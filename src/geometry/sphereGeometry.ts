import * as THREE from "three";
import { sphereEndAngle, sphereOpening } from "./sphereOpening";
import { deformToEgg, eggTaper } from "./eggShape";

// 3D-geometrie van een bol (straal 1, middelpunt in de oorsprong): eventueel met een opening
// (sphereOpening.ts) en eventueel als ei of peer (eggShape.ts). Gedeeld door de editor
// (Sphere.tsx) en de ontwerp-snapshots (designSnapshot.ts).
export function createSphereGeometry(shape: Partial<Shape>, widthSegments = 64, heightSegments = 48): THREE.SphereGeometry {
    const geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments, 0, Math.PI * 2, 0, sphereEndAngle(sphereOpening(shape)));
    applyEggShape(geometry, eggTaper(shape));
    return geometry;
}

// Maakt van een (eenheids)bol een ei. De mate van toelopen gaat mee in userData, zodat de
// grovere kopie voor de kruispunten (calculateIntersections.tsx) dezelfde vorm krijgt.
export function applyEggShape(geometry: THREE.BufferGeometry, taper: number): void {
    if (taper <= 0) return;
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    deformToEgg(position.array as Float32Array, normal ? (normal.array as Float32Array) : null, taper);
    position.needsUpdate = true;
    if (normal) normal.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData.eggTaper = taper;
}
