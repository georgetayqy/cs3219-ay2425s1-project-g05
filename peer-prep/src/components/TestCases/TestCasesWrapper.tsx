// Note: handle run and history service in here
import {
  Badge,
  Box,
  Button,
  Code,
  Group,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import classes from "./TestCasesWrapper.module.css";
import { Question, TestCase, TestCaseResult } from "../../types/question";
import { useEffect, useState } from "react";
import useApi, { ServerResponse, SERVICE } from "../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { EventSourcePolyfill } from "event-source-polyfill";

type TestCasesWrapperProps = {
  testCases: TestCase[]; // array of test cases
  channelId: string | null;
  questionId: string | null;

  // to decide if we want to pass down a function from parent instead of passing down solutioncode
  // runAllTestCases: () => void;

  currentValueRef: React.MutableRefObject<string>;
};

const STATUS_PARTIAL = 206;
const STATUS_COMPLETE = 200;

export default function TestCasesWrapper({
  testCases,
  channelId,
  // runAllTestCases,
  questionId,
  currentValueRef,
}: TestCasesWrapperProps) {
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(
    testCases[0]
  );

  const { fetchData } = useApi();
  // set to false only when receive back full result from SSE
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [isError, setIsError] = useState<boolean>(false);

  // array of tries for each attempt
  const [latestResults, setLatestResults] = useState<TestCaseResult[]>([]);
  const [allResults, setAllResults] = useState<TestCaseResult[][]>([]);

  // ---- effects
  useEffect(() => {
    if (!channelId) return;
    // subscribe to eventsource SSE
    const eventSource = new EventSourcePolyfill(
      `${import.meta.env.VITE_API_URL_RUN}/run-service/subscribe/${channelId}`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          // "Cache-Control": "no-cache",
          // Connection: "keep-alive",
          // "X-Accel-Buffering": "no",
        },
      }
    );

    const onMessage = (event: MessageEvent<string>) => {
      console.log("LOG: event source on message");
      console.log(event);
      const message: ServerResponse<TestCaseResult | TestCaseResult[]> =
        JSON.parse(event.data);

      console.log("INFO ✅: Message json formatted ", message);
      if (message.statusCode === STATUS_PARTIAL) {
      } else if (message.statusCode === STATUS_COMPLETE) {
        const results = message.data as TestCaseResult[];
        // setLatestResults(message.data.);
      } else {
      }
    };

    const onConnect = (event: Event) => {
      console.log("LOG: event source on connect");
      console.log(event);
    };

    const onError = (event: Event) => {
      console.log("LOG: event source on error");
      console.log(event);
    };

    eventSource.onmessage = onMessage;
    eventSource.onopen = onConnect;
    eventSource.onerror = onError;
  }, [channelId]);

  function onTestCaseChange(testCaseId: number) {
    // find the test case and set it
    const testCase = testCases.find((testCase) => testCase._id === testCaseId);
    setCurrentTestCase(testCase);
  }

  function runTestCases() {
    setIsRunning(true);

    const runNumber = allResults.length + 1;

    console.log("LOG: Current code value", currentValueRef.current);

    fetchData<
      ServerResponse<{
        testCaseCount: number;
      }>
    >(`/run-service/execute/${questionId}`, SERVICE.RUN, {
      method: "POST",
      body: JSON.stringify({
        codeAttempt: currentValueRef.current,
        channelId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        notifications.show({
          message: `Executing ${response.data.testCaseCount} test cases`,
        });
      })
      .catch((e) => {
        // TODO: handle error
        console.error(e);

        // 404: testcases/question not found
        // 409: testcases for this question and channel already running
      });

    setTimeout(() => {
      setIsRunning(false);
    }, 1000);
  }

  function getTestCaseResult(testCaseId: string, runNumber: number) {
    // stub
    // find the test case and get the result
    return "";
  }
  return (
    <Box className={classes.container}>
      <Group style={{ alignItems: "center" }}>
        <Title
          flex={1}
          order={3}
          style={{ fontSize: "1.5rem", marginRight: "1rem" }}
        >
          Test Cases ({testCases.length})
        </Title>
        <Button variant="light" onClick={runTestCases} loading={isRunning}>
          {" "}
          Run all testcases{" "}
        </Button>
      </Group>
      <Group>
        {testCases.map((testCase, index) => (
          // <Box key={index} className={classes.testCaseIcon}>
          //   {" "}
          //   {index + 1}{" "}
          // </Box>
          // <Badge
          //   key={index}
          //   size="xl"
          //   color="cyan"
          //   radius={"sm"}
          //   variant="light"
          //   onClick={() => onTestCaseChange(testCase._id)}
          //   style={{ cursor: "pointer" }}
          // >
          //   {index + 1}
          // </Badge>
          <Button
            key={index}
            size="sm"
            color="cyan"
            radius={"sm"}
            variant="light"
            onClick={() => onTestCaseChange(testCase._id)}
          >
            {index + 1}
          </Button>
        ))}
      </Group>
      {currentTestCase && (
        <Box className={classes.testCaseDisplay}>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Box mb={"md"}>
              <Text style={{ fontWeight: "700" }}> Input </Text>
              <Code block mt={"xs"}>
                {currentTestCase.testCode}
              </Code>
            </Box>
            <Box>
              <Text style={{ fontWeight: "700" }}> Expected Output </Text>
              <Code block mt="xs">
                {" "}
                {currentTestCase.expectedOutput}
              </Code>
            </Box>
          </SimpleGrid>
          <Box>
            <Text style={{ fontWeight: "700" }}> Actual output: </Text>
          </Box>
          <Code block>
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1)}
          </Code>
        </Box>
      )}
    </Box>
  );
}
