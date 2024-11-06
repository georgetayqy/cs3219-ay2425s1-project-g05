import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import printRedisMemory from "./redis.js";
import { questionServiceUrl, redisClient } from "./server.js";
import UnauthorizedError from "./errors/UnauthorisedError.js";
import ConflictError from "./errors/ConflictError.js";
import ServiceUnavailableError from "./errors/ServiceUnavailable.js";
import NotFoundError from "./errors/NotFoundError.js";
import BaseError from "./errors/BaseError.js";

// Add function to create channelId connection when session starts
const startSession = async (req, res) => {
  const { firstUserId, secondUserId } = req.body;
  console.log("Starting session between", firstUserId, "and", secondUserId);
  // sort both users by id
  const [userA, userB] = [firstUserId, secondUserId].sort();
  try {
    // Check if a session already exists by checking redis store
    const sessionKey = `session:${userA}-${userB}`;
    // Get session data from Redis
    const channelData = await redisClient.hGetAll(sessionKey);
    if (channelData && channelData.channelId) {
      console.log("Session data found in Redis:", channelData.channelId);
      // Remove channel data from Redis
      await redisClient.del(sessionKey);
      return res.status(200).json({
        statusCode: 200,
        message: `Unique channelId found for ${userA} and ${userB}`,
        data: { channelId: channelData.channelId, userA, userB },
      });
    } else {
      // Create a new channelId

      const channelId = uuidv4();
      console.log("Creating session in Redis:", channelId);
      // Store channelId in Redis
      await redisClient.hSet(sessionKey, {
        channelId,
        userA,
        userB,
      });
      console.log("stored session with sessionkey", sessionKey);
      // delete session data after 10 minutes
      // NOTE: Maybe both users have to join session within x minutes, otherwise this will fail
      await redisClient.expire(sessionKey, 600);
      // TODO: test expiry
      console.log("created session with sessionkey", sessionKey);
      return res.status(200).json({
        statusCode: 200,
        message: `New channelId created for ${userA} and ${userB}`,
        data: { channelId, userA, userB },
      });
    }
  } catch (error) {
    console.error("Error creating sessionId:", error.message);
    return res
      .status(500)
      .json({ statusCode: 500, message: "Failed to start session" });
  }
};

// Add function to create SSE connection with unique channelId
const subscribeToChannel = async (req, res) => {
  const { channelId } = req.params;

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  // TODO: handle pub sub failures? Check in store whether there is an existing result?

  // Response to indicate start of execution and blocks further requests
  res.write(
    `data: ${JSON.stringify({
      statusCode: 206,
      message: "Starting session...",
    })}\n\n`
  );

  // NOTE: EXECUTING RESPONSES WILL BE SENT TO BOTH USERS

  subscriber.subscribe(`channel:${channelId}`, (message) => {
    const update = JSON.parse(message);

    console.log(update.result);
    console.log("Received update from Redis:", update.statusCode);
    if (update.statusCode === 200) {
      // remove the channel data from Redis
      (async () => {
        await redisClient.del(`channel:${channelId}`);
      })();
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    } else if (update.statusCode === 206) {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  });

  req.on("close", async () => {
    console.log("Receiving client's closing connection response");
    // delete channel data from Redis
    await redisClient.del(`channel:${channelId}`);
    await subscriber.unsubscribe();
    await subscriber.disconnect();
    res.end();
  });
};

const executeTest = async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { codeAttempt, channelId } = req.body;

    // Check if another execution is in progress
    const existingJob = await redisClient.hGetAll(`channel:${channelId}`);
    console.log("Existing job data:", existingJob);
    if (existingJob && existingJob.status === "processing") {
      console.log(
        "Another execution is already in progress. Try again later error thrown"
      );
      throw new ConflictError(
        "Another execution is already in progress. Try again later."
      );
      return;
    }

    // Retrieve testcases for the question
    console.log("Executing test cases for questionId:", questionId);
    const testcases = await getTestcases(questionId);
    if (!testcases) {
      throw new NotFoundError("Testcases not found for the question");
    }
    for (let i = 0; i < testcases.length; i++) {
      console.log("Testcase:", testcases[i]._id);
      console.log("isPublic:", testcases[i].isPublic);
    }
    console.log("Testcases retrieved sucessfully");

    // Indicate that the test cases are being processed - initial message to indicate start of execution
    await redisClient.hSet(`channel:${channelId}`, {
      status: "processing",
      questionId,
      codeAttempt,
      data: JSON.stringify([]),
    });

    const testCaseCount = testcases.length;

    // Respond to client with test case count
    res.status(200).json({
      statusCode: 200,
      message: `Executing test cases for questionId: ${questionId}`,
      data: { testCaseCount: testCaseCount },
    });

    // Start processing test cases
    processTestcases(channelId, testcases, codeAttempt, questionId);
  } catch (error) {
    if (error instanceof BaseError) {
      console.log("error!#JNEJ:", error.message)
      return res.status(error.statusCode).json({ statusCode: error.statusCode, message: error.message });
    }
    res.status(500).json({ error: "Failed to execute test cases" });
  }
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
    const requestBody = {
      source_code: sourceCode,
      language_id: 71,
      expected_output: testcase.expectedOutput,
    };

    const headers = {
      "X-Auth-Token": process.env.X_AUTH_TOKEN,
      "X-Auth-User": process.env.X_AUTH_USER,
    };

    // Send POST request to the judge0 API
    const response = await axios.post(process.env.JUDGE0_API_URL, requestBody, {
      headers,
    });

    //console.log("Response from API:", response.data);
    const responseData = response.data;

    let outputFinal = responseData.stdout ? responseData.stdout : "";
    let testCaseDetailsFinal = {
      input: responseData.input || "No input description",
      expectedOutput: testcase.expectedOutput || "No expected output",
      testCaseId: testcase._id,
    };

    // Remove output and question details if the testcase is not public
    if (!testcase.isPublic) {
      console.log("Removing output and question details for private testcase");
      outputFinal = null;
      testCaseDetailsFinal = {
        testCaseId: testcase._id,
        input: "Hidden",
        expectedOutput: "Hidden",
      };
    }

    const testCaseResult = {
      stderr: responseData.stderr,
      isPassed: responseData.status.id === 3 ? true : false,
      stdout: outputFinal,
      testCaseDetails: testCaseDetailsFinal,
      memory: responseData.memory || 0,
      time: responseData.time || "0",
    };
    return testCaseResult;
  } catch (error) {
    console.error("Error executing test case:", error.message);

    if (error.response) {
      switch (error.response.status) {
        case 404:
          // Service not found error -> means not available?
          throw new ServiceUnavailableError(
            "Execution Service not found. Testcase execution failed."
          );
        case 401:
          throw new UnauthorizedError(
            "Authentication failed. Testcase failed to execute."
          );
        case 503:
          throw new ServiceUnavailableError(
            503,
            "Queue is full. Testcase execution failed."
          );
        default:
          throw new BaseError(
            error.response.status,
            "Error executing test case."
          );
      }
    } else {
      throw new BaseError(500, "Error executing test case.");
    }
  }
}

async function processTestcases(channelId, testcases, code, questionId) {
  const results = [];
  let hasError = false;
  console.log("============Starting testcases execution==========");

  for (let i = 0; i < testcases.length; i++) {
    try {
      const result = await runTestcase(testcases[i], code);
      results.push(result);

      console.log("result", result);
      // Publish only the latest test case result
      await redisClient.publish(
        `channel:${channelId}`,
        JSON.stringify({
          statusCode: 206,
          message: `Testcase ${testcases[i]._id} executed successfully`,
          data: { result },
        })
      );
    } catch (error) {
      console.log("Error while executing testcase:", testcases[i]._id);
      const errorMessage = {
        testcaseId: testcases[i]._id,
        message: error.message,
      };
      results.push(errorMessage);
      hasError = true; // Set error flag to true

      console.log(
        "==========Error while executing testcase:",
        errorMessage.testcaseId
      );
      console.log("==========Error Message:", errorMessage.error);
      // Publish only the latest error result
      await redisClient.publish(
        `channel:${channelId}`,
        JSON.stringify({ statusCode: 500, message: errorMessage })
      );
      break;
    }
  }

  console.log("Completed testcases execution for questionId:", questionId);

  await redisClient.hSet(`channel:${channelId}`, {
    status: hasError ? "error" : "completed",
    data: JSON.stringify(results),
    questionId: questionId,
    codeAttempt: code,
  });

  // Publish the "complete" status only if no errors occurred
  if (!hasError) {
    await redisClient.publish(
      `channel:${channelId}`,
      JSON.stringify({
        statusCode: 200,
        data: { results: results, questionId, code },
      })
    );
  }
  printRedisMemory();
}

// TODO: Refactor this function
async function getTestcases(questionId) {
  try {
    const response = await axios.get(`${questionServiceUrl}/${questionId}`);
    const testcases = response.data.data.testCase;
    return testcases;
  } catch (error) {
    console.error("Error retrieving testcases:", error.message);
    throw new ServiceUnavailableError(
      "Connection to question service failed. Testcase execution failed."
    );
  }
}

export { executeTest, subscribeToChannel, startSession };
