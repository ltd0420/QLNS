const axios = require('axios');

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || 'http://localhost:8001';

async function predictAttrition(components, threshold = 0.5) {
  if (!Array.isArray(components) || components.length === 0) {
    throw new Error('components must be a non-empty array');
  }

  try {
    const payload = {
      samples: [{ components }],
    };
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict?threshold=${threshold}`,
      payload,
      { timeout: 5000 }
    );
    return response.data[0];
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    throw new Error(`ML service error: ${message}`);
  }
}

async function predictAttritionBatch(samples, threshold = 0.5) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('samples must be a non-empty array');
  }

  try {
    const payload = { samples };
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict?threshold=${threshold}`,
      payload,
      { timeout: 10000 }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    throw new Error(`ML service error: ${message}`);
  }
}

module.exports = {
  predictAttrition,
  predictAttritionBatch,
};

