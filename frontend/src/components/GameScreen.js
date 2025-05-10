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
  margin-bottom: 10px;
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
  color:rgb(237, 237, 237);
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
  const [blankAnswers, setBlankAnswers] = useState([]);
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

      // Set template as initial value for fill-in-blank challenges
      if (initialChallenge.type === 'fill-in-blank' && initialChallenge.template) {
        // Initialize blank answers array based on number of blanks in template
        const blankCount = (initialChallenge.template.match(/_____/g) || []).length;
        setBlankAnswers(new Array(blankCount).fill(''));
      }

      return;
    }

    // Only fetch challenge if not provided in props
    const fetchChallenge = async () => {
      setLoadingProgress(0);
      try {
        setLoadingProgress(30);
        const data = await getChallenge(level, language);
        setChallenge(data);

        // Set template as initial value for fill-in-blank challenges
        if (data.type === 'fill-in-blank' && data.template) {
          // Initialize blank answers array based on number of blanks in template
          const blankCount = (data.template.match(/_____/g) || []).length;
          setBlankAnswers(new Array(blankCount).fill(''));
        }

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

  const handleSubmit = () => {
    if (!challenge) return;

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
                ) : (
                  // Default to fill-in-blank for any other type
                  renderFillInBlankTemplate(challenge.template)
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
