import {
  Button,
  Code,
  Flex,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import classes from "./SessionSummaryPage.module.css";
import { useState } from "react";

export default function SessionSummaryPage() {
  const [notes, setNotes] = useState("");

  return (
    <Flex className={classes.wrapper}>
      <Stack align="flex-start">
        <Title>Congratulations 🎉</Title>
        <Text>You finished the problem in 26 seconds.</Text>
        <Flex gap="md">
          <Paper radius="md" withBorder className={classes.rtm}>
            <Text size="sm">Runtime</Text>
            <Text size="lg">100 ms</Text>
          </Paper>
          <Paper radius="md" withBorder className={classes.rtm}>
            <Text size="sm">Memory</Text>
            <Text size="lg">54.2 MB</Text>
          </Paper>
        </Flex>
      </Stack>

      <Flex gap={20}>
        <Paper radius="md" withBorder style={{ flex: 5 }} className={classes.paper}>
          <Title order={4}>Reverse a String</Title>
          <ScrollArea type="hover" h={400} mt={10}>
            <Text>
              Write a function that reverses a string. The input string is given as an array of characters `s`. You must do this by modifying the input array in-place with O(1) extra memory.
            </Text>
            <Text mt="sm">Example 1:</Text>
            <Text>Input: s = ["h","e","l","l","o"]</Text>
            <Text>Output: ["o","l","l","e","h"]</Text>
            <Text mt="sm">Example 2:</Text>
            <Text>Input: s = ["H","a","n","n","a","h"]</Text>
            <Text>Output: ["h","a","n","n","a","H"]</Text>
            <Text mt="sm">Constraints:</Text>
            <Text>1 ≤ s.length ≤ 10⁵</Text>
            <Text>s[i] is a printable ASCII character.</Text>
          </ScrollArea>
        </Paper>

        <Paper radius="md" withBorder style={{ flex: 3 }} className={classes.paper}>
          <Title order={4}>Notes</Title>
          <Textarea mt={10}
            autosize
            minRows={15}
            maxRows={15}
            placeholder="Write your notes here"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
          />
          <Button onClick={() => alert("Notes saved!")} mt={20}>Save</Button>
        </Paper>
      </Flex>

      <SimpleGrid cols={2} style={{ width:"100%"}}>
        {/* Recommended Solution */}
        <Paper radius="md" withBorder className={classes.codeBlock}>
          <Title order={4}>Recommended Solution</Title>
          <Code>
            <pre>
{`class Solution(object):
  def reverseString(self, s):
    i, j = 0, len(s) - 1
    while i < j:
      s[i], s[j] = s[j], s[i]
      i, j = i + 1, j - 1`}
            </pre>
          </Code>
        </Paper>

        {/* User's Solution */}
        <Paper radius="md" withBorder className={classes.codeBlock}>
          <Title order={4}>Your Solution</Title>
          <Code>
            <pre>
{`class Solution(object):
  def reverseString(self, s):
    i, j = 0, len(s) - 1
    while i < j:
      s[i], s[j] = s[j], s[i]
      i, j = i + 1, j - 1`}
            </pre>
          </Code>
        </Paper>
      </SimpleGrid>
    </Flex>
  );
}
