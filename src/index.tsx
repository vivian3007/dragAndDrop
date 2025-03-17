import React from "react";
import { createRoot } from "react-dom/client"; // Use createRoot for React 18
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
