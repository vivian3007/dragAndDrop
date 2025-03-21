import "./styles.css";
import Navbar from "./Sidebar.tsx";
import ShapeField from "./ShapeField";
import { useState, useRef, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import useMousePosition from "./useMousePosition";
import {v4 as uuidv4} from "uuid";
import Settingsbar from "./Settingsbar.tsx";

export default function App() {
    const [droppedShapes, setDroppedShapes] = useState<HTMLDivElement[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const shapeRef = useRef<HTMLDivElement>(null);
    const navBarRef = useRef<HTMLDivElement>(null);

    const [shapeType, setShapeType] = useState(null);
    const [activeId, setActiveId] = useState(null);

    const mousePosition = useMousePosition();

    const activeShape = droppedShapes.find((shape) => shape.id === activeId);

    const handleDragEnd = (event) => {
        const { active, over, delta } = event;
        setActiveId(null);
        const currentMouseState = mousePosition;
        const uniqueId = `${uuidv4()}`;

        if (over && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            let shapeWidth = null;
            let shapeHeight = null;

            const newShape = {
                id: uniqueId,
                x: currentMouseState.x - containerRect.x,
                y: currentMouseState.y - containerRect.y,
                type: shapeType
            };

            const existingShape = droppedShapes.find(
                (shape) => shape.id === newShape.id
            );

            console.log(existingShape)

            if (!existingShape) {
                console.log("no shape")
                if (shapeRef.current) {
                    shapeWidth = shapeRef.current.clientWidth;
                    shapeHeight = shapeRef.current.clientHeight;
                }
                const isOutOfBounds =
                    newShape.x - shapeWidth / 2 < 0 ||
                    newShape.x + shapeWidth / 2 > containerRect.width ||
                    newShape.y - shapeHeight / 2 < 0 ||
                    newShape.y + shapeHeight / 2 > containerRect.height;

                if (!isOutOfBounds) {
                    setDroppedShapes((prevShapes) => [...prevShapes, newShape]);
                } else {
                    console.log("Vorm buiten grenzen bij droppen");
                }
            } else {
                console.log("existingshape")
                const newX = existingShape.x + delta.x;
                const newY = existingShape.y + delta.y;

                const isOutOfBounds =
                    existingShape.x - shapeWidth / 2 < 0 ||
                    existingShape.x + shapeWidth / 2 > containerRect.width ||
                    existingShape.y - shapeHeight / 2 < 0 ||
                    existingShape.y + shapeHeight / 2 > containerRect.height;

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
        }
    };

    // console.log(droppedShapes)

    const handleDragStart = (event) => {
        console.log("Start drag");
        const { active, over, delta } = event;

        setShapeType(active.data?.current?.type);
        setActiveId(active.id);
        console.log(active.data);
        console.log("ShapeType: " + shapeType);
    };

    // console.log(activeShape);
    // console.log("dragging");

    return (
        <div className="App">
            <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <Navbar navBarRef={navBarRef} setDroppedShapes={setDroppedShapes} />
                <ShapeField
                    droppedShapes={droppedShapes}
                    containerRef={containerRef}
                    navBarRef={navBarRef}
                />
                <Settingsbar activeShape={activeShape} />
            </DndContext>
        </div>
    );
}
