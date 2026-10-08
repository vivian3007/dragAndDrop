import { decreaseRow, englishPatternTerms, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Cilinder, dicht aan beide kanten (bv. een lijf, poot of hoed): een platte bodem, rechte
// zijkant en een platte bovenkant. In 3D (SolidShape.tsx) ligt de oorsprong in het midden van
// de bodem, met lokale hoogte 0..1 en diameter 1 — net als de Arm.
//
// Bodem: meerderen tot de omtrek (die rondes liggen plat, dus tellen niet mee in de hoogte).
// Zijkant: rechte rondes over de hele hoogte. Bovenkant: plat minderen tot 6.
//
// Wat het een cilinder maakt en geen langgerekte bol: de eerste en de laatste zijronde worden
// in de achterste lus gehaakt (BLO). Daar knikt het werk 90°, zodat bodem en bovenkant plat
// blijven met een scherpe rand. Zonder die rondes heeft het precies de opbouw van een bol.
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

    const incArray: PatternRow[] = [];
    const scArray: PatternRow[] = [];
    const decArray: PatternRow[] = [];
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
    // Eerste zijronde in de achterste lus: de rand onderaan.
    scArray.push(evenRows(t, startRow, startRow, maxStitches, true));
    if (sideRows >= 3) {
        scArray.push(evenRows(t, startRow + 1, endRow - 1, maxStitches));
    }
    // Laatste zijronde in de achterste lus: de rand bovenaan, daarna plat minderen. (Bij één
    // zijronde doet die ene ronde beide.)
    if (sideRows >= 2) {
        scArray.push(evenRows(t, endRow, endRow, maxStitches, true));
    }

    // Minderen tot 12; de slotronde "6 min (6)" op `lastRow` schrijft Pattern.tsx zelf.
    for (let stitches = maxStitches - 6, row = endRow + 1; stitches >= 12; stitches -= 6, row++) {
        decArray.push(decreaseRow(t, row, stitches));
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
        flat: false,
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
