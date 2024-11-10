import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import corsMiddleware from './middleware/cors.js';
import bodyParser from 'body-parser';
import loggingMiddleware from './middleware/logging.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

app.use(corsMiddleware);
app.use(bodyParser.json());
app.use(loggingMiddleware);

// Test Route for Health Checks
app.get('/healthz', (request, response) => {
  response.status(200).json({
    message: 'Connected to the /healthz route of the ai-chat-service',
  });
});

// Automatically delete sessions after 60 minutes of inactivity
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; 

// In-memory store for chat sessions. 
const userSessions = new Map();

// Function to retrieve the chat session for a given API key and room ID
const retrieveChatSession = (apiKey, roomId) => {
  let userChatSessions = userSessions.get(apiKey);
  console.log('User Chat Sessions:', userChatSessions);
  let chatSession;

  // Check if the user has any existing sessions
  if (userChatSessions) {
    // Check if a session exists for the given room (current ongoing session)
    if (roomId && userChatSessions.has(roomId)) {
      chatSession = userChatSessions.get(roomId);
    } else {
      // Create a new session if not found
      chatSession = createNewChatSession(apiKey);
      userChatSessions.set(roomId || 'default', chatSession);
    }
  } else {
    // Create a new session map for this user (API key)
    userChatSessions = new Map();
    chatSession = createNewChatSession(apiKey);
    userChatSessions.set(roomId || 'default', chatSession);
    userSessions.set(apiKey, userChatSessions);
  }
  return chatSession;
}

// Function to create a new chat session using the provided API key
function createNewChatSession(apiKey) {
  const genAIClient = new GoogleGenerativeAI(apiKey);
  const model = genAIClient.getGenerativeModel({ model: 'gemini-pro' });
  const chatSession = model.startChat({
    history: [], // Start with an empty history for each new session
    generationConfig: {
      maxOutputTokens: 500,
    },
  });
  return chatSession;
}

// Periodically clean up inactive sessions
setInterval(() => {
  const now = Date.now();
  userSessions.forEach((value, key) => {
    if (now - value.lastActive > SESSION_TIMEOUT_MS) {
      userSessions.delete(key);
    }
  });
}, SESSION_TIMEOUT_MS);

// Chat endpoint
app.post('/api/ai-chat-service/chat', async (req, res) => {
  const { message, roomId, apiKey } = req.body;

  if (!message || !apiKey) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Message and API Key is required' });
  }

  console.log('Message:', message);

  let chatSession = retrieveChatSession(apiKey, roomId);

  try {
    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const text = await response.text();

    console.log('Response:', text);

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error communicating with Gemini API',
      data: null,
    });
  }
});

// Analyse failed test cases endpoint
app.post('/api/ai-chat-service/analyse-failed-test-cases', async (req, res) => {
  
  const { testProgramCode, expectedOutput, actualOutput, solutionCode, question, roomId, apiKey } = req.body;

  if (!testProgramCode || !expectedOutput || !actualOutput || !solutionCode || !question || !apiKey) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Missing params for analysing failed test cases' });
  }

  const prompt = `I have written a piece of code to solve a problem, and I am encountering errors when I run it. Below are the details of the problem, the test program code, the expected output, the actual output, and my current solution code. \n`
  + `Question: \n ${question} \n Test Program Code: \n ${testProgramCode} \n Expected Output: \n ${expectedOutput} \n Actual Output: \n ${actualOutput} \n Solution code: \n ${solutionCode} \n`
  + 'I need your help to understand why my solution is not producing the expected output. Please analyze the provided solution code and test program code in detail to identify what might be causing the discrepancies between the actual and expected output. \n'
  + '- Focus on pinpointing specific bugs or logical errors in the code. \n'
  + '- Suggest improvements or corrections to fix the failing test cases. \n'
  + 'Please provide a detailed analysis and step-by-step suggestions on how to fix the errors, but keep it concise while still being clear. Thank you!';

  let chatSession = retrieveChatSession(apiKey, roomId);
  
  try {
    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error communicating with Gemini API',
      data: null,
    });
  }
})

// Analyse error logs endpoint
app.post('/api/ai-chat-service/analyse-error-logs', async (req, res) => {

  const { errorLogs, solutionCode, roomId, apiKey } = req.body;

  if (!errorLogs || !solutionCode || !apiKey) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Logs or solution code are required' });
  }

  const prompt = 'I have written a piece of code, and I am encountering errors when I run it. Below are the error logs and my current solution code. \n' 
  + `Error logs: \n ${errorLogs} \n Solution code: \n ${solutionCode} \n ` 
  + 'Please help me understand the errors by analyzing the logs provided. Focus only on identifying what might be causing these errors and provide specific ' 
  + 'steps or advice on how to fix them. Do not give me a solution to the entire problem, and avoid any hints or explanations related to solving the overall task.';

  let chatSession = retrieveChatSession(apiKey, roomId);

  try {
    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log('Response:', text);

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error communicating with Gemini API',
      data: null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chat service with Gemini is running on port ${PORT}`);
});
