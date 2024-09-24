import { useLocalStorage } from "@mantine/hooks";
import { createContext, ReactElement, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  name: string;
  email: string;
};

export interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
}

const DEFAULT_TEMP_USER: User = {
  name: "John Doe",
  email: "johndoe@gmail.com",
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
  const login = async (data: any) => {
    // TODO: uncomment the below line
    // setUser(data);

    console.log("INFO:: Logging in...");

    setUser(DEFAULT_TEMP_USER);
    navigate("/dashboard", { replace: true });
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
