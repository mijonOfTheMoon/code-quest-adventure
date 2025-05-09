import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
    const response = await axios.get(`${API_URL}/challenge`, {
      params: { level, language }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
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
