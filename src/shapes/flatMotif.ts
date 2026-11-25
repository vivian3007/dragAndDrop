import type { GeneratedPattern, OutlinePoint, ShapeDefinition, ShapeSetting } from "./types";
import type { PatternTerms } from "../patterns/patternTerms";
import { insideMotif, outlineCoordinates, outlineIcon, outlineSegmentsAt } from "./outline";
import { clamp01, FLAT_THICKNESS } from "./common";
import { meshScaleOf } from "../geometry/units";

// Een complete vormdefinitie voor een plat motief uit z'n omtrek (zie outline.ts) en een
// patroon. Zo is een nieuw motief één bestand.
//
// `worked`: hoe je het haakt, en dus hoe de rondes of rijen erover lopen (voor kleurwissels):
// - "rows": heen en weer, van onder naar boven (hart, lapje);
// - "rounds": vanuit het midden naar buiten (bloem, ster);
// - "chain": rond een rij lossen in het midden, van onder naar boven (blaadje).
export function flatMotif(options: {
    type: string;
    outline: (shape: Shape) => OutlinePoint[];
    worked: "rows" | "rounds" | "chain";
    pattern: (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t?: PatternTerms) => GeneratedPattern;
    settings?: ShapeSetting[];
    extraStitches?: ShapeDefinition["extraStitches"];
    // Verhouding lengte/breedte bij het neerzetten.
    aspect?: number;
}): ShapeDefinition {
    const { outline } = options;
    return {
        type: options.type,
        category: "flat",
        inPalette: true,
        space: "solid",
        attach: "applique",
        centerY: 0.5,
        inside: (shape, p) => insideMotif(outline(shape), p),
        crochetFraction: (shape, p) => {
            const { x, y } = outlineCoordinates(p);
            if (options.worked === "rows") return clamp01(y + 0.5);
            if (options.worked === "chain") {
                // Van de lossen in het midden naar de rand: de afstand als deel van de halve breedte.
                const width = outlineSegmentsAt(outline(shape), y).reduce((sum, [x0, x1]) => sum + (x1 - x0), 0);
                return clamp01(Math.abs(x) / Math.max(width / 2, 1e-6));
            }
            // Vanuit het midden: de afstand als deel van de afstand tot de rand in die richting.
            const [sx, , sz] = meshScaleOf(shape);
            return clamp01(Math.hypot(x * sx, y * sz) / (0.5 * Math.max(sx, sz)));
        },
        pattern: options.pattern,
        // De steekfoto ligt plat over het motief (zie geometryBuilders.ts): breedte × lengte.
        yarnSize: (_shape, cm) => ({ around: cm.width, along: cm.length }),
        geometryKey: (shape) => [meshScaleOf(shape), shape.petals ?? null],
        // Een laag garen dik, en rechtop naar je toe (zie geometryBuilders.ts).
        dropDefaults: ({ width }) => ({ height: FLAT_THICKNESS, length: width * (options.aspect ?? 1), rotation_x: 90 }),
        settings: options.settings ?? ["stripes"],
        icon: outlineIcon(outline({ petals: null } as unknown as Shape)),
        finishKey: "pattern.fastenOffMotif",
        extraStitches: options.extraStitches,
        outline,
    };
}
