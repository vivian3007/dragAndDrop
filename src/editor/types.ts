import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsImpl } from "three-stdlib";

// Gedeelde types voor de editor-componenten (Editor, ThreeJsField, SceneController,
// Sphere/Arm, Sidebar, Settingsbar).

export type TransformMode = "translate" | "rotate" | "scale";

export type ViewKey = "front" | "back" | "left" | "right" | "top";

export type SetView = (viewKey: string) => void;

// Een vorm met de three.js-mesh die er in de scene bij hoort (calculateIntersections).
export type ShapeMesh = { id: string; mesh: THREE.Mesh };

export type OrbitControlsRef = React.RefObject<OrbitControlsImpl | null>;

export type TransformControlsRef = React.RefObject<TransformControlsImpl | null>;

// Een lege garen-toestand: nog niets gekozen of opgeslagen voor dit ontwerp.
export const EMPTY_YARN: Yarn = { name: null, weight: null, mPerSkein: null, hooksize: null, material: null, color: null };

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// Props die ThreeJsField aan elke vorm-component (Sphere, Arm) meegeeft.
export type ShapeComponentProps = {
    id: string;
    shape: Shape;
    orbitControlsRef: OrbitControlsRef;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdateShape: (shape: Shape) => void;
    transformMode: TransformMode;
    setTransformMode: (mode: TransformMode) => void;
    onDraggingChange?: (isDragging: boolean) => void;
    activeTransformControlsRef?: TransformControlsRef;
};

// Heeft de gebruiker net een as van de verplaats/draai/schaal-gizmo vastgepakt? Dan telt een
// klik niet als selecteren of deselecteren. `axis` is in de types van three-stdlib private,
// maar wel gewoon beschikbaar.
export function isGizmoAxisActive(ref: TransformControlsRef | undefined): boolean {
    const controls = ref?.current as unknown as { axis?: string | null } | null | undefined;
    return Boolean(controls?.axis);
}
