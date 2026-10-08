import { memo, useRef, useState } from "react";
import { Button, IconButton, Tab, Tabs } from "@mui/material";
import { HelpOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import YarnSettings, { YarnSettingsHandle } from "./YarnSettings.tsx";
import ShapeSettings from "./ShapeSettings.tsx"
import AppDialog from "./AppDialog.tsx";
import { FormattedMessage } from "react-intl";
import { useT } from "./i18n/LanguageProvider";
function Settingsbar({
                                        amigurumiId,
                                        activeShape,
                                        onUpdateShape,
                                        onDeleteShape,
                                        onMirrorShape,
                                        onAttachShape,
                                        shapeColor,
                                        setShapeColor,
                                        droppedShapes,
                                        onUpdateYarnInfo,
                                        yarnInfo,
                                    }: {
    amigurumiId: string,
    activeShape: Shape | undefined,
    onUpdateShape: (shape: Shape) => void,
    onDeleteShape: (id: string) => void,
    onMirrorShape: (id: string) => void,
    onAttachShape: (id: string) => void,
    shapeColor: string,
    setShapeColor: (color: string) => void,
    droppedShapes: Shape[],
    onUpdateYarnInfo: (yarn: Yarn) => void,
    yarnInfo: Yarn,
}) {
    const [showYarnSettings, setShowYarnSettings] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [yarnDirty, setYarnDirty] = useState(false)
    const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null)
    const yarnSettingsRef = useRef<YarnSettingsHandle>(null);
    const navigate = useNavigate();
    const t = useT();

    const goToPattern = () => {
        navigate(`/${amigurumiId}/pattern`, {
            state: { shapes: droppedShapes },
        });
    };

    const handlePatternNavigation = () => {
        if (showYarnSettings && yarnDirty) {
            setPendingLeaveAction(() => goToPattern);
        } else {
            goToPattern();
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        const wantsYarn = newValue === 1;
        if (wantsYarn === showYarnSettings) return;
        if (showYarnSettings && yarnDirty) {
            setPendingLeaveAction(() => () => setShowYarnSettings(wantsYarn));
        } else {
            setShowYarnSettings(wantsYarn);
        }
    }

    const handleDiscardAndLeave = () => {
        pendingLeaveAction?.();
        setYarnDirty(false);
        setPendingLeaveAction(null);
    };

    const handleSaveAndLeave = () => {
        yarnSettingsRef.current?.save();
        pendingLeaveAction?.();
        setPendingLeaveAction(null);
    };

    return (
        <nav className="settings-bar">
            <div className="settings-bar-topbar">
                <Tabs
                    value={showYarnSettings ? 1 : 0}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    className="settings-bar-tabs"
                >
                    <Tab label={t("editor.tab.shape")} disableRipple />
                    <Tab label={t("editor.tab.yarn")} disableRipple />
                </Tabs>
                <IconButton
                    aria-label={t("editor.help")}
                    size="small"
                    className="settings-bar-help-btn"
                    onClick={() => setShowHelp(true)}
                >
                    <HelpOutline fontSize="small" />
                </IconButton>
            </div>
            <div className="settings-bar-scroll">
                {showYarnSettings ? (
                    <YarnSettings ref={yarnSettingsRef} amigurumiId={amigurumiId} onUpdateYarnInfo={onUpdateYarnInfo} yarnInfo={yarnInfo} onDirtyChange={setYarnDirty}/>
                ) : <ShapeSettings shapeColor={shapeColor} setShapeColor={setShapeColor} activeShape={activeShape} onUpdateShape={onUpdateShape}/>}
            </div>
            <div className="settings-bar-footer" style={{marginBottom: 20, alignItems: "center", display: "flex", flexDirection: "column"}}>
                {!showYarnSettings && activeShape && (
                    <div style={{ display: "flex", gap: 8, width: "100%", marginBottom: 10 }}>
                        <Button
                            type="button"
                            variant="outlined"
                            color="inherit"
                            title={t("editor.attachShapeHint")}
                            sx={{flex: 1, borderColor: "var(--color-primary)", color: "var(--color-primary)"}}
                            onClick={() => onAttachShape(activeShape.id)}
                        >
                            {t("editor.attachShape")}
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            color="inherit"
                            sx={{flex: 1, borderColor: "var(--color-primary)", color: "var(--color-primary)"}}
                            onClick={() => onMirrorShape(activeShape.id)}
                        >
                            {t("editor.mirrorShape")}
                        </Button>
                    </div>
                )}
                {!showYarnSettings && activeShape && (
                    <p className="settings-bar-tip">{t("editor.arrowKeysTip")}</p>
                )}
                {!showYarnSettings && activeShape && (
                    <Button
                        type="button"
                        variant="contained"
                        color="inherit"
                        sx={{width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)", marginBottom: "10px"}}
                        onClick={() => onDeleteShape(activeShape.id)}
                    >
                        {t("editor.deleteShape")}
                    </Button>
                )}
                {showYarnSettings && (
                    <div style={{width: "100%", position: "relative", marginBottom: "10px"}}>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            className={yarnDirty ? "save-btn-dirty" : ""}
                            sx={{width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)"}}
                            onClick={() => yarnSettingsRef.current?.save()}
                        >
                            {t("editor.save")}
                        </Button>
                        {yarnDirty && (
                            <span className="unsaved-badge">{t("editor.unsavedChanges")}</span>
                        )}
                    </div>
                )}
                <Button
                    variant="contained"
                    color="inherit"
                    sx={{width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)", marginBottom: "10px"}}
                    disabled={!droppedShapes || droppedShapes.length < 1}
                    onClick={handlePatternNavigation}
                >
                    {t("editor.pattern")}
                </Button>
            </div>
            <AppDialog open={pendingLeaveAction !== null} onClose={() => setPendingLeaveAction(null)} maxWidth="xs">
                <div style={{padding: "32px 24px 24px", textAlign: "center"}}>
                    <h2 style={{marginTop: 0}}>{t("editor.unsavedYarn.title")}</h2>
                    <p>{t("editor.unsavedYarn.body")}</p>
                    <div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px"}}>
                        <Button
                            variant="contained"
                            color="inherit"
                            sx={{width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)"}}
                            onClick={handleSaveAndLeave}
                        >
                            {t("editor.unsavedYarn.saveAndLeave")}
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            sx={{width: 1, borderColor: "var(--color-secondary)", color: "var(--color-text)"}}
                            onClick={handleDiscardAndLeave}
                        >
                            {t("editor.unsavedYarn.leave")}
                        </Button>
                        <Button
                            variant="text"
                            color="inherit"
                            sx={{width: 1, color: "var(--color-text)"}}
                            onClick={() => setPendingLeaveAction(null)}
                        >
                            {t("editor.unsavedYarn.cancel")}
                        </Button>
                    </div>
                </div>
            </AppDialog>
            <AppDialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="sm">
                <div style={{padding: "32px 24px 24px"}}>
                    <h2 style={{marginTop: 0, textAlign: "center"}}>{t("editor.helpDialog.title")}</h2>
                    <h3 className="shape-settings-title">{t("editor.helpDialog.gettingStarted")}</h3>
                    <ol className="steps">
                        <li><FormattedMessage id="editor.helpDialog.step1" values={{ b: (chunks) => <b>{chunks}</b> }} /></li>
                        <li><FormattedMessage id="editor.helpDialog.step2" values={{ b: (chunks) => <b>{chunks}</b> }} /></li>
                        <li><FormattedMessage id="editor.helpDialog.step3" values={{ b: (chunks) => <b>{chunks}</b> }} /></li>
                        <li><FormattedMessage id="editor.helpDialog.step4" values={{ b: (chunks) => <b>{chunks}</b> }} /></li>
                    </ol>
                    <hr className="help-divider" />
                    <h3 className="shape-settings-title">{t("editor.helpDialog.shortcuts")}</h3>
                    <div className="shortcut-grid">
                        <div className="shortcut-row"><kbd>G</kbd><span>{t("editor.shortcut.grid")}</span></div>
                        <div className="shortcut-row"><kbd>T</kbd><span>{t("editor.shortcut.translate")}</span></div>
                        <div className="shortcut-row"><kbd>R</kbd><span>{t("editor.shortcut.rotate")}</span></div>
                        <div className="shortcut-row"><kbd>S</kbd><span>{t("editor.shortcut.scale")}</span></div>
                        <div className="shortcut-row"><kbd>Delete</kbd><span>{t("editor.shortcut.delete")}</span></div>
                        <div className="shortcut-row"><kbd>Ctrl+Z</kbd><span>{t("editor.shortcut.undo")}</span></div>
                        <div className="shortcut-row"><kbd>Ctrl+Y</kbd><span>{t("editor.shortcut.redo")}</span></div>
                    </div>
                </div>
            </AppDialog>
        </nav>
    );
}

export default memo(Settingsbar);