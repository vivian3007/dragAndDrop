import React, { useState } from "react";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { AspectRatio, GridOff, GridOn, OpenWith, Redo, Rotate90DegreesCcw, Tune, Undo, Videocam } from "@mui/icons-material";
import { useT } from "../i18n/LanguageProvider";
import type { SetState, SetView, TransformMode, ViewKey } from "./types";

const VIEWS: ViewKey[] = ["front", "back", "left", "right", "top"];

const TRANSFORM_MODES: { mode: TransformMode; icon: React.ReactNode }[] = [
    { mode: "translate", icon: <OpenWith fontSize="small" /> },
    { mode: "scale", icon: <AspectRatio fontSize="small" /> },
    { mode: "rotate", icon: <Rotate90DegreesCcw fontSize="small" /> },
];

// De werkbalk van de editor: kleine icoonknoppen óver het canvas, op een telefoon bovenin en
// verder onderin in het midden (zie .canvas-toolbar in styles.css). Verplaatsen, schalen en
// draaien staan er alleen als er een vorm geselecteerd is; zonder toetsenbord (T/S/R) is dit
// de enige manier om van modus te wisselen.
// `onToggleSettings` en `onOpenPattern` alleen op de telefoon: daar is het instellingenpaneel
// standaard weg en staan die twee rechts in deze werkbalk.
function CanvasToolbar({ setView, transformMode, setTransformMode, hasSelection, showGrid, setShowGrid, onUndo, onRedo, canUndo, canRedo, settingsOpen, onToggleSettings, onOpenPattern, canOpenPattern }: {
    setView: SetView;
    transformMode: TransformMode;
    setTransformMode: (mode: TransformMode) => void;
    hasSelection: boolean;
    showGrid: boolean;
    setShowGrid: SetState<boolean>;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    settingsOpen?: boolean;
    onToggleSettings?: () => void;
    onOpenPattern?: () => void;
    canOpenPattern?: boolean;
}) {
    const t = useT();
    const [viewMenuAnchor, setViewMenuAnchor] = useState<HTMLElement | null>(null);

    return (
        <div className="canvas-toolbar">
            <div className="canvas-toolbar-group">
                <IconButton size="small" aria-label={t("toolbar.undo")} title={t("toolbar.undo")} onClick={onUndo} disabled={!canUndo}>
                    <Undo fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label={t("toolbar.redo")} title={t("toolbar.redo")} onClick={onRedo} disabled={!canRedo}>
                    <Redo fontSize="small" />
                </IconButton>
            </div>
            <div className="canvas-toolbar-group">
                <IconButton size="small" aria-label={t("toolbar.view")} title={t("toolbar.view")} onClick={(e) => setViewMenuAnchor(e.currentTarget)}>
                    <Videocam fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    aria-label={showGrid ? t("toolbar.hideGrid") : t("toolbar.showGrid")}
                    title={showGrid ? t("toolbar.hideGrid") : t("toolbar.showGrid")}
                    onClick={() => setShowGrid((v) => !v)}
                >
                    {showGrid ? <GridOff fontSize="small" /> : <GridOn fontSize="small" />}
                </IconButton>
            </div>
            {hasSelection && (
                <div className="canvas-toolbar-group">
                    {TRANSFORM_MODES.map(({ mode, icon }) => (
                        <IconButton
                            key={mode}
                            size="small"
                            aria-label={t(`toolbar.${mode}`)}
                            aria-pressed={transformMode === mode}
                            title={t(`toolbar.${mode}`)}
                            className={transformMode === mode ? "active" : ""}
                            onClick={() => setTransformMode(mode)}
                        >
                            {icon}
                        </IconButton>
                    ))}
                </div>
            )}
            {(onToggleSettings || onOpenPattern) && (
                <div className="canvas-toolbar-group canvas-toolbar-group--end">
                    {onToggleSettings && (
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
                    )}
                    {onOpenPattern && (
                        <Button size="small" onClick={onOpenPattern} disabled={!canOpenPattern} className="canvas-toolbar-text-btn">
                            {t("editor.pattern")}
                        </Button>
                    )}
                </div>
            )}
            <Menu anchorEl={viewMenuAnchor} open={viewMenuAnchor !== null} onClose={() => setViewMenuAnchor(null)}>
                {VIEWS.map((view) => (
                    <MenuItem
                        key={view}
                        onClick={() => {
                            setView(view);
                            setViewMenuAnchor(null);
                        }}
                    >
                        {t(`toolbar.${view}`)}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

export default React.memo(CanvasToolbar);
