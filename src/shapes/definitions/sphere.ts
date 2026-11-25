import type { ShapeDefinition } from "../types";
import generateSpherePattern from "../../patterns/generateSpherePattern";
import { insideSphere, sphereCrochetFraction, sphereYarnSize } from "../common";
import { eggTaper } from "../../geometry/eggShape";

// Bol of ovaal (hoofd, lijf, neus), en met "Ei of peer" een ei of peer (geometry/eggShape.ts).
// In 3D een eenheidsbol (Sphere.tsx), gehaakt van pool tot pool (generateSpherePattern.tsx).
export const sphere: ShapeDefinition = {
    type: "Sphere",
    category: "round",
    inPalette: true,
    space: "sphere",
    attach: "ball",
    centerY: 0,
    inside: insideSphere,
    crochetFraction: sphereCrochetFraction,
    pattern: (shape, weight, rowHeights, intersections, t) => generateSpherePattern(shape, weight, rowHeights, intersections, t),
    yarnSize: sphereYarnSize,
    geometryKey: (shape) => eggTaper(shape),
    settings: ["egg", "stripes"],
};
