import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { coneTop } from "../geometry/coneShape";
import { stitchesToRows } from "./stitchSequence";

// Kegel (bv. een oor, snuit, hoorn of puntmuts): gehaakt vanaf de punt, steeds iets breder,
// tot de open onderkant die aan een andere vorm wordt genaaid. In 3D (SolidShape.tsx) ligt de
// oorsprong in het midden van de onderkant en de punt op lokale hoogte 1.
//
// Er wordt langs de schuine zijde gehaakt. De meerderingen worden zo gelijk mogelijk over de
// rondes verdeeld: elke ronde komen er 0 of 6 steken bij, zodat de kegel recht uitloopt.
//
// Taps toelopend (geometry/coneShape.ts): eerst een plat rondje tot de breedte van de bovenkant,
// dan één ronde in de achterste lus (de rand) en daarna de schuine zijde.
const generateConePattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");
    const top = coneTop(shape);
    // Steken van de bovenkant: een plat rondje van die breedte (minstens 12, anders is het
    // gewoon een punt).
    const topStitches = top > 0 ? maxStitchesForDiameter(diameterCm * top, stitchWidthCm) : 6;
    const topRows = topStitches / 6; // het platte rondje: 6, 12, …, topStitches
    const topCm = top > 0 ? (topStitches * stitchWidthCm) / Math.PI : 0;
    const slantCm = Math.hypot(heightCm, (diameterCm - topCm) / 2);
    // Met een punt telt de schuine zijde vanaf ronde 1; taps toelopend komt hij na het rondje.
    const slantRows = top > 0 ? Math.max(2, Math.round(slantCm / rowHeightCm)) : 0;
    const rows = top > 0 ? topRows + slantRows : Math.max(2, Math.round(slantCm / rowHeightCm));

    // Per ronde kan er hooguit 6 bij; een heel platte, brede kegel wordt daarom iets smaller.
    // (Taps toelopend: de eerste schuine ronde is de rand in de achterste lus, zonder meerderen.)
    const growRows = top > 0 ? slantRows - 1 : rows;
    let maxStitches = Math.max(topStitches, maxStitchesForDiameter(diameterCm, stitchWidthCm));
    while (maxStitches > Math.max(12, topStitches) && (maxStitches - (top > 0 ? topStitches : 0)) / 6 > growRows) {
        maxStitches -= 6;
    }
    const steps = maxStitches / 6;

    // Steken per ronde. Met een punt: van 6 (ronde 1) gelijkmatig oplopend naar maxStitches
    // (laatste ronde). Taps toelopend: het platte rondje, de rand, en dan gelijkmatig van de
    // bovenkant naar maxStitches.
    const topSteps = (maxStitches - topStitches) / 6;
    const stitchesPerRow = top > 0
        ? [
            ...Array.from({ length: topRows }, (_, i) => (i + 1) * 6),
            topStitches,
            // De meerderingen gelijk over de schuine zijde verdeeld; de laatste ronde is de onderkant.
            ...Array.from({ length: growRows }, (_, i) => topStitches + 6 * Math.round(((i + 0.5) * topSteps) / growRows)),
        ]
        : Array.from({ length: rows }, (_, i) => 6 * Math.max(1, Math.ceil(((i + 1) * steps) / rows)));
    const edgeRow = top > 0 ? topRows + 1 : 0;

    const incArray: PatternRow[] = [];
    const intersectionRows: IntersectionRow[] = [];

    // Hoogte als fractie van de onderkant (0) naar de punt of bovenkant (1). Ronde 1 is de
    // punt; taps toelopend ligt het hele platte rondje bovenop, en begint de schuine zijde bij
    // de rand.
    const toRow = (fraction: number) => {
        const clamped = Math.min(1, Math.max(0, fraction));
        if (top > 0) return Math.min(rows, Math.max(1, Math.round((1 - clamped) * (slantRows - 1)) + edgeRow));
        return Math.min(rows, Math.max(1, Math.round((1 - clamped) * (rows - 1)) + 1));
    };
    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis" || intersection.shape1 !== shape.id) return;
        intersectionRows.push({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow: toRow(intersection.axisHighFraction),
            bottomRow: toRow(intersection.axisLowFraction),
        });
    });

    // Ronde 1 (magische ring, 6) schrijft Pattern.tsx zelf. Opeenvolgende rondes zonder
    // meerderen worden samengevoegd ("Ronde 5-7: 18 v (18)").
    incArray.push(...stitchesToRows(t, stitchesPerRow, 2, rows, (row) => row === edgeRow));

    return {
        type: shape.type,
        color: shape.color,
        name: shape.name,
        width: shape.width,
        height: shape.height,
        rotation_x: shape.rotation_x,
        rotation_y: shape.rotation_y,
        rotation_z: shape.rotation_z,
        rows,
        // Breedte van de platte bovenkant (0 = punt), voor het plaatje op de patroonpagina.
        topWidth: top,
        incRows: top > 0 ? topRows + topSteps : steps,
        // Open onderkant: geen slotronde.
        closed: false,
        flat: false,
        lastRow: rows,
        stitchCount: stitchesPerRow.reduce((sum, n) => sum + n, 0),
        incArray,
        scArray: [] as PatternRow[],
        decArray: [] as PatternRow[],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateConePattern;
