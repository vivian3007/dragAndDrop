import { v4 as uuidv4 } from "uuid";
import { useT } from "./i18n/LanguageProvider";
import React, {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import type {Camera} from "three";
import { toast } from "react-toastify";
import type { SetState } from "./editor/types";
import { PALETTE_GROUPS } from "./shapeTypes";
import { hasShapeIcon, shapeDefinition } from "./shapes/registry";
import ShapeIcon from "./ShapeIcon";
import { snapIfTouching } from "./geometry/attach";
import {setDoc, doc} from "firebase/firestore";
import {db} from "../firebase-config.js";


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

// Zo ver moet een vinger bewegen voordat het slepen (of scrollen) telt; minder is tikken.
const TAP_SLOP_PX = 10;

// Een vinger die op een vorm in de vormenbalk is neergekomen, maar nog niet sleept.
type PendingTouch = { type: string; x: number; y: number; width: number; height: number };

// `layout`: "sidebar" is de kolom naast het canvas (laptop, tablet liggend), "strip" de
// horizontale strook onder het canvas op een telefoon. In de strook pakt een vinger een vorm
// pas op als hij omhoog beweegt (naar het canvas); opzij vegen scrollt alleen de strook.
function Shapebar({ amigurumiId, shapes, setDroppedShapes, setActiveId, threeJsContainerRef, dragging, setDragging, camera, layout = "sidebar" }: {
    amigurumiId: string;
    shapes: Shape[];
    setDroppedShapes: SetState<Shape[]>;
    setActiveId: SetState<string | null>;
    threeJsContainerRef: React.RefObject<HTMLElement | null>;
    dragging: boolean;
    setDragging: SetState<boolean>;
    camera: Camera | null;
    layout?: "sidebar" | "strip";
}) {

    const t = useT();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<string | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);
    const pendingTouchRef = useRef<PendingTouch | null>(null);

    const startDrag = (shapeType: string, at: { x: number; y: number }) => {
        setDragging(true);
        setCurrentShape(shapeType);
        setPosition(at);
    }

    const stopDrag = () => {
        pendingTouchRef.current = null;
        setDragging(false);
        setCurrentShape(null);
    }

    const handleMouseDown = (e: React.MouseEvent, shapeType: string) => {
        e.preventDefault();
        startDrag(shapeType, getEventCoordinates(e));
    }

    // Een vinger op een vorm: nog niet slepen. Pas bij bewegen blijkt of het slepen, scrollen
    // of (bij loslaten zonder bewegen) tikken is. Zo verschijnt er geen opgepakte vorm onder
    // je vinger als je alleen door de strook scrollt.
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, shapeType: string) => {
        const { x, y } = getEventCoordinates(e);
        const { offsetWidth: width, offsetHeight: height } = e.currentTarget;
        pendingTouchRef.current = { type: shapeType, x, y, width, height };
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const at = getEventCoordinates(e);
        if (dragging) {
            setPosition(at);
            return;
        }
        const pending = pendingTouchRef.current;
        if (!pending) return;
        const dx = at.x - pending.x;
        const dy = at.y - pending.y;
        if (Math.hypot(dx, dy) < TAP_SLOP_PX) return;
        const startsDrag = layout === "sidebar" || -dy > Math.abs(dx);
        if (startsDrag) {
            startDrag(pending.type, at);
        } else {
            // Opzij of omlaag: dat is scrollen, geen slepen.
            pendingTouchRef.current = null;
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        // Geen nagebootste muisklik na de touch: die zou de vorm opnieuw oppakken.
        if (e.cancelable) e.preventDefault();
        const pending = pendingTouchRef.current;
        if (dragging) {
            handleMouseUp(e);
            return;
        }
        // Aangetikt zonder te bewegen: de vorm komt midden in het canvas.
        const containerRect = threeJsContainerRef.current?.getBoundingClientRect();
        if (pending && containerRect) {
            placeShape(
                pending.type,
                containerRect.left + containerRect.width / 2,
                containerRect.top + containerRect.height / 2,
                pending.width,
                pending.height,
            );
        }
        stopDrag();
    }

    // De browser neemt het gebaar over (de strook scrollt): dan wordt er niets neergezet.
    const handleTouchCancel = () => stopDrag();

    const handleMouseMove = (e: PointerLikeEvent) => {
        if (dragging) {
            setPosition(getEventCoordinates(e));
        }
    }

    // Zet een nieuwe vorm neer op schermpositie (clientX, clientY), met de maat van het
    // vormpje in de balk. Valt hij niet helemaal binnen het canvas, dan gebeurt er niets.
    // Alles in schermcoördinaten: eerder werd de muispositie met de canvashoogte vergeleken
    // zonder de navigatiebalk erboven mee te tellen, waardoor loslaten onderin het canvas
    // stilletjes werd geweigerd.
    const placeShape = async (shapeType: string, clientX: number, clientY: number, width: number, height: number) => {
        const containerRect = threeJsContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const isOutOfBounds =
            clientX - width / 2 < containerRect.left ||
            clientX + width / 2 > containerRect.right ||
            clientY - height / 2 < containerRect.top ||
            clientY + height / 2 > containerRect.bottom;
        if (isOutOfBounds) return;

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

        // In de maat van het vormpje in de balk; elke vorm kan daar z'n eigen standaard op zetten
        // (een plat rondje is een laag garen dik, een oog 10 mm, ...: dropDefaults in z'n definitie).
        const newShape: Shape & { zIndex: number } = {
            id: uuidv4(),
            amigurumi_id: amigurumiId,
            type: shapeType,
            x: worldPosition.x,
            y: worldPosition.y,
            z: 0,
            length: width,
            width,
            height,
            color: "#FFFFFF",
            name: null,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
            zIndex: 10,
            zoom: 1,
            ...shapeDefinition(shapeType).dropDefaults?.({ width, height }),
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

    // Loslaten na slepen (muis of vinger): neerzetten waar losgelaten, in de maat van de
    // opgepakte vorm.
    const handleMouseUp = (e: PointerLikeEvent) => {
        const width = dragItemRef.current?.offsetWidth;
        const height = dragItemRef.current?.offsetHeight;
        if (dragging && currentShape && width !== undefined && height !== undefined) {
            const { x, y } = getEventCoordinates(e);
            placeShape(currentShape, x, y, width, height);
        }
        stopDrag();
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
            {PALETTE_GROUPS.map(({ category, types }) => (
            <React.Fragment key={category}>
            <h2 className="palette-group-title">{t(`shapebar.group.${category}`)}</h2>
            <div className={"draggables"}>
                {types.map((type) => (
                    <div key={type} className="palette-item">
                        {/* Vak om de vorm heen: in de vormenstrook op de telefoon kleiner (zie styles.css). */}
                        <div className="palette-shape-box">
                        <div
                            className={`draggable-shape ${type}${hasShapeIcon(type) ? " has-icon" : ""}`}
                            role="button"
                            aria-label={t(`shapes.${type}`)}
                            title={t(`shapes.${type}.hint`)}
                            onMouseDown={(e) => handleMouseDown(e, type)}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={(e) => handleTouchStart(e, type)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                        >
                            <ShapeIcon type={type} />
                        </div>
                        </div>
                        <span className="palette-label">{t(`shapes.${type}`)}</span>
                    </div>
                ))}
            </div>
            </React.Fragment>
            ))}
            {dragging && currentShape && (
                <div
                    ref={dragItemRef}
                    className={`draggable-shape ${currentShape}${hasShapeIcon(currentShape) ? " has-icon" : ""}`}
                    style={{
                        // Fixed: de positie is in schermcoördinaten, ook als de pagina gescrold is.
                        position: "fixed",
                        ...getCenteredPosition(),
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                >
                    <ShapeIcon type={currentShape} />
                </div>
            )}
        </div>
    );
}

export default React.memo(Shapebar);
