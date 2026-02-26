const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Strictly using the requested model
const MODEL_NAME = "gemini-2.5-flash";

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: MODEL_NAME });
};

module.exports = { getGeminiModel, MODEL_NAME };