import React from "react";
import type {Camera} from "three";
import type { SetState, SetView, TransformMode } from "./editor/types";
import Shapebar from "./Shapebar";
import Toolbar from "./Toolbar";

function Sidebar({ amigurumiId, setDroppedShapes, setActiveId, threeJsContainerRef, dragging, setDragging, camera, setView, setTransformMode, showGrid, setShowGrid, onUndo, onRedo, canUndo, canRedo }: {
    amigurumiId: string;
    setDroppedShapes: SetState<Shape[]>;
    setActiveId: SetState<string | null>;
    threeJsContainerRef: React.RefObject<HTMLElement | null>;
    dragging: boolean;
    setDragging: SetState<boolean>;
    camera: Camera | null;
    setView: SetView;
    setTransformMode: (mode: TransformMode) => void;
    showGrid: boolean;
    setShowGrid: SetState<boolean>;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}) {

    return (
        <nav className="Navbar">
            <Shapebar amigurumiId={amigurumiId} setActiveId={setActiveId} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} setDroppedShapes={setDroppedShapes} />
            <Toolbar setView={setView} setTransformMode={setTransformMode} showGrid={showGrid} setShowGrid={setShowGrid} onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
        </nav>
    );
}

export default React.memo(Sidebar);
