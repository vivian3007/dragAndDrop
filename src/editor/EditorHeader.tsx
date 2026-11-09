import React from "react";
import { Button, IconButton } from "@mui/material";
import { ArrowBack, Redo, Tune, Undo } from "@mui/icons-material";
import { useT } from "../i18n/LanguageProvider";

// Kopregel van de editor op een telefoon, in plaats van de navigatiebalk van de app: terug,
// de naam van het ontwerp, ongedaan maken/opnieuw, instellingen en Patroon.
function EditorHeader({ name, onBack, onUndo, onRedo, canUndo, canRedo, settingsOpen, onToggleSettings, onOpenPattern, canOpenPattern }: {
    name: string;
    onBack: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    settingsOpen: boolean;
    onToggleSettings: () => void;
    onOpenPattern: () => void;
    canOpenPattern: boolean;
}) {
    const t = useT();

    return (
        <header className="editor-header">
            <IconButton aria-label={t("editor.back")} title={t("editor.back")} onClick={onBack}>
                <ArrowBack />
            </IconButton>
            <h1 className="editor-header-title">{name}</h1>
            <IconButton size="small" aria-label={t("toolbar.undo")} title={t("toolbar.undo")} onClick={onUndo} disabled={!canUndo}>
                <Undo fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("toolbar.redo")} title={t("toolbar.redo")} onClick={onRedo} disabled={!canRedo}>
                <Redo fontSize="small" />
            </IconButton>
            <IconButton
                size="small"
                aria-label={t("editor.sheet.title")}
                aria-pressed={settingsOpen}
                title={t("editor.sheet.title")}
                className={settingsOpen ? "active" : ""}
                onClick={onToggleSettings}
            >
                <Tune fontSize="small" />
            </IconButton>
            <Button size="small" variant="contained" className="editor-header-pattern" onClick={onOpenPattern} disabled={!canOpenPattern}>
                {t("editor.pattern")}
            </Button>
        </header>
    );
}

export default React.memo(EditorHeader);
