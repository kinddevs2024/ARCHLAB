import { DesignProvider } from "./components/DesignSystem";
import { MotionRoot } from "./components/MotionRoot";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./styles/polish.css";
import "./styles/material.css";
import { applyTheme, readTheme } from "./api/theme";
applyTheme(readTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DesignProvider>
      <MotionRoot>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionRoot>
    </DesignProvider>
  </React.StrictMode>,
);
