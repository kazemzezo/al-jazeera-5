import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// تسجيل Service Worker (PWA)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/al-jazeera-5/sw.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}
