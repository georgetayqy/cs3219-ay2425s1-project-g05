import { useEffect, useState } from "react";
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
  MultiSelect,
  Card,
  Switch,
  Flex,
  Divider,
} from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import classes from "./CreateQuestionPage.module.css";
import { TestCase } from "../../../types/question";

export default function CreateQuestionPage() {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]); 

  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);

  // Mapping for difficulty display
  const difficultyOptions = [
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  useEffect(() => {
    fetchCategories();
  } , []);

  const fetchCategories = async () => {
    try {
      // TODO: replace fetch with a fetchdata function
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/question-service/categories`
      );
      const categories = await response.json();

      const transformedCategories = categories.data.map((category: string) => ({
        value: category.toUpperCase(), 
        label: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(), 
      }));

      setFetchedCategories(transformedCategories);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // TODO: replace fetch with a fetchdata function
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/question-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: name,
          description: { testDescription: description },
          categories,
          difficulty,
          testCases,
        }),
      }
    );
    if (response.ok) {
      // Redirect to question page
      window.location.href = "/questions";
    } else {
      alert("Failed to update question.");
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { testCode: "", isPublic: false, meta: {}, expectedOutput: "" }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index][field] = value;
    setTestCases(updatedTestCases);
  };

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
            data={difficultyOptions}
            required
          />
          <MultiSelect
            label="Categories"
            value={categories}
            onChange={(value: string[]) => setCategories(value)}
            data={fetchedCategories} 
            required
          />
          <Textarea
            label={'Description'}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            minRows={8}
            required
          />
          {/* <Input.Wrapper label="Description" required>
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
          </Input.Wrapper> */}

          <Text className={classes.testCaseHeader}>Test Cases</Text>

          <Stack>
            {testCases.map((testCase, index) => (
              <Card key={index} shadow="sm" padding="lg" radius="md">
                <Textarea
                  label={`Test Code ${index + 1}`}
                  value={testCase.testCode}
                  onChange={(event) => handleTestCaseChange(index, 'testCode', event.currentTarget.value)}
                  minRows={8}
                  required
                />
                <Textarea
                  label={`Expected Output ${index + 1}`}
                  value={testCase.expectedOutput}
                  onChange={(event) => handleTestCaseChange(index, 'expectedOutput', event.currentTarget.value)}
                  minRows={8}
                  required
                />
                <Flex justify="space-between" align="center" style={{ paddingTop: 12 }}>
                  <Switch
                    label={"Public Test Case"}
                    checked={testCase.isPublic}
                    onChange={(event) => handleTestCaseChange(index, 'isPublic', event.currentTarget.checked)}
                  />
                  <Button color="red" onClick={() => removeTestCase(index)}>Remove Test Case</Button>
                </Flex>
              </Card>
            ))}
            <Button 
              onClick={addTestCase} 
              style={{ width: 'fit-content'}}
            >  
              Add Test Case
            </Button>        
          </Stack>

          <Divider my="md" />

          <Center>
            <Button type="submit">
              Submit
            </Button>
          </Center>
        </Stack>
      </form>
    </Container>
  );
}
