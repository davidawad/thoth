import React from "react";
import { createRoot } from "react-dom/client";
import MyApp from "./MyApp";
import "../styles/globals.css";
import "../src/App.css";
import "../src/components/Reader/Reader.css";
import "../src/components/FileParser/FileParser.css";

it("renders without crashing", () => {
  const div = document.createElement("div");
  const root = createRoot(div);
  root.render(<MyApp />);
  root.unmount();
});
