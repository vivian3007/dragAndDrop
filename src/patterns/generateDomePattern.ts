import { englishPatternTerms, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { domeCapFraction, domeFractionAtHeight, domeLengths } from "../geometry/domeShape";

// Halve bol (bv. een muts, een schelp of een bolle snuit) en, als hij hoger is dan de halve
// breedte, een arm of been: vanaf de top meerderen tot de omtrek en dan recht door tot de
// open rand. In 3D (SolidShape.tsx) een rond kapje met eventueel een buis eronder, de
// oorsprong in het midden van de onderkant (zie geometry/domeShape.ts).
//
// De rondes lopen over het kapje (een kwart-ellips van de top tot de rand) en dan de buis af;
// de meerderingsrondes moeten in het kapje passen.
const generateDomePattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");
    const cap = domeCapFraction(shape);
    const lengths = domeLengths(diameterCm, heightCm, cap);

    const rows = Math.max(2, Math.round(lengths.total / rowHeightCm));
    const capRows = Math.max(2, Math.round(lengths.capArc / rowHeightCm));
    let maxStitches = maxStitchesForDiameter(diameterCm, stitchWidthCm);
    while (maxStitches > 12 && maxStitches / 6 > capRows) {
        maxStitches -= 6;
    }
    const incRows = maxStitches / 6;

    const incArray: PatternRow[] = [];
    const scArray: PatternRow[] = [];
    for (let row = 2; row <= incRows; row++) {
        incArray.push(increaseRow(t, row, (row - 1) * 6));
    }
    if (rows > incRows) {
        scArray.push(evenRows(t, incRows + 1, rows, maxStitches));
    }

    // Hoogte als fractie van de onderkant (0) naar de top (1); ronde 1 is de top.
    const toRow = (fraction: number) =>
        Math.min(rows, Math.max(1, Math.round(domeFractionAtHeight(fraction, diameterCm, heightCm, cap) * (rows - 1)) + 1));
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow: toRow((intersection as CsgIntersection).axisHighFraction),
            bottomRow: toRow((intersection as CsgIntersection).axisLowFraction),
        }));

    let stitchCount = (rows - incRows) * maxStitches;
    for (let row = 1; row <= incRows; row++) stitchCount += row * 6;

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
        incRows,
        closed: false,
        flat: false,
        lastRow: rows,
        stitchCount,
        incArray,
        scArray,
        decArray: [] as PatternRow[],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateDomePattern;
