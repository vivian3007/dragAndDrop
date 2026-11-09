import React from "react";
import { IconButton } from "@mui/material";
import { Close, DeleteOutline, Flip, Link, Tune } from "@mui/icons-material";
import { useT } from "../i18n/LanguageProvider";

// Telefoon: zolang er een vorm geselecteerd is, staat deze balk onderaan in plaats van de
// vormenstrook. Selecteren opent dus niet meteen het grote instellingenpaneel: het canvas
// houdt zijn ruimte terwijl je met de gizmo werkt, en ⚙ opent pas alle instellingen.
function ShapeContextBar({ shape, onAttach, onMirror, onDelete, onOpenSettings, onDeselect }: {
    shape: Shape;
    onAttach: () => void;
    onMirror: () => void;
    onDelete: () => void;
    onOpenSettings: () => void;
    onDeselect: () => void;
}) {
    const t = useT();

    return (
        <div className="shape-contextbar">
            <span className="shape-contextbar-name">{shape.name || t(`shapes.${shape.type}`)}</span>
            <IconButton size="small" aria-label={t("editor.attachShape")} title={t("editor.attachShapeHint")} onClick={onAttach}>
                <Link fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("editor.mirrorShape")} title={t("editor.mirrorShape")} onClick={onMirror}>
                <Flip fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("editor.deleteShape")} title={t("editor.deleteShape")} onClick={onDelete}>
                <DeleteOutline fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("editor.shapeSettings")} title={t("editor.shapeSettings")} onClick={onOpenSettings}>
                <Tune fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("editor.deselect")} title={t("editor.deselect")} onClick={onDeselect}>
                <Close fontSize="small" />
            </IconButton>
        </div>
    );
}

export default React.memo(ShapeContextBar);
