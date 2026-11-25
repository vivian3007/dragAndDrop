import { englishPatternTerms, PatternTerms } from "./patternTerms";
import { applyStripes } from "./colorChanges";
import { shapeDefinition, isKnownShapeType } from "../shapes/registry";
import type { GeneratedPattern } from "../shapes/types";

// Het uitgewerkte patroon van één vorm, met de kleurwissels erin verwerkt (zie colorChanges.ts).
export type PatternPart = ReturnType<typeof applyStripes<GeneratedPattern>>;

// Het uitgewerkte patroon van één vorm, of null voor een onbekend vormtype en voor iets dat
// geen eigen onderdeel is (ogen en borduursels, zie eyes.ts en embroidery.ts). Welke generator
// bij een vorm hoort, staat in z'n definitie (shapes/definitions/).
export function generatePattern(
    shape: Shape,
    yarnWeight: string,
    rowHeights: Record<string, number>,
    intersections: Intersection[],
    t: PatternTerms = englishPatternTerms,
): PatternPart | null {
    if (!isKnownShapeType(shape.type)) return null;
    const generate = shapeDefinition(shape.type).pattern;
    return generate ? applyStripes(generate(shape, yarnWeight, rowHeights, intersections, t), shape.stripes) : null;
}
