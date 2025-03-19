import Draggable from "./Draggable";
import { v4 as uuidv4 } from "uuid";
import {useEffect, useRef, useState} from "react";

export default function Sidebar({ navBarRef, setDroppedShapes }: { navBarRef: any, setDroppedShapes: any }) {
    const shapes = [
        { type: "circle", label: "Circle" },
        { type: "square", label: "Square" },
        { type: "rectangle", label: "Rectangle" },
        { type: "oval", label: "Oval" },
    ];

    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<string | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);

    const handleMouseDown = (e: any, shapeType: any) => {
        e.preventDefault();
        setDragging(true);
        setCurrentShape(shapeType);
        // Set initial position
        setPosition({
            x: e.clientX,
            y: e.clientY
        });
    }

    const handleMouseMove = (e) => {
        if (dragging) {
            setPosition({
                x: e.clientX,
                y: e.clientY
            });
        }
    }

    const handleMouseUp = (e) => {
        if (dragging && currentShape) {
            const width = dragItemRef.current?.offsetWidth;
            const height = dragItemRef.current?.offsetHeight;
            const newShape = {
                id: uuidv4(),
                type: currentShape,
                x: e.clientX - navBarRef.current.clientWidth - width / 2,
                y: e.clientY - height / 2,
            };
            setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape]);
        }
        setDragging(false);
        setCurrentShape(null);
    }

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    const getCenteredPosition = () => {
        if (dragItemRef.current) {
            const width = dragItemRef.current?.offsetWidth;
            const height = dragItemRef.current?.offsetHeight;
            return {
                left: position.x - width / 2,
                top: position.y - height / 2,
            };
        }
        return { left: position.x, top: position.y }; // Fallback if ref isn't ready
    };

    return (
        <nav className="Navbar" ref={navBarRef}>
            <h1>Vormen</h1>
            <div className={"draggables"}>
                {shapes.map((shape) => {
                    const uniqueId = `${shape.type}-${uuidv4()}`;
                    return (
                        // <Draggable
                        //     key={uniqueId}
                        //     id={shape.type}
                        //     data={{ type: shape.type, label: shape.label }}
                        // />
                             <div className={`draggable-shape ${shape.type}`} onMouseDown={(e) => handleMouseDown(e, shape.type)} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>{shape.label}</div>
                    );
                })}
            </div>
            {dragging && currentShape && (
                <div
                    ref={dragItemRef}
                    className={`draggable-shape ${currentShape}`}
                    style={{
                        position: "absolute",
                        ...getCenteredPosition(),
                        pointerEvents: "none",
                        zIndex: 1000,
                    }}
                >
                    {shapes.find((shape) => shape.type === currentShape)?.label}
                </div>
            )}
        </nav>
    );
}
