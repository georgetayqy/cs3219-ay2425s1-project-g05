import axios from "axios";
import EventSource from "eventsource";

const QUESTION_SERVICE_URL = "http://localhost:8003/api/question-service";
const RUN_SERVICE_URL = "http://localhost:8007/api/run-service";

// find random question 
async function findRandomQuestion() {
  const response = await axios.get(`${QUESTION_SERVICE_URL}/random`);
  console.log("response",response.data.data);
  return response.data.data;
}
async function test() {
  try {
    // Start a session between two users
    const sessionResponse = await axios.post(`${RUN_SERVICE_URL}/session`, {
      firstUserId: "user1",
      secondUserId: "user2",
    });


    const secondSessionResponse = await axios.post(`${RUN_SERVICE_URL}/session`, {
      firstUserId: "user2",
      secondUserId: "user1",
    });
    const  channelId  = sessionResponse.data.data;
    const secondChannelId  = secondSessionResponse.data.data;

    console.log("Session started with channelId for first:", channelId);
    console.log("Session started with channelId for second:", secondChannelId);

    // Simulate two clients subscribing to the SSE channel
    const client1 = new EventSource(`${RUN_SERVICE_URL}/subscribe/${channelId}`);
    const client2 = new EventSource(`${RUN_SERVICE_URL}/subscribe/${channelId}`);

    const handleMessage = (event, clientName) => {
      const message = JSON.parse(event.data);

      // Log message received
      console.log(`${clientName} received message:`, message);

      // Check if execution is complete and log each result
      if (message.status === "complete") {
        console.log("Test execution completed!");
        for (const result of message.data.results) {
          const resultData = result.data.result;
          const { isPassed, stdout, stderr, memory, time, questionDetails, _id } =
            resultData;

          console.log(`Test Case ${_id}:`);
          console.log(`  Passed: ${isPassed}`);
          console.log(`  Output: ${stdout}`);
          console.log(`  Error: ${stderr}`);
          console.log(`  Memory: ${memory}`);
          console.log(`  Time: ${time}`);
          console.log(`  Expected Output: ${questionDetails.expectedOutput}`);
        }
      }
    };

    // Set up event listeners for both clients
    client1.onmessage = (event) => handleMessage(event, "Client 1", client1);
    client2.onmessage = (event) => handleMessage(event, "Client 2", client2);

    client1.onerror = (error) => {
      console.error("Client 1 encountered an error:", error);
      client1.close();
    };

    client2.onerror = (error) => {
      console.error("Client 2 encountered an error:", error);
      client2.close();
    };

    console.log("==================================================")
    // Initiate a test execution
    const question = await findRandomQuestion()
    const questionId = question.question._id;
    console.log("questionId",questionId);
    const executeResponse = await axios.post(`${RUN_SERVICE_URL}/execute/${questionId}`, {
      codeAttempt: question.question.solutionCode, 
      channelId: channelId,
    });
    console.log("Execution started with response:", executeResponse.data);

    const secondQuestion = await findRandomQuestion()
    const secondQuestionId = secondQuestion.question._id;
    console.log("questionId", secondQuestionId);
    const toBlockResponse = await axios.post(`${RUN_SERVICE_URL}/execute/${questionId}`, {
      codeAttempt: question.question.solutionCode, 
      channelId: channelId,
    });
    console.log("Execution started with response:", toBlockResponse.data);
   


  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
