import type * as THREE from "three";
import { shapeDefinition } from "../shapes/registry";
import { createShapeGeometry } from "../shapes/geometry3d";

// Vormen met een vlakke kant (cilinder, kegel, plat rondje, motieven, ...): diameter 1, lokale
// hoogte 0..1, en de oorsprong in het midden van de onderkant (zie ShapeSpace "solid" in
// shapes/types.ts). Daardoor werken de maat in cm (units.ts), de afmetingen (patternBounds.ts)
// en de kruispunten (calculateIntersections.tsx) voor al deze vormen op dezelfde manier.
// De geometrie zelf staat in shapes/geometry3d.ts.

export function isSolidShapeType(type: string | null | undefined): boolean {
    return shapeDefinition(type).space === "solid" && !!type;
}

export function createSolidGeometry(type: string, shape?: Partial<Shape>): THREE.BufferGeometry {
    return createShapeGeometry({ ...shape, type });
}
