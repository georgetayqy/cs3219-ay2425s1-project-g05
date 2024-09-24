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

import classes from "./Dashboard.module.css";
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <section>
        <Container mt={"4rem"}>
          <Group>
            <Avatar size="8rem" name={user?.name}></Avatar>
            <Stack ml={12} flex={1}>
              <Title> {user?.name} </Title>
              <Text> {user?.email}</Text>
            </Stack>
            <Center>
              <Button> Join a session </Button>
            </Center>
          </Group>
        </Container>
      </section>
      <section>
        {/* <Container mt="4rem"> */}
        <Box px={"xl"} mt="4rem">
          <Flex className={classes["question-list"]}>
            {SAMPLE_QUESTIONS.map((question, key) => (
              <QuestionCard key={key} question={question} />
            ))}
          </Flex>
        </Box>
        {/* </Container> */}
      </section>
    </>
  );
}
