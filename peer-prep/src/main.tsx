import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/Home/HomePage.tsx";
import LoginOrRegisterPage from "./pages/Login/LoginPage.tsx";
import { Button, createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import ApplicationWrapper from "./components/ApplicationWrapper.tsx";
import ProtectedRouteWrapper from "./pages/ProtectedRouteWrapper.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.tsx";
import SearchingPage from "./pages/Session/Search/SearchingPage.tsx";
import CreateSessionPage from "./pages/Session/Create/CreateSessionPage.tsx";
import QuestionPage from "./pages/Questions/QuestionPage.tsx";
import CreateQuestionPage from "./pages/Questions/CreateQuestionPage/CreateQuestionPage.tsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <ApplicationWrapper />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <LoginOrRegisterPage />,
      },
      {
        path: "/questions",
        children: [
          {
            path: "/questions",
            element: <QuestionPage />,
            loader: async () =>
              fetch(`${import.meta.env.VITE_API_URL}/question-service`),
              // fetch(
              //   `https://virtserver.swaggerhub.com/PeerPrep/question-service/1.0.0/api/question-service`
              // ),
          },
          {
            path: "/questions/create",
            element: <CreateQuestionPage />,
          },
        ],
      },

      // Protected routes below
      {
        path: "/",
        element: <ProtectedRouteWrapper />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/learn",
            element: <Button>learn!</Button>,
          },

          {
            path: "/session",
            children: [
              {
                path: "/session/create",
                element: <CreateSessionPage />,
              },
              {
                path: "/session/search",
                element: <SearchingPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
  defaultRadius: "md",
  cursorType: "pointer",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <RouterProvider router={router}></RouterProvider>
    </MantineProvider>
    {/* <BrowserRouter>
      <App />
    </BrowserRouter> */}
  </StrictMode>
);
