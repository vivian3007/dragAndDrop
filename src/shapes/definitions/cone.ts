import type { ShapeDefinition } from "../types";
import generateConePattern from "../../patterns/generateConePattern";
import { coneRadiusAt, coneTop } from "../../geometry/coneShape";
import { meshScaleOf } from "../../geometry/units";
import { aroundAnd, clamp01, radialOf } from "../common";

// Kegel (oor, snuit, hoorn, puntmuts), of taps toelopend met een platte bovenkant
// (geometry/coneShape.ts). In 3D de onderkant op de oorsprong en de punt op y = 1.
export const cone: ShapeDefinition = {
    type: "Cone",
    category: "round",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.3,
    inside: (shape, p) => p.y >= 0 && p.y <= 1 && radialOf(p) <= coneRadiusAt(p.y, coneTop(shape)),
    crochetFraction: (shape, point) => {
        // De bodem van de 3D-kegel is de open rand: de laatste ronde.
        if (point.y <= 1e-4) return 1;
        const top = coneTop(shape);
        if (top === 0) return clamp01(1 - point.y);
        // Taps toelopend: eerst het platte rondje bovenop (van het midden naar de rand), dan
        // de schuine zijde naar beneden.
        const [sx, sy, sz] = meshScaleOf(shape);
        const bottomRadius = (sx + sz) / 4;
        const topRadius = top * bottomRadius;
        const slant = Math.hypot(sy, bottomRadius - topRadius);
        const total = topRadius + slant;
        if (point.y >= 1 - 1e-4) return clamp01((radialOf(point) / (0.5 * top)) * topRadius / total);
        return clamp01((topRadius + (1 - point.y) * slant) / total);
    },
    pattern: (shape, weight, rowHeights, intersections, t) => generateConePattern(shape, weight, rowHeights, intersections, t),
    // Langs de schuine zijde (bij een taps toelopende kegel alleen het schuine stuk).
    yarnSize: (shape, cm) => aroundAnd(cm.diameter, Math.hypot(cm.height, (cm.diameter / 2) * (1 - coneTop(shape)))),
    geometryKey: (shape) => [meshScaleOf(shape), coneTop(shape)],
    settings: ["coneTop", "stripes"],
};
