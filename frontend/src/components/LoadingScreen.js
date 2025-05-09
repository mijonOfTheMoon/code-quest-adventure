import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import loadingAnimation from '../assets/loading-animation.gif';

const quotes = [
  "Debugging is like being the detective in a crime movie where you're also the murderer.",
  "There are only two hard things in Computer Science: cache invalidation and naming things.",
  "The best error message is the one that never shows up.",
  "Code is like humor. When you have to explain it, it's bad.",
  "Programming is the art of telling another human what one wants the computer to do.",
  "The most important property of a program is whether it accomplishes the intention of its user.",
  "First, solve the problem. Then, write the code.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "The sooner you start to code, the longer the program will take.",
  "Simplicity is the soul of efficiency.",
  "Make it work, make it right, make it fast.",
  "Talk is cheap. Show me the code.",
  "Code never lies, comments sometimes do.",
  "Programming isn't about what you know; it's about what you can figure out.",
  "The only way to learn a new programming language is by writing programs in it."
];

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #0a0a23;
  color: #ffffff;
  font-family: 'Press Start 2P', cursive;
  text-align: center;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #f5b70a;
  text-shadow: 0 0 10px #f5b70a;
`;

const QuoteContainer = styled.div`
  font-size: 1.2rem;
  max-width: 800px;
  height: 120px; /* Fixed height to prevent layout shifts */
  margin: 2rem auto;
  padding: 1rem;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QuoteText = styled.div`
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
`;

const ProgressBarContainer = styled.div`
  width: 80%;
  max-width: 600px;
  height: 30px;
  background-color: #333;
  border-radius: 15px;
  margin: 2rem 0;
  overflow: hidden;
  border: 2px solid #f5b70a;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #f5b70a, #ff7b00);
  width: ${props => props.progress}%;
  transition: width 0.5s ease-in-out;
  border-radius: 15px;
`;

const LoadingText = styled.div`
  font-size: 1.5rem;
  color: #f5b70a;
  margin-top: 1rem;
`;

const AnimatedDots = styled.span`
  display: inline-block;
  width: 30px;
  text-align: left;
`;

const LoadingAnimation = styled.div`
  margin: 2rem 0;
  img {
    width: auto;
    height: 150px;
    border-radius: 10px;
  }
`;

const LoadingScreen = ({ progress = 0 }) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(Math.floor(Math.random() * quotes.length));
  const [currentQuoteVisible, setCurrentQuoteVisible] = useState(true);
  const [dots, setDots] = useState('.');

  useEffect(() => {
    // Quote rotation effect with randomization
    const quoteInterval = setInterval(() => {
      // Start fade out of current quote
      setCurrentQuoteVisible(false);
      
      // After current quote fades out, show next quote
      setTimeout(() => {
        // Select a random quote that's different from the current one
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * quotes.length);
        } while (newIndex === currentQuoteIndex && quotes.length > 1);
        
        setCurrentQuoteIndex(newIndex);
        setCurrentQuoteVisible(true);
      }, 500);
    }, 5000); // Change quote every 5 seconds

    // Animated dots effect
    const dotsInterval = setInterval(() => {
      setDots(prevDots => {
        if (prevDots === '.') return '..';
        if (prevDots === '..') return '...';
        return '.';
      });
    }, 500);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(dotsInterval);
    };
  }, [currentQuoteIndex]);

  return (
    <Container>
      <Title>Code Quest Adventure</Title>
      <LoadingAnimation>
        <img src={loadingAnimation} alt="Loading Animation" />
      </LoadingAnimation>
      <QuoteContainer>
        <QuoteText visible={currentQuoteVisible}>
          {quotes[currentQuoteIndex]}
        </QuoteText>
      </QuoteContainer>
      <ProgressBarContainer>
        <ProgressBarFill progress={progress} />
      </ProgressBarContainer>
      <LoadingText>
        {progress < 100 ? (
          <>
            Generating your adventure<AnimatedDots>{dots}</AnimatedDots>
          </>
        ) : (
          'Adventure ready!'
        )}
      </LoadingText>
    </Container>
  );
};

export default LoadingScreen;
