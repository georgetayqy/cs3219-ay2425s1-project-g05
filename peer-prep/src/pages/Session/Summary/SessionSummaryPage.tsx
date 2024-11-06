import {
  Accordion,
  Avatar,
  Badge,
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
import { IconChevronRight, IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import CodeEditorWithLanguageSelector from "../../../components/Questions/CodeEditor/CodeEditor";
import { AttemptData, TestCaseResult, UserAttempt } from "../../../types/attempts";
import { useLocation } from "react-router-dom";
import { UserResponseData } from "../../../types/user";

export default function SessionSummaryPage() {
  const { fetchData } = useApi();

  const location = useLocation();
  const { roomIdReceived, attemptReceived } = location.state || {};

  const [roomId, setRoomId] = useState(roomIdReceived);
  const [attempt, setAttempt] = useState(attemptReceived);

  // Attempt data to display
  const [completedAt, setCompletedAt] = useState("");
  const [otherUserDisplayName, setOtherUserDisplayName] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");

  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");

  const [notes, setNotes] = useState("");
  const [toSave, setToSave] = useState(false);

  const [userSolution, setUserSolution] = useState("");
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>(
    []
  );
  const [privateTestsPassed, setPrivateTestsPassed] = useState(true);


  // Retrieve session summary and details of other user on page load
  useEffect(() => {
      getSessionSummary();
      getOtherUser();
  }, []);

  const getSessionSummary = async () => {
    try {
      fetchData<ServerResponse<AttemptData>>(
          `/history-service/attempt/${roomId}`,
          SERVICE.HISTORY
        ).then((response) => {
          const attempt = response.data.attempt[0];
          setAttempt(attempt);

          const question = attempt.question as Question;
          setQuestionTitle(question.title);
          setQuestionDescription(question.description.descriptionHtml);

          setCompletedAt(formatDateTime(attempt.createdAt));
          if (attempt.notes !== " ") {
            setNotes(attempt.notes);
          }

          setUserSolution(attempt.attemptCode);

          setTestCaseResults(attempt.testCaseResults);
          setPrivateTestsPassed(calculateSummary(attempt.testCaseResults).failed === 0);
        });
    } catch (error: any) {
      console.error("Error getting session summary:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  }
  
  const getOtherUser = async () => { 
    try {
      fetchData<ServerResponse<UserResponseData>>(
        `/user-service/users/${attempt.otherUserId}`,
        SERVICE.USER
      ).then((response) => {
        setOtherUserDisplayName(response.data.user.displayName);
        setOtherUserEmail(response.data.user.email);
      });
    } catch (error: any) {
      console.error("Error getting details of other user:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  }

  // Helper function to calculate passed/failed summary
  const calculateSummary = (results: TestCaseResult[]) => {
    const passed = results.filter((result) => result.isPassed).length;
    return { passed, failed: results.length - passed };
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString();
  }

  const { passed, failed } = calculateSummary(testCaseResults);

  const handleSaveNotes = async () => {
    try {
      fetchData<ServerResponse<UserAttempt>>(
        `/history-service/attempt/${roomId}`,
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
      ).then((response) => {
        setToSave(false);
        notifications.show({
          message: "Notes saved successfully!",
          color: "green",
        });
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
        <Text color="dimmed">Completed on {completedAt} </Text>

        {/* Collaborator Details */}
        <Group mb="md" style={{ alignItems: "center" }}>
          <Group>
            <Avatar radius="xl" size="md" color="blue">
              {otherUserDisplayName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text size="sm">{otherUserDisplayName}</Text>
              <Text size="xs" color="dimmed">{otherUserEmail}</Text>
            </div>
            <Badge color="teal" size="sm" variant="filled" ml="xs">
              Collaborator
            </Badge>
          </Group>
          <IconChevronRight size="1rem" color="dimmed" />
        </Group>
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
            onChange={(event) => { setNotes(event.currentTarget.value); setToSave(true); }}
          />
          <Button onClick={handleSaveNotes} mt={20} disabled={!toSave}>
            Save
          </Button>
        </Paper>
      </Flex>


      <Paper w={"100%"}>
        <Title order={4}>Your Solution</Title>
        <CodeEditorWithLanguageSelector
          label=""
          code={userSolution}
          onCodeChange={setUserSolution}
          required={false}
          isReadOnly={true}
        />
      </Paper>

      <Paper radius="md" withBorder className={classes.testCases}>
        <Title order={4}>Test Case Summary</Title>
        <Text>
          Passed: {passed}, Failed: {failed}
        </Text>
        <Accordion multiple mt={10}>
          {testCaseResults.map((result, index) => (
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
                <Text>Input: {result.input}</Text>
                <Text>Expected Output: {result.expectedOutput}</Text>
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
