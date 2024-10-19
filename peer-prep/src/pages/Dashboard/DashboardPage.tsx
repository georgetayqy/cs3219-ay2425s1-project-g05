import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useAuth } from "../../hooks/useAuth";
import QuestionCard from "../../components/Questions/QuestionCard/QuestionCard";
import { SAMPLE_QUESTIONS } from "../../types/question";

import classes from "./DashboardPage.module.css";
import { Link } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../hooks/useApi";
import { AttemptData, UserAttempt } from "../../types/attempts";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
export default function DashboardPage() {
  const { user } = useAuth();
  const { fetchData } = useApi();

  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);

  const getUserAttempts = async () => {
    try {
      const response = await fetchData<ServerResponse<AttemptData>>(
        "/history-service/user",
        SERVICE.HISTORY
      );
      const attempts = response.data.attempts;
      setUserAttempts(attempts);
    } catch (error: any) {
      console.error("Error getting user attempts:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  }
  
  // Fetch the data when the component mounts
  useEffect(() => {
    getUserAttempts();
  }, []);

  return (
    <>
      <section>
        <Container mt={"4rem"}>
          <Group>
            <Avatar size="8rem" name={user?.displayName}></Avatar>
            <Stack ml={12} flex={1}>
              <Title> {user?.displayName} </Title>
              <Text> {user?.email}</Text>
            </Stack>
            <Center>
              <Button component={Link} to="/session/create">
                Start a session
              </Button>
            </Center>
          </Group>
        </Container>
      </section>
      <section>
        {/* <Container mt="4rem"> */}
        <Box px={"xl"} mt="4rem">
          <Flex className={classes["question-list"]}>
            {/* {SAMPLE_QUESTIONS.map((question, key) => (
              <QuestionCard key={key} question={question} difficulty="EASY" />
            ))} */}
            {userAttempts.length > 0 ? (
              userAttempts.map((attempt, key) => (
                <QuestionCard
                  key={key}
                  question={attempt.question} 
                  difficulty={attempt.question.difficulty}
                />
              ))
            ) : (
              <Text>No attempts found</Text>
            )}
          </Flex>
        </Box>
        {/* </Container> */}
      </section>
    </>
  );
}
