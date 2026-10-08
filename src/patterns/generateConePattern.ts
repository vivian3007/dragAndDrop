import { englishPatternTerms, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Kegel (bv. een oor, snuit, hoorn of puntmuts): gehaakt vanaf de punt, steeds iets breder,
// tot de open onderkant die aan een andere vorm wordt genaaid. In 3D (SolidShape.tsx) ligt de
// oorsprong in het midden van de onderkant en de punt op lokale hoogte 1.
//
// Er wordt langs de schuine zijde gehaakt. De meerderingen worden zo gelijk mogelijk over de
// rondes verdeeld: elke ronde komen er 0 of 6 steken bij, zodat de kegel recht uitloopt.
const generateConePattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");
    const slantCm = Math.hypot(heightCm, diameterCm / 2);
    const rows = Math.max(2, Math.round(slantCm / rowHeightCm));

    // Per ronde kan er hooguit 6 bij; een heel platte, brede kegel wordt daarom iets smaller.
    let maxStitches = maxStitchesForDiameter(diameterCm, stitchWidthCm);
    while (maxStitches > 12 && maxStitches / 6 > rows) {
        maxStitches -= 6;
    }
    const steps = maxStitches / 6;

    // Steken per ronde: van 6 (ronde 1) gelijkmatig oplopend naar maxStitches (laatste ronde).
    const stitchesPerRow = Array.from({ length: rows }, (_, i) => 6 * Math.max(1, Math.ceil(((i + 1) * steps) / rows)));

    const incArray: PatternRow[] = [];
    const intersectionRows: IntersectionRow[] = [];

    // Hoogte als fractie van de onderkant (0) naar de punt (1). Ronde 1 is de punt.
    const toRow = (fraction: number) => {
        const clamped = Math.min(1, Math.max(0, fraction));
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
    let row = 2;
    while (row <= rows) {
        const stitches = stitchesPerRow[row - 1];
        const previous = stitchesPerRow[row - 2];
        if (stitches > previous) {
            incArray.push(increaseRow(t, row, previous));
            row++;
            continue;
        }
        let end = row;
        while (end + 1 <= rows && stitchesPerRow[end] === stitches) end++;
        incArray.push(evenRows(t, row, end, stitches));
        row = end + 1;
    }

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
        incRows: steps,
        // Open onderkant: geen slotronde.
        closed: false,
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
