import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { QuestionOlsd } from "../../../types/question";

import classes from "./QuestionCard.module.css";
import ComplexityDisplay from "../Complexity/Complexity";
import { IconBrandLeetcode } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import CategoryDisplay from "../Category/Category";

export default function QuestionCard({
  question,
}: {
  question: QuestionOlsd | any;
}) {
  return (
    <Box className={classes.card}>
      <Stack className={classes.contents}>
        <Title order={3}> {question.title} </Title>
        <Text
          style={{
            whiteSpace: "pre-wrap",
            flex: 1,
          }}
        >
          {question.shortDescription}
        </Text>
        <Flex gap={"md"} justify={"end"}>
          {question.categories.map((category, index) => (
            <CategoryDisplay key={index} category={category} />
          ))}
        </Flex>
        <Divider />
        <Flex justify={"space-between"} align={"center"}>
          <ComplexityDisplay complexity={question.complexity} />
          <Button
            color="black"
            size="compact-md"
            onClick={() => {
              window.open(question.link, "_blank", "noopener,noreferrer");
            }}
          >
            <IconBrandLeetcode style={{ width: rem(16), height: rem(16) }} />
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
