import {
  Accordion,
  Avatar,
  Badge,
  Button,
  Container,
  Flex,
  Group,
  Paper,
  Rating,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import classes from "./SessionPage.module.css";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CodeEditor from "../../../components/CollabCodeEditor/CollabCodeEditor"
import AvatarWithDetailsButton from "../../../components/AvatarIcon/AvatarWithDetailsButton";
import { IconChevronRight } from "@tabler/icons-react";
import { User } from "../../../types/user";

const dummyHtmlTitle = "Reverse String";
const dummyHtmlDescription =
  "<p>Write a function that reverses a string. The input string is given as an array of characters s.</p> <p>Example 1:</p> <pre>Input: s = ['h','e','l','l','o'] Output: ['o','l','l','e','h']</pre> <p>Example 2:</p> <pre>Input: s = ['H','a','n','n','a','h'] Output: ['h','a','n','n','a','H']</pre>";

export default function SessionPage() {
  const { fetchData } = useApi();

  const location = useLocation();
  const { question, roomId, matchData } = location.state || {}; 

  const [questionTitle, setQuestionTitle] = useState(dummyHtmlTitle);
  const [questionDescription, setQuestionDescription] = useState(dummyHtmlDescription);

  const [room, setRoom] = useState(roomId);
  const [questionn, setQuestionn] = useState(question);
  const [user, setUser] = useState(localStorage.getItem('user'))
  const [templateCode, setTemplateCode] = useState('')
  
  // dummy values first 
  const [questionCategories, setQuestionCategories] = useState<String[]>(["Algorithms", "Arrays"])
  const [questionDifficulty, setQuestionDifficulty] = useState('DIFFICULT')
  const [otherUserName, setOtherUserName] = useState('pei1232')
  const [otherUserEmail, setOtherUserEmail] = useState('pei1232@gmail.com')
  const [leetCodeLink, setLeetCodeLink] = useState(String)

  useEffect(()=> {
    console.log("Room ID: ", room);
    console.log("Question: ", questionn);
    console.log("User: ", user, typeof user)

    if (questionn != "") {  
      setQuestionTitle(questionn.title)
      console.log(11111, questionTitle)

      const qd = question.description.descriptionHtml
      console.log('from question sent over:', qd , typeof qd) 
      console.log(22222, questionDescription, typeof questionDescription)
      setQuestionDescription(qd)

      setQuestionCategories(questionn.categories)
      setQuestionDifficulty(questionn.difficulity)
      setTemplateCode(questionn.templateCode)
      setLeetCodeLink(questionn.link)
    }
  }, [room, questionn]);

  const renderComplexity = () => {
    const difficultyRating = questionDifficulty === "EASY" ? 1 : questionDifficulty === "MEDIUM" ? 2 : 3;
    return <Rating mt="xs" defaultValue={difficultyRating} count={3} readOnly />;
  };

  return (
    <Container size="lg" className={classes.wrapper}>
      {/* Collaborator Details */}
      <Group mb="md" style={{ alignItems: "center" }}>
        <Group>
          <Avatar radius="xl" size="md" color="blue">
            {otherUserName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text size="sm">{otherUserName}</Text>
            <Text size="xs" color="dimmed">{otherUserEmail}</Text>
          </div>
          <Badge color="teal" size="sm" variant="filled" ml="xs">
            Collaborator
          </Badge>
        </Group>
        <IconChevronRight size="1rem" color="dimmed" />
      </Group>
      
      <Flex gap="md" className={classes.mainContent}>
        <Paper
          radius="md"
          withBorder
          style={{ flex: 1, minHeight: '100%' }}
          className={classes.paper}
        >
          <Title order={3} style={{ fontSize: '1.5rem', marginRight: '1rem' }}>{questionTitle}</Title>
          <Group>
            {questionCategories.map((category) => (
              <Badge color="blue" size="sm" variant="filled">
                {category}
              </Badge>
            ))}
          </Group>
          {renderComplexity()}

          <ScrollArea type="hover" h={700} mt={10}>
            <TypographyStylesProvider>
              <div
                dangerouslySetInnerHTML={{ __html: questionDescription }}
              ></div>
            </TypographyStylesProvider>
          </ScrollArea>
          <Button
            variant="light"
            color="blue"
            component="a"
            href={leetCodeLink}
            target="_blank"
            mt="sm"
            size="xs"
          >
            View on LeetCode
          </Button>
        </Paper>    

        <Stack style={{ flex: 1, gap: '1 rem' }}>
          <Paper 
            radius="md"
            withBorder
            style={{ flex: 1, minHeight: '100%' }}>
            <CodeEditor
              endpoint={'ws://localhost:8004'}
              room={room}
              user={user}
              theme="dark"
              height={'500px'}
            />
          </Paper>
          <Stack>
            <Paper style={{ height: '200px', backgroundColor: '#f0f0f0' }} className={classes.paper}>
              {/* Placeholder for Test Cases */}
              <Title order={4}>Test Cases</Title>
              <Text size="lg" color="dimmed">Test Cases Placeholder</Text>
            </Paper>
          </Stack>
        </Stack>
      </Flex>
    </Container>
  );
}
