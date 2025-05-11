import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Cache for storing preloaded challenges by level
const challengeCache = {
  items: {
    1: [],
    2: [],
    3: []
  },
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
    // Ensure level is a number and within valid range
    const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
    console.log(`Getting challenge for level: ${validLevel}`);
    
    // Check if we have a cached challenge for this level
    if (challengeCache.items[validLevel] && challengeCache.items[validLevel].length > 0) {
      console.log(`Using cached challenge for level ${validLevel}`);
      return challengeCache.items[validLevel].shift();
    }
    
    // If no cached challenge, fetch one directly
    const response = await axios.get(`${API_URL}/challenge`, {
      params: { level: validLevel, language }
    });
    console.log(`Fetched new challenge for level ${validLevel}`);
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
    // Ensure level is a number and within valid range
    const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
    console.log(`Preloading ${count} challenges for level: ${validLevel}`);
    
    // Initialize the array for this level if it doesn't exist
    if (!challengeCache.items[validLevel]) {
      challengeCache.items[validLevel] = [];
    }
    
    // Preload challenges one by one to avoid overwhelming the server
    for (let i = 0; i < count; i++) {
      const response = await axios.get(`${API_URL}/challenge`, {
        params: { level: validLevel, language }
      });
      challengeCache.items[validLevel].push(response.data);
      console.log(`Preloaded challenge ${i + 1}/${count} for level ${validLevel}`);
    }
  } catch (error) {
    console.error('Error preloading challenges:', error);
  } finally {
    challengeCache.isLoading = false;
  }
};

export const getCachedChallengeCount = (level = 1) => {
  // Ensure level is a number and within valid range
  const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
  
  // Return the count of cached challenges for the specified level
  return challengeCache.items[validLevel] ? challengeCache.items[validLevel].length : 0;
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
