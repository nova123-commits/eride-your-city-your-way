import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import "./index.css";

try {
  const redirectPath = window.sessionStorage.getItem("spa-redirect-path");

  if (redirectPath) {
    window.sessionStorage.removeItem("spa-redirect-path");
    window.history.replaceState(null, "", redirectPath);
  }
} catch (error) {
  console.warn("[eRide Router] Could not restore pending redirect:", error);
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
