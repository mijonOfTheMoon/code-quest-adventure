# Code Quest Adventure - Backend

This is the backend service for the Code Quest Adventure game. It provides APIs for story content, coding challenges, and answer validation.

## Features

- RESTful API endpoints for game content
- Dynamic content generation using Amazon Q CLI
- Support for multiple programming languages
- Answer validation and feedback generation

## API Endpoints

### GET /api/story

Retrieves the story content for a specific level.

**Query Parameters:**
- `level` (optional): The game level (default: 1)

**Response:**
```json
{
  "title": "Level 1: The Beginning",
  "story": "Your adventure begins in the land of Pythonia...",
  "setting": "A mystical forest with ancient code runes",
  "character": "A wise old wizard who teaches programming",
  "objective": "Learn the basics of variables to unlock the first gate"
}
```

### GET /api/challenge

Retrieves a coding challenge for a specific level and programming language.

**Query Parameters:**
- `level` (optional): The game level (default: 1)
- `language` (optional): Programming language (default: python)

**Response:**
```json
{
  "question": "What will be the value of x after this code runs?",
  "type": "multiple-choice",
  "options": ["10", "15", "20", "Error"],
  "answer": "15",
  "hint": "Remember that += adds to the existing value",
  "explanation": "x starts at 10, then 5 is added to it, resulting in 15",
  "difficulty": "easy",
  "xp_reward": 20
}
```

### POST /api/feedback

Evaluates a user's answer and provides feedback.

**Request Body:**
```json
{
  "answer": "x = 10",
  "correct_answer": "x = 10",
  "question": "How do you declare a variable x with value 10?"
}
```

**Response:**
```json
{
  "is_correct": true,
  "feedback": "Great job! You've correctly declared the variable.",
  "next_hint": null
}
```

## Setup and Installation

1. Create a virtual environment:
   ```
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   ```
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the server:
   ```
   python3 app.py
   ```

The server will start on http://localhost:5000

## Requirements

- Python 3.8+
- Flask
- Flask-CORS
- Amazon Q CLI installed and configured

## Configuration

No additional configuration is required, but make sure Amazon Q CLI is properly installed and configured on the system.

## Error Handling

The API includes error handling for:
- Amazon Q CLI failures
- JSON parsing errors
- General exceptions

Errors are returned with appropriate HTTP status codes and error messages.
