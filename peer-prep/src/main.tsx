import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/Home/Home.tsx";
import LoginOrRegister from "./pages/Login/Login.tsx";
import { Button, createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import ApplicationWrapper from "./components/ApplicationWrapper.tsx";
import ProtectedRouteWrapper from "./pages/ProtectedRouteWrapper.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import Dashboard from "./pages/Dashboard/Dashboard.tsx";
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
        element: <LoginOrRegister />,
      },

      // Protected routes below
      {
        path: "/",
        element: <ProtectedRouteWrapper />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/learn",
            element: <Button>learn!</Button>,
          },
        ],
      },
    ],
  },
]);

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
  defaultRadius: "md",
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
