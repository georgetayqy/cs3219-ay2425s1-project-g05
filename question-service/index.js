import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import corsMiddleware from "./middlewares/cors.js";
import errorHandler from "./middlewares/errorHandler.js";
import loggingMiddleware from "./middlewares/logging.js";
import router from "./router/router.js";
import cookieParser from "cookie-parser";


dotenv.config();
const app = express();
const port = process.env.DEV_PORT || 8003;


app.use(corsMiddleware);
app.use(cookieParser());
app.use(loggingMiddleware);
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