import {AppBar, Container, Toolbar} from "@mui/material";
import {Link} from "react-router-dom";
import ThreeJsField from "./ThreeJsField.tsx";
import Settingsbar from "./Settingsbar.tsx";
import Sidebar from "./Sidebar.tsx";

interface Shape {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    length: number;
    color: string;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    zoom: number;
}

interface Yarn {
    id: string;
    name: string;
    weight: number;
    mPerSkein: number;
    hooksize: number;
    material: string;
    color: string;
}

const Editor = ({droppedShapes, setDroppedShapes, setActiveId, activeId, containerRef, threeJsContainerRef, dragging, setDragging, camera, setCamera, handleUpdateShape, handleUpdateYarnInfo, handleDeleteShape, activeShape, shapeColor, setShapeColor, yarnInfo} : {droppedShapes: Shape[], setDroppedShapes: any, setActiveId: any, activeId: any, containerRef: any, threeJsContainerRef: any, dragging: any, setDragging: any, camera: any, setCamera: any, handleUpdateShape: any, handleUpdateYarnInfo: any, handleDeleteShape: any, activeShape: Shape, shapeColor: string, setShapeColor: any, yarnInfo: Yarn }) => {

    return (
        <div className="editor">
            <Sidebar setDroppedShapes={setDroppedShapes} setActiveId={setActiveId} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} />
            <ThreeJsField droppedShapes={droppedShapes} threeJsContainerRef={threeJsContainerRef} activeId={activeId} setActiveId={setActiveId} onUpdateShape={handleUpdateShape} setCamera={setCamera} onDeleteShape={handleDeleteShape} />
            <Settingsbar activeShape={activeShape} onUpdateShape={handleUpdateShape} onDeleteShape={handleDeleteShape} shapeColor={shapeColor} setShapeColor={setShapeColor} droppedShapes={droppedShapes} dragging={dragging} onUpdateYarnInfo={handleUpdateYarnInfo} yarnInfo={yarnInfo} />
        </div>
    );
}

export default Editor

