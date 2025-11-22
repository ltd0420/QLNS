const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Analyze sentiment using BERT model via ML service
 * Falls back to rule-based if BERT service unavailable
 */
async function analyzeSentimentBERT(text, rating = null) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/sentiment`,
      {
        text: text || '',
        rating: rating || null,
      },
      {
        timeout: 10000, // 10 seconds timeout
      }
    );
    return response.data;
  } catch (error) {
    console.error('BERT sentiment service error:', error.message);
    // Fallback to rule-based
    const { analyzeSentiment } = require('../utils/sentimentAnalyzer');
    return analyzeSentiment(text, rating);
  }
}

module.exports = {
  analyzeSentimentBERT,
};

