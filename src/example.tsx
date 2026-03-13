import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LayoutExample } from "./components/LayoutExample";
import "./index.css";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <LayoutExample />
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
