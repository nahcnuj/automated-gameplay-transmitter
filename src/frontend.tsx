/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CommentProvider } from "./contexts/CommentContext";
import { SpeechProvider } from "./contexts/SpeechContext";
import { ServiceMetaProvider } from "./contexts/ServiceMetaContext";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <ServiceMetaProvider>
      <SpeechProvider>
        <CommentProvider>
          <App />
        </CommentProvider>
      </SpeechProvider>
    </ServiceMetaProvider>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
