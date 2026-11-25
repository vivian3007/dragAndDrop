import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { stitchesToRows } from "./stitchSequence";
import { endsClosed, profileLength, profilePointAt, startsClosed } from "../shapes/profile";
import type { GeneratedPattern, ProfilePoint } from "../shapes/types";
import { patternBase } from "../shapes/common";

// Het patroon van een profielvorm (zie shapes/profile.ts), voor elke bolle vorm uit één
// profiel. Zo haak je zo'n vorm ook echt:
// - Rondes liggen op gelijke afstand langs het werk (één rondehoogte per ronde).
// - Elke ronde heeft zoveel steken als de omtrek daar breed is, afgerond op een veelvoud van 6
//   (er wordt in zes gelijke delen gemeerderd en geminderd).
// - Per ronde komen er hooguit 6 bij of af; waar het profiel sneller breder of smaller wordt,
//   blijft het werk iets binnen het profiel (de vorm wordt iets ronder, niet groter).
// - Waar het profiel een scherpe knik maakt (meer dan 50°) (een platte bodem, de rand van een hoedje), komt
//   een ronde in de achterste lus: daar knikt het werk.
// - Een dicht begin is een magische ring (6), een dicht eind wordt dichtgeminderd (12 → 6); een
//   open begin is een ring van lossen, een open eind wordt afgehecht.
export function generateProfilePattern(
    shape: Shape,
    profile: ProfilePoint[],
    yarnWeight: string,
    rowHeights: Record<string, number>,
    intersections: Intersection[],
    t: PatternTerms = englishPatternTerms,
): GeneratedPattern {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");

    // In het profiel is r de straal bij een diameter van 1: × diameter is de echte straal.
    const lengthCm = profileLength(profile, diameterCm, heightCm);
    const rows = Math.max(3, Math.round(lengthCm / rowHeightCm));
    const closedStart = startsClosed(profile);
    const closedEnd = endsClosed(profile);

    // Omtrek (in steken) op een plek langs het werk.
    const pointAt = (fraction: number) => profilePointAt(profile, fraction, diameterCm, heightCm);
    const stitchesAt = (fraction: number) => (2 * Math.PI * pointAt(fraction).r * diameterCm) / stitchWidthCm;
    const round6 = (value: number) => Math.max(6, Math.round(value / 6) * 6);

    // Gewenst aantal steken per ronde: de breedste rand van de ronde (de steken van een ronde
    // liggen bovenop de vorige ronde; bij het meerderen is dat de buitenrand, bij het minderen
    // de binnenrand).
    const target = Array.from({ length: rows }, (_, i) => round6(Math.max(stitchesAt(i / rows), stitchesAt((i + 1) / rows))));
    if (closedStart) target[0] = 6;
    if (closedEnd) {
        target[rows - 1] = 6;
        // De slotronde (6 min, geschreven door Pattern.tsx) gaat van 12 naar 6: de ronde ervoor
        // heeft dus 12 steken, ook als de vorm daar zo smal is dat er 6 zouden passen.
        target[rows - 2] = Math.max(target[rows - 2], 12);
    }

    // Scherpe knikken in het profiel (een platte bodem, de rand van een hoedje): de eerste ronde
    // na de knik in de achterste lus, zonder meerderen of minderen.
    const backLoopRows = new Set<number>();
    sharpBends(profile).forEach((index) => {
        const fraction = profileLength(profile.slice(0, index + 1), diameterCm, heightCm) / Math.max(lengthCm, 1e-9);
        const row = Math.min(rows - (closedEnd ? 1 : 0), Math.max(2, Math.floor(fraction * rows) + 1));
        backLoopRows.add(row);
    });

    // Hooguit 6 erbij of eraf per ronde: het grootste rijtje dat nergens boven het gewenste
    // aantal uitkomt en per ronde hooguit 6 verschilt. Een ronde in de achterste lus krijgt
    // evenveel steken als de ronde ervoor; zo nodig wordt de kant ervoor of erna wat smaller.
    const limit = (wanted: number[]) => wanted.map((_, i) => Math.min(...wanted.map((value, j) => value + 6 * Math.abs(i - j))));
    let stitches = limit(target);
    for (let pass = 0; pass < 8; pass++) {
        let changed = false;
        backLoopRows.forEach((row) => {
            const here = stitches[row - 1];
            const before = stitches[row - 2];
            if (here > before) target[row - 1] = before;
            else if (here < before) target[row - 2] = here;
            else return;
            changed = true;
        });
        if (!changed) break;
        stitches = limit(target);
    }

    // Opdelen: meerderen, recht door, en het laatste stuk minderen (vóór het minderen komt bij
    // een dichte vorm "begin met vullen", zie Pattern.tsx).
    const lastWritten = closedEnd ? rows - 1 : rows; // de slotronde (6 min) schrijft Pattern.tsx
    let lastIncrease = 1;
    for (let row = 2; row <= lastWritten; row++) if (stitches[row - 1] > stitches[row - 2]) lastIncrease = row;
    let firstFinalDecrease = lastWritten + 1;
    for (let row = lastIncrease + 1; row <= lastWritten; row++) {
        if (stitches[row - 1] < stitches[row - 2]) {
            firstFinalDecrease = row;
            break;
        }
    }
    const blo = (row: number) => backLoopRows.has(row);
    const incArray = stitchesToRows(t, stitches, 2, lastIncrease, blo);
    const scArray = stitchesToRows(t, stitches, lastIncrease + 1, firstFinalDecrease - 1, blo);
    const decArray = stitchesToRows(t, stitches, firstFinalDecrease, lastWritten, blo);

    // Een open begin: een ring van lossen (zoals bij de open buis).
    const firstRow: PatternRow | undefined = closedStart
        ? undefined
        : { from: 1, to: 1, instruction: t.tubeStart(stitches[0]), stitches: stitches[0] };

    // Kruispunten: de rondes op de hoogtes waar de andere vorm deze raakt.
    const rowHeightsY = Array.from({ length: rows }, (_, i) => pointAt((i + 0.5) / rows).y);
    const toRow = (fraction: number) => {
        let best = 0;
        rowHeightsY.forEach((y, i) => {
            if (Math.abs(y - fraction) < Math.abs(rowHeightsY[best] - fraction)) best = i;
        });
        return best + 1;
    };
    const intersectionRows: IntersectionRow[] = [];
    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis" || intersection.shape1 !== shape.id) return;
        const a = toRow(intersection.axisHighFraction);
        const b = toRow(intersection.axisLowFraction);
        intersectionRows.push({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: Math.min(a, b), bottomRow: Math.max(a, b) });
    });

    return {
        ...patternBase(shape),
        rows,
        incRows: stitches.filter((value, i) => i > 0 && value > stitches[i - 1]).length,
        // Dicht: Pattern.tsx zet er "begin met vullen" en de slotronde (6 min) bij.
        closed: closedEnd,
        flat: false,
        lastRow: rows,
        stitchCount: stitches.reduce((sum, n) => sum + n, 0),
        incArray,
        scArray,
        decArray,
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
        ...(firstRow ? { firstRow } : {}),
    };
}

// De punten (indexen) waar het profiel een knik van meer dan 50° maakt.
function sharpBends(profile: ProfilePoint[]): number[] {
    const bends: number[] = [];
    for (let i = 1; i <= profile.length - 2; i++) {
        const a = profile[i - 1];
        const b = profile[i];
        const c = profile[i + 1];
        const angle1 = Math.atan2(b.y - a.y, b.r - a.r);
        const angle2 = Math.atan2(c.y - b.y, c.r - b.r);
        let turn = Math.abs(angle2 - angle1);
        if (turn > Math.PI) turn = 2 * Math.PI - turn;
        if (turn > (50 * Math.PI) / 180) bends.push(i);
    }
    return bends;
}
