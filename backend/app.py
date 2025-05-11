from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import os
import re
import time

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
    json_str = re.sub(r'(?<!")(\".*?[^\\]")(?!")', r'\\\1', json_str)
    
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
    # Add length limitation to the prompt and emphasize JSON format
    limited_prompt = f"{prompt}\n\nIMPORTANT: Keep your response concise and under {max_tokens} tokens. Focus on essential information only. RETURN ONLY VALID JSON WITHOUT ANY ADDITIONAL TEXT OR MARKDOWN FORMATTING. DO NOT USE SINGLE QUOTES IN JSON, USE DOUBLE QUOTES ONLY. ENSURE ALL SPECIAL CHARACTERS ARE PROPERLY ESCAPED."
    
    try:
        # Prepare the command to run Amazon Q CLI
        command = ["q", "chat", "--no-interactive", limited_prompt]
        
        # Execute the command and capture output
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            return {"error": "Amazon Q failed to generate content"}
        
        content = result.stdout.strip()
        
        # Additional length check - truncate if still too long
        if len(content.split()) > max_tokens * 1.5:  # Using word count as rough approximation
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
        return jsonify({"error": "Failed to generate story content"}), 500
    
    try:
        # Try to parse the response as JSON
        content = result["content"]
        
        # Find JSON content between curly braces
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_content = content[json_start:json_end]
            
            # Clean up the JSON content to handle common issues
            # Remove any markdown code block markers
            json_content = re.sub(r'```json|```', '', json_content)
            
            # Handle escaped quotes and newlines
            json_content = json_content.replace('\\"', '"')
            json_content = json_content.replace('\\n', ' ')
            
            # Fix common JSON formatting issues
            # Replace single quotes with double quotes for JSON compatibility
            json_content = re.sub(r"(?<![\\])\'", '"', json_content)
            
            # Fix unescaped control characters
            json_content = re.sub(r'[\x00-\x1F\x7F]', '', json_content)
            
            # Fix trailing commas in arrays and objects
            json_content = re.sub(r',\s*}', '}', json_content)
            json_content = re.sub(r',\s*]', ']', json_content)
            
            try:
                parsed_content = json.loads(json_content)
            except json.JSONDecodeError:
                # Try a more aggressive approach if the first attempt fails
                # Strip all whitespace and try again
                json_content = re.sub(r'\s+', ' ', json_content).strip()
                parsed_content = json.loads(json_content)
            
            # Additional length checks on individual fields
            if "story" in parsed_content and len(parsed_content["story"]) > 800:
                parsed_content["story"] = parsed_content["story"][:800] + "..."
            if "objective" in parsed_content and len(parsed_content["objective"]) > 250:
                parsed_content["objective"] = parsed_content["objective"][:250] + "..."
                
            return jsonify(parsed_content)
    except json.JSONDecodeError:
        # Try to extract any JSON-like structure as a last resort
        try:
            # Look for title, story, and objective patterns
            title_match = re.search(r'"title":\s*"([^"]+)"', content)
            story_match = re.search(r'"story":\s*"([^"]+)"', content)
            objective_match = re.search(r'"objective":\s*"([^"]+)"', content)
            
            if title_match and story_match and objective_match:
                return jsonify({
                    "title": title_match.group(1),
                    "story": story_match.group(1),
                    "objective": objective_match.group(1)
                })
            else:
                return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500
        except:
            return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500
    except Exception:
        return jsonify({"error": "Error processing story response"}), 500

@app.route('/api/challenge', methods=['GET'])
def get_challenge():
    """Get a coding challenge based on level and story objective"""
    level = request.args.get('level', '1')
    language = request.args.get('language', 'python')
    objective = request.args.get('objective', '')
    story_context = request.args.get('story_context', '')
    
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
        11. NO COMMENTS AT ALL
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
    
    # Prepare context from objective and story if available
    story_objective_context = ""
    if objective or story_context:
        # Sanitize and prepare the objective and story for inclusion in the prompt
        sanitized_objective = objective.replace('"', "'").strip() if objective else ""
        sanitized_story = story_context.replace('"', "'").strip() if story_context else ""
        
        story_objective_context = f"""
        IMPORTANT: Create a challenge that relates to this story context and objective:
        
        Story: "{sanitized_story}"
        Objective: "{sanitized_objective}"
        
        The challenge should feel connected to this narrative, either thematically or in the scenario described.
        The question text should reference elements from the story or objective when possible.
        For example, if the story mentions a spaceship, the challenge could involve calculating fuel for a spaceship.
        """
    
    prompt = f"""Generate a coding challenge for level {level} in {language} for a game called "Code Quest Adventure".
    Make it appropriate for beginners but challenging.
    Always generate new and unique value.
    Randomize the first word of the chalenge.
    The probability of multiple choice is 65%, and the fill in the blank is 35%.
    DO NOT include any comments in the code (no # comments)
    DO NOT include any comments in the code (no // or /* */ comments)
    NO COMMENTS AT ALL
    {story_objective_context}
    {language_specific_instructions}
    
    IMPORTANT INSTRUCTIONS FOR MULTIPLE-CHOICE QUESTIONS:
    - ALWAYS include sample code in the "template" field for ALL multiple-choice questions
    - NEVER NEVER NEVER INCLUE THE CODE IN THE "question" FIELD. ALWAYS IN "template" FIELD.
    - Do NOT include any blanks or fillable parts in the template for multiple-choice questions
    - Keep the code concise (maximum 10 lines)
    - Format the code properly with line breaks using \\n
    - Make sure the code is properly escaped for JSON
    - The question should clearly explain what the user needs to determine about the code
    - ALWAYS provide EXACTLY 4 options (no more, no less)
    - Make sure the options are distinct and reasonable
    
    Format the response as JSON with the following structure:
    {{
        "question": "The question text (keep under 100 words and PLEASE MAKE A VERY CLEAR INSTRUCTION. CODE RELATED THE QUESTION MUST BE WRITTEN IN THE "template" field.)",
        "type": "fill-in-blank OR multiple-choice",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (EXACTLY 4 options for multiple-choice),
        "template": "Code template with _____ for blanks (for fill-in-blank) OR complete code without blanks (REQUIRED for multiple-choice questions)",
        "answer": "The correct answer or solution (keep code solutions under 15 lines). For fill-in-blank with multiple blanks, separate the answers with commas and space (", ")",
        "hint": "A helpful hint (under 50 words)",
        "explanation": "Explanation of the solution (under 100 words)",
        "difficulty": "easy/medium/hard (easy for level 1, medium for level 2, hard for level 3)",
        "xp_reward": 10 for level 1, 20 for level 2, and 3 for level 3
    }}
    """
    
    result = generate_with_amazon_q(prompt, max_tokens=400)
    
    if "error" in result:
        return jsonify({"error": "Failed to generate challenge content"}), 500
    
    try:
        # Try to parse the response as JSON
        content = result["content"]
        
        # Find JSON content between curly braces
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_content = content[json_start:json_end]
            
            # Remove any markdown code block markers
            json_content = re.sub(r'```json|```', '', json_content)
            
            # Fix common JSON formatting issues
            json_content = json_content.replace('\n', ' ')
            
            # Replace single quotes with double quotes for JSON compatibility
            json_content = re.sub(r"(?<![\\])\'", '"', json_content)
            
            # Fix unescaped control characters
            json_content = re.sub(r'[\x00-\x1F\x7F]', '', json_content)
            
            # Fix trailing commas in arrays and objects
            json_content = re.sub(r',\s*}', '}', json_content)
            json_content = re.sub(r',\s*]', ']', json_content)
            
            # Simple approach: just double escape all backslashes in the entire JSON
            json_content = json_content.replace('\\', '\\\\')
            
            # Fix double-escaped quotes
            json_content = json_content.replace('\\\\"', '\\"')
            
            try:
                parsed_content = json.loads(json_content)
            except json.JSONDecodeError:
                # Try a more aggressive approach if the first attempt fails
                # Strip all whitespace and try again
                json_content = re.sub(r'\s+', ' ', json_content).strip()
                # Try with a different escaping approach
                json_content = fix_json_string_escaping(json_content)
                parsed_content = json.loads(json_content)
            
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
            
            # For multiple-choice questions, ensure code is in template and exactly 4 options
            if parsed_content.get("type") == "multiple-choice":
                # Ensure there's a template for code
                if "template" not in parsed_content or not parsed_content["template"]:
                    # Check if question contains code blocks (indicated by indentation, function definitions, etc.)
                    question = parsed_content.get("question", "")
                    
                    # More comprehensive list of code indicators
                    code_indicators = [
                        "def ", "function ", "class ", "for ", "while ", "if ", "else ", "elif ", "return ",
                        "var ", "let ", "const ", "import ", "from ", "public ", "private ", "static ",
                        "int ", "float ", "string ", "boolean ", "void ", "=>", "->", "{", "}", "[]", "()",
                        "    ", "\t", "```", "```python", "```javascript", "```java", "```c", "```cpp"
                    ]
                    
                    # Check for code blocks in triple backticks
                    code_block_pattern = re.search(r'```(?:\w+)?\n(.*?)\n```', question, re.DOTALL)
                    
                    has_code = any(indicator in question for indicator in code_indicators) or code_block_pattern
                    
                    # First check for code blocks in triple backticks
                    if code_block_pattern:
                        # Extract code from the code block
                        code = code_block_pattern.group(1)
                        # Remove the code block from the question
                        question = re.sub(r'```(?:\w+)?\n.*?\n```', '', question, flags=re.DOTALL).strip()
                        parsed_content["template"] = code
                        parsed_content["question"] = question
                    
                    # Then check for inline code
                    elif has_code:
                        # Extract code from question and move it to template
                        code_lines = []
                        question_lines = []
                        in_code_block = False
                        
                        # More sophisticated extraction
                        for line in question.split('\n'):
                            # Check if line starts a code block
                            if line.strip().startswith('```'):
                                in_code_block = not in_code_block
                                continue
                                
                            # If we're in a code block or line has code indicators, add to code
                            if in_code_block or any(line.strip().startswith(kw) for kw in ["def ", "function ", "class ", "for ", "while ", "if ", "else", "elif ", "return "]) or line.startswith("    ") or line.startswith("\t"):
                                code_lines.append(line)
                            else:
                                question_lines.append(line)
                        
                        if code_lines:
                            parsed_content["template"] = "\n".join(code_lines)
                            parsed_content["question"] = "\n".join(question_lines).strip()
                    else:
                        # If no code found, create a simple example based on the language
                        if language.lower() == "javascript":
                            parsed_content["template"] = "function example() {\n  console.log('This is a sample code');\n  return true;\n}"
                        else:
                            parsed_content["template"] = "def example():\n    print('This is a sample code')\n    return True"
                
                # Ensure exactly 4 options
                if "options" in parsed_content:
                    options = parsed_content["options"]
                    
                    # If fewer than 4 options, add more
                    while len(options) < 4:
                        if language.lower() == "javascript":
                            options.append(f"Additional option {len(options) + 1}")
                        else:
                            options.append(f"Additional option {len(options) + 1}")
                    
                    # If more than 4 options, trim to 4
                    if len(options) > 4:
                        # Keep the correct answer and 3 other options
                        correct_answer = parsed_content.get("answer")
                        if correct_answer in options:
                            # Keep the correct answer and 3 other options
                            correct_index = options.index(correct_answer)
                            options = [options[i] for i in range(len(options)) if i == correct_index or i < 3]
                            # If we still need more options (because correct answer was in first 3)
                            while len(options) > 4:
                                options.pop()
                        else:
                            # If correct answer not in options, just keep first 4
                            options = options[:4]
                    
                    parsed_content["options"] = options
            
            # Ensure fill-in-blank challenges have at least 2 blanks
            if parsed_content.get("type") == "fill-in-blank":
                template = parsed_content.get("template", "")
                blank_count = template.count("_____")
                
                if blank_count < 2:
                    # If there's only one blank, add another blank
                    if language.lower() == "javascript":
                        # Add a second blank for JavaScript
                        if "return" in template:
                            parsed_content["template"] = template.replace("return ", "return _____ ")
                            # Update answer to include both parts
                            parsed_content["answer"] = f"{parsed_content.get('answer', '')}, "
                        else:
                            # Add a variable declaration with a blank
                            parsed_content["template"] = f"var x = _____;\n{template}"
                            # Update answer to include both parts
                            parsed_content["answer"] = f"10, {parsed_content.get('answer', '')}"
                    else:
                        # Add a second blank for Python
                        if "return" in template:
                            parsed_content["template"] = template.replace("return ", "return _____ ")
                            # Update answer to include both parts
                            parsed_content["answer"] = f"{parsed_content.get('answer', '')}, "
                        else:
                            # Add a variable declaration with a blank
                            parsed_content["template"] = f"x = _____\n{template}"
                            # Update answer to include both parts
                            parsed_content["answer"] = f"10, {parsed_content.get('answer', '')}"
                
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
    except json.JSONDecodeError:
        # Try to extract any JSON-like structure as a last resort
        try:
            # Look for question, type, and other required fields
            question_match = re.search(r'"question":\s*"([^"]+)"', content)
            type_match = re.search(r'"type":\s*"([^"]+)"', content)
            point_match = re.search(r'"xp_reward":\s*"([^"]+)"', content)
            
            if question_match and type_match:
                challenge_type = type_match.group(1).strip()
                
                if challenge_type == "multiple-choice":
                    # Try to extract options and answer
                    options_match = re.search(r'"options":\s*\[(.*?)\]', content, re.DOTALL)
                    answer_match = re.search(r'"answer":\s*"([^"]+)"', content)
                    
                    if options_match and answer_match:
                        # Parse options from the matched string
                        options_str = options_match.group(1)
                        options = [opt.strip().strip('"\'') for opt in options_str.split(',')]
                        
                        return jsonify({
                            "question": question_match.group(1),
                            "type": "multiple-choice",
                            "options": options,
                            "answer": answer_match.group(1),
                            "hint": "Think about the problem carefully.",
                            "explanation": "This is the correct approach to solve the problem.",
                            "difficulty": "medium",
                            "xp_reward": point_match
                        })
                elif challenge_type == "fill-in-blank":
                    # Try to extract template and answer
                    template_match = re.search(r'"template":\s*"([^"]+)"', content)
                    answer_match = re.search(r'"answer":\s*"([^"]+)"', content)
                    
                    if template_match and answer_match:
                        return jsonify({
                            "question": question_match.group(1),
                            "type": "fill-in-blank",
                            "template": template_match.group(1).replace('\\n', '\n'),
                            "answer": answer_match.group(1),
                            "hint": "Think about the problem carefully.",
                            "explanation": "This is the correct approach to solve the problem.",
                            "difficulty": "medium",
                            "xp_reward": point_match
                        })
            
            return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500
        except:
            return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500
    except Exception:
        return jsonify({"error": "Error processing challenge"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)