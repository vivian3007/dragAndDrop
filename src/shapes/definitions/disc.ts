import type { ShapeDefinition } from "../types";
import generateDiscPattern from "../../patterns/generateDiscPattern";
import { clamp01, FLAT_THICKNESS, insideUnitCylinder, radialOf } from "../common";

// Plat rondje (plat oor, oogje, buiklapje): één laag, vanuit een magische ring meerderen.
// In 3D een dunne cilinder; de dikte (height) is die ene laag garen.
export const disc: ShapeDefinition = {
    type: "Disc",
    category: "flat",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.5,
    inside: insideUnitCylinder,
    // Van het midden naar de rand.
    crochetFraction: (_shape, p) => clamp01(radialOf(p) / 0.5),
    pattern: (shape, weight, rowHeights, intersections, t) => generateDiscPattern(shape, weight, rowHeights, intersections, t),
    yarnSize: (_shape, cm) => ({ around: Math.PI * cm.diameter, along: cm.diameter / 2 }),
    dropDefaults: () => ({ height: FLAT_THICKNESS }),
    settings: ["stripes"],
};
