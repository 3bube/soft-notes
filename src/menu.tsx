import React from "react";
import ReactDOM from "react-dom/client";
import { MenuWindow } from "./src/components/MenuWindow";
import "./src/components/MenuWindow.css";

ReactDOM.createRoot(document.getElementById("menu-root")!).render(
  <React.StrictMode>
    <MenuWindow />
  </React.StrictMode>
);
