import {
  Button,
  Collapse,
  Flex,
  Text,
  Title,
} from "@mantine/core";
import { AttemptQuestion, Complexity } from "../../../types/question";

import classes from "./AttemptCard.module.css";
import { IconBrandLeetcode, IconInfoCircle } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { memo, useState } from "react";
import ComplexityDisplay from "../../Questions/Complexity/Complexity";
import { UserAttempt } from "../../../types/attempts";

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
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/session/summary/${roomId}`, { state: { roomIdReceived: roomId, attemptReceived: attempt } });
  };

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
            <Text lineClamp={2}>{question.description.descriptionText} </Text>
          </Flex>

          <ComplexityDisplay complexity={question.difficulty} />
        </Flex>
        <Collapse in={isExpanded}>
          <Flex className={classes.accordionBody}>
            {/* <SimpleGrid cols={2}> */}
            <Flex>
              <Button onClick={handleCardClick} variant="light">
                View
              </Button>
            </Flex>

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
