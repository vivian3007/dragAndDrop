import { v4 as uuidv4 } from "uuid";
import React, {Ref, useEffect, useRef, useState} from "react";
import Trashcan from "./Trashcan.tsx";
import * as THREE from "three";
import {Camera} from "three";
import {setDoc, doc} from "firebase/firestore";
import {db} from "../firebase-config.js";
import Shapebar from "./Shapebar";
import Toolbar from "./Toolbar";

function Sidebar({ setDroppedShapes, setActiveId, containerRef, threeJsContainerRef, dragging, setDragging, camera, setView, setTransformMode, showGrid, setShowGrid }: { setDroppedShapes: any, setActiveId: any, containerRef: Ref<HTMLDivElement>, threeJsContainerRef: Ref<HTMLCanvasElement>, dragging: boolean, setDragging: any, camera: Camera, setView: any, setTransformMode: any, showGrid: boolean, setShowGrid: any }) {

    const navBarRef = useRef<HTMLDivElement>(null);

    return (
        <nav className="Navbar" ref={navBarRef}>
            <Shapebar setActiveId={setActiveId} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} setDroppedShapes={setDroppedShapes} navBarRef={navBarRef} />
            <Toolbar setView={setView} setTransformMode={setTransformMode} showGrid={showGrid} setShowGrid={setShowGrid} />
        </nav>
    );
}

export default React.memo(Sidebar);
