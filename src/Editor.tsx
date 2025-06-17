import React, { useEffect } from 'react';
import { AppBar, Container, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import ThreeJsField from "./ThreeJsField.tsx";
import Settingsbar from "./Settingsbar.tsx";
import Sidebar from "./Sidebar.tsx";

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
    intersections: any;
    setIntersections: any;
    meshes: any;
    setMeshes: any;
    scene: any;
    setScene: any;
}) => {
    const location = useLocation();

    useEffect(() => {
        if (location.state?.shapes) {
            const incomingShapes: Shape[] = location.state.shapes;
            console.log("UseEFFECT van Editor.")
            setDroppedShapes(incomingShapes);
        }
        if (location.state?.amigurumi) {
            const amigurumi: Shape[] = location.state.amigurumi;
            localStorage.setItem("amigurumi", amigurumi.id);
            const currentYarn = yarns.find((yarn) => yarn.id === amigurumi.yarn_id);
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
                setDroppedShapes={setDroppedShapes}
                setActiveId={setActiveId}
                containerRef={containerRef}
                threeJsContainerRef={threeJsContainerRef}
                dragging={dragging}
                setDragging={setDragging}
                camera={camera}
                setView={setView}
                setTransformMode={setTransformMode}
            />
            <ThreeJsField
                droppedShapes={droppedShapes}
                setDroppedShapes={setDroppedShapes}
                threeJsContainerRef={threeJsContainerRef}
                activeId={activeId}
                setActiveId={setActiveId}
                onUpdateShape={handleUpdateShape}
                setCamera={setCamera}
                camera={camera}
                onDeleteShape={handleDeleteShape}
                onSetView={onSetView}
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                intersections={intersections}
                setIntersections={setIntersections}
                meshes={meshes}
                setMeshes={setMeshes}
                scene={scene}
                setScene={setScene}
            />
            <Settingsbar
                activeShape={activeShape}
                onUpdateShape={handleUpdateShape}
                onDeleteShape={handleDeleteShape}
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