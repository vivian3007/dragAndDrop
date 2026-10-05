import * as THREE from "three";
import { computePatternBounds } from "./patternBounds";

// Zelfde als computePatternBounds, als THREE.Box3 voor code die toch al in de 3D-scene zit
// (camera richten, snapshot, spiegelen).
export function computePatternBox(shapes: Shape[]): THREE.Box3 | null {
    const bounds = computePatternBounds(shapes);
    return bounds ? new THREE.Box3(new THREE.Vector3(...bounds.min), new THREE.Vector3(...bounds.max)) : null;
}
