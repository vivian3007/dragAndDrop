import * as THREE from "three";

// 3D-geometrie van de vormen met een vlakke kant (cilinder, kegel). Net als de Arm: diameter
// 1, lokale hoogte 0..1, en de oorsprong in het midden van de onderkant. Daardoor werken de
// maat in cm (units.ts), de afmetingen (patternBounds.ts) en de kruispunten
// (calculateIntersections.tsx) voor deze vormen op dezelfde manier als voor de Arm.
//
// Gedeeld door de editor (SolidShape.tsx) en de ontwerp-snapshots (designSnapshot.ts).

export const SOLID_SHAPE_TYPES = ["Cylinder", "Cone"] as const;
export type SolidShapeType = (typeof SOLID_SHAPE_TYPES)[number];

export function isSolidShapeType(type: string | null | undefined): type is SolidShapeType {
    return (SOLID_SHAPE_TYPES as readonly string[]).includes(type ?? "");
}

export function createSolidGeometry(type: SolidShapeType): THREE.BufferGeometry {
    const geometry = type === "Cone"
        ? new THREE.ConeGeometry(0.5, 1, 32)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    // three.js zet deze vormen gecentreerd neer (-0.5..0.5); wij willen 0..1.
    geometry.translate(0, 0.5, 0);
    // calculateIntersections maakt voor CSG een grovere kopie uit `parameters`, maar die kent
    // de verschuiving hierboven niet: gebruik voor deze vormen de geometrie zelf.
    geometry.userData.skipCsgProxy = true;
    return geometry;
}
