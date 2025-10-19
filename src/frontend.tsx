/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AIVTuberProvider } from "./contexts/AIVTuberContext";
import { CommentProvider } from "./contexts/CommentContext";
import { ServiceMetaProvider } from "./contexts/ServiceMetaContext";
import { StrictMode } from "react";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <ServiceMetaProvider>
        <AIVTuberProvider>
          <CommentProvider>
            <App />
          </CommentProvider>
        </AIVTuberProvider>
      </ServiceMetaProvider>
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
