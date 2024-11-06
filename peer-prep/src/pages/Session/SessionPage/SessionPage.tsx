import {
  Accordion,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Paper,
  Rating,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import classes from "./SessionPage.module.css";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CodeEditor from "../../../components/CollabCodeEditor/CollabCodeEditor";
import AvatarWithDetailsButton from "../../../components/AvatarIcon/AvatarWithDetailsButton";
import { IconChevronRight } from "@tabler/icons-react";
import { Question } from "../../../types/question";
import { useLocalStorage, useSessionStorage } from "@mantine/hooks";
import { modals, ModalsProvider } from "@mantine/modals";
import TextChatWidget from "../../../components/Communication/Text/TextChatWidget";
import { notifications } from "@mantine/notifications";
import { UserResponseData } from "../../../types/user";

type QuestionCategory =
  | "ALGORITHMS"
  | "DATABASES"
  | "DATA STRUCTURES"
  | "BRAINTEASER"
  | "STRINGS"
  | "BIT MANIPULATION"
  | "RECURSION";

// Map of category to color for badges
const categoryColorMap: { [key in QuestionCategory]: string } = {
  "ALGORITHMS": "blue",
  "DATABASES": "green",
  "DATA STRUCTURES": "orange",
  "BRAINTEASER": "red",
  "STRINGS": "purple",
  "BIT MANIPULATION": "cyan",
  "RECURSION": "teal",
};

const dummyTestCaseResults = [
  {
      "testCaseId": "first testcase",
      "isPassed": true,
      "input": "first qn",
      "output": "xxx",
      "expectedOutput": "first ans"
  },
  {
      "testCaseId": "sec testcase",
      "isPassed": true,
      "input": "first qn",
      "output": "xxx",
      "expectedOutput": "second ans"
  }
]

const LOCAL_WEBSOCKET = import.meta.env.VITE_COLLAB_WS_URL_LOCAL;

interface HistoryResponse {
  attempt: any;
}

export default function SessionPage() {
  const WEBSOCKET_URL = import.meta.env.VITE_COLLAB_WS_URL || LOCAL_WEBSOCKET;

  const { fetchData } = useApi();
  const navigate = useNavigate();

  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user") as string)
      : null
  );
  const [userId, setUserId] = useState(user?._id);

  const location = useLocation();
  const { questionReceived, roomIdReceived, otherUserIdReceived } = location.state || {};

  // Room ID and Question details from matching of users
  const [roomId, setRoomId] = useState(roomIdReceived);
  const [question, setQuestion] = useState(questionReceived);
  const [otherUserId, setOtherUserId] = useState(otherUserIdReceived);
  const [otherUserDisplayName, setOtherUserDisplayName] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");

  // Question details to be displayed
  const [questionCategories, setQuestionCategories] = useState<
    QuestionCategory[]
  >([]);
  const [questionDifficulty, setQuestionDifficulty] = useState(question.difficulity);
  const [questionTitle, setQuestionTitle] = useState(question.title);
  const [questionDescription, setQuestionDescription] = useState(question.description.descriptionHtml);
  const [leetCodeLink, setLeetCodeLink] = useState(question.link);

  const [templateCode, setTemplateCode] = useState(question.templateCode);
  const [attemptCode, setAttemptCode] = useState(question.templateCode);
  const [testCaseResults, setTestCaseResults] = useState(dummyTestCaseResults);

  // when true, don't show modal when # users in room < 2
  // const [isWaitingForRejoin, setIsWaitingForRejoin] = useState(false);
  const isWaitingForRejoinRef = useRef(false);

  interface CheckRoomDetailsResponse {
    [roomId: string]: {
      users: String[];
    };
  }

  useEffect(() => {
    try {
      fetchData<ServerResponse<UserResponseData>>(
        `/user-service/users/${otherUserId}`,
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
  }, []);

  const renderComplexity = () => {
    const difficultyRating =
      questionDifficulty === "EASY"
        ? 1
        : questionDifficulty === "MEDIUM"
        ? 2
        : 3;
    return (
      <Rating mt="xs" defaultValue={difficultyRating} count={3} readOnly />
    );
  };

  const checkRoomStatus = async () => {
    try {
      const response = await fetchData<
        ServerResponse<CheckRoomDetailsResponse>
      >(`/collaboration-service/rooms/${roomId}`, SERVICE.COLLAB);

      const users = response.data[roomId].users;

      console.log({ isWaitingForRejoinRef });
      if (users.length < 2 && !isWaitingForRejoinRef.current) {
        // other user has left the room
        openSessionEndedModal();
      }
      if (users.length === 2) {
        // other user has joined the room
        if (isWaitingForRejoinRef.current) {
          isWaitingForRejoinRef.current = false;

          // notify that the other user has joined back
          notifications.show({
            title: "User has joined back",
            message:
              "The other user has joined back. You can now continue the session.",
            color: "green",
          });
        }
      }
    } catch (error: any) {
      console.error("Error checking room status", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  useEffect(() => {
    setUserId(user?._id);

    // Call checkRoomStatus every 5 seconds
    const intervalId = setInterval(() => {
      checkRoomStatus();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const openEndSessionModal = () => {
    console.log("End Session");
    modals.openConfirmModal({
      title: "Would you like to end the session?",
      labels: {
        confirm: "End Session",
        cancel: "Cancel",
      },
      onConfirm: handleEndSession,
    });
  };

  const openSessionEndedModal = () => {
    console.log("Session Ended");
    modals.open({
      title: "Session has ended",
      children: (
        <>
          <Text>
            This session has ended as the other user has left the room.
          </Text>
          <Text mt="lg">
            You can choose to wait for the other user to join back, or end the
            session.
          </Text>
          <Text mt="sm">
            You'll be notified when the other user joins back.
          </Text>
          <SimpleGrid cols={2} mt={"lg"}>
            <Button fullWidth variant="light" onClick={handleWait}>
              Wait for the other user
            </Button>
            <Button
              fullWidth
              onClick={handleEndSession}
              variant="light"
              color="red"
            >
              End session
            </Button>
          </SimpleGrid>
        </>
      ),
      withCloseButton: false,
      size: "lg",
      closeOnClickOutside: false,
      closeOnEscape: false,
    });
  };

  const handleEndSession = () => {
    modals.closeAll();

    // call history service to create an attempt
    try {
      const { _id, testCases, templateCode, meta, isDeleted, __v, categories, ...questionForAttempt } = question;

      fetchData<ServerResponse<HistoryResponse>>(
        `/history-service/attempt`, 
        SERVICE.HISTORY, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otherUserId,
            roomId,
            notes: " ",
            attemptCode,
            testCaseResults,
            question: questionForAttempt,
          }),
        }
      ).then((response) => {
        console.log("Attempt created", response);
        const attempt = response.data.attempt;
        console.log("Attempt", attempt);

        // navigate to session summary page
        navigate(`/session/summary/${roomId}`, { state: { roomIdReceived: roomId, attemptReceived: attempt } });
      });
    } catch (error: any) {
      console.error("Error ending session", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }

  };

  const handleWait = () => {
    console.log("LOG: we're waiting");
    // just close the modal
    modals.closeAll();
    isWaitingForRejoinRef.current = true;
  };

  return (
    <ModalsProvider>
      <TextChatWidget roomId={roomId} />
      <Box className={classes.wrapper}>
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

        <Flex gap="md" className={classes.mainContent}>
          <Paper
            radius="md"
            withBorder
            style={{
              flex: 1,
              minHeight: "100%",
              maxWidth: "50%",
              overflow: "auto",
            }}
            className={classes.paper}
          >
            <Title
              order={3}
              style={{ fontSize: "1.5rem", marginRight: "1rem" }}
            >
              {questionTitle}
            </Title>
            <Group mt={8}>
              {questionCategories.map((category, index) => (
                <Badge
                  key={index}
                  color={categoryColorMap[category] || "cyan"}
                  size="sm"
                  variant="filled"
                >
                  {category}
                </Badge>
              ))}
            </Group>
            {renderComplexity()}

            <ScrollArea type="hover" h={700} mt={10}>
              <TypographyStylesProvider>
                <div
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: questionDescription }}
                ></div>
              </TypographyStylesProvider>
            </ScrollArea>
            <Button
              variant="light"
              color="blue"
              component="a"
              href={leetCodeLink}
              target="_blank"
              mt="sm"
              size="xs"
            >
              View on LeetCode
            </Button>

            <Center>
              <Button
                // variant="light"
                color="red"
                size="md"
                style={{ marginTop: "1rem" }}
                onClick={openEndSessionModal}
              >
                End Session
              </Button>
            </Center>
          </Paper>

          <Stack style={{ flex: 1, gap: "1 rem" }}>
            <Paper
              radius="md"
              withBorder
              style={{ flex: 1, minHeight: "100%" }}
            >
              <CodeEditor
                // endpoint={"ws://localhost:8004"}
                endpoint={WEBSOCKET_URL}
                room={roomId}
                user={userId}
                theme="dark"
                height={"500px"}
                defaultValue={question.templateCode}
                onChange={(code) => setAttemptCode(code)}
              />
            </Paper>
            <Stack>
              <Paper
                style={{ height: "200px", backgroundColor: "#f0f0f0" }}
                className={classes.paper}
              >
                {/* Placeholder for Test Cases */}
                <Title order={4}>Test Cases</Title>
                <Text size="lg" color="dimmed">
                  Test Cases Placeholder
                </Text>
              </Paper>
            </Stack>
          </Stack>
        </Flex>
      </Box>
    </ModalsProvider>
  );
}
