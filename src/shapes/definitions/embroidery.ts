import type { ShapeDefinition } from "../types";
import { meshScaleOf } from "../../geometry/units";
import { embroideryDefaults } from "../../patterns/embroidery";
import { insideUnitCylinder, sphereCrochetFraction, sphereYarnSize } from "../common";

// Borduurdetail (mondje, neusje, wenkbrauw, wangetje): een paar draadjes garen óp een onderdeel
// (patterns/embroidery.ts, geometry/embroideryGeometry.ts). Geen eigen haakpatroon.
export const embroidery: ShapeDefinition = {
    type: "Embroidery",
    category: "detail",
    inPalette: true,
    space: "solid",
    attach: "embroidery",
    centerY: 0,
    inside: insideUnitCylinder,
    crochetFraction: sphereCrochetFraction,
    pattern: null,
    yarnSize: sphereYarnSize,
    // Hangt af van de soort, de maat en de bolling van het oppervlak eronder.
    geometryKey: (shape) => [meshScaleOf(shape), shape.detail ?? null, shape.curvature ?? 0],
    // Begint als mondje, in z'n eigen maat en kleur.
    dropDefaults: () => embroideryDefaults("mouth"),
    settings: ["embroidery"],
    decoration: true,
    canHold: false,
};
