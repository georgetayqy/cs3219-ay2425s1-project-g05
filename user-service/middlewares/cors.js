import cors from "cors"

const allowedOrigins = [
    "http://localhost:8000", // frontend
    "http://localhost:8001", // user service
    "http://localhost:8002", // matching service
    "http://localhost:8003", // question service
    "http://localhost:8004", // collaboration service
];

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

export default cors(corsOptions);
