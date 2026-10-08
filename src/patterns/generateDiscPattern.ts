import { englishPatternTerms, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Plat rondje (bv. een plat oor, een oogje of een buiklapje): één laag, vanuit een magische
// ring meerderen tot de doorsnede. De dikte (height) is gewoon die ene laag garen. In 3D
// (SolidShape.tsx) een dunne cilinder met de oorsprong in het midden van de onderkant.
const generateDiscPattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;

    const maxStitches = maxStitchesForDiameter(diameterCm, stitchWidthCm);
    const rows = maxStitches / 6;

    // Ronde 1 (magische ring, 6) schrijft Pattern.tsx zelf.
    const incArray: PatternRow[] = [];
    for (let row = 2; row <= rows; row++) {
        incArray.push(increaseRow(t, row, (row - 1) * 6));
    }

    // Een plat rondje wordt meestal met de buitenste ronde vastgenaaid.
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: rows, bottomRow: rows }));

    let stitchCount = 0;
    for (let row = 1; row <= rows; row++) stitchCount += row * 6;

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
        incRows: rows,
        closed: false,
        // Plat: geen vulling, afhechten met een lange draad om vast te naaien.
        flat: true,
        lastRow: rows,
        stitchCount,
        incArray,
        scArray: [] as PatternRow[],
        decArray: [] as PatternRow[],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateDiscPattern;
