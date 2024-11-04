import express from 'express';
import { corsOp, allowedOrigins } from './middlewares/cors.js';
import dotenv from 'dotenv';
import { connectToDB } from './services.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { socketHandler } from './controllers/socketHandler.js';

// Create express app and server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: '/api/matching-service',
  cors: {
    origin: allowedOrigins, // set cors origin to frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
});

// Setup environment variables
dotenv.config();

// Initialise middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsOp);

// Initialise socket handler
socketHandler(io);

// Test Route for Health Checks
app.get('/healthz', (req, res) => {
  res
    .status(200)
    .json({ message: 'Connected to /healthz route of matching-service' });
});

// Connect to DB, then listen at port
await connectToDB()
  .then(() => {
    console.log('MongoDB Connected!');
    server.listen(process.env.PORT);
    console.log(`Matching service listening at port ${process.env.PORT}`);
  })
  .catch((error) => {
    console.log('Failed to connect to DB');
    console.log(error);
  });
