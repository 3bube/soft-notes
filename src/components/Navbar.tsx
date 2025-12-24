import React from "react";
import "./Navbar.css";

import { getCurrentWindow } from "@tauri-apps/api/window";

function Navbar() {
  const appWindow = getCurrentWindow();

  return (
    <nav>
      <div>
        <div data-tauri-drag-region>DRAG</div>
        <div></div>
      </div>
    </nav>
  );
}

export default Navbar;
