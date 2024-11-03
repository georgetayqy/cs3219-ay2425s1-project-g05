import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import printRedisMemory from "./redis.js";
import { questionServiceUrl, redisClient } from "./server.js";

const executeTest = async (req, res) => {
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
    data: JSON.stringify([]),
  });

  // Respond to client with jobId and SSE URL
  res.json({ data: { jobId: jobId } });

  // Start processing test cases
  processTestcases(jobId, testcases, codeAttempt);
};

// SSE route for incremental updates
const getResults = async (req, res) => {
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
      data: { statusCode: 200, message: "Starting test cases..." },
    })}\n\n`
  );

  let isCompleted = false; // Track if job completed
  // change timeoutDuration to 2 minutes
  const timeoutDuration = 120000; // Set a timeout period (e.g., 30 seconds)
  let timeoutHandle;

  // Function to handle timeout in the event pub-sub fails (end request)
  const resetTimeout = () => {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => {
      if (!isCompleted) {
        res.write(
          `data: ${JSON.stringify({
            status: "error",
            message: "Timeout: No response from server.",
          })}\n\n`
        );
        subscriber.unsubscribe();
        res.end();
      }
    }, timeoutDuration);
  };

  resetTimeout();

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
          message: "processing",
          data: update.result,
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
};

// TODO: Refactor code below
// Function to execute a single test case
async function runTestcase(testcase, code) {
  try {
    // Append test code to main code
    const normalizedCode = code.trim().replace(/\r?\n/g, "\n");
    const testCode = testcase.testCode.trim().replace(/\r?\n/g, "\n");

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
      message: `${testcase._id} executed successfully`,
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
        JSON.stringify({ status: "error", message: errorMessage })
      );
    }
  }
  console.log("completed testcases execution");

  // After all test cases, publish the full results array
  await redisClient.hSet(`job:${jobId}`, {
    status: "completed",
    data: JSON.stringify(results),
  });
  await redisClient.publish(
    `job-update:${jobId}`,
    JSON.stringify({ status: "complete", data: { results: results } })
  );
  printRedisMemory();
}

// TODO: Refactor this function
async function getTestcases(questionId) {
  // GET request to question-service to retrieve test cases
  const response = await axios.get(`${questionServiceUrl}/${questionId}`);
  const testcases = response.data.data.testCase;
  return testcases;
}

export { executeTest, getResults };
