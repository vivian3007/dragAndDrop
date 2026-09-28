import React from "react";
import {Button} from "@mui/material";
import { useT } from "./i18n/LanguageProvider";

function Toolbar({ setView, setTransformMode, showGrid, setShowGrid }: { setView: (viewKey: string) => void, setTransformMode: any, showGrid: boolean, setShowGrid: any }) {
    const t = useT();

    return (
        <div className="toolbar">
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
