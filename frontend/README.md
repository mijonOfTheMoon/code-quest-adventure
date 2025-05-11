# Code Quest Adventure - Frontend

The frontend application for Code Quest Adventure, a dynamic coding game where all content is generated in real-time by Amazon Q CLI.

## Overview

This React application provides the user interface for the Code Quest Adventure game. It communicates with the backend API to fetch dynamically generated stories and coding challenges.

## Features

- **Interactive Game Interface**: Engaging UI for playing through coding challenges
- **Multiple Programming Languages**: Support for Python and JavaScript challenges
- **Dynamic Content Loading**: Seamless fetching of Amazon Q CLI generated content
- **Responsive Design**: Works on various screen sizes

## Prerequisites

- Node.js (v20+)
- npm (v10+)
- Backend server running (see backend README)
- Amazon Q CLI installed and configured (see main README)

## Installation

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Configure the API endpoint:

By default, the application connects to `http://localhost:5000/api`. If your backend is running on a different URL, update the `API_URL` constant in `src/services/api.js`.

## Running the Application

Start the development server:

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

Create an optimized production build:

```bash
npm run build
```

The build files will be in the `build` directory and can be served using any static file server.

## How It Works

1. The frontend fetches dynamically generated stories and challenges from the backend
2. The backend uses Amazon Q CLI to create unique content for each game session
3. Players solve coding challenges to progress through the adventure

## Amazon Q CLI Integration

The magic of Code Quest Adventure is that **all game content is generated in real-time by Amazon Q CLI**. This means:

- Every story is unique
- Challenges are freshly generated for each game
- Content adapts to the selected programming language

See the main README for instructions on setting up Amazon Q CLI on your system.

## Project Structure

- `src/components/`: React components for the game interface
- `src/services/`: API service for communicating with the backend
- `src/assets/`: Game assets including images and animations
- `src/game/`: Game engine and logic