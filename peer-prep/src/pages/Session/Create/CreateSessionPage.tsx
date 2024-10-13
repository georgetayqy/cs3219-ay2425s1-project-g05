import {
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Flex,
  Group,
  Image,
  MultiSelect,
  SimpleGrid,
  Stack,
  Stepper,
  Title,
  Container,
  Text,
  List,
  rem,
  ThemeIcon,
} from "@mantine/core";
import classes from "./CreateSessionPage.module.css";
import { useEffect, useState } from "react";
import { capitalizeFirstLetter } from "../../../utils/utils";
import { Link, useLoaderData } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { CategoryResponseData } from "../../../types/question";
import { socket } from "../../../websockets/socket";
import { useAuth } from "../../../hooks/useAuth";
import { displayName } from "react-quill";
import SearchingPage from "../Search/SearchingPage";
import {
  IconCancel,
  IconCircleCheck,
  IconCircleDashed,
  IconCross,
} from "@tabler/icons-react";

import NoMatchImage from "../../../assets/nomatchimage.svg";
import SearchingImage from "../../../assets/searchimage.svg";

import AlertBox from "../../../components/Alert/AlertBox";

// Arrays
// Algorithms
// Databases
// Data Structures
// Brainteaser
// Strings
// Bit Manipulation
// Recursion

enum Status {
  IDLE,
  SEARCHING,
  MATCH_FOUND,
  NO_MATCH,
}

export default function CreateSessionPage() {
  // TODO: query the question service to get a list of categories and difficulties
  const { fetchData } = useApi();
  useEffect(() => {
    fetchData<ServerResponse<CategoryResponseData>>(
      `/question-service/categories`,
      SERVICE.QUESTION
    ).then((data) => {
      const categories = data.data.categories;
      const transformedCategories = categories.map((category: string) => ({
        value: category.toUpperCase(),
        label:
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
      }));

      setCategories(transformedCategories.map((v) => v.value));
    });
  }, []);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [difficulties, setDifficulties] = useState<string[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );

  const { user } = useAuth();

  const canSearch =
    selectedCategories.length > 0 && selectedDifficulties.length > 0;

  // const data = useLoaderData() as ServerResponse<[string[]]>;

  // useEffect(() => {
  //   console.log("data from preload:", data);
  //   if (data.data) {
  //     setCategories(data.data[0]);
  //   }
  // }, [data]);

  // initialize socket
  useEffect(() => {
    socket.connect();

    function onConnect() {
      console.log("connected to server");
    }

    function onWaitingForMatch() {
      console.log("waiting for a match");

      setStatus(Status.SEARCHING);
      setActive(1);
    }

    function onFoundMatch() {
      console.log("found a match");

      setStatus(Status.MATCH_FOUND);
      setActive(2);
    }

    function onNoMatch() {
      console.log("no match found");

      setStatus(Status.NO_MATCH);
      setActive(2);
    }

    socket.on("connect", onConnect);
    socket.on("finding-match", onWaitingForMatch);
    socket.on("found-match", onFoundMatch);
    socket.on("no-match", onNoMatch);

    return () => {
      // clear up socket

      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("finding-match", onWaitingForMatch);
      socket.off("found-match", onFoundMatch);
      socket.off("no-match", onNoMatch);
      console.log("we are disconnected");
    };
  }, []);

  const [status, setStatus] = useState(Status.IDLE);

  const [active, setActive] = useState(0);

  function search() {
    if (!canSearch) {
      return;
    }

    const query = {
      categories: selectedCategories.map((c) => c.toUpperCase()),
      difficulties: selectedDifficulties.map((d) => d.toUpperCase()),
      email: user.email,
      displayName: user.displayName,
    };

    // fire a socket event
    socket.emit("create-match", query);
    console.log("searching for a match");
  }

  function goToStart() {
    setActive(0);
    setStatus(Status.IDLE);
    // setSelectedCategories([]);
    // setSelectedDifficulties([]);
  }

  const CREATE_COMPONENT = (
    <>
      {/* <Title> Create a session </Title> */}
      {/* <MultiSelect
          label="Your favorite libraries"
          placeholder="Pick value"
          data={["React", "Angular", "Vue", "Svelte"]}
        /> */}

      <SimpleGrid cols={2}>
        <Stack className={classes.criteria}>
          <Title order={4}> Categories </Title>
          <Checkbox.Group
            defaultValue={[]}
            label="Pick one or more categories to search for"
            description=""
            withAsterisk
            value={selectedCategories}
            onChange={(value) => setSelectedCategories(value)}
          >
            <Stack mt="xs">
              {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
              {categories.map((category, index) => (
                <Checkbox value={category} label={category} key={index} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Divider />
          <Checkbox
            checked={selectedCategories.length === categories.length}
            indeterminate={
              selectedCategories.length !== categories.length &&
              selectedCategories.length > 0
            }
            label={
              selectedCategories.length > 0
                ? `${selectedCategories.length} selected`
                : "Select all"
            }
            onChange={() => {
              // if indeterminate, select all
              // if all selected, deselect all
              // if none selected, select all
              if (selectedCategories.length === categories.length) {
                setSelectedCategories([]);
              } else {
                setSelectedCategories(categories);
              }
            }}
          />
        </Stack>
        <Stack className={classes.criteria}>
          <Title order={4}> Difficulties </Title>
          <Checkbox.Group
            defaultValue={[]}
            label="Pick one or more difficulties to search for"
            description=""
            withAsterisk
            value={selectedDifficulties}
            onChange={(value) => setSelectedDifficulties(value)}
          >
            <Stack mt="xs">
              {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
              {difficulties.map((difficulty, index) => (
                <Checkbox
                  value={difficulty}
                  label={capitalizeFirstLetter(difficulty)}
                  key={index}
                />
              ))}
            </Stack>
          </Checkbox.Group>
          <Divider />
          <Checkbox
            checked={selectedDifficulties.length === difficulties.length}
            indeterminate={
              selectedDifficulties.length !== difficulties.length &&
              selectedDifficulties.length > 0
            }
            label={
              selectedDifficulties.length > 0
                ? `${selectedDifficulties.length} selected`
                : "Select all"
            }
            onChange={() => {
              // if indeterminate, select all
              // if all selected, deselect all
              // if none selected, select all
              if (selectedDifficulties.length === difficulties.length) {
                setSelectedDifficulties([]);
              } else {
                setSelectedDifficulties(difficulties);
              }
            }}
          />
        </Stack>
      </SimpleGrid>
      <Center>
        <Button
          // component={Link}
          // to="/session/search"
          disabled={!canSearch}
          style={{ pointerEvents: !canSearch ? "none" : "unset" }}
          onClick={() => search()}
        >
          Begin search
        </Button>
      </Center>
    </>
  );

  const SEARCH_COMPONENT = (
    <>
      <Stack gap={"2rem"}>
        <Center>
          <Image className={classes.image} src={SearchingImage} />
        </Center>
        <Title style={{ textAlign: "center" }}>
          {" "}
          <span className={classes.hourglass}> ⏳ </span> Loading...{" "}
        </Title>
        <Text style={{ textAlign: "center" }}>
          {" "}
          You will be matched with a partner soon!{" "}
        </Text>

        <SimpleGrid cols={2} className={classes.criteria}>
          <Stack>
            <Text fw={600} size="lg">
              {" "}
              Categories
            </Text>
            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon size={24} radius="xl">
                  <IconCircleCheck
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </ThemeIcon>
              }
            >
              {selectedCategories.map((categories, index) => (
                <List.Item key={index}>{categories}</List.Item>
              ))}
            </List>
          </Stack>
          <Stack>
            <Text fw={600} size="lg">
              {" "}
              Difficulties
            </Text>
            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon size={24} radius="xl">
                  <IconCircleCheck
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </ThemeIcon>
              }
            >
              {selectedDifficulties.map((difficulties, index) => (
                <List.Item key={index}>
                  {capitalizeFirstLetter(difficulties)}
                </List.Item>
              ))}
            </List>
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );

  const FAIL_COMPONENT = (
    <Stack gap={"2em"}>
      <Center>
        <Image className={classes.image} src={NoMatchImage} />
      </Center>
      <AlertBox type="error">
        <Stack justify="center">
          <Text fw={700} size="xl" style={{ textAlign: "center" }}>
            {" "}
            Couldn't find a match!{" "}
          </Text>
          <Text style={{ textAlign: "center" }}>
            Try changing your criteria?
          </Text>
          <Center>
            <Button
              onClick={() => {
                goToStart();
              }}
            >
              {" "}
              Try again{" "}
            </Button>
          </Center>
        </Stack>
      </AlertBox>
    </Stack>
  );

  const SUCCESS_COMPONENT = (
    <>
      <Stack gap={"2em"}>
        <Center>
          <Image className={classes.image} src={NoMatchImage} />
        </Center>
        <AlertBox type="error">
          <Stack justify="center">
            <Text fw={700} size="xl" style={{ textAlign: "center" }}>
              {" "}
              Couldn't find a match!{" "}
            </Text>
            <Text style={{ textAlign: "center" }}>
              Try changing your criteria?
            </Text>
            <Center>
              <Button
                onClick={() => {
                  goToStart();
                }}
              >
                {" "}
                Try again{" "}
              </Button>
            </Center>
          </Stack>
        </AlertBox>
      </Stack>
    </>
  );
  return (
    <Container>
      <Flex className={classes.wrapper}>
        <Box
          style={{
            width: "100%",
          }}
        >
          <Stepper active={active} onStepClick={setActive}>
            <Stepper.Step
              label="Create"
              description={active === 0 && "Specify criteria"}
              allowStepSelect={false}
            >
              <Box className={classes.stepWrapper}>{CREATE_COMPONENT}</Box>
            </Stepper.Step>
            <Stepper.Step
              label="Search"
              description={active === 1 && "Seaching for a match..."}
              allowStepSelect={false}
              loading={status === Status.SEARCHING}
            >
              <Box className={classes.stepWrapper}>{SEARCH_COMPONENT}</Box>
            </Stepper.Step>
            {status === Status.NO_MATCH ? (
              <Stepper.Step
                label="Matching failed!"
                description={"No match found"}
                allowStepSelect={false}
                icon={<IconCancel />}
                color="red"
              >
                <Box className={classes.stepWrapper}>{FAIL_COMPONENT}</Box>
              </Stepper.Step>
            ) : (
              <Stepper.Step
                label="Matched!"
                description={
                  active === 2 && Status.MATCH_FOUND && "Match found!"
                }
                allowStepSelect={false}
              >
                Step 3 content: Get full access
              </Stepper.Step>
            )}
          </Stepper>
        </Box>
      </Flex>
    </Container>
  );
}
