import { v4 as uuidv4 } from "uuid";
import { useT } from "./i18n/LanguageProvider";
import React, {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import type {Camera} from "three";
import { toast } from "react-toastify";
import type { SetState } from "./editor/types";
import { SHAPE_TYPES } from "./shapeTypes";
import { snapIfTouching } from "./geometry/attach";
import {setDoc, doc} from "firebase/firestore";
import {db} from "../firebase-config.js";


// Dikte van een plat rondje (een laag vasten), in opslag-eenheden (zie units.ts): ±0,3 cm.
const DISC_THICKNESS = 0.3 * 37.8;

// Muis of vinger, als React-event of als gewoon DOM-event (de window-listeners hieronder).
type PointerLikeEvent = MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent;

// Schermpositie van een muis- of touch-event. Bij `touchend` staat de vinger al niet meer in
// `touches`, maar wel in `changedTouches`.
const getEventCoordinates = (e: PointerLikeEvent) => {
    if ("touches" in e) {
        const touch = e.touches[0] ?? e.changedTouches[0];
        return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
    }
    return { x: e.clientX, y: e.clientY };
};

function Shapebar({ amigurumiId, shapes, setDroppedShapes, setActiveId, threeJsContainerRef, dragging, setDragging, camera }: {
    amigurumiId: string;
    shapes: Shape[];
    setDroppedShapes: SetState<Shape[]>;
    setActiveId: SetState<string | null>;
    threeJsContainerRef: React.RefObject<HTMLElement | null>;
    dragging: boolean;
    setDragging: SetState<boolean>;
    camera: Camera | null;
}) {

    const t = useT();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<string | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, shapeType: string) => {
        e.preventDefault();
        setDragging(true);
        setCurrentShape(shapeType);
        setPosition(getEventCoordinates(e));
    }

    const handleMouseMove = (e: PointerLikeEvent) => {
        if (dragging) {
            setPosition(getEventCoordinates(e));
        }
    }

    const handleMouseUp = async (e: PointerLikeEvent) => {
        if (dragging && currentShape) {
            const width = dragItemRef.current?.offsetWidth;
            const height = dragItemRef.current?.offsetHeight;
            const containerRect = threeJsContainerRef.current?.getBoundingClientRect();
            if (width === undefined || height === undefined || !containerRect) {
                setDragging(false);
                return;
            }
            // De vorm moet helemaal binnen het canvas vallen. Alles in schermcoördinaten: eerder
            // werd de muispositie met de canvashoogte vergeleken zonder de navigatiebalk erboven
            // mee te tellen, waardoor loslaten onderin het canvas stilletjes werd geweigerd.
            const { x: clientX, y: clientY } = getEventCoordinates(e);
            const isOutOfBounds =
                clientX - width / 2 < containerRect.left ||
                clientX + width / 2 > containerRect.right ||
                clientY - height / 2 < containerRect.top ||
                clientY + height / 2 > containerRect.bottom;

            const mouseX = ((clientX - containerRect.left) / containerRect.width) * 2 - 1;
            const mouseY = -((clientY - containerRect.top) / containerRect.height) * 2 + 1;

            let worldPosition = { x: 0, y: 0, z: 0 };
            if (camera) {
                const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
                vector.unproject(camera);

                const dir = vector.sub(camera.position).normalize();
                const distance = -camera.position.z / dir.z;
                const pos = camera.position.clone().add(dir.multiplyScalar(distance));
                worldPosition = { x: pos.x, y: pos.y, z: 0 };
            }

            if (!isOutOfBounds) {
                // Een oog is een veiligheidsoogje van 10 mm (bol-maat: straal, zie units.ts).
                const eyeSize = 1 * 37.8 / 2;
                const isEyeShape = currentShape === "Eye";
                const newShape: Shape & { zIndex: number } = {
                    id: uuidv4(),
                    amigurumi_id: amigurumiId,
                    type: currentShape,
                    x: worldPosition.x,
                    y: worldPosition.y,
                    z: 0,
                    length: isEyeShape ? eyeSize : width,
                    width: isEyeShape ? eyeSize : width,
                    // Plat rondje: de dikte van een laag garen; halve bol: half zo hoog als breed.
                    height: isEyeShape ? eyeSize : currentShape === "Disc" ? DISC_THICKNESS : currentShape === "Dome" ? width / 2 : height,
                    color: isEyeShape ? "#111111" : "#FFFFFF",
                    name: null,
                    rotation_x: 0,
                    rotation_y: 0,
                    rotation_z: 0,
                    zIndex: 10,
                    zoom: 1,
                };

                // Neergezet tegen (of in) een andere vorm: meteen netjes aansluiten.
                const placed = { ...newShape, ...(snapIfTouching(newShape, shapes)?.shape ?? {}) };
                setDroppedShapes((prevShapes) => [...prevShapes, placed]);
                setActiveId(placed.id);

                try {
                    const { id, ...shapeData } = placed;
                    await setDoc(doc(db, "shapes", id), shapeData);
                } catch (error) {
                    console.error("Fout bij opslaan van nieuwe vorm:", error);
                    toast.error(t("errors.saveShape", { message: String(error) }));
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
        <div className="shapebar">

            <h1 className="shapes-text">{t("shapebar.title")}</h1>
            <div className={"draggables"}>
                {SHAPE_TYPES.map((type) => (
                    <div key={type} className="palette-item">
                        <div
                            className={`draggable-shape ${type}`}
                            role="button"
                            aria-label={t(`shapes.${type}`)}
                            title={t(`shapes.${type}.hint`)}
                            onMouseDown={(e) => handleMouseDown(e, type)}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={(e) => handleMouseDown(e, type)}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                        />
                        <span className="palette-label">{t(`shapes.${type}`)}</span>
                    </div>
                ))}
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
        </div>
    );
}

export default React.memo(Shapebar);
