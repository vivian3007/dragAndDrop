import type { ShapeDefinition } from "../types";
import { insideSphere, sphereCrochetFraction, sphereYarnSize } from "../common";

// Veiligheidsoogje van 10 mm (patterns/eyes.ts): geen eigen onderdeel, maar een plek op een
// ander onderdeel. In 3D een glanzend bolletje (Sphere.tsx).
const EYE_SIZE = (1 * 37.8) / 2; // straal 0,5 cm in bol-maat (zie geometry/units.ts)

export const eye: ShapeDefinition = {
    type: "Eye",
    category: "detail",
    inPalette: true,
    space: "sphere",
    attach: "ball",
    centerY: 0,
    inside: insideSphere,
    crochetFraction: sphereCrochetFraction,
    pattern: null,
    yarnSize: sphereYarnSize,
    dropDefaults: () => ({ width: EYE_SIZE, height: EYE_SIZE, length: EYE_SIZE, color: "#111111" }),
    settings: [],
    decoration: true,
};
