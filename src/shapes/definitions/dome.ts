import type { ShapeDefinition } from "../types";
import generateDomePattern from "../../patterns/generateDomePattern";
import { domeCapFraction, domeFractionAtHeight, domeLengths, insideDome } from "../../geometry/domeShape";
import { meshScaleOf } from "../../geometry/units";
import { aroundAnd } from "../common";

// Halve bol (muts, schelp, bolle snuit) en, als hij hoger is dan de halve breedte, een arm of
// been: een kapje met een buis eronder (geometry/domeShape.ts).
export const dome: ShapeDefinition = {
    type: "Dome",
    category: "round",
    inPalette: true,
    space: "solid",
    attach: "limb",
    centerY: 0.35,
    inside: (shape, p) => insideDome(p.x, p.y, p.z, domeCapFraction(shape)),
    crochetFraction: (shape, p) => {
        const [sx, sy, sz] = meshScaleOf(shape);
        return domeFractionAtHeight(p.y, (sx + sz) / 2, sy, domeCapFraction(shape));
    },
    pattern: (shape, weight, rowHeights, intersections, t) => generateDomePattern(shape, weight, rowHeights, intersections, t),
    // Over het kapje en (als die er is) de buis.
    yarnSize: (shape, cm) => aroundAnd(cm.diameter, domeLengths(cm.diameter, cm.height, domeCapFraction(shape)).total),
    geometryKey: (shape) => meshScaleOf(shape),
    // Half zo hoog als breed: een rond kapje.
    dropDefaults: ({ width }) => ({ height: width / 2 }),
    settings: ["stripes"],
};
