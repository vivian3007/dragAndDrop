import React, { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { AspectRatio, GridOff, GridOn, OpenWith, Redo, Rotate90DegreesCcw, Undo, Videocam } from "@mui/icons-material";
import { useT } from "../i18n/LanguageProvider";
import type { SetState, SetView, TransformMode, ViewKey } from "./types";

const VIEWS: ViewKey[] = ["front", "back", "left", "right", "top"];

const TRANSFORM_MODES: { mode: TransformMode; icon: React.ReactNode }[] = [
    { mode: "translate", icon: <OpenWith fontSize="small" /> },
    { mode: "scale", icon: <AspectRatio fontSize="small" /> },
    { mode: "rotate", icon: <Rotate90DegreesCcw fontSize="small" /> },
];

// Kleine icoonknoppen óver het canvas (zie .canvas-toolbar in styles.css).
// - "desktop": één rij onderin het midden: ongedaan maken/opnieuw, weergave/raster en, met
//   een geselecteerde vorm, verplaatsen/schalen/draaien.
// - "phone": ongedaan maken/opnieuw staan dan in de kopregel (EditorHeader); weergave en
//   raster zijn twee knopjes rechtsboven, de modi een groep onderin het midden.
// De modi staan er alleen bij een geselecteerde vorm; zonder toetsenbord (T/S/R) is dit de
// enige manier om van modus te wisselen.
function CanvasToolbar({ variant, setView, transformMode, setTransformMode, hasSelection, showGrid, setShowGrid, onUndo, onRedo, canUndo, canRedo }: {
    variant: "desktop" | "phone";
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
}) {
    const t = useT();
    const [viewMenuAnchor, setViewMenuAnchor] = useState<HTMLElement | null>(null);

    const historyGroup = (
        <div className="canvas-toolbar-group">
            <IconButton size="small" aria-label={t("toolbar.undo")} title={t("toolbar.undo")} onClick={onUndo} disabled={!canUndo}>
                <Undo fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("toolbar.redo")} title={t("toolbar.redo")} onClick={onRedo} disabled={!canRedo}>
                <Redo fontSize="small" />
            </IconButton>
        </div>
    );

    const viewGroup = (
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
    );

    const modesGroup = hasSelection && (
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
    );

    const viewMenu = (
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
    );

    if (variant === "phone") {
        return (
            <>
                <div className="canvas-toolbar canvas-toolbar--side">{viewGroup}</div>
                {modesGroup && <div className="canvas-toolbar canvas-toolbar--modes">{modesGroup}</div>}
                {viewMenu}
            </>
        );
    }

    return (
        <div className="canvas-toolbar">
            {historyGroup}
            {viewGroup}
            {modesGroup}
            {viewMenu}
        </div>
    );
}

export default React.memo(CanvasToolbar);
