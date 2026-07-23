import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { getSettings, resolveTheme } from "./lib/settings";
import "./index.css";

// Set the theme before first paint so there's no flash of the wrong theme.
document.documentElement.setAttribute("data-theme", resolveTheme(getSettings().theme));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
