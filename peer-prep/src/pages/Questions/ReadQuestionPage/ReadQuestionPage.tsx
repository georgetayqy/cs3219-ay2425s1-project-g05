import { useLoaderData, useNavigate } from "react-router-dom";
import { ServerResponse } from "../../../hooks/useApi";
import { Question } from "../../../types/question";
import { useEffect, useState } from "react";
import { Container, Group, Stack, Title } from "@mantine/core";
import CategoryDisplay from "../../../components/Questions/Category/Category";

export default function ReadQuestionPage() {
  const data = useLoaderData() as ServerResponse<{ question: Question }>;

  const [question, setQuestion] = useState<Question | null>(null);

  const navigate = useNavigate();

  const statusCode = data.statusCode;

  useEffect(() => {
    if (statusCode !== 200) {
      navigate("/questions");
    }

    if (data.data) {
      setQuestion(data.data.question);
    }
  }, [statusCode]);

  // @ts-ignore
  console.log(question?.question?.title);

  if (question)
    return (
      <Container mt={"xl"}>
        <Stack>
          <Title> {question.title}</Title>
          <Group>
            {(question.categories || []).map((category, index) => (
              <CategoryDisplay key={index} category={category} />
            ))}
          </Group>
        </Stack>
      </Container>
    );
  else return "Loading...";
}
