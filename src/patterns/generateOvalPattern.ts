import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Plat ovaal (bv. een voetzool, buiklapje of plat oor): één laag, gehaakt rond een rij lossen.
// Zo haak je een ovaal echt: de lossen vormen het rechte middenstuk, de twee uiteinden worden
// halve cirkels. Elke ronde komen er aan elk uiteinde 3 steken bij (samen 6, net als bij een
// rondje), de rechte zijkanten blijven even lang. In 3D (SolidShape.tsx) een dun, ovaal schijfje
// met de oorsprong in het midden van de onderkant, net als het platte rondje.
//
// Ronde r (r ≥ 1) telt 2 × middenstuk + 6 × r steken: ronde 1 is 3 steken aan elk uiteinde
// plus het middenstuk aan beide kanten van de lossen.
const generateOvalPattern = (shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const widthCm = shapeDimensionCm(shape, "width");
    const lengthCm = shapeDimensionCm(shape, "length");
    const shortCm = Math.min(widthCm, lengthCm);
    const longCm = Math.max(widthCm, lengthCm);

    // De uiteinden zijn halve rondjes met de korte kant als doorsnede: evenveel rondes als
    // een plat rondje van die maat. Het middenstuk overbrugt het verschil met de lange kant.
    const rows = maxStitchesForDiameter(shortCm, stitchWidthCm) / 6;
    const middle = Math.max(1, Math.round((longCm - shortCm) / stitchWidthCm));
    const chains = middle + 3;
    const stitchesInRow = (row: number) => 2 * middle + 6 * row;

    const firstRow: PatternRow = { from: 1, to: 1, instruction: t.ovalStart(chains, middle), stitches: stitchesInRow(1) };

    // Per uiteinde drie keer meerderen, verdeeld over de steken van dat uiteinde; de
    // zijkanten recht door.
    const incArray: PatternRow[] = [];
    for (let row = 2; row <= rows; row++) {
        const end = row === 2 ? t.inc(3) : `[${t.inc(1)}, ${t.sc(row - 2)}] * 3`;
        incArray.push({ from: row, to: row, instruction: `[${end}, ${t.sc(middle)}] * 2`, stitches: stitchesInRow(row) });
    }

    // Net als het platte rondje: vastgenaaid met de buitenste ronde.
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: rows, bottomRow: rows }));

    let stitchCount = 0;
    for (let row = 1; row <= rows; row++) stitchCount += stitchesInRow(row);

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
        flat: true,
        lastRow: rows,
        stitchCount,
        firstRow,
        incArray,
        scArray: [] as PatternRow[],
        decArray: [] as PatternRow[],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
};

export default generateOvalPattern;
