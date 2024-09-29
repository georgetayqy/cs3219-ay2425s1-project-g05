import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { TextInput, Select, Textarea, Text, Button, Container, MultiSelect, Input, Stack, Flex, Switch, Card, Center, Divider } from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import classes from "./EditQuestionPage.module.css";
import { TestCase } from "../../../types/question";
import useApi from "../../../hooks/useApi";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
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
    if (typeof id === "string") {
      fetchQuestionDetails(id);
      fetchCategories();
    }
  }, [id]);

  const { fetchData, isLoading, error } = useApi();

  const fetchQuestionDetails = async (questionId: string) => {
    try {
      // TODO: replace fetch with a fetchdata function
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/question-service/id/${questionId}`
      );
      const question = await response.json();
      const questionData = question.data;
      console.log("Question details:", questionData);
      setName(questionData.title);
      setDifficulty(questionData.difficulty);
      setCategories(questionData.categories);
      setDescription(questionData.description.testDescription);
      setTestCases(questionData.testCases);
    } catch (error) {
      console.error("Error fetching question details:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categories = await fetchData<[]>("/question-service/categories");
      // const response = await fetch(
      //   `${import.meta.env.VITE_API_URL}/question-service/categories`
      // );
      // const categories = await response.json();

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

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/question-service/id/${id}`,
      {
        method: "PUT",
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
  
    // const response = await fetchData(`/question-service/id/${id}`, {
    //   method: "PUT",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     title: name,
    //     description: { testDescription: description },
    //     categories,
    //     difficulty,
    //     testCases,
    //   }),
    // });

    if (response.ok) {
      alert("Question updated successfully!");
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

  const handleDelete = async () => {
    // TODO: add logic to delete the question from the database
    console.log("Deleting question with id:", id);
  }

  return (
    <Container mt={48}>
      <h1>Edit Question</h1>
      <form onSubmit={handleSubmit}>
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
          multiple
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
            onChange={newDescription => setDescription(newDescription)}
            style={{ height: "576px", marginTop: "12px" }}
            modules={ modules }
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
            style={{ width: 'fit-content', marginTop: '8px'}}
          >  
            Add Test Case
          </Button>        
        </Stack>

        <Divider my="md" />
        
        <Center>
          <Button type="submit" style={{ marginTop: '12px' }}>Update Question</Button>
          <Button type="button" style={{ marginTop: '12px', marginLeft: "8px", backgroundColor: "red"}} onClick={handleDelete}>Delete Question</Button>
        </Center>
      </form>
    </Container>
  );
}