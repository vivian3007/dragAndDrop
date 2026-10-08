import { englishPatternTerms, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { halfEllipsePerimeter, maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

const generateArmPattern = (singleShape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    // Echte maten in cm (zoom meegerekend). `height` is de totale armlengte; de doorsnede is
    // het gemiddelde van width (X) en length (Z) — die zijn los instelbaar en kunnen de Arm in
    // 3D ovaal maken, terwijl het haakpatroon maar één omtrek per ronde kent.
    const lengthCm = shapeDimensionCm(singleShape, "height");
    const diameterCm = (shapeDimensionCm(singleShape, "width") + shapeDimensionCm(singleShape, "length")) / 2;

    // Opbouw zoals in Arm.tsx: een bolvormig kapje (een derde van de totale lengte, zie
    // ARM_TOTAL_LOCAL_LENGTH) op een open cilinder. Het kapje haak je over een kwart-ellips
    // van de top tot de rand; daarin moeten de meerderingsrondes passen.
    const capCm = lengthCm / 3;
    const capRows = Math.max(2, Math.round(halfEllipsePerimeter(diameterCm / 2, capCm) / 2 / rowHeightCm));
    let maxStitches = maxStitchesForDiameter(diameterCm, stitchWidthCm);
    while (maxStitches > 12 && maxStitches / 6 > capRows) {
        maxStitches -= 6;
    }
    const incRows = maxStitches / 6; // ronde 1 (6) t/m ronde M/6 (M)
    const straightRows = Math.round((lengthCm - capCm) / rowHeightCm);
    const scRows = Math.max(0, capRows - incRows) + straightRows;
    const rows = incRows + scRows;

    const rowArray: number[] = [];
    const incArray: PatternRow[] = [];
    const scArray: PatternRow[] = [];
    const decArray: PatternRow[] = [];
    const intersectionRows: IntersectionRow[] = [];

    // Een cilinder heeft geen polen-compressie zoals een bol — rijen liggen al gelijkmatig
    // verdeeld over de lengte, dus lineaire mapping i.p.v. de acos-formule van Sphere.
    // Conventie: rij 1 is het bolvormige kapje (volgt uit de opbouw hieronder: incArray
    // eerst, geen sluit-rij — dus haken begint bij de ronding), de rijen tellen naar de
    // open onderkant toe.
    const toArmRow = (fractionOfLength: number) => {
        const clamped = Math.min(1, Math.max(0, fractionOfLength)); // 0=open onderkant, 1=kapje
        const rowFractionFromCap = 1 - clamped;
        return Math.min(rows, Math.max(1, Math.round(rowFractionFromCap * (rows - 1)) + 1));
    };

    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis") return; // "sphere-analytic" gaat altijd over twee Sphere-vormen, niet relevant hier

        // Alleen koppelingen waarbij deze Arm zelf shape1 is — anders zou elke Arm in de
        // scene dezelfde koppeling opnieuw pushen zodra intersectionRows wordt teruggegeven,
        // wat dubbele regels in de Assembly-lijst zou opleveren (zie generateSpherePattern.tsx
        // voor dezelfde fix).
        if (intersection.shape1 !== singleShape.id) return;

        const topRow = toArmRow(intersection.axisHighFraction);
        const bottomRow = toArmRow(intersection.axisLowFraction);
        intersectionRows.push({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow,
            bottomRow,
        });
    });

    for (let i = 1; i <= rows; i++) {
        rowArray.push(i);
    }

    // Ronde 1 (magische ring, 6) schrijft Pattern.tsx zelf; vanaf ronde 2 komen ze hier vandaan.
    for (let row = 2; row <= incRows; row++) {
        incArray.push(increaseRow(t, row, (row - 1) * 6));
    }

    if (scRows > 0) {
        const startRow = incRows + 1;
        const endRow = incRows + scRows;
        scArray.push(evenRows(t, startRow, endRow, maxStitches));
    }

    // Totaal aantal steken, voor de garenschatting: 6, 12, …, M en dan scRows × M. Een arm
    // is aan de onderkant open, dus geen minderingsrondes.
    let stitchCount = scRows * maxStitches;
    for (let row = 1; row <= incRows; row++) stitchCount += row * 6;

    return {
        type: singleShape.type,
        color: singleShape.color,
        name: singleShape.name,
        width: singleShape.width,
        height: singleShape.height,
        rotation_x: singleShape.rotation_x,
        rotation_y: singleShape.rotation_y,
        rotation_z: singleShape.rotation_z,
        rows,
        incRows,
        // Aan de onderkant open (wordt aan het lijf genaaid): geen slotronde.
        closed: false,
        lastRow: rows,
        stitchCount,
        incArray,
        scArray,
        decArray,
        rowArray,
        intersectionRows,
    };
};

export default generateArmPattern;
