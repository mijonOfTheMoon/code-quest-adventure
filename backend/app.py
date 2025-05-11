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
    # First, handle Python code templates with backslashes
    # Replace all backslashes with double backslashes in template and answer fields
    json_str = re.sub(r'"template":\s*"(.*?)"', 
                     lambda m: '"template": "' + m.group(1).replace('\\', '\\\\').replace('\\\\"', '\\"') + '"', 
                     json_str, flags=re.DOTALL)
    
    json_str = re.sub(r'"answer":\s*"(.*?)"', 
                     lambda m: '"answer": "' + m.group(1).replace('\\', '\\\\').replace('\\\\"', '\\"') + '"', 
                     json_str, flags=re.DOTALL)
    
    # Fix unescaped quotes in strings
    json_str = re.sub(r'(?<!")(".*?[^\\]")(?!")', r'\\\1', json_str)
    
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
    
    # Replace underscores with commas for fill-in-blank answers
    # Only do this for answer strings, not for template strings or variable names
    if '_____' in code:
        # This is likely a template, don't modify
        pass
    elif code.strip().startswith('_') and code.strip().endswith('_'):
        # This looks like a placeholder, don't modify
        pass
    elif re.search(r'\b_[a-zA-Z0-9]+\b', code):
        # This looks like a variable name with underscore prefix, don't modify
        pass
    elif ',' not in code and '_' in code and not re.search(r'[a-zA-Z0-9]_[a-zA-Z0-9]', code):
        # This might be an answer with underscores as separators
        # Only replace if underscores are not part of variable names
        code = re.sub(r'(?<![a-zA-Z0-9])_+(?![a-zA-Z0-9])', ',', code)
    
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
    
    prompt = f"""Generate a randomized short adventure story introduction for a coding game called "Code Quest Adventure" for level {level}.
    The story should be exciting and set up a scenario where the player needs to solve coding challenges.
    Always generate new and unique value. The title should be 3 random cheesy words. You must include the level on the title.
    You must randomize the starting letter alphabet.
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
        9. For fill-in-blank challenges, ALWAYS include at least 2 blanks in the template
        10. For fill-in-blank challenges with multiple blanks, separate the answers with commas and space (", ")
        """
    else:
        language_specific_instructions = """
        For Python challenges:
        1. Make sure all code is valid Python syntax
        2. For fill-in-blank challenges, ensure the template and answer are valid Python
        3. DO NOT include any comments in the code (no # comments)
        4. Provide clean code without escape characters
        5. For fill-in-blank challenges, ALWAYS include at least 2 blanks in the template
        6. For fill-in-blank challenges with multiple blanks, separate the answers with commas and space (", ")
        7. DO NOT include any comments in the code (no // or /* */ comments)
        8. NO COMMENTS AT ALL
        """
    
    prompt = f"""Generate a coding challenge for level {level} in {language} for a game called "Code Quest Adventure".
    Make it appropriate for beginners but challenging.
    Always generate new and unique value.
    Randomize the first alphabet of the chalenge.
    The probability of multiple choice is 65%, and the fill in the blank is 35%.
    DO NOT include any comments in the code (no # comments)
    DO NOT include any comments in the code (no // or /* */ comments)
    NO COMMENTS AT ALL
    {language_specific_instructions}
    Format the response as JSON with the following structure:
    {{
        "question": "The question text (keep under 100 words and PLEASE MAKE A VERY CLEAR INSTRUCTION"),
        "type": "fill-in-blank OR multiple-choice",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple-choice only),
        "template": "Code template with _____ for blanks" (for fill-in-blank only),
        "answer": "The correct answer or solution (keep code solutions under 15 lines). For fill-in-blank with multiple blanks, separate the answers with commas and space (", ")",
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
            
            # Simple approach: just double escape all backslashes in the entire JSON
            json_content = json_content.replace('\\', '\\\\')
            
            # Fix double-escaped quotes
            json_content = json_content.replace('\\\\"', '\\"')
            
            # Handle escaped quotes in code examples
            try:
                parsed_content = json.loads(json_content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Problematic JSON: {json_content}")
                return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 500
            
            # Clean code based on language
            if "template" in parsed_content:
                # Convert \n sequences to actual newlines for all languages
                parsed_content["template"] = parsed_content["template"].replace('\\n', '\n')
                
                if language.lower() == "javascript":
                    parsed_content["template"] = clean_javascript_code(parsed_content["template"])
            
            if "answer" in parsed_content:
                # Also handle newlines in answers if needed
                parsed_content["answer"] = parsed_content["answer"].replace('\\n', '\n')
                
                # Don't apply underscore-to-comma conversion for Python answers
                # This was causing the bug where variable names with underscores were being corrupted
                if language.lower() == "javascript":
                    parsed_content["answer"] = clean_javascript_code(parsed_content["answer"])
            
            # Ensure fill-in-blank challenges have at least 2 blanks
            if parsed_content.get("type") == "fill-in-blank":
                template = parsed_content.get("template", "")
                blank_count = template.count("_____")
                
                if blank_count < 2:
                    # If there's only one blank, reject and generate a new challenge
                    return jsonify({"error": "Generated challenge doesn't meet requirements. Please try again."}), 500
                
                # Ensure answer has commas for multiple blanks
                answer = parsed_content.get("answer", "")
                if blank_count > 1 and "," not in answer:
                    # Try to split the answer into parts
                    parts = answer.split()
                    if len(parts) >= blank_count:
                        parsed_content["answer"] = ", ".join(parts[:blank_count])
            
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