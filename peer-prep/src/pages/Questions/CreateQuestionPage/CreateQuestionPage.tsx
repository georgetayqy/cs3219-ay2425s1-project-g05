import { useState } from "react";
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Container,
  Stack,
  Center,
  Input,
  Stepper,
  Text,
} from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import classes from "./CreateQuestionPage.module.css";

export default function CreateQuestionPage() {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: add logic to create the new question in the database
  };

  console.log(description);

  const [active, setActive] = useState(1);

  return (
    <Container mt={48}>
      <h1>Add New Question</h1>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
          />
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(value: string | null) => setDifficulty(value)}
            data={["Easy", "Medium", "Hard"]}
            required
          />
          <Select
            label="Categories"
            value={categories}
            onChange={(value: string[]) => setCategories(value)}
            data={["Category 1", "Category 2", "Category 3"]} // TODO: fetch categories from the database and display as
            multiple
            required
          />
          <Input.Wrapper label="Description" required>
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              style={{ height: "576px", marginTop: "12px" }}
              modules={{
                toolbar: [
                  "bold",
                  "underline",
                  "italic",
                  "link",
                  "blockquote",
                  "code-block",
                  "image",
                ],
              }}
            >
              <div className={classes.quillEditor} />
            </ReactQuill>
          </Input.Wrapper>

          <Textarea
            label="Test Cases"
            value={testCases}
            onChange={(event) => setTestCases(event.currentTarget.value)}
            style={{ marginTop: "48px" }}
            autosize
            minRows={4}
          />

          <Center>
            <Button type="submit" style={{ marginTop: "12px" }}>
              Submit
            </Button>
          </Center>
        </Stack>
      </form>
    </Container>
  );
}
