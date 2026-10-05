import * as THREE from "three";
import { computePatternBox } from "./patternBounds";

// Spiegelt een vorm links↔rechts (wereld-X, de horizontale as in het vooraanzicht) in het
// verticale vlak door het midden van de óverige vormen — een arm aan de rechterkant van
// het lijf komt zo precies aan de linkerkant, ook als het lijf niet op x=0 staat.
//
// Rotaties: spiegelen in het vlak loodrecht op X is M·R·M met M = diag(-1, 1, 1). Dat laat
// de rotatie óm X ongemoeid en keert die om Y en Z om, per Euler-factor afzonderlijk, dus
// het klopt voor elke rotatievolgorde. De lokale geometrie van Sphere en Arm is zelf
// symmetrisch in X, dus de gespiegelde vorm is weer gewoon een (geroteerde) Sphere/Arm.
export function mirrorShape(shape: Shape & { id: string }, allShapes: (Shape & { id: string })[]): Omit<Shape, "id"> {
    const others = allShapes.filter((other) => other.id !== shape.id);
    const box = computePatternBox(others);
    const mirrorX = box ? box.getCenter(new THREE.Vector3()).x : 0;

    return {
        ...shape,
        x: 2 * mirrorX - (shape.x ?? 0),
        rotation_x: shape.rotation_x ?? 0,
        rotation_y: -(shape.rotation_y ?? 0),
        rotation_z: -(shape.rotation_z ?? 0),
    };
}
