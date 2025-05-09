# Code Quest Adventure - Frontend

This is the frontend application for Code Quest Adventure, a gamified coding learning platform.

## Features

- Interactive game interface with RPG-style combat
- Dynamic story and challenge content
- Visual feedback for correct/incorrect answers
- Level progression system with XP rewards
- Support for multiple programming languages
- Engaging loading screens with coding quotes

## Components

### Game Screens

- **StartScreen**: Initial game screen with language selection
- **LoadingScreen**: Displays progress while content is being generated
- **GameScreen**: Main game interface with story, challenges, and game canvas

### Game Engine

The game is powered by Phaser.js, providing:
- Character animations
- Health bars
- Attack effects
- Level-up animations
- Game state management

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── assets/         # Game assets (images, sounds)
│   ├── components/     # React components
│   ├── game/           # Game engine and logic
│   ├── services/       # API services
│   ├── App.js          # Main application component
│   └── index.js        # Entry point
├── package.json
└── webpack.config.js
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Development

### Adding New Game Features

To add new game features, modify the `GameEngine.js` file in the `src/game` directory.

### Adding New Challenge Types

To add new challenge types, update the `GameScreen.js` component to handle the new challenge format.

### Customizing the UI

The UI is built with styled-components. Modify the component styles in their respective files.

## Dependencies

- React
- Phaser.js
- styled-components
- axios
- react-router-dom

## Browser Compatibility

The application is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Game assets are loaded asynchronously
- Loading screens prevent UI freezing during content generation
- Animations are optimized for performance
