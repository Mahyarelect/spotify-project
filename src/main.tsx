import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { registerServiceWorker } from "@/lib/pwa/registerServiceWorker";

void registerServiceWorker().catch(() => {
  // PWA installation must never prevent the web application from starting.
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
