import React from "react";
import { createRoot } from "react-dom/client"; // Use createRoot for React 18
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
import "./styles.css";
import { LanguageProvider } from "./i18n/LanguageProvider";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <ThemeProvider theme={theme}>
        <LanguageProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </LanguageProvider>
    </ThemeProvider>
);
