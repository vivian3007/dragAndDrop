import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { toast } from "react-toastify";
import type * as THREE from "three";
import { db } from "../../firebase-config.js";
import { useT } from "../i18n/LanguageProvider";
import { EMPTY_YARN, SetView, ShapeMesh, TransformMode } from "./types";

// Hoe lang na de laatste wijziging een vorm naar Firestore gaat: slepen of een slider vuurt
// tientallen updates per seconde af, die hoeven niet allemaal naar de server.
const SAVE_DEBOUNCE_MS = 400;

// Alle state van de editor voor één ontwerp. Laadt alleen dát ontwerp: het document zelf,
// z'n vormen en z'n garen (vroeger haalde App.tsx bij het opstarten álle ontwerpen en al het
// garen van iedereen op). Leest altijd uit Firestore — met de lokale cache is dat direct, en
// zo is het na herladen of via een gedeelde link precies hetzelfde.
export function useEditorState(amigurumiId: string) {
    const t = useT();

    const [loading, setLoading] = useState(true);
    const [amigurumi, setAmigurumi] = useState<Amigurumi | null>(null);
    const [droppedShapes, setDroppedShapes] = useState<Shape[]>([]);
    const [yarnInfo, setYarnInfo] = useState<Yarn>(EMPTY_YARN);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [camera, setCamera] = useState<THREE.Camera | null>(null);
    const [shapeColor, setShapeColor] = useState("#FFFFFF");
    const [intersections, setIntersections] = useState<Intersection[]>([]);
    const [meshes, setMeshes] = useState<ShapeMesh[]>([]);
    const [setView, setSetView] = useState<SetView>(() => () => {});
    const [transformMode, setTransformMode] = useState<TransformMode>("translate");
    const [showGrid, setShowGrid] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setActiveId(null);
        setIntersections([]);
        setMeshes([]);
        (async () => {
            const [designSnap, shapesSnap] = await Promise.all([
                getDoc(doc(db, "amigurumi", amigurumiId)),
                getDocs(query(collection(db, "shapes"), where("amigurumi_id", "==", amigurumiId))),
            ]);
            const design = designSnap.exists() ? ({ id: designSnap.id, ...designSnap.data() } as Amigurumi) : null;
            const yarnSnap = design?.yarn_id ? await getDoc(doc(db, "yarn", design.yarn_id)) : null;
            if (cancelled) return;
            setAmigurumi(design);
            setDroppedShapes(shapesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shape));
            setYarnInfo(yarnSnap?.exists() ? ({ id: yarnSnap.id, ...yarnSnap.data() } as Yarn) : EMPTY_YARN);
        })()
            .catch((error) => {
                console.error("Fout bij laden van het ontwerp:", error);
                toast.error(t("errors.loadData", { message: String(error) }));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    // `t` hoort er bewust niet bij: een taalwissel hoeft het ontwerp niet opnieuw te laden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amigurumiId]);

    const persistShapeUpdate = useCallback(async (updatedShape: Shape) => {
        try {
            await updateDoc(doc(db, "shapes", updatedShape.id), {
                name: updatedShape.name,
                x: updatedShape.x,
                y: updatedShape.y,
                z: updatedShape.z,
                width: updatedShape.width,
                height: updatedShape.height,
                length: updatedShape.length,
                color: updatedShape.color,
                rotation_x: updatedShape.rotation_x,
                rotation_y: updatedShape.rotation_y,
                rotation_z: updatedShape.rotation_z,
                zoom: updatedShape.zoom,
            });
        } catch (error) {
            console.error("Fout bij opslaan van vorm:", error);
            toast.error(t("errors.updateShape", { message: String(error) }));
        }
    }, [t]);

    // Per vorm de laatst gewijzigde versie die nog niet is weggeschreven, met z'n timer.
    const pendingRef = useRef<Record<string, { shape: Shape; timer: ReturnType<typeof setTimeout> }>>({});
    const persistRef = useRef(persistShapeUpdate);
    persistRef.current = persistShapeUpdate;

    const handleUpdateShape = useCallback((updatedShape: Shape) => {
        setDroppedShapes((prev) => prev.map((shape) => (shape.id === updatedShape.id ? { ...shape, ...updatedShape } : shape)));
        if (!updatedShape.id) return;

        const pending = pendingRef.current;
        if (pending[updatedShape.id]) clearTimeout(pending[updatedShape.id].timer);
        pending[updatedShape.id] = {
            shape: updatedShape,
            timer: setTimeout(() => {
                delete pending[updatedShape.id];
                persistRef.current(updatedShape);
            }, SAVE_DEBOUNCE_MS),
        };
    }, []);

    // Bij het verlaten van de editor (of een ander ontwerp openen) nog openstaande wijzigingen
    // meteen wegschrijven — anders gaat de laatste versleping verloren.
    useEffect(() => {
        const pending = pendingRef.current;
        return () => {
            Object.entries(pending).forEach(([id, { shape, timer }]) => {
                clearTimeout(timer);
                delete pending[id];
                persistRef.current(shape);
            });
        };
    }, [amigurumiId]);

    const handleDeleteShape = useCallback(async (id: string) => {
        if (!id) return;
        let previousShapes: Shape[] = [];
        setDroppedShapes((prev) => {
            previousShapes = prev;
            return prev.filter((shape) => shape.id !== id);
        });
        setActiveId((prevActiveId) => (prevActiveId === id ? null : prevActiveId));
        const pending = pendingRef.current[id];
        if (pending) {
            clearTimeout(pending.timer);
            delete pendingRef.current[id];
        }
        try {
            await deleteDoc(doc(db, "shapes", id));
        } catch (error) {
            console.error("Fout bij verwijderen van vorm:", error);
            setDroppedShapes(previousShapes);
        }
    }, []);

    const handleUpdateYarnInfo = useCallback((updatedYarnInfo: Yarn) => {
        // Hetzelfde garen, of het eerste garen voor dit ontwerp (nog zonder id).
        setYarnInfo((prev) => (prev.id === undefined || prev.id === updatedYarnInfo.id ? { ...prev, ...updatedYarnInfo } : prev));
    }, []);

    const onSetView = useCallback((setViewFn: SetView) => {
        setSetView(() => setViewFn);
    }, []);

    const activeShape = droppedShapes.find((shape) => shape.id === activeId);

    return {
        loading,
        amigurumi,
        droppedShapes,
        setDroppedShapes,
        yarnInfo,
        handleUpdateYarnInfo,
        activeId,
        setActiveId,
        activeShape,
        dragging,
        setDragging,
        camera,
        setCamera,
        shapeColor,
        setShapeColor,
        intersections,
        setIntersections,
        meshes,
        setMeshes,
        setView,
        onSetView,
        transformMode,
        setTransformMode,
        showGrid,
        setShowGrid,
        handleUpdateShape,
        handleDeleteShape,
    };
}
