from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import os
import re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def fix_json_string_escaping(json_str):
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
            # Truncate to avoid excessively long responses
            content_parts = content.split()
            content = " ".join(content_parts[:max_tokens]) + "..."
        
        return {"content": content}
    except subprocess.TimeoutExpired:
        return {"error": "Request to Amazon Q timed out"}
    except Exception as e:
        return {"error": f"Error generating content: {str(e)}"}

def create_story_json(content):
    try:
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
                
            return parsed_content, None
        else:
            return None, "Could not parse JSON from Amazon Q response"
    except json.JSONDecodeError:
        return None, "Invalid JSON response from Amazon Q"

def create_challenge_json(content, language):
    try:
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
                return None, f"Invalid JSON format: {str(e)}"
            
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
                if language.lower() == "javascript":
                    parsed_content["answer"] = clean_javascript_code(parsed_content["answer"])
            
            # Ensure fill-in-blank challenges have at least 2 blanks
            if parsed_content.get("type") == "fill-in-blank":
                template = parsed_content.get("template", "")
                blank_count = template.count("_____")
                
                if blank_count < 2:
                    # If there's only one blank, reject and generate a new challenge
                    return None, "Generated challenge doesn't meet requirements. Please try again."
                
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
                
            return parsed_content, None
        else:
            return None, "Could not parse JSON from Amazon Q response"
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON response from Amazon Q: {str(e)}"
    except Exception as e:
        return None, f"Error processing challenge: {str(e)}"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Code Quest Adventure backend is running"})

@app.route('/api/story', methods=['GET'])
def get_story():
    level = request.args.get('level', '1')
    
    # Try up to 3 times to generate a valid story
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            prompt = f"""Generate a randomized short adventure story introduction for a coding game called "Code Quest Adventure" for level {level}.
            The story should be exciting and set up a scenario where the player needs to solve coding challenges.
            Always generate new and unique story and objective. The title should be 3 random cheesy words. You must include the level on the title.
            You must randomize the starting word.
            Format the response as JSON with the following structure:
            {{
                "title": "Level {level} title",
                "story": "Story text here (keep under 70 words)",
                "objective": "What the player needs to accomplish (under 30 words)"
            }}
            """
            
            result = generate_with_amazon_q(prompt, max_tokens=300)
            
            if "error" in result:
                print(f"Story generation attempt {attempt+1} failed: {result['error']}")
                continue
            
            parsed_content, error = create_story_json(result["content"])
            if error:
                print(f"Story parsing attempt {attempt+1} failed: {error}")
                continue
            
            # If we got here, we have a valid story
            return jsonify(parsed_content)
            
        except Exception as e:
            print(f"Unexpected error in story generation attempt {attempt+1}: {str(e)}")
            continue

@app.route('/api/challenge', methods=['GET'])
def get_challenge():
    level = request.args.get('level', '1')
    language = request.args.get('language', 'python')
    
    # Try up to 3 times to generate a valid challenge
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            # Determine question type based on level
            question_type = "multiple-choice"  # Default
            
            # Level 1: Always multiple-choice
            if level == '1':
                question_type = "multiple-choice"
            # Level 2: Always fill-in-blank
            elif level == '2':
                question_type = "fill-in-blank"
            # Level 3: Randomized (50% multiple-choice, 50% fill-in-blank)
            elif level == '3':
                import random
                question_type = random.choice(["multiple-choice", "fill-in-blank"])
            
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
            Always generate new and unique fresh question.
            Randomize the first word of the challenge.
            The question type MUST be {question_type}.
            DO NOT include any comments in the code (no # comments)
            DO NOT include any comments in the code (no // or /* */ comments)
            NO COMMENTS AT ALL
            {language_specific_instructions}
            Format the response as JSON with the following structure:
            {{
                "question": "The question text (keep under 100 words and PLEASE MAKE A VERY CLEAR INSTRUCTION)",
                "type": "{question_type}",
                "code": "Source code that the question is about (required for all question types)",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple-choice only, EXACTLY 4 options),
                "template": "Code template with _____ for blanks" (for fill-in-blank only),
                "answer": "The correct answer or solution (keep code solutions under 15 lines). For fill-in-blank with multiple blanks, separate the answers with commas and space (", ")",
                "hint": "A helpful hint (under 50 words)",
                "explanation": "Explanation of the solution (under 100 words)",
                "difficulty": "easy/medium/hard",
                "xp_reward": 10 for level 1, 20 for level 2, and 30 for level 3.
            }}
            """
            
            result = generate_with_amazon_q(prompt, max_tokens=400)
            
            if "error" in result:
                print(f"Challenge generation attempt {attempt+1} failed: {result['error']}")
                continue
            
            parsed_content, error = create_challenge_json(result["content"], language)
            if error:
                print(f"Challenge parsing attempt {attempt+1} failed: {error}")
                continue
            
            # Ensure there are exactly 4 options for multiple-choice questions
            if parsed_content.get("type") == "multiple-choice" and "options" in parsed_content:
                options = parsed_content["options"]
                if len(options) != 4:
                    if len(options) < 4:
                        # Add dummy options if less than 4
                        while len(options) < 4:
                            options.append(f"Additional option {len(options) + 1}")
                    else:
                        # Truncate if more than 4
                        options = options[:4]
                    parsed_content["options"] = options
            
            # Ensure code field exists
            if "code" not in parsed_content:
                # If no code field, use template or create a placeholder
                if "template" in parsed_content:
                    parsed_content["code"] = parsed_content["template"]
                else:
                    parsed_content["code"] = "// Code example will be shown here"
            
            # Set XP reward based on level if not present
            if "xp_reward" not in parsed_content:
                level_int = int(level)
                if level_int == 1:
                    parsed_content["xp_reward"] = 10
                elif level_int == 2:
                    parsed_content["xp_reward"] = 20
                elif level_int == 3:
                    parsed_content["xp_reward"] = 30
                else:
                    parsed_content["xp_reward"] = 15
            
            # Validate required fields
            required_fields = ["question", "type", "code", "answer", "hint"]
            missing_fields = [field for field in required_fields if field not in parsed_content]
            if missing_fields:
                print(f"Challenge missing required fields: {', '.join(missing_fields)}")
                continue
                
            # If we got here, we have a valid challenge
            return jsonify(parsed_content)
            
        except Exception as e:
            print(f"Unexpected error in challenge generation attempt {attempt+1}: {str(e)}")
            continue
    
    # If we've tried multiple times and still failed, return a fallback challenge
    fallback_challenge = create_fallback_challenge(level, question_type, language)
    return jsonify(fallback_challenge)

def create_fallback_challenge(level, question_type, language):
    """Create a fallback challenge when API generation fails"""
    level_int = int(level)
    
    if question_type == "multiple-choice":
        return {
            "question": f"Level {level} fallback question: What will the following code output?",
            "type": "multiple-choice",
            "code": "x = 5\ny = 10\nresult = x + y\nprint(result)",
            "options": ["15", "5", "10", "Error"],
            "answer": "15",
            "hint": "Add the values of x and y together.",
            "explanation": "The code adds 5 and 10 together and stores it in result, then prints it.",
            "difficulty": "easy",
            "xp_reward": 10 * level_int
        }
    else:  # fill-in-blank
        return {
            "question": f"Level {level} fallback question: Complete the code to calculate the sum and product of two numbers.",
            "type": "fill-in-blank",
            "code": "a = 7\nb = 3\nsum_result = a + b\nproduct_result = a * b",
            "template": "a = 7\nb = 3\nsum_result = _____\nproduct_result = _____",
            "answer": "a + b, a * b",
            "hint": "Use the addition and multiplication operators.",
            "explanation": "To find the sum, use the + operator. To find the product, use the * operator.",
            "difficulty": "easy",
            "xp_reward": 10 * level_int
        }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)