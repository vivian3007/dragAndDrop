import "./styles.css";
import Sidebar from "./Sidebar.tsx";
import ShapeField from "./ShapeField";
import ThreeJsField from "./ThreeJsField.tsx"
import Pattern from "./Pattern";
import YarnSettings from "./YarnSettings"
import { useState, useRef, useEffect } from "react";
import {DndContext, DragOverlay, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import useMousePosition from "./useMousePosition";
import {v4 as uuidv4} from "uuid";
import Settingsbar from "./Settingsbar.tsx";
import {Route, Routes, Link} from "react-router-dom";

export default function App() {
    const [droppedShapes, setDroppedShapes] = useState<
        { id: string; type: string; x: number; y: number,z: number, width: number, height: number, length:number, color: string, name: string, zoom: number, rotateX: number, rotateY: number, rotateZ: number, zIndex: number }[]
    >([]);
    const [yarnInfo, setYarnInfo] = useState<
        { id: string; name: string; weight: number; mPerSkein: number, hooksize: number, material: string, color: string }
    >({});
    const containerRef = useRef<HTMLDivElement>(null);
    const threeJsContainerRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);
    const [camera, setCamera] = useState(null);

    const [activeId, setActiveId] = useState(null);
    const [shapeColor, setShapeColor] = useState('#FFFFFF');

    useEffect(() => {
        const newShape1 = {
            id: uuidv4(),
            type: 'Sphere',
            x: 0,
            y: 0,
            z: 0,
            width: 200,
            height: 200,
            length: 200,
            color: 'yellow',
            name: 'Circle',
            rotateX: null,
            rotateY: null,
            rotateZ: null,
            zIndex: 10,
            zoom: 1,
        };

        const newShape2 = {
            id: uuidv4(),
            type: 'Arm',
            x: 12,
            y: 0,
            z: 0,
            width: 200,
            height: 200,
            length: 200,
            color: 'hotpink',
            name: 'Arm',
            rotateX: null,
            rotateY: null,
            rotateZ: null,
            zIndex: 10,
            zoom: 1,
        };
        setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape1, newShape2]);

        setYarnInfo( {id: uuidv4(), name: null, weight: null, mPerSkein: null, hooksize: null, material: null, color: null});
    }, []);

    const activeShape = droppedShapes.find((shape) => shape.id === activeId);
    const handleDragEnd = (event) => {
        const { over, delta } = event;
        if (over && containerRef.current) {
            if(over?.id === "trashcan"){
                const updatedDroppedShapes = droppedShapes.filter(shape => shape.id !== activeShape?.id);
                setDroppedShapes(updatedDroppedShapes);
            }
            const containerRect = containerRef.current.getBoundingClientRect();
                const newX = activeShape?.x + delta.x;
                const newY = activeShape?.y + delta.y;

                const isOutOfBounds =
                    newX < 0 ||
                    newX + activeShape?.width > containerRect.width ||
                    newY < 0 ||
                    newY + activeShape?.height > containerRect.height;

                if (!isOutOfBounds) {
                    setDroppedShapes((prevShapes) =>
                        prevShapes.map((shape) =>
                            shape.id === activeId ? { ...shape, x: newX, y: newY } : shape
                        )
                    );
                } else {
                    console.log("Vorm buiten grenzen bij verplaatsen");
                }
            }
    };

    // const handleDragStart = (event) => {
    //     const { active, over, delta } = event;
    //
    //     console.log("dragstart")
    //     setActiveId(active.id);
    // };

    const handleUpdateShape = (updatedShape: { id: string; x: number, y: number, z: number, width: number; height: number, length: number, color: string, name: string, rotateX: number, rotateY: number, rotateZ: number, zIndex: number, zoom: number }) => {
        console.log(updatedShape)
        console.log(activeShape)
        setDroppedShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === updatedShape.id
                    ? { ...shape, x: updatedShape.x, y: updatedShape.y, z: updatedShape.z, width: updatedShape.width, height: updatedShape.height, length: updatedShape.length, color: updatedShape.color, name: updatedShape.name, rotateX: updatedShape.rotateX, rotateY: updatedShape.rotateY,  rotateZ: updatedShape.rotateZ, zIndex: updatedShape.zIndex, zoom: updatedShape.zoom }
                    : shape
            )
        );
    };

    const handleUpdateYarnInfo = (updatedYarnInfo: { id: string; name: string; weight: number; mPerSkein: number, hooksize: number, material: string, color: string }) => {
        console.log(updatedYarnInfo)
        setYarnInfo(
        yarnInfo.id === updatedYarnInfo.id
            ? { name: updatedYarnInfo.name, weight: updatedYarnInfo.weight, mPerSkein: updatedYarnInfo.mPerSkein, hooksize: updatedYarnInfo.hooksize, material: updatedYarnInfo.material, color: updatedYarnInfo.color }
            : yarnInfo
        );
    };

    const handleDeleteShape = (id: string) => {
        setDroppedShapes((prev) => prev.filter((shape) => shape.id !== id));
        if (activeShape?.id === id) {
            setActiveId(null);
        }
    };

    console.log(droppedShapes)

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={
                    <DndContext onDragEnd={handleDragEnd}>
                        <Sidebar setDroppedShapes={setDroppedShapes} setActiveId={setActiveId} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} />
                        {/*<ShapeField*/}
                        {/*    droppedShapes={droppedShapes}*/}
                        {/*    containerRef={containerRef}*/}
                        {/*    shapeColor={shapeColor}*/}
                        {/*/>*/}
                        <ThreeJsField droppedShapes={droppedShapes} threeJsContainerRef={threeJsContainerRef} activeId={activeId} setActiveId={setActiveId} onUpdateShape={handleUpdateShape} setCamera={setCamera} />
                        <Settingsbar activeShape={activeShape} onUpdateShape={handleUpdateShape} onDeleteShape={handleDeleteShape} shapeColor={shapeColor} setShapeColor={setShapeColor} droppedShapes={droppedShapes} dragging={dragging} onUpdateYarnInfo={handleUpdateYarnInfo} yarnInfo={yarnInfo} />
                    </DndContext>
                    }
                />
                <Route path="/pattern" element={<Pattern shapes={droppedShapes} />} />
                {/*<Route path="/yarnSettings" element={<YarnSettings />} />*/}
            </Routes>

        </div>
    );
}
