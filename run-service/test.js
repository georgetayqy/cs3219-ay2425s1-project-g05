import axios from "axios";
import EventSource from "eventsource";


const QUESTION_SERVICE_URL = "http://localhost:8003/api/question-service"; 
const RUN_SERVICE_URL = "http://localhost:8009/api/run-service";

async function getRandomQuestion() {
    try {
        const response = await axios.get(`${QUESTION_SERVICE_URL}/random`);
        console.log("Random Question:", response.data);
        return response.data; 
    } catch (error) {
        console.error("Error fetching random question:", error);
        throw error;
    }
}

async function executeQuestion(questionId, codeAttempt) {
    try {
        console.log("Executing question with ID:", questionId);
        console.log(codeAttempt)
        const response = await axios.post(`${RUN_SERVICE_URL}/execute/${questionId}`, {
            codeAttempt: codeAttempt,
            language_id: 71 // TODO: Adjust based on the language ID
        });
        return response.data; 
    } catch (error) {
        console.error("Error executing question:", error);
        throw error;
    }
}

async function subscribeToResults(jobId) {
    // This uses EventSource for SSE
    const eventSource = new EventSource(`${RUN_SERVICE_URL}/result/${jobId}`);
    eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.status === "complete") {
            console.log("Test execution completed!");
            for (const result of message.data.results) {
                // Assuming result.data.result contains the actual result object you want to print
                const resultData = result.data.result; 
                const { isPassed, stdout, stderr, memory, time, questionDetails, _id } = resultData; // Destructure properties
    
                console.log(`Test Case ${_id}:`);
                console.log(`  Passed: ${isPassed}`);
                console.log(`  Output: ${stdout}`);
                console.log(`  Error: ${stderr}`);
                console.log(`  Memory: ${memory}`);
                console.log(`  Time: ${time}`);
                console.log(`  Question Details: ${questionDetails.expectedOutput}`);
            }
            eventSource.close(); // Close the connection after completion
        }
        console.log("Received message:", message);
    };

    eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        eventSource.close(); 
    };
}

(async () => {
    try {
        // Step 1: Get a random question
        const randomQuestion = await getRandomQuestion();
        console.log("Random Question:", randomQuestion);

        // Step 2: Execute the question with some code attempt
        const questionId = randomQuestion.data.question._id; // Adjust based on your question structure
        const codeAttempt = randomQuestion.data.question.solutionCode; // Replace with actual code attempt

        const executeResponse = await executeQuestion(questionId, codeAttempt);
        const jobId = executeResponse.data.jobId;
        console.log(`Execution started for jobId: ${jobId}`);

        // Step 3: Subscribe to results
        subscribeToResults(jobId);
    } catch (error) {
        console.error("An error occurred during testing:", error);
    }
})();
