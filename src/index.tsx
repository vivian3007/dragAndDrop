import { createRoot } from "react-dom/client"; // Use createRoot for React 18
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
import "./styles.css";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { FavoritesProvider } from "./favorites/FavoritesProvider";
import { FollowingProvider } from "./follows/FollowingProvider";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <ThemeProvider theme={theme}>
        <LanguageProvider>
            <AuthProvider>
                <FavoritesProvider>
                    <FollowingProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </FollowingProvider>
                </FavoritesProvider>
            </AuthProvider>
        </LanguageProvider>
    </ThemeProvider>
);
