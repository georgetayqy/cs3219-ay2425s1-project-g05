import express from "express";
import { executeTest, getResults } from "./controller.js";
const router = express.Router();

// POST route to initiate a test run
router.post("/execute/:questionId", executeTest);

// GET route to retrieve results of a test run (SSE Url)
router.get("/result/:jobId", getResults);

export default router;
