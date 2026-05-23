import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter
} from "react-router-dom";
import axios from "axios";

import { ThemeProvider } from "./ThemeContext";
import App from "./App";
import "./index.css";
import { setupNotifications } from "./notificationService";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.msg || error.response?.data?.error || "";
    if (msg === "Token has expired" || msg === "Signature verification failed") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

setupNotifications();

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <BrowserRouter>

      <ThemeProvider><App /></ThemeProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

    </BrowserRouter>

  </React.StrictMode>

);