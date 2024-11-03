import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import printRedisMemory from "./redis.js";
import { questionServiceUrl, redisClient } from "./server.js";
import UnauthorizedError from "./errors/UnauthorisedError.js";
import NotFoundError from "./errors/NotFoundError.js";
import ServiceUnavailableError from "./errors/ServiceUnavailable.js";

const executeTest = async (req, res) => {
  const questionId = req.params.questionId;
  const { codeAttempt } = req.body;
  const jobId = uuidv4();

  try {
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

    // Respond to client with jobId
    res.json({ data: { jobId: jobId } });

    // Start processing test cases
    processTestcases(jobId, testcases, codeAttempt);
  } catch (error) {
    console.error("Error fetching test cases:", error.message);
    res.status(500).json({ error: "Failed to retrieve test cases" });
  }
};

// SSE route for incremental updates
const getResults = async (req, res) => {
  const { jobId } = req.params;
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  let isCompleted = false;
  const timeoutDuration = 120000;
  let timeoutHandle;

  // Function to reset timeout
  const resetTimeout = () => {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => {
      if (!isCompleted) {
        sendErrorAndClose(res, subscriber);
      }
    }, timeoutDuration);
  };

  // Initial response
  res.write(
    `data: ${JSON.stringify({
      status: "processing",
      message: "Starting test cases...",
    })}\n\n`
  );

  // Start timeout
  resetTimeout();

  subscriber.subscribe(`job-update:${jobId}`, (message) => {
    const update = JSON.parse(message);

    console.log("Received update (in sub):", update);
    if (update.status === "complete") {
      isCompleted = true;
      res.write(`data: ${JSON.stringify(update)}\n\n`);
      subscriber.unsubscribe();
      res.end();
    } else if (update.status === "error") {
      update.message = {
        ...update.message,
        questionId: jobId,
      };
      res.write(
        `data: ${JSON.stringify({
          status: "error",
          result: update.message,
        })}\n\n`
      );
    } else {
      res.write(
        `data: ${JSON.stringify({
          status: "processing",
          result: update.result,
        })}\n\n`
      );
      resetTimeout(); // Reset timeout on each message
    }
  });

  req.on("close", async () => {
    console.log("Receiving client's closing connection response");
    // delete job data from Redis
    // TODO: check whether connection disconnect is due to completion of testcases
    // If not, then do not job data from Redis & implement fault tolerance mechanism
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
      "http://PeerPrepALB-705702575.ap-southeast-1.elb.amazonaws.com:2358/xx/submissions/?wait=true",
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

    if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new NotFoundError("Execution Service not found. Test execution halted.");
          case 401:
            throw new UnauthorizedError("Authentication failed. Test execution halted.");
          case 503:
            throw new ServiceUnavailableError(503, "Queue is full. Test execution halted.");
          default:
            throw new BaseError(error.response.status, "Error executing test case.");
        }
      } else {
        throw new BaseError(500, "Error executing test case.");
      }
  }
}

async function processTestcases(jobId, testcases, code) {
  const results = [];
  console.log("============Starting testcases execution==========");
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
        statusCode: error.statusCode,
        error: error.message,
      };
      results.push(errorMessage);

      console.log(
        "==========Error while executing testcase:",
        errorMessage.testcaseId
      );
      console.log("==========Error Message:", errorMessage.error);
      // Publish only the latest error result
      await redisClient.publish(
        `job-update:${jobId}`,
        JSON.stringify({ status: "error", message: errorMessage })
      );
      break;
    }
  }
  console.log("Completed testcases execution");

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

const sendErrorAndClose = (res, subscriber) => {
  const errorMessage = JSON.stringify({
    status: "error",
    statusCode: 499,
    message: "Timeout occurred: No response from server",
  });

  res.write(`data: ${errorMessage}\n\n`);
  subscriber.unsubscribe();
  res.end();
};

export { executeTest, getResults };
