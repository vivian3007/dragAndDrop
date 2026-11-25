import type { ShapeDefinition } from "../types";
import generateOvalPattern from "../../patterns/generateOvalPattern";
import { meshScaleOf } from "../../geometry/units";
import { clamp01, FLAT_THICKNESS, insideUnitCylinder } from "../common";

// Plat ovaal (voetzool, buiklapje, plat oor): één laag, gehaakt rond een rij lossen
// (generateOvalPattern.ts). In 3D een dun, ovaal schijfje.
export const oval: ShapeDefinition = {
    type: "Oval",
    category: "flat",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.5,
    inside: insideUnitCylinder,
    // Rondes rond het rechte middenstuk (de lossen): de afstand tot dat middenstuk, als deel van
    // de halve korte kant.
    crochetFraction: (shape, point) => {
        const [sx, , sz] = meshScaleOf(shape);
        const half = Math.min(sx, sz) / 2;
        const straight = Math.abs(sx - sz) / 2;
        const along = sx >= sz ? Math.abs(point.x * sx) : Math.abs(point.z * sz);
        const across = sx >= sz ? point.z * sz : point.x * sx;
        return clamp01(Math.hypot(across, Math.max(0, along - straight)) / half);
    },
    pattern: (shape, weight, rowHeights, intersections, t) => generateOvalPattern(shape, weight, rowHeights, intersections, t),
    // Rond het rechte middenstuk: de omtrek van een ovaal met rechte zijkanten, en vanuit het
    // middenstuk naar de rand.
    yarnSize: (_shape, cm) => {
        const short = Math.min(cm.width, cm.length);
        return { around: Math.PI * short + 2 * Math.abs(cm.width - cm.length), along: short / 2 };
    },
    geometryKey: (shape) => meshScaleOf(shape),
    // Anderhalf keer zo lang als breed.
    dropDefaults: ({ width }) => ({ length: width * 1.6, height: FLAT_THICKNESS }),
    settings: ["stripes"],
    finishKey: "pattern.fastenOffOval",
};
