import { englishPatternTerms, evenRows, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Open buis, open aan beide kanten (bv. een nek, mouw, sjaal of kraag): een ring van lossen en
// daarna rechte rondes tot de hoogte. Geen meerderen of minderen, dus het aantal steken hoeft
// geen veelvoud van 6 te zijn. In 3D (SolidShape.tsx) een open cilinder met de oorsprong in
// het midden van de onderkant; ronde 1 is de onderkant.
const generateTubePattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");

    const stitches = Math.max(6, Math.round((Math.PI * diameterCm) / stitchWidthCm));
    const rows = Math.max(2, Math.round(heightCm / rowHeightCm));

    const firstRow: PatternRow = { from: 1, to: 1, instruction: t.tubeStart(stitches), stitches };
    const scArray: PatternRow[] = [evenRows(t, 2, rows, stitches)];

    // Hoogte als fractie van onder (0) naar boven (1), zoals bij de cilinder.
    const toRow = (fraction: number) => 1 + Math.round(Math.min(1, Math.max(0, fraction)) * (rows - 1));
    const intersectionRows: IntersectionRow[] = [];
    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis" || intersection.shape1 !== shape.id) return;
        intersectionRows.push({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow: toRow(intersection.axisLowFraction),
            bottomRow: toRow(intersection.axisHighFraction),
        });
    });

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
        incRows: 0,
        closed: false,
        flat: false,
        lastRow: rows,
        stitchCount: rows * stitches,
        firstRow,
        incArray: [] as PatternRow[],
        scArray,
        decArray: [] as PatternRow[],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateTubePattern;
