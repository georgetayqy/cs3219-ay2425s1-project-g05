import {
  Avatar,
  Badge,
  Button,
  Collapse,
  Flex,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AttemptQuestion, Complexity } from "../../../types/question";

import classes from "./AttemptCard.module.css";
import { IconBrandLeetcode, IconInfoCircle } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { memo, useEffect, useState } from "react";
import ComplexityDisplay from "../../Questions/Complexity/Complexity";
import { UserAttempt } from "../../../types/attempts";
import useApi, { SERVICE, ServerResponse } from "../../../hooks/useApi";
import { UserResponseData } from "../../../types/user";
import { notifications } from "@mantine/notifications";

interface AttemptCardProps {
  attempt: UserAttempt;
  question: AttemptQuestion;
  difficulty: Complexity;
  roomId: string;
  isClickable?: boolean; // New prop to control click behavior
}

const AttemptCard = memo(function AttemptCard({
  attempt,
  question,
  difficulty,
  roomId,
  isClickable = false, // Default to false
}: AttemptCardProps) {
  const { fetchData } = useApi();

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/session/summary/${roomId}`, { state: { roomIdReceived: roomId, attemptReceived: attempt } });
  };

  const [completedAt, setCompletedAt] = useState("");
  const [otherUserDisplayName, setOtherUserDisplayName] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");

  useEffect(() => {
    setCompletedAt(formatDateTime(attempt.createdAt));
    getOtherUser();
  }, []);

  const getOtherUser = async () => { 
    try {
      fetchData<ServerResponse<UserResponseData>>(
        `/user-service/users/${attempt.otherUserId}`,
        SERVICE.USER
      ).then((response) => {
        setOtherUserDisplayName(response.data.user.displayName);
        setOtherUserEmail(response.data.user.email);
      });
    } catch (error: any) {
      console.error("Error getting details of other user:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString();
  }

  // convert difficulity to lowercase
  const difficultyString = difficulty.toLowerCase();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Flex
        className={`${classes.accordion} ${classes[difficultyString]} ${
          classes[isExpanded ? "expanded" : "collapsed"]
        }`}
      >
        <Flex
          className={classes.accordionTop}
          onClick={() => setIsExpanded((p) => !p)}
        >
          <Flex className={classes.accordionTopHeader}>
            <Title order={4}>{question.title}</Title>
            <Text size="sm" color="dimmed">
              Completed on {completedAt}
            </Text>
            {/* <Text lineClamp={2}>{question.description.descriptionText} </Text> */}
          </Flex>

          <ComplexityDisplay complexity={question.difficulty} />
        </Flex>
        <Collapse in={isExpanded}>
          <Flex className={classes.accordionBody}>
            <Flex justify={"space-between"}>
              <Flex className={classes.collaboratorDetails} align="center" gap="sm" mt="md">
                <Avatar radius="xl" size="md" color="blue">
                  {otherUserDisplayName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text size="sm">{otherUserDisplayName}</Text>
                  <Text size="xs" color="dimmed">{otherUserEmail}</Text>
                </div>
              </Flex>

              {/* <SimpleGrid cols={2}> */}
              <Flex>
                <Button onClick={handleCardClick} variant="light">
                  View
                </Button>
              </Flex>

            </Flex>
            {/* Collaborator Details */}

            <Text className={classes.accordionBodyDescription} lineClamp={64}>
              {question.description.descriptionText}
            </Text>
            {/* </SimpleGrid> */}
          </Flex>
        </Collapse>
      </Flex>
    </>
  );
});

export default AttemptCard;
