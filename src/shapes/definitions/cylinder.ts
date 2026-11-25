import type { ShapeDefinition } from "../types";
import generateCylinderPattern from "../../patterns/generateCylinderPattern";
import { meshScaleOf } from "../../geometry/units";
import { aroundAnd, insideUnitCylinder, radialOf } from "../common";

// Cilinder, dicht aan beide kanten (lijf, poot, hoed): platte bodem, rechte zijkant, platte
// bovenkant, met een ronde in de achterste lus bij elke rand (generateCylinderPattern.ts).
export const cylinder: ShapeDefinition = {
    type: "Cylinder",
    category: "round",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.5,
    inside: insideUnitCylinder,
    // Van het midden van de bodem via de zijkant naar het midden van de bovenkant.
    crochetFraction: (shape, point) => {
        const radial = radialOf(point);
        const [sx, sy, sz] = meshScaleOf(shape);
        const radius = (sx + sz) / 4;
        const total = 2 * radius + sy;
        if (point.y <= 1e-4) return (radial / 0.5) * radius / total;
        if (point.y >= 1 - 1e-4) return (radius + sy + (1 - radial / 0.5) * radius) / total;
        return (radius + point.y * sy) / total;
    },
    pattern: (shape, weight, rowHeights, intersections, t) => generateCylinderPattern(shape, weight, rowHeights, intersections, t),
    yarnSize: (_shape, cm) => aroundAnd(cm.diameter, cm.height),
    geometryKey: (shape) => meshScaleOf(shape),
    settings: ["stripes"],
};
