import {
  Box,
  CloseButton,
  Container,
  Flex,
  Input,
  Stack,
  Button,
  Modal,
  TextInput,
  Select,
  Textarea,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Question, SAMPLE_QUESTIONS } from "../../types/question";
import useApi, { QuestionServerResponse } from "../../hooks/useApi";
import { useLoaderData } from "react-router-dom";
import QuestionCard from "../../components/Questions/QuestionCard/QuestionCard";

import classes from "./QuestionPage.module.css";

export default function QuestionPage() {
  const [searchValue, setSearchValue] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // const { isLoading, error, fetchData } = useApi();
  const data = useLoaderData() as QuestionServerResponse<Question[]>;
  console.log({ data });

  useEffect(() => {
    setQuestions(data.data);
  }, [data]);

  return (
    <>
      <Container mt={48}>
        <Stack>
          <Input
            size="xl"
            placeholder="Search for a question..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            rightSection={
              <CloseButton
                aria-label="Clear input"
                onClick={() => setSearchValue("")}
                style={{ display: searchValue ? undefined : "none" }}
              />
            }
          />
        </Stack>
      </Container>

      <Container mt={16}>
        <Button component="a" href="/questions/create">
          Add New Question
        </Button>
      </Container>

      <section>
        {/* <Container mt="4rem"> */}
        <Box px={"xl"} mt="4rem">
          <Flex className={classes["question-list"]}>
            {SAMPLE_QUESTIONS.map(
              (
                question,
                key // TODO: replace SAMPLE_QUESTIONS with questions
              ) => (
                <QuestionCard key={key} question={question} isClickable />
              )
            )}
          </Flex>
        </Box>
        {/* </Container> */}
      </section>
    </>
  );
}
