import { useCallback, useRef, useState } from "react";
import type * as THREE from "three";

// De mesh van een vorm, als ref én als state. De gizmo (TransformControlsThree) krijgt de mesh
// als `object` mee tijdens het renderen; met alleen een ref is die bij de eerste render nog leeg
// (een ref wordt pas ná het renderen gevuld). Een vers neergezette vorm is meteen geselecteerd,
// dus de gizmo koppelde zich dan aan niets en bleef op de oorsprong staan tot de vorm om een
// andere reden opnieuw rendert. Via state rendert hij opnieuw zodra de mesh er is.
export function useMeshObject() {
    const meshRef = useRef<THREE.Mesh | null>(null);
    const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
    const meshCallbackRef = useCallback((node: THREE.Mesh | null) => {
        meshRef.current = node;
        setMesh(node);
    }, []);
    return { meshRef, mesh, meshCallbackRef };
}
