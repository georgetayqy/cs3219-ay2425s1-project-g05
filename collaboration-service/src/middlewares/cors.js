import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // frontend dev
  'http://peerprep.s3-website-ap-southeast-1.amazonaws.com', // frontend prod
  'http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com', // frontend staging
  'http://localhost:8001', // user service
  'http://localhost:8002', // matching service
  'http://localhost:8003', // question service
  'http://localhost:8004', // collaboration service
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  credentials: true,
};

function checkCors(request) {
  // Inspired by https://stackoverflow.com/questions/71384801/how-to-enable-cors-for-web-sockets-using-ws-library-in-node-js
  const origins = request?.rawHeaders ?? [];
  const allowedO = allowedOrigins.map((value, idx, array) => {
    const results = value.split('//');
    return results[results.length - 1];
  });

  for (const orig of allowedO) {
    for (const entry of origins) {
      if (entry.startsWith(orig)) {
        return true;
      }
    }
  }

  // invalid URL
  return false;
}

const corsMiddleware = cors(corsOptions);
export { corsMiddleware, checkCors };
