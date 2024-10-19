import {
  Accordion,
  Button,
  Flex,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import classes from "./SessionSummaryPage.module.css";
import { useEffect, useState } from "react";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { Question } from "../../../types/question";
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import CodeEditorWithLanguageSelector from "../../../components/Questions/CodeEditor/CodeEditor";
import { AttemptData, TestCaseResult, UserAttempt } from "../../../types/attempts";

const dummyRecommendedSolution = `class Solution(object):
  def reverseString(self, s):
    i, j = 0, len(s) - 1
    while i < j:
      s[i], s[j] = s[j], s[i]
      i, j = i + 1, j - 1`;

const dummyHtmlDescription =
  "<p>Write a function that reverses a string. The input string is given as an array of characters s.</p> <p>Example 1:</p> <pre>Input: s = ['h','e','l','l','o'] Output: ['o','l','l','e','h']</pre> <p>Example 2:</p> <pre>Input: s = ['H','a','n','n','a','h'] Output: ['h','a','n','n','a','H']</pre>";

const dummyTestCasesResults: TestCaseResult[] = [
  {
    isPassed: true,
    output: "['o','l','l','e','h']",
    _id: "1",
  },
  {
    isPassed: true,
    output: "['h','a','n','n','a','H']",
    _id: "2",
  },
  {
    isPassed: false,
    output: "['h','a','n','n','a','H']",
    _id: "3",
  },
  {
    isPassed: true,
    output: "['o','l','l','e','h']",
    _id: "4",
  },
];

export default function SessionSummaryPage() {
  const { fetchData } = useApi();

  const [duration, setDuration] = useState(10);
  const [runtime, setRuntime] = useState("");
  const [memory, setMemory] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendedSolution, setRecommendedSolution] = useState(
    dummyRecommendedSolution
  );
  const [userSolution, setUserSolution] = useState("");
  const [testCasesResults, setTestCasesResults] = useState<TestCaseResult[]>(
    []
  );
  const [privateTestsPassed, setPrivateTestsPassed] = useState(true);

  useEffect(() => {
    getSessionSummary();
  }, []);

  const getSessionSummary = async () => {
    try {
      // Get session summary
      const response = await fetchData<ServerResponse<AttemptData>>(
        "/history-service/?roomId=TESTROOM2",
        SERVICE.HISTORY
      );
      const attempt = response.data.attempts[0];
      const runtime = "100"; // TO replace with actual runtime once sent over by backend
      const memory = "54.2"; // TO replace with actual memory once sent over by backend
      const questionTitle = attempt.question.title;
      const questionDescription = attempt.question.description.descriptionHtml;
      const notes = attempt.notes;
      const recommendedSolution = dummyRecommendedSolution; // TO replace with actual recommended solution once sent over by backend
      const userSolution = attempt.attemptCode;
      const testCasesResults = attempt.testCasesResults;
      const createdAt = attempt.createdAt;
      const updatedAt = attempt.updatedAt;

      const duration = updatedAt
        ? new Date(updatedAt).getTime() - new Date(createdAt).getTime()
        : "";

      // console.log("Session Summary:", {
      //   duration,
      //   runtime,
      //   memory,
      //   questionTitle,
      //   questionDescription,
      //   notes,
      //   recommendedSolution,
      //   userSolution,
      //   testCasesResults,
      //   createdAt
      // });

      setRuntime(runtime);
      setMemory(memory);
      setQuestionTitle(questionTitle);
      setQuestionDescription(dummyHtmlDescription); // TO replace with actual question description once sent over by backend
      setNotes(notes);
      setRecommendedSolution(recommendedSolution);
      setUserSolution(userSolution);
      setTestCasesResults(testCasesResults);
      setPrivateTestsPassed(calculateSummary(testCasesResults).failed === 0);
    } catch (error: any) {
      console.error("Error getting session summary:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  // Helper function to calculate passed/failed summary
  const calculateSummary = (results: TestCaseResult[]) => {
    const passed = results.filter((result) => result.isPassed).length;
    return { passed, failed: results.length - passed };
  };

  const { passed, failed } = calculateSummary(dummyTestCasesResults);

  const handleSaveNotes = async () => {
    try {
      const response = await fetchData<ServerResponse<UserAttempt>>(
        "/history-service/TESTROOM2",
        SERVICE.HISTORY,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes,
          }),
        }
      );
      notifications.show({
        message: "Notes saved successfully!",
        color: "green",
      });
    } catch (error: any) {
      console.error("Error saving notes:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  return (
    <Flex className={classes.wrapper}>
      <Stack align="flex-start">
        <Title>Congratulations 🎉</Title>
        <Text>You finished the problem in {duration} minutes.</Text>
        <Flex gap="md">
          <Paper radius="md" withBorder className={classes.rtm}>
            <Text size="sm">Runtime</Text>
            <Text size="lg">{runtime} ms</Text>
          </Paper>
          <Paper radius="md" withBorder className={classes.rtm}>
            <Text size="sm">Memory</Text>
            <Text size="lg">{memory} MB</Text>
          </Paper>
        </Flex>
      </Stack>

      <Flex gap={20} w={"100%"}>
        <Paper
          radius="md"
          withBorder
          style={{ flex: 5 }}
          className={classes.paper}
        >
          <Title order={4}>{questionTitle}</Title>
          <ScrollArea type="hover" h={400} mt={10}>
            <TypographyStylesProvider>
              <div
                dangerouslySetInnerHTML={{ __html: questionDescription }}
              ></div>
            </TypographyStylesProvider>
          </ScrollArea>
        </Paper>

        <Paper
          radius="md"
          withBorder
          style={{ flex: 3 }}
          className={classes.paper}
        >
          <Title order={4}>Notes</Title>
          <Textarea
            mt={10}
            autosize
            minRows={15}
            maxRows={15}
            placeholder="Write your notes here"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
          />
          <Button onClick={handleSaveNotes} mt={20}>
            Save
          </Button>
        </Paper>
      </Flex>

      <SimpleGrid cols={2} style={{ width: "100%" }}>
        <Stack>
          <Title order={4}>Recommended Solution</Title>
          <CodeEditorWithLanguageSelector
            label=""
            code={recommendedSolution}
            onCodeChange={setRecommendedSolution}
            required={false}
            isReadOnly={true}
          />
        </Stack>

        <Stack>
          <Title order={4}>Your Solution</Title>
          <CodeEditorWithLanguageSelector
            label=""
            code={userSolution}
            onCodeChange={setUserSolution}
            required={false}
            isReadOnly={true}
          />
        </Stack>
      </SimpleGrid>

      <Paper radius="md" withBorder className={classes.testCases}>
        <Title order={4}>Test Case Summary</Title>
        <Text>
          Passed: {passed}, Failed: {failed}
        </Text>
        <Accordion multiple mt={10}>
          {testCasesResults.map((result, index) => (
            <Accordion.Item key={index} value={result._id}>
              <Accordion.Control
                icon={
                  result.isPassed ? (
                    <IconCircleCheckFilled
                      style={{ color: "var(--mantine-color-green-6" }}
                    />
                  ) : (
                    <IconCircleXFilled
                      style={{ color: "var(--mantine-color-red-6" }}
                    />
                  )
                }
              >
                Test Case {index + 1} - {result.isPassed ? "Passed" : "Failed"}
              </Accordion.Control>
              <Accordion.Panel>
                {/* TO replace with expected output (not yet sent over by backend) */}
                <Text>Expected Output: {result.output}</Text>
                <Text>Your Output: {result.output}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        <Paper
          mt="md"
          p="md"
          withBorder
          className={privateTestsPassed ? classes.ptcPassed : classes.ptcFailed}
        >
          <Group>
            {privateTestsPassed ? (
              <IconCircleCheckFilled
                style={{ color: "var(--mantine-color-green-6)" }}
              />
            ) : (
              <IconCircleXFilled
                style={{ color: "var(--mantine-color-red-6)" }}
              />
            )}
            <Text>
              Private Test Cases: {privateTestsPassed ? "Passed" : "Failed"}
            </Text>
          </Group>
          <Text size="sm" color="dimmed">
            Details for private test cases are hidden.
          </Text>
        </Paper>
      </Paper>
    </Flex>
  );
}
