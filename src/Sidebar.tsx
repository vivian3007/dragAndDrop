import React, {useRef} from "react";
import {Camera} from "three";
import Shapebar from "./Shapebar";
import Toolbar from "./Toolbar";

function Sidebar({ setDroppedShapes, setActiveId, containerRef, threeJsContainerRef, dragging, setDragging, camera, setView, setTransformMode, showGrid, setShowGrid, onUndo, onRedo, canUndo, canRedo }: { setDroppedShapes: any, setActiveId: any, containerRef: React.RefObject<HTMLDivElement | null>, threeJsContainerRef: React.RefObject<HTMLElement | null>, dragging: boolean, setDragging: any, camera: Camera, setView: any, setTransformMode: any, showGrid: boolean, setShowGrid: any, onUndo: () => void, onRedo: () => void, canUndo: boolean, canRedo: boolean }) {

    const navBarRef = useRef<HTMLDivElement>(null);

    return (
        <nav className="Navbar" ref={navBarRef}>
            <Shapebar setActiveId={setActiveId} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} setDroppedShapes={setDroppedShapes} navBarRef={navBarRef} />
            <Toolbar setView={setView} setTransformMode={setTransformMode} showGrid={showGrid} setShowGrid={setShowGrid} onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
        </nav>
    );
}

export default React.memo(Sidebar);
