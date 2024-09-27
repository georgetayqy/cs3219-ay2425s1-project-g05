import { useState } from "react";
import { User } from "../types/user";
import { useLocalStorage } from "@mantine/hooks";

export interface ServerResponse<T> {
  success: boolean;
  status: number;
  data: T;
}

export default function useApi() {
  // const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  // const [user, setUser] = useLocalStorage<User | null>({
  //   key: "user",
  //   defaultValue: null,
  // });

  async function fetchData<T>(
    url: string,
    options?: RequestInit,
    suppressWarning?: boolean
  ) {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        ...options,
        headers: {
          ...options?.headers,
          "x-api-key": import.meta.env.VITE_API_KEY as string,
          // bearer token
          // "Authorization": `Bearer ${accessToken}`,
        },
      });

      // if the response status indicates not logged in, clear data and redirect to login
      // if (response.status === 401) {
      //   // setUser(null);
      //   // navigate("/login");
      //   return;
      // }
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data: T = await response.json();

      // setData(data);
      return data;
    } catch (error) {
      setError(error);

      // throw error again
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, fetchData };
}
