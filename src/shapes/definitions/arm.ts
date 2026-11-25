import type { ShapeDefinition } from "../types";
import generateArmPattern from "../../patterns/generateArmPattern";
import { ARM_TOTAL_LOCAL_LENGTH } from "../../geometry/armGeometry";
import { aroundAnd, clamp01, radialOf } from "../common";

// De oude arm: een cilinder met een halve bol erop (Arm.tsx, geometry/armGeometry.ts). Staat
// niet meer in de vormenbalk (een hoge halve bol is nu een arm), maar oude ontwerpen werken nog.
export const arm: ShapeDefinition = {
    type: "Arm",
    category: "round",
    inPalette: false,
    space: "arm",
    attach: "limb",
    centerY: ARM_TOTAL_LOCAL_LENGTH / 3,
    inside: (_shape, p) => (p.y >= 0 && p.y <= 1 && radialOf(p) <= 0.5) || Math.hypot(p.x, p.y - 1, p.z) <= 0.5,
    // Van het kapje naar de open kant.
    crochetFraction: (_shape, p) => clamp01((ARM_TOTAL_LOCAL_LENGTH - p.y) / ARM_TOTAL_LOCAL_LENGTH),
    pattern: (shape, weight, rowHeights, intersections, t) => generateArmPattern(shape, weight, rowHeights, intersections, t),
    // De textuur ligt over het cilinderdeel; het kapje is de rest van de lengte.
    yarnSize: (_shape, cm) => aroundAnd(cm.diameter, cm.height / ARM_TOTAL_LOCAL_LENGTH),
    settings: ["stripes"],
};
