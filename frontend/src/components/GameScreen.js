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
`;

const GameContainer = styled.div`
  display: flex;
  height: 100%;
`;

const GameArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const GameCanvas = styled.div`
  height: 400px;
  width: 100%;
  position: relative;
`;

const StoryContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  margin: 10px;
  overflow-y: auto;
  font-family: 'Roboto', sans-serif;
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
`;

const ChallengeContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  margin: 10px;
  display: flex;
  flex-direction: column;
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
`;

const AnswerContainer = styled.div`
  margin-top: 15px;
`;

const CodeEditor = styled.textarea`
  width: 100%;
  height: 150px;
  background-color: #1e1e3f;
  color: #fff;
  font-family: monospace;
  padding: 10px;
  border: 1px solid #333;
  border-radius: 5px;
  resize: none;
`;

const OptionButton = styled.button`
  background-color: #1e1e3f;
  color: #fff;
  border: 1px solid #f5b70a;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 5px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
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

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 10px 0;
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
  padding: 10px;
  border-radius: 5px;
  background-color: ${props => props.isCorrect ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
  border-left: 4px solid ${props => props.isCorrect ? '#4caf50' : '#f44336'};
`;

const HintButton = styled.button`
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  font-family: 'Roboto', sans-serif;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px;
  background-color: rgba(244, 67, 54, 0.3);
  border-left: 4px solid #f44336;
  border-radius: 5px;
  font-family: 'Roboto', sans-serif;
`;

const GameScreen = ({ story, level = 1, language = 'python' }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState(null);
  const gameCanvasRef = useRef(null);
  const gameEngineRef = useRef(null);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);

    // Fetch challenge data
    const fetchChallenge = async () => {
      try {
        const data = await getChallenge(level, language);
        setChallenge(data);
        
        // Initialize game engine after challenge is loaded
        setTimeout(() => {
          setLoading(false);
          clearInterval(interval);
          
          // Initialize game engine after component is fully rendered
          setTimeout(() => {
            if (gameCanvasRef.current) {
              gameEngineRef.current = new GameEngine('game-canvas', () => {
                console.log('Game engine initialized');
              });
              gameEngineRef.current.init();
            }
          }, 100);
        }, 2000);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        setError('Failed to load challenge data. Please try again.');
        setLoading(false);
        clearInterval(interval);
      }
    };

    fetchChallenge();

    return () => {
      clearInterval(interval);
      // Clean up game engine if needed
      if (gameEngineRef.current && gameEngineRef.current.game) {
        gameEngineRef.current.game.destroy(true);
      }
    };
  }, [level, language]);

  const handleAnswerChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!challenge) return;
    
    try {
      const answer = challenge.type === 'multiple-choice' ? selectedOption : userAnswer;
      const result = await submitAnswer(answer, challenge.answer, challenge.question);
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
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback({
        is_correct: false,
        feedback: 'An error occurred while checking your answer. Please try again.'
      });
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

  // If challenge is still null after loading, show a default challenge
  if (!challenge) {
    const defaultChallenge = {
      question: "What does the print function do in Python?",
      type: "multiple-choice",
      options: ["Displays output to the console", "Prints to a printer", "Creates a file", "None of the above"],
      answer: "Displays output to the console",
      hint: "Think about how you see output from your code",
      explanation: "The print function in Python displays output to the console or terminal",
      difficulty: "easy",
      xp_reward: 10
    };
    setChallenge(defaultChallenge);
    return <LoadingScreen progress={95} />;
  }

  return (
    <Container>
      <GameContainer>
        <GameArea>
          <GameCanvas id="game-canvas" ref={gameCanvasRef} />
          <StoryContainer>
            <StoryTitle>{story?.title || "Adventure Begins"}</StoryTitle>
            <StoryText>{story?.story || "Your coding adventure is about to begin..."}</StoryText>
            <StoryText><strong>Setting:</strong> {story?.setting || "A digital realm"}</StoryText>
            <StoryText><strong>Character:</strong> {story?.character || "A brave coder"}</StoryText>
            <StoryText><strong>Objective:</strong> {story?.objective || "Solve coding challenges to advance"}</StoryText>
          </StoryContainer>
        </GameArea>
        
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
            
            <SubmitButton 
              onClick={handleSubmit}
              disabled={challenge.type === 'multiple-choice' ? !selectedOption : !userAnswer}
            >
              Submit Answer
            </SubmitButton>
            
            <HintButton onClick={toggleHint}>
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </HintButton>
            
            {showHint && challenge.hint && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#2c2c54', borderRadius: '5px' }}>
                <p><strong>Hint:</strong> {challenge.hint}</p>
              </div>
            )}
            
            {feedback && (
              <FeedbackContainer isCorrect={feedback.is_correct}>
                <p><strong>{feedback.is_correct ? 'Correct!' : 'Incorrect!'}</strong></p>
                <p>{feedback.feedback}</p>
                {!feedback.is_correct && feedback.next_hint && (
                  <p><strong>Hint:</strong> {feedback.next_hint}</p>
                )}
              </FeedbackContainer>
            )}
          </AnswerContainer>
        </ChallengeContainer>
      </GameContainer>
    </Container>
  );
};

export default GameScreen;
