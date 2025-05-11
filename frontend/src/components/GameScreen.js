import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import GameEngine from '../game/GameEngine';
import { playerConfig, gameProgressionConfig } from '../config/gameConfig';
import { getStory, getChallenge, submitAnswer, preloadChallenges, getCachedChallengeCount, isPreloadingChallenges, flushPreloadedChallenges, getStoredObjective } from '../services/api';
import LoadingScreen from './LoadingScreen';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0a0a23;
  color: #ffffff;
  overflow-x: hidden; /* Prevent horizontal scrolling */
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const GameArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Ensure content doesn't overflow */
  height: 100vh; /* Full viewport height */
`;

const GameCanvas = styled.div`
  height: 400px; /* Changed from 500px to 400px */
  width: 100vw;
  position: relative;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
`;

const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  flex: 1;
  height: calc(100vh - 400px - 20px); /* Full height minus game height and margins */
`;

const FillInBlankContainer = styled.div`
  font-family: 'Courier New', monospace;
  background-color: #1e1e3f;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  white-space: pre-wrap;
  line-height: 1.5;
  color: rgb(237, 237, 237);
`;

const TemplateText = styled.span`
  color: rgb(237, 237, 237);
`;

const BlankInput = styled.input`
  background-color: #2d2d6d;
  color: #f8f8f2;
  border: 1px solid #6272a4;
  border-radius: 3px;
  padding: 5px 12px;
  font-family: 'Courier New', monospace;
  margin: 0 2px;
  width: ${props => props.width || '80px'};
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
  letter-spacing: 0;
  &:focus {
    outline: none;
    border-color: #f5b70a;
    box-shadow: 0 0 0 2px rgba(245, 183, 10, 0.3);
  }
`;

const StoryContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  margin: 10px;
  overflow-y: auto;
  height: 100%; /* Take full height */
  display: flex;
  flex-direction: column;
  position: relative; /* Added for positioning loading animation */
`;

const StoryTitle = styled.h2`
  color: #f5b70a;
  font-family: 'Press Start 2P', cursive;
  margin-bottom: 15px;
`;

const StoryText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
  font-family: 'Courier New', monospace;
  color:rgb(236, 236, 236);
`;

const StoryLabel = styled.span`
  font-weight: bold;
  color: #f5b70a;
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
`;

const ChallengeContainer = styled.div`
  flex: 2;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  height: 100%; /* Take full height */
  overflow: hidden; /* Changed from auto to hidden */
  position: relative;
`;

const ChallengeTitle = styled.h3`
  color: #f5b70a;
  font-family: 'Press Start 2P', cursive;
  margin-bottom: 15px;
`;

const ChallengeQuestion = styled.div`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
  background-color: #1e1e3f;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #f5b70a;
  font-family: 'Courier New', monospace;
  color: rgb(237, 237, 237);
`;

const CodeDisplay = styled.pre`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
  background-color: #1e1e3f;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #2196f3;
  font-family: 'Courier New', monospace;
  color: rgb(237, 237, 237);
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
`;

const AnswerContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* Space for the button container */
`;

const CodeEditor = styled.textarea`
  width: 100%;
  height: 180px; /* Adjusted to leave space for feedback and buttons */
  background-color: #1e1e3f;
  color: #fff;
  font-family: 'Courier New', monospace;
  padding: 10px;
  border: 1px solid #333;
  border-radius: 5px;
  resize: none;
  margin-bottom: 5px;
`;

const OptionButton = styled.button`
  background-color: #1e1e3f;
  color: #fff;
  border: 1px solid #f5b70a;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 5px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f5b70a;
    color: #1e1e3f;
  }
  
  ${props => props.selected && `
    background-color: #f5b70a;
    color: #1e1e3f;
  `}
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  margin-bottom: 15px;
  background-color: rgba(0, 0, 0, 0.9);
  border-top: 1px solid #333;
  z-index: 15;
`;

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  font-family: 'Press Start 2P', cursive;
  transition: all 0.3s;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const FeedbackContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${props => props.isCorrect ? 'rgba(76, 175, 80, 0.65)' : 'rgba(244, 67, 54, 0.65)'};
  border-left: 4px solid ${props => props.isCorrect ? '#4caf50' : '#f44336'};
  font-family: 'Courier New', monospace;
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translate(-50%, ${props => props.visible ? '0' : '-200%'}) scale(${props => props.visible ? '1' : '0.8'});
  z-index: 100;
  width: 80%;
  max-width: 500px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  color: white;
  text-align: center;
  opacity: ${props => props.visible ? '1' : '0'};
  transition: transform 0.9s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.8s ease-in-out;
  backdrop-filter: blur(3px);
  
  p {
    font-size: 18px;
    margin: 8px 0;
  }
  
  strong {
    font-size: 22px;
    display: block;
    margin-bottom: 10px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #f5b70a;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Use the same LoadingContainer style for story loading to maintain consistency

// Using the same styling for loading text in both containers

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 20;
  color: #f5b70a;
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  backdrop-filter: blur(3px);
  
  p {
    margin-top: 15px;
  }
`;

const HintButton = styled.button`
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: 'Press Start 2P', cursive;
`;

const HintContent = styled.div`
  margin-top: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #2c2c54;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  color: rgb(237, 237, 237);
  border-left: 4px solid #f5b70a;
  transform: translateX(${props => props.visible ? '0' : '100%'});
  opacity: ${props => props.visible ? '1' : '0'};
  transition: transform 0.5s ease-out, opacity 0.4s ease-in-out;
  position: relative;
  bottom: 0;
  margin-top: auto;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px;
  background-color: rgba(244, 67, 54, 0.3);
  border-left: 4px solid #f44336;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
`;

const GameScreen = ({ story: initialStory = null, initialChallenge = null, level = 1, language = 'python', initialError = null }) => {
  const [challenge, setChallenge] = useState(initialChallenge || null);
  const [story, setStory] = useState(initialStory || null);
  const [currentLevel, setCurrentLevel] = useState(level);
  const [loading, setLoading] = useState(!initialChallenge);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState(initialError || null);
  const [blankAnswers, setBlankAnswers] = useState([]);
  const [nextChallengeLoading, setNextChallengeLoading] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [feedbackAnimation, setFeedbackAnimation] = useState(false);
  const gameCanvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const nextChallengeRef = useRef(null);

  // Function to load story and challenge based on current level
  const loadStoryAndChallenge = async () => {
    try {
      // Show loading animations for both story and challenge
      setStoryLoading(true);
      setNextChallengeLoading(true);

      // Get current level from game engine or use state
      const level = gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : currentLevel;

      // Fetch story based on current level
      const storyResponse = await getStory(level);
      setStory(storyResponse);
      
      // Hide story loading indicator
      setStoryLoading(false);

      // Fetch challenge with objective from story - ensure objective exists
      if (!storyResponse || !storyResponse.objective) {
        console.error('Story response missing objective!', storyResponse);
        throw new Error('Story response missing objective');
      }
      
      // The objective is now stored in levelObjectives via getStory
      console.log(`Using objective for challenge: ${storyResponse.objective}`);
      const challengeResponse = await getChallenge(level, language, storyResponse.objective);
      setChallenge(challengeResponse);

      // Reset state for new challenge
      setSelectedOption(null);
      setUserAnswer('');
      setBlankAnswers([]);
      setFeedback(null);
      setSubmitDisabled(false);

      // Hide the challenge loading indicator
      setNextChallengeLoading(false);

      // Initialize blank answers array for fill-in-blank challenges
      if (challengeResponse.type === 'fill-in-blank') {
        if (challengeResponse.template) {
          const blankCount = (challengeResponse.template.match(/_____/g) || []).length;
          setBlankAnswers(new Array(blankCount).fill(''));
        } else {
          console.warn('Fill-in-blank question missing template field');
        }
      }

      // Start preloading more challenges in the background
      if (!isPreloadingChallenges()) {
        // The objective is already stored in levelObjectives via getStory
        const objective = getStoredObjective(level);
        if (objective) {
          console.log(`Preloading challenges with stored objective: ${objective}`);
          preloadChallenges(level, language, 2, objective);
        } else {
          console.error('No stored objective found for preloading challenges!');
        }
      }
    } catch (err) {
      setError('Failed to load game content. Please try again.');
      setStoryLoading(false);
      setNextChallengeLoading(false);
    }
  };

  // Listen for stage level change events
  useEffect(() => {
    const handleLevelChange = (event) => {
      const newLevel = event.detail.level;
      setCurrentLevel(newLevel);

      // Flush preloaded challenges for previous level
      flushPreloadedChallenges();
      console.log('Flushed preloaded questions when continuing to next level');

      // Show loading animations for both story and challenge
      setStoryLoading(true);
      setNextChallengeLoading(true);

      // Fetch new story and challenge for the new level after a short delay
      setTimeout(() => {
        loadStoryAndChallenge();
      }, 500);
    };

    // Add event listener
    document.addEventListener('stage-level-changed', handleLevelChange);

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('stage-level-changed', handleLevelChange);
    };
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (feedback) {
      // Start animation after a small delay
      setTimeout(() => {
        setFeedbackAnimation(true);
      }, 100);
    } else {
      setFeedbackAnimation(false);
    }
  }, [feedback]);

  useEffect(() => {
    // If we already have a challenge from props, just initialize the game engine
    if (initialChallenge) {
      // Initialize game engine after component is fully rendered
      setTimeout(() => {
        if (gameCanvasRef.current) {
          gameEngineRef.current = new GameEngine('game-canvas', () => {
          });
          gameEngineRef.current.init();
        }
      }, 100);

      // Set template as initial value for fill-in-blank challenges
      if (initialChallenge.type === 'fill-in-blank') {
        if (initialChallenge.template) {
          // Initialize blank answers array based on number of blanks in template
          const blankCount = (initialChallenge.template.match(/_____/g) || []).length;
          setBlankAnswers(new Array(blankCount).fill(''));
        } else {
          console.warn('Fill-in-blank question missing template field');
        }
      }

      // Start preloading challenges in the background
      const objective = initialStory.objective;
      preloadChallenges(level, language, 2, objective);

      return;
    }

    // Only fetch story and challenge if not provided in props
    const fetchChallenge = async () => {
      setLoadingProgress(0);
      try {
        setLoadingProgress(20);

        // Fetch story based on level
        const storyData = await getStory(level);
        setStory(storyData);

        setLoadingProgress(50);

        // Fetch challenge
        const data = await getChallenge(level, language);
        setChallenge(data);

        // Set template as initial value for fill-in-blank challenges
        if (data.type === 'fill-in-blank') {
          if (data.template) {
            // Initialize blank answers array based on number of blanks in template
            const blankCount = (data.template.match(/_____/g) || []).length;
            setBlankAnswers(new Array(blankCount).fill(''));
          } else {
            console.warn('Fill-in-blank question missing template field');
          }
        }

        setLoadingProgress(80);

        // Initialize game engine after challenge is loaded
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(100);

          // Initialize game engine after component is fully rendered
          if (gameCanvasRef.current) {
            gameEngineRef.current = new GameEngine('game-canvas', () => {
            });
            gameEngineRef.current.init();
          }

          // Start preloading challenges in the background
          const objective = storyData.objective;
          preloadChallenges(level, language, 2, objective);
        }, 500);
      } catch (error) {
        setError('Failed to load challenge data. Please try again.');
        setLoading(false);
      }
    };

    if (!initialChallenge) {
      fetchChallenge();
    }

    return () => {
      // Clean up game engine if needed
      if (gameEngineRef.current && gameEngineRef.current.game) {
        gameEngineRef.current.game.destroy(true);
      }
    };
  }, [level, language, initialChallenge]);

  const handleAnswerChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const handleBlankChange = (index, value) => {
    const newAnswers = [...blankAnswers];
    newAnswers[index] = value;
    setBlankAnswers(newAnswers);

    // Join all answers with comma and space for the final answer
    setUserAnswer(newAnswers.join(', '));
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const loadNextChallenge = async (levelOverride = null) => {
    setNextChallengeLoading(true);
    try {
      // Use the provided level override, or get the current level from the game engine, or fall back to the level state
      const currentLevel = levelOverride ||
        (gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : currentLevel);

      console.log(`Loading next challenge for level: ${currentLevel}`);
      
      // Get the stored objective for this level
      const objective = getStoredObjective(currentLevel);
      if (!objective) {
        console.error('No stored objective found when loading next challenge!');
        throw new Error('No stored objective found');
      }
      
      console.log(`Using stored objective for next challenge: ${objective}`);
      const nextChallenge = await getChallenge(currentLevel, language, objective);
      nextChallengeRef.current = nextChallenge;

      // Trigger another background preload if cache is getting low
      if (getCachedChallengeCount(currentLevel) < 1 && !isPreloadingChallenges()) {
        preloadChallenges(currentLevel, language, 2, objective);
      }
    } catch (error) {
    } finally {
      setNextChallengeLoading(false);
    }
  };

  const moveToNextChallenge = () => {
    // Reset state for new challenge
    setFeedback(null);
    setUserAnswer('');
    setSelectedOption(null);
    setShowHint(false);
    setSubmitDisabled(false);

    // If we have a preloaded challenge, use it
    if (nextChallengeRef.current) {
      const nextChallenge = nextChallengeRef.current;
      setChallenge(nextChallenge);
      nextChallengeRef.current = null;

      // Set template as initial value for fill-in-blank challenges
      if (nextChallenge.type === 'fill-in-blank') {
        if (nextChallenge.template) {
          // Initialize blank answers array based on number of blanks in template
          const blankCount = (nextChallenge.template.match(/_____/g) || []).length;
          setBlankAnswers(new Array(blankCount).fill(''));
        } else {
          console.warn('Fill-in-blank question missing template field');
        }
      }

      // Start loading the next challenge in the background
      const currentLevel = gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : currentLevel;
      loadNextChallenge(currentLevel);
    } else {
      // If no preloaded challenge, show loading state and fetch one
      setNextChallengeLoading(true);
      const currentLevel = gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : currentLevel;
      // Get the stored objective for this level
      const objective = getStoredObjective(currentLevel);
      if (!objective) {
        console.error('No stored objective found when moving to next challenge!');
        throw new Error('No stored objective found');
      }
      
      console.log(`Using stored objective for next challenge: ${objective}`);
      getChallenge(currentLevel, language, objective)
        .then(data => {
          setChallenge(data);

          // Set template as initial value for fill-in-blank challenges
          if (data.type === 'fill-in-blank') {
            if (data.template) {
              // Initialize blank answers array based on number of blanks in template
              const blankCount = (data.template.match(/_____/g) || []).length;
              setBlankAnswers(new Array(blankCount).fill(''));
            } else {
              console.warn('Fill-in-blank question missing template field');
            }
          }

          setNextChallengeLoading(false);

          // Continue preloading more challenges
          const currentLevel = gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : currentLevel;
          loadNextChallenge(currentLevel);
        })
        .catch(error => {
          setError('Failed to load next challenge. Please try again.');
          setNextChallengeLoading(false);
        });
    }
  };

  const handleSubmit = () => {
    if (!challenge || submitDisabled) return;

    // Get the user's answer
    const answer = challenge.type === 'multiple-choice' ? selectedOption : userAnswer;

    // Improved answer validation
    let isCorrect = false;

    if (challenge.type === 'multiple-choice') {
      // For multiple choice, still use exact matching
      isCorrect = answer === challenge.answer;
    } else if (challenge.type === 'fill-in-blank' && answer.includes(',')) {
      // For fill-in-blank with multiple answers
      const userParts = answer.split(',').map(part => part.trim());
      const correctParts = challenge.answer.split(',').map(part => part.trim());

      if (userParts.length === correctParts.length) {
        isCorrect = userParts.every((part, index) => {
          const userClean = part.replace(/\s/g, '').toLowerCase();
          const correctClean = correctParts[index].replace(/\s/g, '').toLowerCase();
          return userClean === correctClean;
        });
      }
    } else {
      // For single-answer fill-in-blank
      const userAnswerClean = answer.trim().replace(/\s+/g, ' ');
      const correctAnswerClean = challenge.answer.trim().replace(/\s+/g, ' ');

      // Check for exact match after normalization
      if (userAnswerClean === correctAnswerClean) {
        isCorrect = true;
      } else {
        // Check for semantic equivalence (ignoring whitespace, semicolons, etc.)
        const userNoWhitespace = userAnswerClean.replace(/\s/g, '').replace(/;/g, '');
        const correctNoWhitespace = correctAnswerClean.replace(/\s/g, '').replace(/;/g, '');

        // Check for case insensitivity
        const userLower = userNoWhitespace.toLowerCase();
        const correctLower = correctNoWhitespace.toLowerCase();

        isCorrect = userNoWhitespace === correctNoWhitespace || userLower === correctLower;
      }
    }

    // Create feedback object
    const result = {
      is_correct: isCorrect,
      feedback: isCorrect
        ? "Correct! Great job!"
        : `Incorrect. The correct answer is: ${challenge.answer}`,
      next_hint: !isCorrect ? challenge.hint : null
    };

    setFeedback(result);
    setSubmitDisabled(true);

    // Reset feedback animation state
    setFeedbackAnimation(false);

    // Trigger animation after a small delay
    setTimeout(() => {
      setFeedbackAnimation(true);
    }, 50);

    // Update game state based on answer correctness
    if (result.is_correct) {
      // Player attacks enemy
      const enemyDefeated = gameEngineRef.current.playerAttack();

      // Add points
      gameEngineRef.current.addPoints(challenge.xp_reward || playerConfig.pointsPerCorrectAnswer);
    } else {
      // Enemy attacks player
      const playerDefeated = gameEngineRef.current.enemyAttack();

      // If player is defeated, we don't need to do anything here
      // as the game engine will handle showing the game over popup
    }

    // Start loading the next challenge if we don't have one yet
    if (!nextChallengeRef.current && !isPreloadingChallenges()) {
      // Get current level from game engine
      const currentLevel = gameEngineRef.current ? gameEngineRef.current.getCurrentLevel() : 1;
      loadNextChallenge(currentLevel);
    }

    // After feedback delay, move to the next challenge
    setTimeout(() => {
      // Fade out feedback before moving to next challenge
      setFeedbackAnimation(false);

      // Wait for fade out animation to complete before moving to next challenge
      setTimeout(() => {
        // Only move to next challenge if enemy or player isn't defeated
        // (those cases are handled by the game engine popups)
        if (gameEngineRef.current && gameEngineRef.current.enemyHealth > 1 && gameEngineRef.current.playerHealth > 1) {
          moveToNextChallenge();
        }
      }, 500);
    }, gameProgressionConfig.answerFeedbackDelay);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Calculate precise width for input field based on expected answer
  const calculateInputWidth = (answer) => {
    if (!answer) return '80px';

    const trimmedAnswer = answer.trim();
    const length = trimmedAnswer.length;

    const charWidth = 8.4;
    const basePadding = 24;

    const calculatedWidth = (length * charWidth) + basePadding;
    return `${Math.max(70, calculatedWidth)}px`;
  };

  // Render fill-in-blank template with input fields
  const renderFillInBlankTemplate = (template) => {
    if (!template) return null;

    // Split the template by the blank marker (_____)
    const parts = template.split('_____');

    // Calculate answer widths once to ensure consistency
    const answerWidths = [];
    if (challenge && challenge.answer) {
      const answers = challenge.answer.split(',');
      answers.forEach((answer, i) => {
        answerWidths[i] = calculateInputWidth(answer);
      });
    }

    return (
      <FillInBlankContainer>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <TemplateText>{part}</TemplateText>
            {index < parts.length - 1 && (
              <BlankInput
                type="text"
                value={blankAnswers[index] || ''}
                onChange={(e) => handleBlankChange(index, e.target.value)}
                width={answerWidths[index] || '80px'}
                maxLength={getMaxLength(index)}
              />
            )}
          </React.Fragment>
        ))}
      </FillInBlankContainer>
    );
  };

  // Get maximum length for input field to match answer length
  const getMaxLength = (index) => {
    if (!challenge || !challenge.answer) return 20;

    const answers = challenge.answer.split(',');
    if (index >= answers.length) return 20;

    // Add a small buffer (2 chars) to allow for slight variations
    return answers[index].trim().length + 2;
  };

  // Estimate appropriate width for input field based on expected answer length
  const estimateInputWidth = (index) => {
    if (!challenge || !challenge.answer) return '80px';

    const answers = challenge.answer.split(',');
    if (index >= answers.length) return '80px';

    const answerLength = answers[index].trim().length;

    // More precise width calculation based on character count
    // For monospace fonts, each character is roughly 7.5px wide
    // Add padding (16px) and border (2px) for a total of 18px extra space
    const charWidth = 7.5;
    const extraSpace = 18;

    // Minimum width of 60px, and scale precisely with answer length
    return `${Math.max(60, Math.min(200, (answerLength * charWidth) + extraSpace))}px`;
  };

  if (loading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <h3>Error</h3>
          <p>{error}</p>
          <p>Please refresh the page to try again.</p>
        </ErrorMessage>
      </Container>
    );
  }

  // If challenge is still null after loading, continue showing loading screen
  if (!challenge) {
    return <LoadingScreen progress={95} />;
  }

  return (
    <Container>
      <GameContainer>
        <GameArea>
          <GameCanvas id="game-canvas" ref={gameCanvasRef} />

          {/* Feedback popup that appears in front of game engine */}
          {feedback && (
            <FeedbackContainer isCorrect={feedback.is_correct} visible={feedbackAnimation}>
              <strong>{feedback.is_correct ? 'Correct!' : 'Incorrect!'}</strong>
              <p>{feedback.feedback}</p>
            </FeedbackContainer>
          )}

          <ContentContainer>
            <StoryContainer>
              <StoryTitle>{story?.title || "Adventure Begins"}</StoryTitle>
              <StoryText>{story?.story || "Your coding adventure is about to begin..."}</StoryText>
              <StoryText>
                <StoryLabel>Objective: </StoryLabel> {story?.objective || "Solve coding challenges to advance"}
              </StoryText>

              {storyLoading && (
                <LoadingContainer>
                  <LoadingSpinner />
                  <p>Loading story...</p>
                </LoadingContainer>
              )}

              {/* Spacer to push hints to the bottom */}
              <div style={{ flex: 1 }}></div>

              {/* Hint moved to story container with animation - now at bottom and slides from right */}
              {challenge && challenge.hint && (
                <HintContent visible={showHint}>
                  <p><strong>Hint:</strong> {challenge.hint}</p>
                </HintContent>
              )}
            </StoryContainer>

            <ChallengeContainer>
              <ChallengeTitle>Coding Challenge</ChallengeTitle>
              <ChallengeQuestion>{challenge.question}</ChallengeQuestion>

              {/* Display code only for multiple-choice questions */}
              {challenge.type === 'multiple-choice' && challenge.code && (
                <CodeDisplay>
                  {challenge.code.toString().replace(/\\n/g, '\n')}
                </CodeDisplay>
              )}

              {nextChallengeLoading && (
                <LoadingContainer>
                  <LoadingSpinner />
                  <p>Loading next challenge...</p>
                </LoadingContainer>
              )}

              <AnswerContainer>
                {challenge.type === 'multiple-choice' ? (
                  <div>
                    {challenge.options && challenge.options.map((option, index) => (
                      <OptionButton
                        key={index}
                        selected={selectedOption === option}
                        onClick={() => handleOptionSelect(option)}
                        disabled={submitDisabled}
                      >
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                ) : (
                  // Default to fill-in-blank for any other type
                  renderFillInBlankTemplate(challenge.template)
                )}

                <ButtonContainer>
                  <HintButton onClick={toggleHint} disabled={submitDisabled}>
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </HintButton>

                  <SubmitButton
                    onClick={handleSubmit}
                    disabled={submitDisabled || (challenge.type === 'multiple-choice' ? !selectedOption : !userAnswer)}
                  >
                    Submit Answer
                  </SubmitButton>
                </ButtonContainer>
              </AnswerContainer>
            </ChallengeContainer>
          </ContentContainer>
        </GameArea>
      </GameContainer>
    </Container>
  );
};

export default GameScreen;
