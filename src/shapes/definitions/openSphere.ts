import type { ShapeDefinition } from "../types";
import generateSpherePattern from "../../patterns/generateSpherePattern";
import { insideSphere, sphereCrochetFraction, sphereYarnSize } from "../common";
import { eggTaper } from "../../geometry/eggShape";
import { sphereOpening } from "../../geometry/sphereOpening";

// Bol met een opening (geometry/sphereOpening.ts): een snuit, of een lijf waar het hoofd op komt.
export const openSphere: ShapeDefinition = {
    type: "OpenSphere",
    category: "round",
    inPalette: true,
    space: "sphere",
    attach: "openSphere",
    centerY: 0,
    inside: insideSphere,
    crochetFraction: sphereCrochetFraction,
    pattern: (shape, weight, rowHeights, intersections, t) => generateSpherePattern(shape, weight, rowHeights, intersections, t),
    yarnSize: sphereYarnSize,
    geometryKey: (shape) => [sphereOpening(shape), eggTaper(shape)],
    settings: ["opening", "egg", "stripes"],
    finishKey: "pattern.stuffOpening",
    doubleSided: () => true,
};
