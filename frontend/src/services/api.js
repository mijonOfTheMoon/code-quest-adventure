import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Cache for storing preloaded challenges by level
const challengeCache = {
  items: {
    1: [],
    2: [],
    3: []
  },
  isLoading: false,
  activeRequests: [] // Array to track active request cancel tokens
};

export const getStory = async (level) => {
  try {
    const response = await axios.get(`${API_URL}/story`, {
      params: { level }
    });
    
    // Store the objective for this level when we get a story
    if (response.data && response.data.objective) {
      levelObjectives[level] = response.data.objective;
      console.log(`Stored objective from story for level ${level}: ${response.data.objective}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
};

// Store objectives by level to maintain consistency
const levelObjectives = {
  1: null,
  2: null,
  3: null
};

// Function to get the stored objective for a level
export const getStoredObjective = (level) => {
  const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
  return levelObjectives[validLevel];
};

export const getChallenge = async (level, language, objective) => {
  try {
    // Ensure level is a number and within valid range
    const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
    console.log(`Getting challenge for level: ${validLevel}`);
    
    // If objective is provided, store it for this level
    if (objective) {
      levelObjectives[validLevel] = objective;
      console.log(`Storing objective for level ${validLevel}: ${objective}`);
    }
    // If no objective provided, use the stored one for this level
    else if (levelObjectives[validLevel]) {
      objective = levelObjectives[validLevel];
      console.log(`Using stored objective for level ${validLevel}: ${objective}`);
    }
    // If still no objective, this is an error - we should always have an objective
    else {
      console.error(`No objective available for level ${validLevel}`);
      throw new Error(`No objective available for level ${validLevel}`);
    }
    
    // Check if we have a cached challenge for this level
    if (challengeCache.items[validLevel] && challengeCache.items[validLevel].length > 0) {
      console.log(`Using cached challenge for level ${validLevel}`);
      return challengeCache.items[validLevel].shift();
    }
    
    // If no cached challenge, fetch one directly
    // Create a cancel token for this request
    const cancelTokenSource = axios.CancelToken.source();
    
    // Add this token to our active requests array
    challengeCache.activeRequests.push(cancelTokenSource);
    
    console.log(`Requesting challenge with objective: ${objective}`);
    const response = await axios.get(`${API_URL}/challenge`, {
      params: { level: validLevel, language, objective },
      cancelToken: cancelTokenSource.token
    });
    
    // Remove this token from active requests once completed
    const index = challengeCache.activeRequests.indexOf(cancelTokenSource);
    if (index > -1) {
      challengeCache.activeRequests.splice(index, 1);
    }
    
    console.log(`Fetched new challenge for level ${validLevel}`);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Challenge request was cancelled');
      throw new Error('Challenge request was cancelled');
    } else {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }
};

export const preloadChallenges = async (level, language, count = 2, objective) => {
  // Don't start another preload if one is already in progress
  if (challengeCache.isLoading) return;
  
  challengeCache.isLoading = true;
  
  try {
    // Ensure level is a number and within valid range
    const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
    console.log(`Preloading ${count} challenges for level: ${validLevel}`);
    
    // If objective is provided, store it for this level
    if (objective) {
      levelObjectives[validLevel] = objective;
      console.log(`Storing objective for level ${validLevel}: ${objective}`);
    }
    // If no objective provided, use the stored one for this level
    else if (levelObjectives[validLevel]) {
      objective = levelObjectives[validLevel];
      console.log(`Using stored objective for level ${validLevel}: ${objective}`);
    }
    // If still no objective, this is an error - we should always have an objective
    else {
      console.error(`No objective available for preloading level ${validLevel}`);
      throw new Error(`No objective available for preloading level ${validLevel}`);
    }
    
    // Initialize the array for this level if it doesn't exist
    if (!challengeCache.items[validLevel]) {
      challengeCache.items[validLevel] = [];
    }
    
    // Preload challenges one by one to avoid overwhelming the server
    for (let i = 0; i < count; i++) {
      // Create a cancel token for this request
      const cancelTokenSource = axios.CancelToken.source();
      
      // Add this token to our active requests array
      challengeCache.activeRequests.push(cancelTokenSource);
      
      try {
        console.log(`Preloading challenge ${i+1} with objective: ${objective}`);
        const response = await axios.get(`${API_URL}/challenge`, {
          params: { level: validLevel, language, objective },
          cancelToken: cancelTokenSource.token
        });
        
        challengeCache.items[validLevel].push(response.data);
        console.log(`Preloaded challenge ${i + 1}/${count} for level ${validLevel}`);
      } finally {
        // Remove this token from active requests once completed or failed
        const index = challengeCache.activeRequests.indexOf(cancelTokenSource);
        if (index > -1) {
          challengeCache.activeRequests.splice(index, 1);
        }
      }
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Preload request was cancelled');
    } else {
      console.error('Error preloading challenges:', error);
    }
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

/**
 * Cancels all ongoing challenge API requests
 */
export const cancelAllChallengeRequests = () => {
  console.log(`Cancelling ${challengeCache.activeRequests.length} active challenge requests`);
  
  // Cancel each request in the active requests array
  challengeCache.activeRequests.forEach(cancelTokenSource => {
    try {
      cancelTokenSource.cancel('Operation cancelled due to flush request');
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  });
  
  // Clear the active requests array
  challengeCache.activeRequests = [];
};

/**
 * Flushes all preloaded challenges for a specific level or all levels
 * @param {number} level - Optional level to flush. If not provided, flushes all levels.
 */
export const flushPreloadedChallenges = (level = null) => {
  console.log(`Flushing preloaded challenges${level ? ` for level ${level}` : ' for all levels'}`);
  
  // First, cancel all ongoing challenge API requests
  cancelAllChallengeRequests();
  
  if (level === null) {
    // Flush all levels
    Object.keys(challengeCache.items).forEach(lvl => {
      challengeCache.items[lvl] = [];
    });
  } else {
    // Ensure level is a number and within valid range
    const validLevel = Math.min(Math.max(parseInt(level) || 1, 1), 3);
    
    // Flush only the specified level
    if (challengeCache.items[validLevel]) {
      challengeCache.items[validLevel] = [];
    }
  }
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
