import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingScreen from './components/LoadingScreen';
import { getStory, getChallenge } from './services/api';

const App = () => {
  const [gameState, setGameState] = useState('start'); // start, loading, game
  const [language, setLanguage] = useState('python');
  const [level, setLevel] = useState(1);
  const [story, setStory] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleStart = async (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setGameState('loading');
    setLoadingProgress(0);
    
    try {
      // Start loading story (50% of progress)
      setLoadingProgress(5);
      const storyData = await getStory(level);
      setStory(storyData);
      setLoadingProgress(50);
      
      // Then load challenge (remaining 50% of progress)
      const challengeData = await getChallenge(level, selectedLanguage);
      setChallenge(challengeData);
      setLoadingProgress(95);
      
      // Short delay for smooth transition
      setTimeout(() => {
        setLoadingProgress(100);
        setGameState('game');
      }, 500);
    } catch (error) {
      console.error('Error loading game data:', error);
      setError('Failed to load game content. Please try again.');
      setLoadingProgress(100);
      
      // If story loaded but challenge failed, use a placeholder for story
      if (!story) {
        setStory({
          title: "Connection Error",
          story: "Unable to connect to the adventure server. Please try again later.",
          objective: "Refresh the page to try again"
        });
      }
      
      // Show game screen with error state
      setGameState('game');
    }
  };

  // Render different screens based on game state
  if (gameState === 'start') {
    return <StartScreen onStart={handleStart} />;
  } else if (gameState === 'loading') {
    return <LoadingScreen progress={loadingProgress} />;
  } else {
    return (
      <GameScreen 
        story={story} 
        initialChallenge={challenge}
        level={level} 
        language={language}
        initialError={error}
      />
    );
  }
};

export default App;
