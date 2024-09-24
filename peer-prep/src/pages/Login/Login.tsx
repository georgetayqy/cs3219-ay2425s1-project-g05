import {
  Paper,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Title,
  Text,
  Anchor,
  Box,
  Flex,
  Center,
  Stack,
  Image,
} from "@mantine/core";
import classes from "./Login.module.css";
import image from "../../assets/loginimage.svg";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function LoginOrRegister() {
  const [loginMode, setLoginMode] = useState(true); // true = log in, false = register

  const { login } = useAuth();
  return (
    // <div className={classes.wrapper}>
    <Flex>
      <Flex
        flex={1}
        className={classes["left-image-container"]}
        justify={"center"}
        align={"center"}
      >
        <Image
          fit="contain"
          src={image}
          className={classes["left-image"]}
        ></Image>
      </Flex>
      <Flex className={classes.form}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          Welcome {loginMode && "back"} to PeerPrep!
        </Title>

        <TextInput
          label="Email address"
          placeholder="hello@gmail.com"
          size="md"
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          mt="md"
          size="md"
        />
        <Checkbox label="Keep me logged in" mt="xl" size="md" />
        {loginMode ? (
          <Button fullWidth mt="xl" size="md" onClick={() => login({})}>
            Login
          </Button>
        ) : (
          <Button fullWidth mt="xl" size="md">
            Register
          </Button>
        )}

        {loginMode ? (
          <Text ta="center" mt="md">
            Don&apos;t have an account?{" "}
            <Anchor<"a">
              href="#"
              fw={700}
              onClick={(event) => {
                event.preventDefault();
                setLoginMode(false);
              }}
            >
              Register
            </Anchor>
          </Text>
        ) : (
          <Text ta="center" mt="md">
            Already have an account?{" "}
            <Anchor<"a">
              href="#"
              fw={700}
              onClick={(event) => {
                event.preventDefault();
                setLoginMode(true);
              }}
            >
              Login instead
            </Anchor>
          </Text>
        )}
      </Flex>
    </Flex>
    // </div>
  );
}
