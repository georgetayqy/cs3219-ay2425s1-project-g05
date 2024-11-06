// Note: handle run and history service in here
import {
  Alert,
  Badge,
  Box,
  Button,
  ButtonProps,
  Code,
  Group,
  rem,
  SimpleGrid,
  Space,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import classes from "./TestCasesWrapper.module.css";
import {
  ExecutionResultSchema,
  FinalResult,
  PartialResult,
  Question,
  TestCase,
  TestCaseResult,
} from "../../types/question";
import { useEffect, useState } from "react";
import useApi, { ServerResponse, SERVICE } from "../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useColorScheme, useTimeout } from "@mantine/hooks";
import { clear } from "console";
import { IconDatabase, IconHourglassEmpty } from "@tabler/icons-react";
import { kBtoMb, secondsToMsIfappropriate } from "../../utils/utils";

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
const STATUS_CREATED = 201;

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
  const { colorScheme } = useMantineColorScheme();
  const { fetchData } = useApi();
  // set to false only when receive back full result from SSE
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const { start: startRunningTimeout, clear: clearRunningTimeout } = useTimeout(
    () => {
      setIsError(true);
      setIsRunning(false);
      notifications.show({
        title: "Error running test cases",
        message:
          "There was an unknown error running the test cases. Timed out after 10 seconds. Please try again.",
        color: "red",
      });
    },
    10000
  );

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
      const message: ExecutionResultSchema = JSON.parse(event.data);

      console.log("INFO ✅: Message json formatted ", message);
      if (message.statusCode === STATUS_PARTIAL) {
        // console.log("INFO: Partial result received");
        const result = (message.data as PartialResult).result;
        console.log("INFO: One result", result);
        setLatestResults((prev) => [...prev, result]);
      } else if (message.statusCode === STATUS_COMPLETE) {
        console.log("INFO: Complete result received");
        const results = (message.data as FinalResult).results;
        // setLatestResults(message.data.);

        setIsRunning(false);
        notifications.show({
          message: `All test cases executed successfully`,
        });

        setLatestResults(results);
        setAllResults((prev) => [...prev, results]);

        console.log("INFO: Latest results", results);
        clearRunningTimeout();
      } else if (message.statusCode === STATUS_CREATED) {
      } else {
        clearRunningTimeout();
        setIsError(true);
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
    setIsError(false);
    setIsRunning(true);

    // latest results should have already been copied into all results
    setLatestResults([]);

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

    startRunningTimeout();
  }

  function getTestCaseResult(
    testCaseId: string,
    runNumber: number // unused for now, -1 means latest
  ): TestCaseResult | undefined {
    // stub
    // find the test case and get the result
    console.log({ latestResults });
    return latestResults.find(
      (result) => result.testCaseDetails.testCaseId === testCaseId
    );
  }

  function getTestCaseColour(testCaseId: string): ButtonProps["color"] {
    // if latestresult is fail, return red
    const result = getTestCaseResult(testCaseId, -1);
    if (!result) return "gray";

    if (result.isPassed) {
      return "green";
    } else {
      return "red";
    }
  }
  console.log({ colorScheme });
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
          <Button
            key={index}
            size="sm"
            color={getTestCaseColour(testCase._id.toString())}
            radius={"sm"}
            variant={testCase._id === currentTestCase?._id ? "filled" : "light"}
            onClick={() => onTestCaseChange(testCase._id)}
            loading={
              isRunning &&
              latestResults.find(
                (result) =>
                  result.testCaseDetails.testCaseId === testCase._id.toString()
              ) === undefined
            }
          >
            {index + 1}
          </Button>
        ))}
      </Group>
      {currentTestCase && currentTestCase.isPublic ? (
        <Box className={classes.testCaseDisplay}>
          {getTestCaseResult(currentTestCase._id.toString(), 1) && (
            <Group>
              <Badge
                variant="dot"
                color={getTestCaseColour(currentTestCase._id.toString())}
                size="xl"
                radius="xs"
              >
                {getTestCaseResult(currentTestCase._id.toString(), 1).isPassed
                  ? "Passed"
                  : "Failed"}
              </Badge>
              <Space flex={1} />
              <Group>
                <Badge
                  leftSection={<IconDatabase width="16px" height="16px" />}
                  radius="sm"
                  variant="light"
                  size="lg"
                  styles={{
                    label: {
                      // get rid of uppercase
                      textTransform: "none",
                    },
                  }}
                  color={colorScheme === "dark" ? "gray" : "gray"}
                >
                  {kBtoMb(
                    getTestCaseResult(currentTestCase._id.toString(), 1).memory
                  )}{" "}
                  MB
                </Badge>
                <Badge
                  leftSection={
                    <IconHourglassEmpty width="16px" height="16px" />
                  }
                  radius="sm"
                  variant="light"
                  size="lg"
                  styles={{
                    label: {
                      // get rid of uppercase
                      textTransform: "none",
                    },
                  }}
                  color={colorScheme === "dark" ? "gray" : "gray"}
                >
                  {secondsToMsIfappropriate(
                    Number(
                      getTestCaseResult(currentTestCase._id.toString(), 1).time
                    )
                  )}
                </Badge>
              </Group>
            </Group>
          )}
          <SimpleGrid cols={{ base: 1, md: 2 }} mt="lg">
            <Box mb={"md"}>
              <Text style={{ fontWeight: "700" }}> Test Program </Text>
              <Code block mt={"xs"} className={classes.codeBlock}>
                {currentTestCase.testCode}
              </Code>
            </Box>
            <Box>
              <Text style={{ fontWeight: "700" }}> Expected Output </Text>
              <Code block mt="xs" className={classes.codeBlock}>
                {currentTestCase.expectedOutput}
              </Code>
            </Box>
          </SimpleGrid>
          <Box>
            <Text style={{ fontWeight: "700" }}> Actual output: </Text>
          </Box>
          <Code
            block
            className={classes.codeBlock}
            style={{
              outline: `1.5px solid var(--mantine-color-${getTestCaseColour(
                currentTestCase._id.toString()
              )}-9)`,
            }}
            color={
              colorScheme === "light" &&
              `${getTestCaseColour(currentTestCase._id.toString())}.1`
            }
          >
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1).stdout}
          </Code>
          <Box mt={"xs"}>
            <Text style={{ fontWeight: "700" }}> Error logs: </Text>
          </Box>
          <Code block className={classes.codeBlock}>
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1).stderr}
          </Code>
        </Box>
      ) : (
        <Box className={classes.testCaseDisplay}>
          {getTestCaseResult(currentTestCase._id.toString(), 1) && (
            <Group mb={"lg"}>
              <Badge
                variant="dot"
                color={getTestCaseColour(currentTestCase._id.toString())}
                size="xl"
                radius="xs"
              >
                {getTestCaseResult(currentTestCase._id.toString(), 1).isPassed
                  ? "Passed"
                  : "Failed"}
              </Badge>
            </Group>
          )}
          <Alert variant="light">
            This is a private test case! No other details will be shown.
          </Alert>
        </Box>
      )}
    </Box>
  );
}
