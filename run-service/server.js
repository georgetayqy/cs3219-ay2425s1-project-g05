import express from "express";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import dotenv from "dotenv";
import test from "node:test";

const app = express();

const port = 8009;

dotenv.config();

const questionServiceUrl =
  process.env.NODE_ENV === "DEV" ? process.env.QUESTION_SVC_DEV : "";

// Connect to Redis instance
const redisClient = createClient({
  url: "redis://localhost:6379",
});

// Add error handling for Redis connection
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));
redisClient.on("ready", () => console.log("Redis Client Ready"));
await redisClient.connect();

app.use(express.json());
// POST route to initiate a test run
app.post("/execute/:questionId", async (req, res) => {
  // change questionId to be in req params
  const questionId = req.params.questionId;
  console.log(req.body);
  const { codeAttempt, language_id } = req.body;
  const jobId = uuidv4();

  // Retrieve test cases for the questionId
  const testcases = await getTestcases(questionId);
  if (!testcases) {
    return res
      .status(404)
      .json({ error: `No question found for ID ${questionId}` });
  }

  // Initialize job data in Redis
  await redisClient.hSet(`job:${jobId}`, {
    status: "processing",
    questionId,
    codeAttempt,
    results: JSON.stringify([]),
  });

  // Respond to client with jobId and SSE URL
  res.json({ data: { jobId: jobId } });

  // Start processing test cases
  processTestcases(jobId, testcases, codeAttempt);
});

// SSE route for incremental updates
app.get("/result/:jobId", async (req, res) => {
  const { jobId } = req.params;

  // Set up headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Initialize a Redis subscriber client
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  res.write(
    `data: ${JSON.stringify({
      status: "processing",
      result: "Starting test cases...",
    })}\n\n`
  );

  subscriber.subscribe(`job-update:${jobId}`, (message) => {
    console.log("Received message:", message);
    const update = JSON.parse(message);

    // Complete execution of all testcases and send final result
    if (update.status === "complete") {
      // get question
      res.write(`data: ${JSON.stringify(update)}\n\n`);
      subscriber.unsubscribe();
      res.end();
    } else {
      // Send single testcase result
      res.write(
        `data: ${JSON.stringify({
          status: "processing",
          result: update.result,
        })}\n\n`
      );
    }
  });

  // Cleanup on client disconnect
  req.on("close", async () => {
    await redisClient.del(`job:${jobId}`);
    await subscriber.unsubscribe();
    await subscriber.disconnect();
    res.end();
  });
});

async function processTestcases(jobId, testcases, code) {
  const results = [];
  console.log("starting testcases execution");
  console.log(testcases);
  for (let i = 0; i < testcases.length; i++) {
    try {
      const result = await runTestcase(testcases[i], code);
      results.push(result);

      console.log("result", result);
      // Publish only the latest test case result
      await redisClient.publish(
        `job-update:${jobId}`,
        JSON.stringify({ status: "processing", result })
      );
    } catch (error) {
      const errorMessage = {
        testcaseId: testcases[i]._id,
        status: "failed",
        error: error.message,
      };
      results.push(errorMessage);

      // Publish only the latest error result
      await redisClient.publish(
        `job-update:${jobId}`,
        JSON.stringify({ status: "processing", result: errorMessage })
      );
    }
  }
  console.log("completed testcases execution");

  // After all test cases, publish the full results array
  await redisClient.hSet(`job:${jobId}`, {
    status: "completed",
    results: JSON.stringify(results),
  });
  await redisClient.publish(
    `job-update:${jobId}`,
    JSON.stringify({ status: "complete", results })
  );
  printRedisMemory();
}

// Function to print Redis memory contents
async function printRedisMemory() {
  try {
    console.log("\n=== Redis Memory Contents ===");

    // Get all keys in the Redis database
    const keys = await redisClient.keys("*");
    for (const key of keys) {
      console.log("Key:", key);

      // Check the time-to-live (TTL) of the key
      const ttl = await redisClient.ttl(key);
      console.log("TTL:", ttl === -1 ? "No expiration" : `${ttl} seconds`);

      // Check the type of each key to handle it appropriately
      const type = await redisClient.type(key);
      console.log("Type:", type);

      let value;
      if (type === "hash") {
        value = await redisClient.hGetAll(key);
      } else if (type === "string") {
        value = await redisClient.get(key);
      } else if (type === "list") {
        value = await redisClient.lRange(key, 0, -1);
      } else if (type === "set") {
        value = await redisClient.sMembers(key);
      } else {
        value = "Unknown or unsupported type";
      }

      console.log("Value:", value);
    }
  } catch (error) {
    console.error("Error printing Redis memory:", error);
  }
}

// Mock function to retrieve test cases from question-service
// TODO: Replace with actual API call to question-service
async function getTestcases(questionId) {
  // GET request to question-service to retrieve test cases
  const response = await axios.get(`${questionServiceUrl}/${questionId}`);
  const testcases = response.data.data.testCase;
  return testcases;
}

// Mock function to simulate running a test case via an API call
async function runTestcase(testcase, code) {
  try {
    // Append test code to main code
    const normalizedCode = code.trim().replace(/\r?\n/g, '\n');
    const testCode = testcase.testCode.trim().replace(/\r?\n/g, '\n');

    // Combine the normalized code and test code
    const sourceCode = `${normalizedCode}\n\n${testCode}`;
    console.log(sourceCode);
    const requestBody = {
      source_code: sourceCode,
      language_id: 71,
      expected_output: testcase.expectedOutput,
    };

    const headers = {
      "X-Auth-Token": process.env.X_AUTH_TOKEN,
      "X-Auth-User": process.env.X_AUTH_USER,
    };

    // Send POST request to the external API
    const response = await axios.post(
      "http://PeerPrepALB-705702575.ap-southeast-1.elb.amazonaws.com:2358/submissions/?wait=true",
      requestBody,
      { headers }
    );
    console.log("Response from API:", response.data);
    const responseData = response.data;
    const testCaseResult = {
      statusCode: 200,
      message: "Test case results",
      data: {
        result: {
          stderr: responseData.stderr || "",
          isPassed: responseData.status.id === 3 ? true : false,
          stdout: responseData.stdout || "No result",
          questionDetails: {
            input: responseData.input || "No input description",
            expectedOutput: testcase.expectedOutput || "No expected output",
          },
          memory: responseData.memory || 0,
          time: responseData.time || "0",
          _id: testcase._id,
        },
      },
    };
    return testCaseResult;
  } catch (error) {
    console.error("Error executing test case:", error.message);
    return {
      testcaseId: testcase._id,
      statusCode: 500,
      message: error.message,
    };
  }
}

// Test Route for Health Checks
app.get("/healthz", (req, res) => {
  res
    .status(200)
    .json({ message: "Connected to /healthz route of run-service" });
});

app.listen(port, () => console.log(`run-service listening on port ${port}`));
