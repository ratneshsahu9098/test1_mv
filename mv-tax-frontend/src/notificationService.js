import axios from "axios";
import API_URL from "./config";
import { requestNotificationPermission, onForegroundMessage } from "./firebase";

export function setupNotifications() {
  if (!("Notification" in window)) {
    return;
  }

  const fcmToken = localStorage.getItem("fcm_token");
  if (!fcmToken) {
    requestNotificationPermission().then((token) => {
      if (token) {
        saveTokenToServer(token);
      }
    });
  }

  onForegroundMessage((payload) => {
    const title = payload.notification?.title || "MV Tax Alert";
    const body = payload.notification?.body || "";
    showBrowserNotification(title, body);
  });
}

export function showBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/vite.svg" });
  }
}

async function saveTokenToServer(token) {
  try {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    await axios.post(
      API_URL + "/api/save_fcm_token",
      { fcm_token: token },
      { headers: { Authorization: `Bearer ${storedToken}` } }
    );
  } catch (err) {
    console.error("Failed to save FCM token:", err);
  }
}
