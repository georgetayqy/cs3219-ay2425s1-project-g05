/**
 * Adapted from https://github.com/yjs/y-websocket/blob/master/bin/server.cjs
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import { corsMiddleware, checkCors } from './src/middlewares/cors.js';

import { createServer } from 'node:http';
import { config } from 'dotenv';
import { setupWSConnection } from './src/server/utils.js';
import { parseInt } from 'lib0/number';
import { router } from './src/router/router.js';

import pkg from 'ws';
import { verifyAccessToken } from './src/middlewares/access-control.js';
const { Server } = pkg;

// Set up env variables
config();

// Set up host and port
const host = process.env.HOST?.trim() || '0.0.0.0';
const port = parseInt(process.env.PORT?.trim()) || 8004;

// Create express app and websocket server
const app = express();

const websocketServer = new Server({
  noServer: true,
  cors: {
    origin: 'http://localhost:5173',
  },
});
const httpServer = createServer(app);

// Init middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use('/api/collaboration-service', router);

// Test Route for Health Checks
app.get('/healthz', (request, response) => {
  response.status(200).json({
    message: 'Connected to the /healthz route of the collaboration-service',
  });
});

// Setup the websocketServer connection
websocketServer.on('connection', async (conn, sock) => {
  setupWSConnection(conn, sock);
});

// Upgrade requests to Websockets
httpServer.on('upgrade', (req, sock, head) => {
  const headers = req.rawHeaders;
  let cookie = '';

  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'Cookie' || headers[i] === 'cookie') {
      cookie = headers[i + 1];
    }
  }

  cookie ??= '';

  if (cookie === '') {
    console.log('Missing Access Token');
    websocketServer.emit('error', soc, req);
    sock.destroy();
  }

  let foundAccessToken = false;
  cookie = cookie.split(';');

  for (const cook of cookie) {
    const tok = cook.split('=');
    tok.forEach((x) => x.trim());

    if (tok.length > 0 && tok[0].includes('accessToken')) {
      foundAccessToken = true;

      if (!verifyAccessToken(tok[1].trim())) {
        console.log('Invalid Access Token');
        websocketServer.emit('error', soc, req);
        sock.destroy();
      }
    }
  }

  if (!foundAccessToken) {
    console.log('Missing Access Token');
    websocketServer.emit('error', soc, req);
    sock.destroy();
  }

  websocketServer.handleUpgrade(req, sock, head, (soc) => {
    websocketServer.emit('connection', soc, req);
  });
});

// Start the HTTP server
httpServer.listen(port, host, () => {
  console.log('Collaboration Service listening at port', port);
});

export { app };
