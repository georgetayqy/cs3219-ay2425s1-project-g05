import cors from "cors";

const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:8001",
  "http://localhost:8002",
  "http://localhost:8004",
];

// PORT 8000 - FRONTEND
// PORT 8001 - USER SERVICE
// PORT 8002 - MATCHING SERVICE
// PORT 8003 - QUESTION SERVICE
// PORT 8004 - COLLABORATION SERVICE

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
