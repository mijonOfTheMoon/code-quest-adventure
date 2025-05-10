import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import GameEngine from '../game/GameEngine';
import { getChallenge, submitAnswer } from '../services/api';
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

const StoryContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  margin: 10px;
  overflow-y: auto;
  height: 100%; /* Take full height */
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
  overflow-y: hidden; /* Changed from auto to hidden */
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
  color: #e0e0e0;
`;

const AnswerContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding-bottom: 60px; /* Space for the button container */
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
  margin-bottom: 15px;
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
  padding: 15px 0;
  background-color: rgba(0, 0, 0, 0.5);
  border-top: 1px solid #333;
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
  padding: 10px;
  border-radius: 5px;
  background-color: ${props => props.isCorrect ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
  border-left: 4px solid ${props => props.isCorrect ? '#4caf50' : '#f44336'};
  font-family: 'Courier New', monospace;
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
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #2c2c54;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  color: #e0e0e0;
  border-left: 4px solid #f5b70a;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px;
  background-color: rgba(244, 67, 54, 0.3);
  border-left: 4px solid #f44336;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
`;

const GameScreen = ({ story, initialChallenge = null, level = 1, language = 'python', initialError = null }) => {
  const [challenge, setChallenge] = useState(initialChallenge || null);
  const [loading, setLoading] = useState(!initialChallenge);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState(initialError || null);
  const gameCanvasRef = useRef(null);
  const gameEngineRef = useRef(null);

  useEffect(() => {
    // If we already have a challenge from props, just initialize the game engine
    if (initialChallenge) {
      // Initialize game engine after component is fully rendered
      setTimeout(() => {
        if (gameCanvasRef.current) {
          gameEngineRef.current = new GameEngine('game-canvas', () => {
            console.log('Game engine initialized');
          });
          gameEngineRef.current.init();
        }
      }, 100);
      return;
    }

    // Only fetch challenge if not provided in props
    const fetchChallenge = async () => {
      setLoadingProgress(0);
      try {
        setLoadingProgress(30);
        const data = await getChallenge(level, language);
        setChallenge(data);
        setLoadingProgress(80);
        
        // Initialize game engine after challenge is loaded
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(100);
          
          // Initialize game engine after component is fully rendered
          if (gameCanvasRef.current) {
            gameEngineRef.current = new GameEngine('game-canvas', () => {
              console.log('Game engine initialized');
            });
            gameEngineRef.current.init();
          }
        }, 500);
      } catch (error) {
        console.error('Error fetching challenge:', error);
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

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!challenge) return;
    
    // Get the user's answer
    const answer = challenge.type === 'multiple-choice' ? selectedOption : userAnswer;
    
    // Improved answer validation
    let isCorrect = false;
    
    if (challenge.type === 'multiple-choice') {
      // For multiple choice, still use exact matching
      isCorrect = answer === challenge.answer;
    } else {
      // For code challenges, use more flexible matching
      const userAnswerClean = answer.trim().replace(/\s+/g, ' ');
      const correctAnswerClean = challenge.answer.trim().replace(/\s+/g, ' ');
      
      // Check for exact match after normalization
      if (userAnswerClean === correctAnswerClean) {
        isCorrect = true;
      } else {
        // Check for semantic equivalence in code (ignoring whitespace, semicolons, etc.)
        const userNoWhitespace = userAnswerClean.replace(/\s/g, '').replace(/;/g, '');
        const correctNoWhitespace = correctAnswerClean.replace(/\s/g, '').replace(/;/g, '');
        
        // Check for case insensitivity for non-case-sensitive languages
        const userLower = userNoWhitespace.toLowerCase();
        const correctLower = correctNoWhitespace.toLowerCase();
        
        isCorrect = userNoWhitespace === correctNoWhitespace || userLower === correctLower;
        
        // Additional check for Python-specific equivalence
        if (!isCorrect && language === 'python') {
          // Handle Python print statements with different quote styles
          const userPythonNormalized = userLower
            .replace(/print\(['"](.+)['"]\)/g, 'print($1)')
            .replace(/print\s*\(['"](.+)['"]\)/g, 'print($1)');
          const correctPythonNormalized = correctLower
            .replace(/print\(['"](.+)['"]\)/g, 'print($1)')
            .replace(/print\s*\(['"](.+)['"]\)/g, 'print($1)');
          
          isCorrect = userPythonNormalized === correctPythonNormalized;
        }
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
    
    // Update game state based on answer correctness
    if (result.is_correct) {
      // Player attacks enemy
      const enemyDefeated = gameEngineRef.current.playerAttack(30);
      
      // Add XP points
      gameEngineRef.current.addXP(challenge.xp_reward || 20);
      
      if (enemyDefeated) {
        // Reset enemy for next challenge
        setTimeout(() => {
          gameEngineRef.current.resetEnemy();
        }, 2000);
      }
    } else {
      // Enemy attacks player
      const playerDefeated = gameEngineRef.current.enemyAttack(15);
      
      if (playerDefeated) {
        // Game over
        gameEngineRef.current.gameOver();
      }
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
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
          <ContentContainer>
            <StoryContainer>
              <StoryTitle>{story?.title || "Adventure Begins"}</StoryTitle>
              <StoryText>{story?.story || "Your coding adventure is about to begin..."}</StoryText>
              <StoryText>
                <StoryLabel>Objective: </StoryLabel> {story?.objective || "Solve coding challenges to advance"}
              </StoryText>
            </StoryContainer>
            
            <ChallengeContainer>
              <ChallengeTitle>Coding Challenge</ChallengeTitle>
              <ChallengeQuestion>{challenge.question}</ChallengeQuestion>
              
              <AnswerContainer>
                {challenge.type === 'multiple-choice' ? (
                  <div>
                    {challenge.options && challenge.options.map((option, index) => (
                      <OptionButton 
                        key={index}
                        selected={selectedOption === option}
                        onClick={() => handleOptionSelect(option)}
                      >
                        {option}
                      </OptionButton>
                    ))}
                  </div>
                ) : challenge.type === 'fill-in-blank' ? (
                  <CodeEditor 
                    value={userAnswer}
                    onChange={handleAnswerChange}
                    placeholder={challenge.template || "Type your answer here..."}
                  />
                ) : (
                  <CodeEditor 
                    value={userAnswer}
                    onChange={handleAnswerChange}
                    placeholder="Write your code here..."
                  />
                )}
                
                <ButtonContainer>
                  <HintButton onClick={toggleHint}>
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </HintButton>
                  
                  <SubmitButton 
                    onClick={handleSubmit}
                    disabled={challenge.type === 'multiple-choice' ? !selectedOption : !userAnswer}
                  >
                    Submit Answer
                  </SubmitButton>
                </ButtonContainer>
                
                {showHint && challenge.hint && (
                  <HintContent>
                    <p><strong>Hint:</strong> {challenge.hint}</p>
                  </HintContent>
                )}
                
                {feedback && (
                  <FeedbackContainer isCorrect={feedback.is_correct}>
                    <p><strong>{feedback.is_correct ? 'Correct!' : 'Incorrect!'}</strong></p>
                    <p>{feedback.feedback}</p>
                    {feedback.is_correct && feedback.next_hint && (
                      <p><strong>Hint:</strong> {feedback.next_hint}</p>
                    )}
                  </FeedbackContainer>
                )}
              </AnswerContainer>
            </ChallengeContainer>
          </ContentContainer>
        </GameArea>
      </GameContainer>
    </Container>
  );
};

export default GameScreen;
