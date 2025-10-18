/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { AIVTuberProvider, App, ServiceMetaProvider } from "automated-gameplay-transmitter";
import { createRoot } from "react-dom/client";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <ServiceMetaProvider>
      <AIVTuberProvider>
        <App>
          {/* TODO */}
        </App>
      </AIVTuberProvider>
    </ServiceMetaProvider>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
