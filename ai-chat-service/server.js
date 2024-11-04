import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import corsMiddleware from './middleware/cors.js';
import bodyParser from 'body-parser';
import loggingMiddleware from './middleware/logging.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;
const API_KEY = process.env.API_KEY;

app.use(corsMiddleware)
app.use(bodyParser.json());
app.use(loggingMiddleware);

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

let chatSession;

// Function to initialize or reset the chat session
async function initializeChatSession() {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  chatSession = model.startChat({
    history: [], // Start with an empty history
    generationConfig: {
      maxOutputTokens: 500,
    },
  });
}

initializeChatSession();

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const text = await response.text();

    console.log(`Response: `, response);

    res.json({ reply: text });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({ error: 'Error communicating with Gemini API' });
  }
});

app.listen(PORT, () => {
  console.log(`Chat service with Gemini is running on port ${PORT}`);
});
