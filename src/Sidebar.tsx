import { v4 as uuidv4 } from "uuid";
import React, {Ref, useEffect, useRef, useState} from "react";
import Trashcan from "./Trashcan.tsx";
import * as THREE from "three";
import {Camera} from "three";
import {setDoc, doc} from "firebase/firestore";
import {db} from "../firebase-config.js";


export default function Sidebar({ setDroppedShapes, setActiveId, containerRef, threeJsContainerRef, dragging, setDragging, camera }: { setDroppedShapes: any, setActiveId: any, containerRef: Ref<HTMLDivElement>, threeJsContainerRef: Ref<HTMLCanvasElement>, dragging: boolean, setDragging: any, camera: Camera }) {
    const shapes = [
        { type: "Sphere", label: "Head" },
        { type: "Arm", label: "body" },
        { type: "leftArm", label: "LeftArm" },
        { type: "leftLeg", label: "LeftLeg" },
        { type: "square", label: "Square" },
        { type: "oval", label: "Oval" },
    ];

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<string | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);
    const navBarRef = useRef<HTMLDivElement>(null);

    const getEventCoordinates = (e: any) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };


    const handleMouseDown = (e: any, shapeType: any) => {
        e.preventDefault();
        setDragging(true);
        setCurrentShape(shapeType);
        const coords = getEventCoordinates(e);
        setPosition(coords);
    }

    const handleMouseMove = (e) => {
        if (dragging) {
            const coords = getEventCoordinates(e);
            setPosition(coords);
        }
    }

    const handleMouseUp = async (e) => {
        if (dragging && currentShape) {
            const width = dragItemRef.current?.offsetWidth;
            const height = dragItemRef.current?.offsetHeight;
            const containerRect = threeJsContainerRef.current?.getBoundingClientRect();
            const isOutOfBounds =
                e?.clientX - navBarRef.current.clientWidth - width / 2 < 0 ||
                e?.clientX - navBarRef.current.clientWidth + width / 2 > containerRect.width ||
                e?.clientY - height / 2 < 0 ||
                e?.clientY + height / 2 > containerRect.height;


            const mouseX = ((e.clientX - containerRect.left) / containerRect.width) * 2 - 1;
            const mouseY = -((e.clientY - containerRect.top) / containerRect.height) * 2 + 1;

            let worldPosition = { x: 0, y: 0, z: 0 };
            if (camera) {
                console.log("camera")
                const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
                vector.unproject(camera);

                const dir = vector.sub(camera.position).normalize();
                const distance = -camera.position.z / dir.z;
                const pos = camera.position.clone().add(dir.multiplyScalar(distance));
                worldPosition = { x: pos.x, y: pos.y, z: 0 };
            }

            if(!isOutOfBounds) {
                const newShape = {
                    id: uuidv4(),
                    type: currentShape,
                    x: worldPosition.x,
                    y: worldPosition.y,
                    z: 0,
                    length: width,
                    width: width,
                    height: height,
                    color: "#FFFFFF",
                    name: null,
                    rotation_x: 0,
                    rotation_y: 0,
                    rotation_z: 0,
                    zIndex: 10,
                    zoom: 1,
                };
                setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape]);
                setActiveId(newShape.id)

                try {
                    const shapeRef = doc(db, "shapes", newShape.id);

                    const shapeData: { [key: string]: any } = {
                        type: newShape.type,
                        x: newShape.x ?? 0,
                        y: newShape.y ?? 0,
                        z: newShape.z ?? 0,
                        width: newShape.width ?? 0,
                        height: newShape.height ?? 0,
                        length: newShape.length ?? 0,
                        color: newShape.color ?? "#FFFFFF",
                        name: newShape.name ?? null,
                        rotation_x: newShape.rotation_x ?? 0,
                        rotation_y: newShape.rotation_y ?? 0,
                        rotation_z: newShape.rotation_z ?? 0,
                        zIndex: newShape.zIndex ?? 10,
                        zoom: newShape.zoom ?? 1,
                    };

                    Object.keys(shapeData).forEach((key) => {
                        if (shapeData[key] === undefined) {
                            console.warn(`Field ${key} is undefined, excluding from Firestore`);
                            delete shapeData[key];
                        }
                    });

                    await setDoc(shapeRef, shapeData);
                } catch (error) {
                    console.error("Error saving shape to Firestore:", error);
                    alert("Error saving shape: " + error);
                }
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
            <h1 className="shapes-text">Shapes</h1>
            <div className={"draggables"}>
                {shapes.map((shape) => {
                    return (
                             <div key={shape.type} className={`draggable-shape ${shape.type}`} onMouseDown={(e) => handleMouseDown(e, shape.type)} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={(e) => {handleMouseDown(e, shape.type)}} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}></div>
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
