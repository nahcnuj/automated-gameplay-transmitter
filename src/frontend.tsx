/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <App>
        <span className="text-xs font-normal opacity-10">Version: {new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
      </App>
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
