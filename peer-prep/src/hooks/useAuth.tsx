import { useLocalStorage } from "@mantine/hooks";
import { createContext, ReactElement, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user";
import useApi from "./useApi";

export interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
  register: (data: any) => void;
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
  register: () => {},
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

  const { fetchData, isLoading, error } = useApi();
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const login = async (data: { email: string; password: string }) => {
    fetchData<User>(`/user-service/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((data) => {
        // ok!
        setUser(DEFAULT_TEMP_USER);
        console.log(data, "<<<<");
        navigate("/dashboard", { replace: true });
      })
      .catch((e) => {
        console.error("ERROR:: Login failed");
      });
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    fetchData(`/user-service/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((_) => {
      // ok!
      // need to login to set cookie
      login({
        email: data.email,
        password: data.password,
      });
      return;
    });
    // const response = await fetch(`/user-service/users`);

    // if (!response.ok) {
    //   console.error("ERROR:: Registration failed");
    //   return;
    // }

    // if (response.status === 201) {
    //   console.log("INFO:: Registration successful");

    //   // login the user
    // }
  };

  // call this function to sign out logged in user
  const logout = () => {
    fetchData(`/user-service/users/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((_) => {
        // ok!
        setUser(null);
        navigate("/", { replace: true });
      })
      .catch((e) => {
        console.error("ERROR:: Logout failed");
      });
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      register,
    }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
