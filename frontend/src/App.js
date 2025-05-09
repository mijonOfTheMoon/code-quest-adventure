import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingScreen from './components/LoadingScreen';
import { getStory } from './services/api';

const App = () => {
  const [gameState, setGameState] = useState('start'); // start, loading, game
  const [language, setLanguage] = useState('python');
  const [level, setLevel] = useState(1);
  const [story, setStory] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleStart = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setGameState('loading');
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);
    
    // Fetch story data
    getStory(level)
      .then(data => {
        setStory(data);
        setTimeout(() => {
          clearInterval(interval);
          setLoadingProgress(100);
          setGameState('game');
        }, 2000);
      })
      .catch(error => {
        console.error('Error fetching story:', error);
        clearInterval(interval);
        // Handle error - could show an error screen
        setStory({
          title: "Connection Error",
          story: "Unable to connect to the adventure server. Please try again later.",
          setting: "Error Zone",
          character: "Debug Dragon",
          objective: "Refresh the page to try again"
        });
        setGameState('game');
      });
  };

  // Render different screens based on game state
  if (gameState === 'start') {
    return <StartScreen onStart={handleStart} />;
  } else if (gameState === 'loading') {
    return <LoadingScreen progress={loadingProgress} />;
  } else {
    return <GameScreen story={story} level={level} language={language} />;
  }
};

export default App;
