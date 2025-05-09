from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

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
    Format the response as JSON with the following structure:
    {{
        "title": "Level {level} title",
        "story": "Story text here (keep under 70 words)",
        "setting": "Brief description of the setting (under 30 words)",
        "character": "Brief description of the character or enemy (under 30 words)",
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
            if "setting" in parsed_content and len(parsed_content["setting"]) > 250:
                parsed_content["setting"] = parsed_content["setting"][:250] + "..."
            if "character" in parsed_content and len(parsed_content["character"]) > 250:
                parsed_content["character"] = parsed_content["character"][:250] + "..."
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
    
    prompt = f"""Generate a coding challenge for level {level} in {language} for a game called "Code Quest Adventure".
    Make it appropriate for beginners but challenging.
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
            parsed_content = json.loads(json_content)
            
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
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500

@app.route('/api/feedback', methods=['POST'])
def get_feedback():
    """Get feedback on a user's answer"""
    data = request.json
    user_answer = data.get('answer', '')
    correct_answer = data.get('correct_answer', '')
    question = data.get('question', '')
    
    # Limit the length of inputs to prevent excessively long prompts
    if len(user_answer) > 1000:
        user_answer = user_answer[:1000] + "..."
    if len(correct_answer) > 1000:
        correct_answer = correct_answer[:1000] + "..."
    if len(question) > 500:
        question = question[:500] + "..."
    
    prompt = f"""Evaluate this answer for a coding game:
    Question: {question}
    Correct answer: {correct_answer}
    User answer: {user_answer}
    
    Format the response as JSON with the following structure:
    {{
        "is_correct": true/false,
        "feedback": "Detailed feedback on the answer (under 100 words)",
        "next_hint": "A hint if they got it wrong (under 50 words)"
    }}
    """
    
    result = generate_with_amazon_q(prompt, max_tokens=200)
    
    if "error" in result:
        print(f"Error from Amazon Q: {result['error']}")
        return jsonify({"error": "Failed to generate feedback"}), 500
    
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
            if "feedback" in parsed_content and len(parsed_content["feedback"]) > 500:
                parsed_content["feedback"] = parsed_content["feedback"][:500] + "..."
            if "next_hint" in parsed_content and parsed_content["next_hint"] and len(parsed_content["next_hint"]) > 250:
                parsed_content["next_hint"] = parsed_content["next_hint"][:250] + "..."
                
            return jsonify(parsed_content)
        else:
            return jsonify({"error": "Could not parse JSON from Amazon Q response"}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON response from Amazon Q"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
