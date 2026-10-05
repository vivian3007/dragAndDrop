import { MutableRefObject, useCallback, useRef, useState } from "react";

// Wijzigingen kort na elkaar tellen als één stap: slepen met de gizmo of een slider vuurt
// tientallen updates per seconde af, en die wil je in één keer ongedaan maken.
const COALESCE_MS = 600;
const MAX_STEPS = 100;

// Undo/redo voor de vormen in de editor. Bewaart snapshots van de vormen-array; omdat
// handleUpdateShape alleen het gewijzigde object vervangt, delen snapshots de ongewijzigde
// vormen gewoon (geen diepe kopieën nodig) en is "veranderd" een kwestie van identiteit.
// `applySnapshot` zet een snapshot terug in de state én in Firestore (zie Editor.tsx).
export function useShapeHistory(
    shapes: Shape[],
    applySnapshot: (target: Shape[], current: Shape[]) => void,
) {
    const shapesRef = useRef(shapes);
    shapesRef.current = shapes;
    const applyRef = useRef(applySnapshot);
    applyRef.current = applySnapshot;

    const pastRef = useRef<Shape[][]>([]);
    const futureRef = useRef<Shape[][]>([]);
    const lastChangeRef = useRef(0);
    const [counts, setCounts] = useState({ past: 0, future: 0 });

    const syncCounts = () => setCounts({ past: pastRef.current.length, future: futureRef.current.length });

    // Aanroepen vlak vóór elke wijziging door de gebruiker.
    const checkpoint = useCallback(() => {
        const now = Date.now();
        if (now - lastChangeRef.current > COALESCE_MS) {
            pastRef.current = [...pastRef.current, shapesRef.current].slice(-MAX_STEPS);
            futureRef.current = [];
            syncCounts();
        }
        lastChangeRef.current = now;
    }, []);

    const step = useCallback((from: MutableRefObject<Shape[][]>, to: MutableRefObject<Shape[][]>) => {
        const target = from.current[from.current.length - 1];
        if (!target) return;
        from.current = from.current.slice(0, -1);
        to.current = [...to.current, shapesRef.current];
        // Volgende wijziging is altijd een nieuwe stap, ook als die direct volgt.
        lastChangeRef.current = 0;
        applyRef.current(target, shapesRef.current);
        syncCounts();
    }, []);

    const undo = useCallback(() => step(pastRef, futureRef), [step]);
    const redo = useCallback(() => step(futureRef, pastRef), [step]);

    const reset = useCallback(() => {
        pastRef.current = [];
        futureRef.current = [];
        lastChangeRef.current = 0;
        syncCounts();
    }, []);

    return { checkpoint, undo, redo, reset, canUndo: counts.past > 0, canRedo: counts.future > 0 };
}
