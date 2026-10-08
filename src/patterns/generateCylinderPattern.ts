import { englishPatternTerms, increaseRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Cilinder, dicht aan beide kanten (bv. een lijf, poot of hoed): een platte bodem, rechte
// zijkant en een platte bovenkant. In 3D (Cylinder.tsx) ligt de oorsprong in het midden van
// de bodem, met lokale hoogte 0..1 en diameter 1 — net als de Arm.
//
// Bodem: meerderen tot de omtrek (die rondes liggen plat, dus tellen niet mee in de hoogte).
// Zijkant: rechte rondes over de hele hoogte. Bovenkant: plat minderen tot 6.
const generateCylinderPattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    // Doorsnede: gemiddelde van width en length (die kunnen de cilinder in 3D ovaal maken,
    // het haakpatroon kent maar één omtrek per ronde).
    const diameterCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const heightCm = shapeDimensionCm(shape, "height");

    const maxStitches = maxStitchesForDiameter(diameterCm, stitchWidthCm);
    const incRows = maxStitches / 6; // bodem: ronde 1 (6) t/m ronde M/6 (M)
    const sideRows = Math.max(1, Math.round(heightCm / rowHeightCm));
    const decRows = maxStitches / 6 - 1; // bovenkant: M-6 t/m 6
    const rows = incRows + sideRows + decRows;

    const incArray: string[] = [];
    const scArray: string[] = [];
    const decArray: string[] = [];
    const intersectionRows: IntersectionRow[] = [];

    // Hoogte als fractie van onder (0) naar boven (1), net als bij de Arm (zie
    // calculateIntersections.tsx). De bodem en bovenkant zijn plat, dus alles wat aan de
    // zijkant vastzit, valt in de zijrondes.
    const toRow = (fraction: number) => {
        const clamped = Math.min(1, Math.max(0, fraction));
        return incRows + 1 + Math.round(clamped * (sideRows - 1));
    };
    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis" || intersection.shape1 !== shape.id) return;
        intersectionRows.push({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow: toRow(intersection.axisLowFraction),
            bottomRow: toRow(intersection.axisHighFraction),
        });
    });

    // Ronde 1 (magische ring, 6) schrijft Pattern.tsx zelf.
    for (let row = 2; row <= incRows; row++) {
        incArray.push(increaseRow(t, row, (row - 1) * 6));
    }

    const startRow = incRows + 1;
    const endRow = incRows + sideRows;
    const rowText = sideRows === 1 ? t.row(startRow) : t.row(`${startRow}-${endRow}`);
    scArray.push(`${rowText}: ${t.sc(maxStitches)} (${maxStitches})`);

    // Minderen tot 12; de slotronde "6 min (6)" op `lastRow` schrijft Pattern.tsx zelf.
    for (let stitches = maxStitches - 6, row = endRow + 1; stitches >= 12; stitches -= 6, row++) {
        decArray.push(`${t.row(row)}: [${t.dec(1)}, ${t.sc(stitches / 6 - 1)}] * 6 (${stitches})`);
    }

    let stitchCount = sideRows * maxStitches;
    for (let row = 1; row <= incRows; row++) stitchCount += row * 6;
    for (let stitches = maxStitches - 6; stitches >= 6; stitches -= 6) stitchCount += stitches;

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
        closed: true,
        lastRow: rows,
        stitchCount,
        incArray,
        scArray,
        decArray,
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateCylinderPattern;
