import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import router from "./router/router.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config({ path: "./config/.env" });
const app = express();
const port = process.env.DEV_PORT || 8003;

const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:8001",
  "http://localhost:8002",
  "http://localhost:8004",
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  next();
});

app.use(bodyParser.json());

app.use("/api/question-service", router);

app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.DEV_URI, {});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB connection established successfully");
});
connection.on("error", (err) => {
  console.log("MongoDB error: " + err);
});

app.listen(port, () => console.log(`question-service listening on port ${port}`));