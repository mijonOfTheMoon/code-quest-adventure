# Code Quest Adventure

An interactive, gamified coding learning platform for beginners. This web-based adventure game teaches coding concepts through an engaging storyline, where players solve coding challenges to progress through the game.

## Features

- **Adventure Story Game**: Immersive storyline with characters and objectives
- **Interactive Coding Challenges**: Multiple types of challenges including multiple-choice, fill-in-the-blank, and code completion
- **Game Mechanics**: Players battle enemies by solving coding challenges correctly
- **Dynamic Content Generation**: Uses Amazon Q to generate story content and coding challenges
- **Visual Feedback**: Game-like interface with health bars, attack animations, and level progression
- **Multiple Programming Languages**: Support for Python and JavaScript challenges

## Project Structure

The application consists of two main parts:

### Backend (Flask)

- Handles API requests for story content, challenges, and answer validation
- Communicates with Amazon Q CLI to generate dynamic content
- Provides feedback on user answers

### Frontend (React)

- Game interface built with React and styled-components
- Game engine using Phaser.js for animations and visual effects
- Loading screens with progress indicators and coding quotes
- Responsive design for different screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- Amazon Q CLI installed and configured

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/code-quest-adventure.git
   cd code-quest-adventure
   ```

2. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Select your preferred programming language on the start screen
2. Read the story and understand your objective
3. Solve the coding challenge presented to you
4. Submit your answer to attack the enemy
5. Correct answers damage the enemy and earn XP
6. Incorrect answers result in the enemy attacking you
7. Level up by earning enough XP
8. Progress through the adventure by defeating enemies

## API Endpoints

### GET /api/health

Health check endpoint to verify the backend is running.

### GET /api/story

Retrieves a dynamically generated story segment.

**Query Parameters:**
- `level` (optional): The game level (default: 1)

### GET /api/challenge

Retrieves a coding challenge.

**Query Parameters:**
- `level` (optional): The game level (default: 1)
- `language` (optional): Programming language (default: python)

### POST /api/feedback

Evaluates a user's answer and provides feedback.

**Request Body:**
```json
{
  "answer": "User's answer",
  "correct_answer": "The correct answer",
  "question": "The challenge question"
}
```

## Technologies Used

- **Frontend**: React, Phaser.js, styled-components
- **Backend**: Flask, Flask-CORS
- **Content Generation**: Amazon Q CLI
- **Build Tools**: Webpack, Babel

## License

This project is licensed under the MIT License - see the LICENSE file for details.
