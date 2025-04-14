import "./styles.css";
import Navbar from "./Sidebar.tsx";
import ShapeField from "./ShapeField";
import ThreeJsField from "./ThreeJsField.tsx"
import Pattern from "./Pattern";
import { useState, useRef, useEffect } from "react";
import {DndContext, DragOverlay, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import useMousePosition from "./useMousePosition";
import {v4 as uuidv4} from "uuid";
import Settingsbar from "./Settingsbar.tsx";
import {Route, Routes, Link} from "react-router-dom";

export default function App() {
    const [droppedShapes, setDroppedShapes] = useState<
        { id: string; type: string; x: number; y: number, width: number, height: number, length:number, color: string, name: string, zoom: number, rotate: number, zIndex: number }[]
    >([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const threeJsContainerRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);

    const [activeId, setActiveId] = useState(null);
    const [shapeColor, setShapeColor] = useState('#FFFFFF');

    useEffect(() => {
        const newShape1 = {
            id: uuidv4(),
            type: 'circle',
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            length: 200,
            color: 'yellow',
            name: 'Circle',
            rotate: null,
            zIndex: 10,
            zoom: 1,
        };

        const newShape2 = {
            id: uuidv4(),
            type: 'circle',
            x: 12,
            y: 0,
            width: 200,
            height: 200,
            length: 200,
            color: 'hotpink',
            name: 'Circle',
            rotate: null,
            zIndex: 10,
            zoom: 1,
        };
        setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape1, newShape2]);
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

    const handleDragStart = (event) => {
        const { active, over, delta } = event;

        setActiveId(active.id);
    };

    const handleUpdateShape = (updatedShape: { id: string; x: number, y: number, width: number; height: number, length: number, color: string, name: string, rotate: number, zIndex: number, zoom: number }) => {
        console.log(updatedShape)
        setDroppedShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === updatedShape.id
                    ? { ...shape, width: updatedShape.width, height: updatedShape.height, length: updatedShape.length, color: updatedShape.color, name: updatedShape.name, rotate: updatedShape.rotate, zIndex: updatedShape.zIndex, zoom: updatedShape.zoom }
                    : shape
            )
        );
    };

    console.log(droppedShapes)

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={
                    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                        <Navbar setDroppedShapes={setDroppedShapes} setActiveId={setActiveId} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} />
                        {/*<ShapeField*/}
                        {/*    droppedShapes={droppedShapes}*/}
                        {/*    containerRef={containerRef}*/}
                        {/*    shapeColor={shapeColor}*/}
                        {/*/>*/}
                        <ThreeJsField droppedShapes={droppedShapes} threeJsContainerRef={threeJsContainerRef} activeId={activeId} setActiveId={setActiveId} />
                        <Settingsbar activeShape={activeShape} onUpdateShape={handleUpdateShape} shapeColor={shapeColor} setShapeColor={setShapeColor} droppedShapes={droppedShapes} dragging={dragging} />
                    </DndContext>
                    }
                />
                <Route path="/pattern" element={<Pattern shapes={droppedShapes} />} />
            </Routes>

        </div>
    );
}
