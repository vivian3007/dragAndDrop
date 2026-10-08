import React from "react";
import {Button} from "@mui/material";
import {Redo, Undo} from "@mui/icons-material";
import { useT } from "./i18n/LanguageProvider";
import type { SetState, SetView, TransformMode } from "./editor/types";

function Toolbar({ setView, setTransformMode, showGrid, setShowGrid, onUndo, onRedo, canUndo, canRedo }: { setView: SetView, setTransformMode: (mode: TransformMode) => void, showGrid: boolean, setShowGrid: SetState<boolean>, onUndo: () => void, onRedo: () => void, canUndo: boolean, canRedo: boolean }) {
    const t = useT();

    return (
        <div className="toolbar">
            <h1 className="shapes-text">{t("toolbar.history")}</h1>
            <div className="toolbar-category">
                <Button size="small" variant="contained" onClick={onUndo} disabled={!canUndo} startIcon={<Undo />} sx={{ flexDirection: 'row' }}>{t("toolbar.undo")}</Button>
                <Button size="small" variant="contained" onClick={onRedo} disabled={!canRedo} startIcon={<Redo />} sx={{ flexDirection: 'row' }}>{t("toolbar.redo")}</Button>
            </div>
            <h1 className="shapes-text">{t("toolbar.view")}</h1>
            <div className="toolbar-category">
                <Button size="small" variant="contained" onClick={() => setView('front')}>{t("toolbar.front")}</Button>
                <Button size="small" variant="contained" onClick={() => setView('back')}>{t("toolbar.back")}</Button>
                <Button size="small" variant="contained" onClick={() => setView('left')}>{t("toolbar.left")}</Button>
                <Button size="small" variant="contained" onClick={() => setView('right')}>{t("toolbar.right")}</Button>
                <Button size="small" variant="contained" onClick={() => setView('top')}>{t("toolbar.top")}</Button>
            </div>
            <h1 className="shapes-text">{t("toolbar.transformMode")}</h1>
            <div className="toolbar-category">
                <Button size="small" variant="contained" onClick={() => setTransformMode('translate')}>{t("toolbar.translate")}</Button>
                <Button size="small" variant="contained" onClick={() => setTransformMode('scale')}>{t("toolbar.scale")}</Button>
                <Button size="small" variant="contained" onClick={() => setTransformMode('rotate')}>{t("toolbar.rotate")}</Button>
            </div>
            <h1 className="shapes-text">{t("toolbar.grid")}</h1>
            <div className="toolbar-category">
                <Button size="small" variant="contained" onClick={() => setShowGrid((v: boolean) => !v)}>
                    {showGrid ? t("toolbar.hideGrid") : t("toolbar.showGrid")}
                </Button>
            </div>
        </div>
    );
}

export default React.memo(Toolbar);
