import React, { useState, useEffect } from "react";
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

function ResponsiveToaster() {
  const [position, setPosition] = useState(
    window.innerWidth < 640 ? "bottom-center" : "top-right"
  );

  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth < 640 ? "bottom-center" : "top-right");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <Toaster position={position} reverseOrder={false} />;
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <BrowserRouter>

      <ThemeProvider><App /></ThemeProvider>
      <ResponsiveToaster />

    </BrowserRouter>

  </React.StrictMode>

);