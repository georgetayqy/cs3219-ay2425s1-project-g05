import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { TextInput, Select, Textarea, Button, Container } from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState("");

  useEffect(() => {
    if (typeof id === "string") {
      fetchQuestionDetails(id);
    }
  }, [id]);

  const fetchQuestionDetails = async (questionId: string) => {
    try {
      // TODO: fetch question details from the database
      // const response = await fetch(
      //   `${import.meta.env.VITE_API_URL}/question-service/${questionId}`
      // );
      // const question = await response.json();
      // setName(question.name);
      // setDifficulty(question.difficulty);
      // setCategories(question.categories);
      // setDescription(question.description);
      // setTestCases(question.testCases);
    } catch (error) {
      console.error("Error fetching question details:", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Updating question with id:", id);
    // TODO: add logic to update the question in the database
    // const response = await fetch(
    //   `${import.meta.env.VITE_API_URL}/question-service/${id}`,
    //   {
    //     method: "PUT",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       name,
    //       difficulty,
    //       categories,
    //       description,
    //       testCases,
    //     }),
    //   }
    // );
    // if (response.ok) {
    //   alert("Question updated successfully!");
    // } else {
    //   alert("Failed to update question.");
    // }
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
          value="dummy name"
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <Select
          label="Difficulty"
          value="Easy"
          onChange={(value: string | null) => setDifficulty(value)}
          data={["Easy", "Medium", "Hard"]}
          required
        />
        <Select
          label="Categories"
          value="Category 1"
          onChange={(value: string[]) => setCategories(value)}
          data={["Category 1", "Category 2", "Category 3"]}
          multiple
          required
        />
        <ReactQuill
          theme="snow"
          value="DUMMY DESCRIPTION for now, to update with actual question description"
          onChange={setDescription}
          style={{ height: "200px", marginTop: "12px" }}
        />
        <Textarea
          label="Test Cases"
          value={testCases}
          onChange={(event) => setTestCases(event.currentTarget.value)}
          style={{ marginTop: '48px' }}
        />
        <Button type="submit" style={{ marginTop: '12px' }}>Update Question</Button>
        <Button type="button" style={{ marginTop: '12px', marginLeft: "8px", backgroundColor: "red"}} onClick={handleDelete}>Delete Question</Button>
      </form>
    </Container>
  );
}