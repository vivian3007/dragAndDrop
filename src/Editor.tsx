import React, { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { toast } from "react-toastify";
import ThreeJsField from "./ThreeJsField.tsx";
import Settingsbar from "./Settingsbar.tsx";
import Sidebar from "./Sidebar.tsx";
import { useShapeHistory } from "./useShapeHistory";
import { saveShapeDoc } from "./shapeDocs";
import { mirrorShape } from "./geometry/mirrorShape";
import { attachToNearest } from "./geometry/attach";
import { useEditorState } from "./editor/useEditorState";
import { useT } from "./i18n/LanguageProvider";

// De editor voor één ontwerp (/:amigurumi_id/editor). Alle state zit in useEditorState;
// welk ontwerp het is komt uit de URL, zodat herladen en een gedeelde link gewoon werken.
const Editor = () => {
    const { amigurumi_id: amigurumiId = '' } = useParams();
    const t = useT();
    const threeJsContainerRef = useRef<HTMLCanvasElement>(null);
    const {
        loading,
        amigurumi,
        droppedShapes,
        setDroppedShapes,
        yarnInfo,
        handleUpdateYarnInfo,
        activeId,
        setActiveId,
        activeShape,
        dragging,
        setDragging,
        camera,
        setCamera,
        shapeColor,
        setShapeColor,
        setView,
        onSetView,
        transformMode,
        setTransformMode,
        showGrid,
        setShowGrid,
        handleUpdateShape,
        handleDeleteShape,
    } = useEditorState(amigurumiId);

    // Zet een eerdere toestand terug: in de state, en het verschil met de huidige toestand
    // ook in Firestore — verwijderde vormen weer aanmaken, toegevoegde weer weghalen en
    // gewijzigde via de gewone (debounced) update, zodat die een nog lopende update vervangt.
    const applySnapshot = useCallback((target: Shape[], current: Shape[]) => {
        const targetIds = new Set(target.map((shape) => shape.id));
        const currentById = new Map(current.map((shape) => [shape.id, shape]));

        current.forEach((shape) => {
            if (!targetIds.has(shape.id)) handleDeleteShape(shape.id);
        });
        target.forEach((shape) => {
            const before = currentById.get(shape.id);
            if (!before) {
                saveShapeDoc({ ...shape, amigurumi_id: amigurumiId }).catch((error) => console.error("Fout bij terugzetten van vorm:", error));
            } else if (before !== shape) {
                handleUpdateShape(shape);
            }
        });
        setDroppedShapes(target);
    }, [handleDeleteShape, handleUpdateShape, setDroppedShapes, amigurumiId]);

    const history = useShapeHistory(droppedShapes, applySnapshot);
    const { checkpoint, undo, redo, reset: resetHistory } = history;

    // Ander ontwerp (of opnieuw geladen): de geschiedenis van het vorige telt niet meer.
    useEffect(() => {
        if (!loading) resetHistory();
    }, [loading, amigurumiId, resetHistory]);

    // Alle wijzigingen door de gebruiker lopen via deze wrappers, zodat er vooraf een
    // undo-stap wordt vastgelegd.
    const updateShape = useCallback((shape: Shape) => {
        checkpoint();
        handleUpdateShape(shape);
    }, [checkpoint, handleUpdateShape]);

    const deleteShape = useCallback((id: string) => {
        checkpoint();
        handleDeleteShape(id);
    }, [checkpoint, handleDeleteShape]);

    const setShapesFromUser = useCallback((update: React.SetStateAction<Shape[]>) => {
        checkpoint();
        setDroppedShapes(update);
    }, [checkpoint, setDroppedShapes]);

    const handleMirrorShape = useCallback((id: string) => {
        const source = droppedShapes.find((shape) => shape.id === id);
        if (!source) return;
        const mirrored: Shape & { amigurumi_id: string } = {
            ...mirrorShape(source, droppedShapes),
            id: uuidv4(),
            amigurumi_id: amigurumiId,
            name: source.name ? t("editor.mirroredName", { name: source.name }) : null,
        };
        checkpoint();
        setDroppedShapes((prev) => [...prev, mirrored]);
        setActiveId(mirrored.id);
        saveShapeDoc(mirrored).catch((error) => {
            console.error("Fout bij opslaan van gespiegelde vorm:", error);
            toast.error(t("errors.saveShape", { message: String(error) }));
        });
    }, [droppedShapes, checkpoint, setDroppedShapes, setActiveId, t, amigurumiId]);

    // Sluit de vorm netjes aan op de dichtstbijzijnde andere vorm (zie geometry/attach.ts).
    // Via updateShape, dus met een undo-stap en gewoon opgeslagen.
    const handleAttachShape = useCallback((id: string) => {
        const source = droppedShapes.find((shape) => shape.id === id);
        if (!source) return;
        const result = attachToNearest(source, droppedShapes);
        if (!result) {
            toast.info(t("editor.attachNoTarget"));
            return;
        }
        updateShape(result.shape);
        const target = droppedShapes.find((shape) => shape.id === result.targetId);
        toast.success(t("editor.attached", { name: target?.name || t(`shapes.${target?.type ?? "Sphere"}`) }));
    }, [droppedShapes, updateShape, t]);

    // Ctrl/Cmd+Z = ongedaan maken, Ctrl/Cmd+Shift+Z of Ctrl+Y = opnieuw. Niet in invoervelden,
    // daar hoort Ctrl+Z bij de tekst.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement | null;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return;
            if (!(event.ctrlKey || event.metaKey)) return;
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            } else if ((key === 'z' && event.shiftKey) || key === 'y') {
                event.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    if (!loading && !amigurumi) {
        return (
            <Box sx={{ p: 5 }}>
                <Typography>{t('editor.notFound')}</Typography>
            </Box>
        );
    }

    return (
        <div className="editor">
            <Sidebar
                amigurumiId={amigurumiId}
                setDroppedShapes={setShapesFromUser}
                setActiveId={setActiveId}
                threeJsContainerRef={threeJsContainerRef}
                dragging={dragging}
                setDragging={setDragging}
                camera={camera}
                setView={setView}
                setTransformMode={setTransformMode}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                onUndo={undo}
                onRedo={redo}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
            />
            <ThreeJsField
                droppedShapes={droppedShapes}
                threeJsContainerRef={threeJsContainerRef}
                activeId={activeId}
                setActiveId={setActiveId}
                onUpdateShape={updateShape}
                setCamera={setCamera}
                onDeleteShape={deleteShape}
                onSetView={onSetView}
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                setShowGrid={setShowGrid}
                showGrid={showGrid}
            />
            <Settingsbar
                amigurumiId={amigurumiId}
                activeShape={activeShape}
                onUpdateShape={updateShape}
                onDeleteShape={deleteShape}
                onMirrorShape={handleMirrorShape}
                onAttachShape={handleAttachShape}
                shapeColor={shapeColor}
                setShapeColor={setShapeColor}
                droppedShapes={droppedShapes}
                onUpdateYarnInfo={handleUpdateYarnInfo}
                yarnInfo={yarnInfo}
            />
        </div>
    );
};

export default Editor;
