import type { ShapeDefinition } from "../types";
import generateTubePattern from "../../patterns/generateTubePattern";
import { aroundAnd, clamp01, insideUnitCylinder } from "../common";

// Open buis, open aan beide kanten (nek, mouw, sjaal, kraag): een ring van lossen en rechte
// rondes (generateTubePattern.ts).
export const tube: ShapeDefinition = {
    type: "Tube",
    category: "round",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.5,
    inside: insideUnitCylinder,
    crochetFraction: (_shape, p) => clamp01(p.y),
    pattern: (shape, weight, rowHeights, intersections, t) => generateTubePattern(shape, weight, rowHeights, intersections, t),
    yarnSize: (_shape, cm) => aroundAnd(cm.diameter, cm.height),
    settings: ["stripes"],
    finishKey: "pattern.fastenOffTube",
    // Open aan beide kanten: je ziet hem ook van binnen.
    doubleSided: () => true,
};
