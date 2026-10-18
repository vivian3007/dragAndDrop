import generateSpherePattern from "./generateSpherePattern";
import generateArmPattern from "./generateArmPattern";
import generateCylinderPattern from "./generateCylinderPattern";
import generateConePattern from "./generateConePattern";
import generateDiscPattern from "./generateDiscPattern";
import generateDomePattern from "./generateDomePattern";
import generateOvalPattern from "./generateOvalPattern";
import generateTubePattern from "./generateTubePattern";
import { englishPatternTerms, PatternTerms } from "./patternTerms";
import { applyStripes } from "./colorChanges";

// Welke patroongenerator bij welk vormtype hoort. Eén plek, zodat de patroonpagina en de
// garenschatting altijd dezelfde vormen kennen. Ogen en borduursels hebben geen eigen
// patroon (zie eyes.ts en embroidery.ts).
const generators = {
    Sphere: generateSpherePattern,
    OpenSphere: generateSpherePattern,
    Arm: generateArmPattern,
    Cylinder: generateCylinderPattern,
    Tube: generateTubePattern,
    Cone: generateConePattern,
    Disc: generateDiscPattern,
    Oval: generateOvalPattern,
    Dome: generateDomePattern,
};

type GeneratedPattern = ReturnType<(typeof generators)[keyof typeof generators]>;

// Het uitgewerkte patroon van één vorm, met de kleurwissels erin verwerkt (zie colorChanges.ts).
export type PatternPart = ReturnType<typeof applyStripes<GeneratedPattern>>;

// Het uitgewerkte patroon van één vorm, of null voor een onbekend vormtype.
export function generatePattern(
    shape: Shape,
    yarnWeight: string,
    rowHeights: Record<string, number>,
    intersections: Intersection[],
    t: PatternTerms = englishPatternTerms,
): PatternPart | null {
    const generate = generators[shape.type as keyof typeof generators];
    return generate ? applyStripes(generate(shape, yarnWeight, rowHeights, intersections, t), shape.stripes) : null;
}
