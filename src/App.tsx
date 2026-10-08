import "./styles.css";
import MyPatterns from "./MyPatterns";
import Account from "./Account";
import Favorites from "./Favorites";
import Following from "./Following";
import TopNavBar from "./TopNavBar.tsx";
import {lazy, Suspense} from "react";
import Homepage from "./Homepage.tsx";
import {Route, Routes} from "react-router-dom";
import {Box} from "@mui/material";
import Login from "./Login.tsx";
import Profile from "./Profile.tsx";
import { ToastContainer } from 'react-toastify';
import { RequireAuth } from './auth/AuthProvider';
import ChooseUsernameDialog from './users/ChooseUsernameDialog';
import 'react-toastify/dist/ReactToastify.css';

// Pagina's met three.js (editor, patroon met 3D-preview) pas laden als je ze opent: three.js
// en react-three-fiber zijn samen het grootste deel van de bundel.
const Editor = lazy(() => import("./Editor"));
const Pattern = lazy(() => import("./Pattern"));

// Even leeg (geen laadicoontje) zolang de code van een lazy pagina binnenkomt.
const RouteFallback = () => <Box sx={{ minHeight: "92vh" }} aria-busy="true" />;

export default function App() {
    return (
        <div className="App">
            <TopNavBar />
            <Box>
                <Routes>
                    <Route path={"/"} element={<Login />} />
                    <Route path="/home" element={<RequireAuth><Homepage /></RequireAuth>} />
                    <Route path="/myPatterns" element={<RequireAuth><MyPatterns /></RequireAuth>} />
                    <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
                    <Route path="/following" element={<RequireAuth><Following /></RequireAuth>} />
                    <Route path="/:amigurumi_id/editor" element={
                        <RequireAuth>
                        <Suspense fallback={<RouteFallback />}>
                            <Editor />
                        </Suspense>
                        </RequireAuth>
                    }
                    />
                    <Route path="/:amigurumi_id/pattern" element={<RequireAuth><Suspense fallback={<RouteFallback />}><Pattern /></Suspense></RequireAuth>} />
                    <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                    <Route path="/profile/:username" element={<RequireAuth><Profile /></RequireAuth>} />
                </Routes>
            </Box>
            <ChooseUsernameDialog />
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
