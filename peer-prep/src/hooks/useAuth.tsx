import { useLocalStorage } from "@mantine/hooks";
import { createContext, ReactElement, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user";

export interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
}

const DEFAULT_TEMP_USER: User = {
  email: "johndoe@gmail.com",
  displayName: "John Doe",
  isAdmin: false,
  // password: "password",
};

const DEFAULT: AuthContextType = {
  user: DEFAULT_TEMP_USER, // TODO: switch this out later
  login: () => {
    console.log("log");
  },
  logout: () => {},
};
const AuthContext = createContext<AuthContextType>(DEFAULT);

export const AuthProvider = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}) => {
  const [user, setUser] = useLocalStorage<User | null>({
    key: "user",
    defaultValue: null,
  });
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const login = async (data: { email: string; password: string }) => {
    // TODO: uncomment the below line

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/user-service/users/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error("ERROR:: Login failed");
      return;
    }

    if (response.status === 200) {
      setUser(DEFAULT_TEMP_USER);
      navigate("/dashboard", { replace: true });
      return;
    }

    // setUser(data);

    // console.log("INFO:: Logging in...");

    // setUser(DEFAULT_TEMP_USER);
    // navigate("/dashboard", { replace: true });
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/user-service/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error("ERROR:: Registration failed");
      return;
    }

    if (response.status === 201) {
      console.log("INFO:: Registration successful");

      // login the user
      login({
        email: data.email,
        password: data.password,
      });
      return;
    }
  };

  // call this function to sign out logged in user
  const logout = () => {
    setUser(null);
    navigate("/", { replace: true });
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
