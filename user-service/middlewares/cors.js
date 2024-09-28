import cors from "cors"

const allowedOrigins = [
    "http://localhost:5173", // frontend
    "http://localhost:8001", // user service
    "http://localhost:8002", // matching service
    "http://localhost:8003", // question service
    "http://localhost:8004", // collaboration service
];

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key' , 'X-Amz-Security-Token'],
    credentials: true,
};

export default cors(corsOptions);
