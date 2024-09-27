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
import classes from "./LoginPage.module.css";
import image from "../../assets/loginimage.svg";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function LoginOrRegisterPage() {
  const [loginMode, setLoginMode] = useState(true); // true = log in, false = register

  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  // if register mode from query params, show register form
  const query = new URLSearchParams(window.location.search);
  useEffect(() => {
    const register = query.get("register");
    console.log({ query: query.get("register") });
    if (register) {
      setLoginMode(false);
    }
  }, []);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    // validate

    // call
    login({
      email,
      password,
    });
  };

  const handleRegister = () => {};

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
        <Title order={2} className={classes.title} ta="center" mt="md" mb={36}>
          Welcome {loginMode && "back"} to PeerPrep!
        </Title>

        {!loginMode && (
          <TextInput
            label="Display name"
            placeholder="Your display name"
            size="md"
            required
            onChange={(event) => setDisplayName(event.currentTarget.value)}
            value={displayName}
          />
        )}

        <TextInput
          label="Email address"
          placeholder="hello@gmail.com"
          size="md"
          mt="md"
          required
          onChange={(event) => setEmail(event.currentTarget.value)}
          value={email}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          mt="md"
          required
          size="md"
          onChange={(event) => setPassword(event.currentTarget.value)}
          value={password}
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
