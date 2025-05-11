# Code Quest Adventure - Backend

The backend server for Code Quest Adventure, providing dynamically generated game content through Amazon Q CLI integration.

## Overview

This Flask-based API serves as the bridge between the frontend application and Amazon Q CLI. It generates unique stories and coding challenges for the game by leveraging Amazon Q's capabilities.

## Features

- **Dynamic Content Generation**: Creates unique stories and coding challenges using Amazon Q CLI
- **Multiple Programming Languages**: Supports Python and JavaScript challenges
- **Progressive Difficulty**: Three levels of increasing challenge
- **RESTful API**: Clean API endpoints for the frontend to consume

## Prerequisites

- Python 3.6+
- Flask and other dependencies (see requirements.txt)
- Amazon Q CLI installed and configured (see main README)

## Installation

1. Create and activate a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the Flask development server:

```bash
python app.py
```

The API will be available at [http://localhost:5000](http://localhost:5000).

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/story?level={level}`: Get a dynamically generated story for the specified level
- `GET /api/challenge?level={level}&language={language}&objective={objective}`: Get a coding challenge for the specified level, language, and objective

## Response Samples

### Health Check Response

```json
{
  "status": "ok",
  "message": "Code Quest Adventure backend is running"
}
```

### Story Response

```json
{
  "title": "Level 2 Mysterious Quantum Labyrinth",
  "story": "You've discovered an ancient quantum computer hidden beneath the city. Its circuits pulse with otherworldly energy, but the security system has detected your presence. To access its secrets, you must solve a series of coding puzzles that protect the core memory banks.",
  "objective": "Bypass the quantum security system by completing the coding challenges to access the ancient knowledge."
}
```

### Challenge Response (Multiple Choice)

```json
{
  "question": "What will be the output of this code?",
  "type": "multiple-choice",
  "code": "function calculateSum(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] % 2 === 0) {\n      sum += arr[i];\n    }\n  }\n  return sum;\n}\n\nconsole.log(calculateSum([1, 2, 3, 4, 5]));",
  "options": [
    "6",
    "15",
    "9",
    "0"
  ],
  "answer": "6",
  "hint": "The function is adding something specific from the array.",
  "explanation": "The function calculateSum adds only the even numbers in the array. In this case, the even numbers are 2 and 4, so the sum is 2 + 4 = 6.",
  "difficulty": "easy",
  "xp_reward": 10
}
```

### Challenge Response (Fill-in-Blank)

```json
{
  "question": "Complete the Python function that calculates the factorial of a number using recursion.",
  "type": "fill-in-blank",
  "template": "def factorial(n):\n    if n <= 1:\n        return _____\n    else:\n        return n * _____",
  "answer": "1, factorial(n-1)",
  "hint": "Remember the base case for factorial and how to make the recursive call.",
  "explanation": "A factorial function needs a base case (n <= 1) that returns 1, and a recursive case that multiplies n by the factorial of n-1.",
  "difficulty": "medium",
  "xp_reward": 20
}
```

## How It Works

1. The backend receives requests from the frontend for stories or challenges
2. It constructs prompts for Amazon Q CLI based on the request parameters
3. Amazon Q CLI generates creative content based on these prompts
4. The backend processes and formats the responses before sending them to the frontend

## Amazon Q CLI Integration

**All game content is generated in real-time by Amazon Q CLI!** This integration is what makes Code Quest Adventure unique:

- The backend uses subprocess calls to interact with Amazon Q CLI
- Prompts are carefully crafted to generate appropriate content for each game level
- Response parsing and error handling ensure reliable content delivery

See the main README for instructions on setting up Amazon Q CLI on your system.

## Configuration

The server runs on port 5000 by default. You can modify this in the `app.py` file if needed.