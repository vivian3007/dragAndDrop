import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Vanaf deze pagina's is er niets om naar terug te gaan: de terugknop sluit dan de app.
const ROOT_PATHS = ["/", "/home"];

// Terugknop van Android in de app: een pagina terug, of de app sluiten op een startpagina.
// Op het web doet dit niets, daar heeft de browser zijn eigen terugknop.
export function useAndroidBackButton() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    // Via een ref, zodat de listener niet bij elke paginawissel opnieuw aangemaakt hoeft te worden.
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;

    useEffect(() => {
        if (Capacitor.getPlatform() !== "android") return;
        const listener = CapacitorApp.addListener("backButton", () => {
            if (ROOT_PATHS.includes(pathnameRef.current)) {
                CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        });
        return () => {
            listener.then((handle) => handle.remove());
        };
    }, [navigate]);
}
