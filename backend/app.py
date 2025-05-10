from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import os
import re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def fix_json_string_escaping(json_str):
    """
    Fix common JSON string escaping issues, particularly with code examples
    that contain quotes within strings
    """
    # This is a simplified fix - for production, a more robust solution would be needed
    # Handle unescaped quotes in strings
    in_string = False
    result = ""
    i = 0
    
    while i < len(json_str):
        char = json_str[i]
        
        if char == '"' and (i == 0 or json_str[i-1] != '\\'):
            in_string = not in_string
            result += char
        elif char == '"' and json_str[i-1] == '\\':
            # Already escaped quote
            result += char
        elif in_string and char == '\\' and i+1 < len(json_str) and json_str[i+1] != '"' and json_str[i+1] != '\\':
            # Escape backslashes that aren't already escaping something
            result += '\\\\'
        else:
            result += char
            
        i += 1
    
    return result

def clean_javascript_code(code):
    """Clean JavaScript code by removing unwanted escape characters and comments"""
    if not code:
        return code
    
    # Replace literal backslash+n with actual newlines
    code = code.replace('\\n', '\n')
    
    # Remove trailing backslashes at end of lines
    code = re.sub(r'\\$', '', code, flags=re.MULTILINE)
    
    # Remove any comments
    code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    
    # Fix other common escape issues
    code = code.replace('\\"', '"')
    code = code.replace('\\t', '\t')
    
    # Additional fix for backslashes in newlines
    code = re.sub(r'\\\\n', '\n', code)
    
    return code

def generate_with_amazon_q(prompt, max_tokens=500):
    """
    Generate content using Amazon Q CLI with length limitations
    
    Args:
        prompt: The prompt to send to Amazon Q
        max_tokens: Maximum number of tokens (roughly words) to generate
    """
    # Add length limitation to the prompt
    limited_prompt = f"{prompt}\n\nIMPORTANT: Keep your response concise and under {max_tokens} tokens. Focus on essential information only."
    
    try:
        # Prepare the command to run Amazon Q CLI
        command = ["q", "chat", "--no-interactive", limited_prompt]
        
        # Execute the command and capture output
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            return {"error": "Amazon Q failed to generate content", "details": result.stderr}
        
        content = result.stdout.strip()
        
        # Additional length check - truncate if still too long
        if len(content.split()) > max_tokens * 1.5:  # Using word count as rough approximation
            print(f"Warning: Generated content exceeds length limit ({len(content.split())} words)")
            # Truncate to avoid excessively long responses
            content_parts = content.split()
            content = " ".join(content_parts[:max_tokens]) + "..."
        
        return {"content": content}
    except subprocess.TimeoutExpired:
        return {"error": "Request to Amazon Q timed out"}
    except Exception as e:
        return {"error": f"Error generating content: {str(e)}"}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Code Quest Adventure backend is running"})

@app.route('/api/story', methods=['GET'])
def get_story():
    """Get the initial story and game setup"""
    level = request.args.get('level', '1')
    
    prompt = f"""Generate a short adventure story introduction for a coding game called "Code Quest Adventure" for level {level}.
    The story should be exciting and set up a scenario where the player needs to solve coding challenges.
    Always generate new and unique value. The title should be 3 random cheesy words. You must include the level on the title.
    Format the response as JSON with the following structure:
    {{
        "title": "Level {level} title",
        "story": "Story text here (keep under 70 words)",
        "objective": "What the player needs to accomplish (under 30 words)"
    }}
    """
    
    result = generate_with_amazon_q(prompt, max_tokens=300)
    
    if "error" in result:
        print(f"Error from Amazon Q: {result['error']}")
        return jsonify({"error": "Failed to generate story content"}), 500
    
    try:
        # Try to parse the response as JSON
        content = result["content"]
        # Find JSON content between curly braces
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_content = content[json_start:json_end]
            parsed_content = json.loads(json_content)
            
            # Additional length checks on individual fields
            if "story" in parsed_content and len(parsed_content["story"]) > 800:
                parsed_content["story"] = parsed_content["story"][:800] + "..."
            if "objective" in parsed_content and len(parsed_content["objective"]) > 250:
                parsed_content["objective"] = parsed_content["objective"][:250] + "..."
                
            return jsonify(parsed_content)
        else:
            return jsonify({"error": "Could not parse JSON from Amazon Q response"}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500

@app.route('/api/challenge', methods=['GET'])
def get_challenge():
    """Get a coding challenge based on level"""
    level = request.args.get('level', '1')
    language = request.args.get('language', 'python')
    
    # Adjust prompt based on language to ensure proper formatting
    language_specific_instructions = ""
    if language.lower() == "javascript":
        language_specific_instructions = """
        For JavaScript challenges:
        1. Make sure all code is valid JavaScript syntax
        2. Use semicolons at the end of statements
        3. For fill-in-blank challenges, ensure the template and answer are valid JavaScript
        4. DO NOT include any comments in the code (no // or /* */ comments)
        5. Avoid using ES6+ features that might not be widely supported
        6. Test your code solution to ensure it works correctly
        7. Provide clean code without escape characters
        8. Do not use backslashes at the end of lines
        """
    
    prompt = f"""Generate a coding challenge for level {level} in {language} for a game called "Code Quest Adventure".
    Make it appropriate for beginners but challenging.
    Always generate new and unique value.
    {language_specific_instructions}
    Format the response as JSON with the following structure:
    {{
        "question": "The question text (keep under 100 words)",
        "type": "fill-in-blank OR multiple-choice OR code-completion",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple-choice only),
        "template": "Code template with _____ for blanks" (for fill-in-blank only),
        "answer": "The correct answer or solution (keep code solutions under 15 lines)",
        "hint": "A helpful hint (under 50 words)",
        "explanation": "Explanation of the solution (under 100 words)",
        "difficulty": "easy/medium/hard",
        "xp_reward": number between 10-50
    }}
    """
    
    result = generate_with_amazon_q(prompt, max_tokens=400)
    
    if "error" in result:
        print(f"Error from Amazon Q: {result['error']}")
        return jsonify({"error": "Failed to generate challenge content"}), 500
    
    try:
        # Try to parse the response as JSON
        content = result["content"]
        # Find JSON content between curly braces
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_content = content[json_start:json_end]
            
            # Fix common JSON formatting issues
            json_content = json_content.replace('\n', ' ')
            json_content = json_content.replace('\\', '\\\\')
            
            # Handle escaped quotes in code examples
            json_content = fix_json_string_escaping(json_content)
            
            try:
                parsed_content = json.loads(json_content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Problematic JSON: {json_content}")
                return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 500
            
            # Clean JavaScript code if needed
            if language.lower() == "javascript":
                if "template" in parsed_content:
                    parsed_content["template"] = clean_javascript_code(parsed_content["template"])
                if "answer" in parsed_content:
                    parsed_content["answer"] = clean_javascript_code(parsed_content["answer"])
            
            # Additional length checks on individual fields
            if "question" in parsed_content and len(parsed_content["question"]) > 500:
                parsed_content["question"] = parsed_content["question"][:500] + "..."
            if "answer" in parsed_content and len(parsed_content["answer"]) > 800:
                parsed_content["answer"] = parsed_content["answer"][:800] + "..."
            if "hint" in parsed_content and len(parsed_content["hint"]) > 250:
                parsed_content["hint"] = parsed_content["hint"][:250] + "..."
            if "explanation" in parsed_content and len(parsed_content["explanation"]) > 500:
                parsed_content["explanation"] = parsed_content["explanation"][:500] + "..."
                
            return jsonify(parsed_content)
        else:
            return jsonify({"error": "Could not parse JSON from Amazon Q response"}), 500
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw content: {result.get('content', 'No content')}")
        return jsonify({"error": f"Invalid JSON response from Amazon Q: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": f"Error processing challenge: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)