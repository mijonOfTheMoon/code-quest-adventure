import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #0a0a23;
  background-image: radial-gradient(circle at 50% 50%, #1a1a3a 0%, #0a0a23 100%);
  color: #ffffff;
  font-family: 'Press Start 2P', cursive;
  animation: ${fadeIn} 1s ease-in;
  overflow: hidden;
  position: relative;
`;

const StarBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  
  &:before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
      radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
      radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
  }
`;

const Title = styled.h1`
  font-size: 4rem;
  margin-bottom: 2rem;
  color: #f5b70a;
  text-shadow: 0 0 10px #f5b70a, 0 0 20px #f5b70a;
  text-align: center;
  z-index: 1;
  animation: ${pulse} 3s infinite ease-in-out;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 3rem;
  color: #ffffff;
  text-align: center;
  max-width: 800px;
  z-index: 1;
`;

const CharacterImage = styled.div`
  width: 200px;
  height: 200px;
  margin-bottom: 2rem;
  background-color: #f5b70a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  color: #0a0a23;
  box-shadow: 0 0 20px #f5b70a;
  animation: ${float} 6s infinite ease-in-out;
  z-index: 1;
`;

const StartButton = styled.button`
  background-color: #f5b70a;
  color: #0a0a23;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  font-family: 'Press Start 2P', cursive;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 2rem;
  transition: all 0.3s;
  box-shadow: 0 0 10px #f5b70a;
  z-index: 1;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px #f5b70a;
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  margin-bottom: 2rem;
  z-index: 1;
`;

const LanguageButton = styled.button`
  background-color: ${props => props.selected ? '#f5b70a' : 'transparent'};
  color: ${props => props.selected ? '#0a0a23' : '#f5b70a'};
  border: 2px solid #f5b70a;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  font-family: 'Press Start 2P', cursive;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: ${props => props.selected ? '#f5b70a' : 'rgba(245, 183, 10, 0.2)'};
  }
`;

const StartScreen = ({ onStart }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const handleStart = () => {
    onStart(selectedLanguage);
  };

  return (
    <Container>
      <StarBackground />
      <Title>Code Quest Adventure</Title>
      <Subtitle>
        Embark on an epic journey through the lands of programming.
        Solve coding challenges, defeat bugs, and become a master developer!
      </Subtitle>
      
      <CharacterImage>⚔️</CharacterImage>
      
      <LanguageSelector>
        <LanguageButton 
          selected={selectedLanguage === 'python'}
          onClick={() => setSelectedLanguage('python')}
        >
          Python
        </LanguageButton>
        <LanguageButton 
          selected={selectedLanguage === 'javascript'}
          onClick={() => setSelectedLanguage('javascript')}
        >
          JavaScript
        </LanguageButton>
      </LanguageSelector>
      
      <StartButton onClick={handleStart}>
        Start Adventure
      </StartButton>
    </Container>
  );
};

export default StartScreen;
