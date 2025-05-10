import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Cache for storing preloaded challenges
const challengeCache = {
  items: [],
  isLoading: false
};

export const getStory = async (level) => {
  try {
    const response = await axios.get(`${API_URL}/story`, {
      params: { level }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
};

export const getChallenge = async (level, language) => {
  try {
    // Check if we have a cached challenge
    if (challengeCache.items.length > 0) {
      return challengeCache.items.shift();
    }
    
    // If no cached challenge, fetch one directly
    const response = await axios.get(`${API_URL}/challenge`, {
      params: { level, language }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};

export const preloadChallenges = async (level, language, count = 6) => {
  // Don't start another preload if one is already in progress
  if (challengeCache.isLoading) return;
  
  challengeCache.isLoading = true;
  
  try {
    // Preload challenges one by one to avoid overwhelming the server
    for (let i = 0; i < count; i++) {
      const response = await axios.get(`${API_URL}/challenge`, {
        params: { level, language }
      });
      challengeCache.items.push(response.data);
      console.log(`Preloaded challenge ${i + 1}/${count}`);
    }
  } catch (error) {
    console.error('Error preloading challenges:', error);
  } finally {
    challengeCache.isLoading = false;
  }
};

export const getCachedChallengeCount = () => {
  return challengeCache.items.length;
};

export const isPreloadingChallenges = () => {
  return challengeCache.isLoading;
};

export const submitAnswer = async (answer, correct_answer, question) => {
  try {
    const response = await axios.post(`${API_URL}/feedback`, {
      answer,
      correct_answer,
      question
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};
