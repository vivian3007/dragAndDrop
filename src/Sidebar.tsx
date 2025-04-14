import { v4 as uuidv4 } from "uuid";
import React, {Ref, useEffect, useRef, useState} from "react";
import Trashcan from "./Trashcan.tsx";

export default function Sidebar({ setDroppedShapes, setActiveId, containerRef, threeJsContainerRef, dragging, setDragging }: { setDroppedShapes: any, setActiveId: any, containerRef: Ref<HTMLDivElement>, threeJsContainerRef: Ref<HTMLCanvasElement>, dragging: boolean, setDragging: any }) {
    const shapes = [
        { type: "head", label: "Head" },
        { type: "body", label: "body" },
        { type: "leftArm", label: "LeftArm" },
        { type: "leftLeg", label: "LeftLeg" },
        { type: "circle", label: "Circle" },
        { type: "square", label: "Square" },
        { type: "rectangle", label: "Rectangle" },
        { type: "oval", label: "Oval" },
    ];


    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<string | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);
    const navBarRef = useRef<HTMLDivElement>(null);

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
            // const containerRect = containerRef.current.getBoundingClientRect();
            const containerRect = threeJsContainerRef.current?.getBoundingClientRect();
            const isOutOfBounds =
                e?.clientX - navBarRef.current.clientWidth - width / 2 < 0 ||
                e?.clientX - navBarRef.current.clientWidth + width / 2 > containerRect.width ||
                e?.clientY - height / 2 < 0 ||
                e?.clientY + height / 2 > containerRect.height;
            if(!isOutOfBounds) {
                const newShape = {
                    id: uuidv4(),
                    type: currentShape,
                    x: e.clientX - navBarRef.current.clientWidth - width / 2,
                    y: e.clientY - height / 2,
                    length: null,
                    width: width,
                    height: height,
                    color: null,
                    name: null,
                    rotate: null,
                    zIndex: 10,
                    zoom: 1,
                };
                setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape]);
                setActiveId(newShape.id)
            }
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
        return { left: position.x, top: position.y };
    };

    return (
        <nav className="Navbar" ref={navBarRef}>
            <h1>Shapes</h1>
            <div className={"draggables"}>
                {shapes.map((shape) => {
                    return (
                             <div key={shape.type} className={`draggable-shape ${shape.type}`} onMouseDown={(e) => handleMouseDown(e, shape.type)} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}></div>
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
                        zIndex: 10,
                    }}
                >
                    {/*{shapes.find((shape) => shape.type === currentShape)?.label}*/}
                </div>
            )}
        </nav>
    );
}
