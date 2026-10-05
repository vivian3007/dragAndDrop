import React, { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";
import { AppBar, Container, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import ThreeJsField from "./ThreeJsField.tsx";
import Settingsbar from "./Settingsbar.tsx";
import Sidebar from "./Sidebar.tsx";
import { useShapeHistory } from "./useShapeHistory";
import { saveShapeDoc } from "./shapeDocs";
import { mirrorShape } from "./geometry/mirrorShape";
import { useT } from "./i18n/LanguageProvider";

const Editor = ({
                    droppedShapes,
                    setDroppedShapes,
                    setActiveId,
                    activeId,
                    containerRef,
                    threeJsContainerRef,
                    dragging,
                    setDragging,
                    camera,
                    setCamera,
                    handleUpdateShape,
                    handleUpdateYarnInfo,
                    handleDeleteShape,
                    activeShape,
                    shapeColor,
                    setShapeColor,
                    yarnInfo,
                    setYarnInfo,
                    yarns,
    onSetView,
    setView,
    transformMode,
    setTransformMode,
    showGrid,
    setShowGrid,
    intersections,
    setIntersections,
    meshes,
    setMeshes,
    scene,
    setScene,
                }: {
    droppedShapes: Shape[];
    setDroppedShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
    setActiveId: any;
    activeId: any;
    containerRef: any;
    threeJsContainerRef: any;
    dragging: any;
    setDragging: any;
    camera: any;
    setCamera: any;
    handleUpdateShape: any;
    handleUpdateYarnInfo: any;
    handleDeleteShape: any;
    activeShape: Shape;
    shapeColor: string;
    setShapeColor: any;
    yarnInfo: Yarn;
    setYarnInfo: any;
    yarns: Yarn[];
    onSetView: (setView: (viewKey: string) => void) => void;
    setView: any;
    transFormMode: any;
    setTransformMode: any;
    showGrid: boolean;
    setShowGrid: any;
    intersections: any;
    setIntersections: any;
    meshes: any;
    setMeshes: any;
    scene: any;
    setScene: any;
}) => {
    const location = useLocation();
    const t = useT();

    // Zet een eerdere toestand terug: in de state, en het verschil met de huidige toestand
    // ook in Firestore — verwijderde vormen weer aanmaken, toegevoegde weer weghalen en
    // gewijzigde via de gewone (debounced) update, zodat die een nog lopende update vervangt.
    const applySnapshot = useCallback((target: any[], current: any[]) => {
        const targetIds = new Set(target.map((shape) => shape.id));
        const currentById = new Map(current.map((shape) => [shape.id, shape]));

        current.forEach((shape) => {
            if (!targetIds.has(shape.id)) handleDeleteShape(shape.id);
        });
        target.forEach((shape) => {
            const before = currentById.get(shape.id);
            if (!before) {
                saveShapeDoc(shape).catch((error) => console.error("Fout bij terugzetten van vorm:", error));
            } else if (before !== shape) {
                handleUpdateShape(shape);
            }
        });
        setDroppedShapes(target);
    }, [handleDeleteShape, handleUpdateShape, setDroppedShapes]);

    const history = useShapeHistory(droppedShapes, applySnapshot);
    const { checkpoint, undo, redo, reset: resetHistory } = history;

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
        const source: any = droppedShapes.find((shape: any) => shape.id === id);
        if (!source) return;
        const mirrored: any = {
            ...mirrorShape(source, droppedShapes as any[]),
            id: uuidv4(),
            name: source.name ? t("editor.mirroredName", { name: source.name }) : null,
        };
        checkpoint();
        setDroppedShapes((prev) => [...prev, mirrored]);
        setActiveId(mirrored.id);
        saveShapeDoc(mirrored).catch((error) => {
            console.error("Fout bij opslaan van gespiegelde vorm:", error);
            alert(t("errors.saveShape", { message: String(error) }));
        });
    }, [droppedShapes, checkpoint, setDroppedShapes, setActiveId, t]);

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

    useEffect(() => {
        if (location.state?.shapes) {
            const incomingShapes: Shape[] = location.state.shapes;
            console.log("UseEFFECT van Editor.")
            setDroppedShapes(incomingShapes);
            // Ander (of opnieuw geladen) ontwerp: geschiedenis van het vorige telt niet meer.
            resetHistory();
        }
        if (location.state?.amigurumi) {
            const amigurumi: Shape[] = location.state.amigurumi;
            localStorage.setItem("amigurumi", amigurumi.id);
            // Net gekopieerd garen zit nog niet in de bij het opstarten geladen `yarns`,
            // dus dat wordt via de navigatie-state meegegeven.
            const currentYarn = location.state.yarn ?? yarns.find((yarn) => yarn.id === amigurumi.yarn_id);
            if(currentYarn){
                setYarnInfo(currentYarn);

            } else {
                setYarnInfo({name: null, weight: null, mPerSkein: null, hooksize: null, color: null, material: null});
            }
        }
    }, [location.state?.shapes, setDroppedShapes]);

    return (
        <div className="editor">
            <Sidebar
                setDroppedShapes={setShapesFromUser}
                setActiveId={setActiveId}
                containerRef={containerRef}
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
                setDroppedShapes={setDroppedShapes}
                threeJsContainerRef={threeJsContainerRef}
                activeId={activeId}
                setActiveId={setActiveId}
                onUpdateShape={updateShape}
                setCamera={setCamera}
                camera={camera}
                onDeleteShape={deleteShape}
                onSetView={onSetView}
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                intersections={intersections}
                setIntersections={setIntersections}
                meshes={meshes}
                setMeshes={setMeshes}
                scene={scene}
                setScene={setScene}
            />
            <Settingsbar
                activeShape={activeShape}
                onUpdateShape={updateShape}
                onDeleteShape={deleteShape}
                onMirrorShape={handleMirrorShape}
                shapeColor={shapeColor}
                setShapeColor={setShapeColor}
                droppedShapes={droppedShapes}
                dragging={dragging}
                onUpdateYarnInfo={handleUpdateYarnInfo}
                yarnInfo={yarnInfo}
                intersections={intersections}
            />
        </div>
    );
}

export default Editor;