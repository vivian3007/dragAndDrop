import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import type { GeneratedPattern } from "../shapes/types";
import { patternBase } from "../shapes/common";

// Plat hartje, zoals het in gangbare haakpatronen gaat (bv. het "flat heart" van Pocket
// Yarnlings): heen en weer in rijen vasten, van de punt onderaan naar boven.
// - Rij 1: 2 lossen, 2 v in de 2e losse vanaf de haak.
// - Daarna elke rij aan beide kanten meerderen (2 v in de eerste en de laatste steek), tot de
//   breedste rij.
// - Dan de twee bogen, elk over de helft van die rij: eerst één rechte rij, daarna elke rij aan
//   beide kanten minderen, tot er 1 steek over is.
// - Tot slot een rand van vasten rondom, met 2 v in de punt onderaan.
// Elke rij eindigt met 1 losse en keren. De maat komt uit de breedte; de vorm van een hart
// ligt vast door deze opbouw (ongeveer driekwart zo hoog als breed).
export function generateHeartPattern(shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms): GeneratedPattern {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    // De breedste rij, zonder de rand (die maakt het aan elke kant een steek breder). Een
    // viervoud, zodat beide bogen een even aantal steken hebben en netjes tot 1 steek minderen.
    const widest = Math.max(8, Math.round((shapeDimensionCm(shape, "width") / stitchWidthCm - 2) / 4) * 4);
    const lobe = widest / 2;
    const turn = t.phrase("turn");

    const lines: PatternRow[] = [];
    let stitchCount = 2;
    let rowNumber = 1;
    const addRow = (instruction: string, stitches: number, last = false) => {
        rowNumber++;
        stitchCount += stitches;
        lines.push({ from: rowNumber, to: rowNumber, instruction: last ? instruction : `${instruction}, ${turn}`, stitches, inRows: true });
    };

    const firstRow: PatternRow = { from: 1, to: 1, instruction: `${t.phrase("intoSecondChain", { chains: 2, stitches: t.sc(2) })}, ${turn}`, stitches: 2, inRows: true };
    // Breder: elke rij aan beide kanten 1 erbij.
    for (let width = 4; width <= widest; width += 2) {
        const previous = width - 2;
        addRow(previous === 2 ? t.inc(2) : `${t.inc(1)}, ${t.sc(previous - 2)}, ${t.inc(1)}`, width);
    }
    const widestRow = rowNumber;

    // De twee bogen: dezelfde rijen, elk over de helft van de breedste rij.
    const lobeRows: { instruction: string; stitches: number }[] = [{ instruction: t.sc(lobe), stitches: lobe }];
    for (let width = lobe; width > 1; ) {
        const next = width === 2 ? 1 : width - 2;
        lobeRows.push({ instruction: width === 2 ? t.dec(1) : width === 4 ? t.dec(2) : `${t.dec(1)}, ${t.sc(width - 4)}, ${t.dec(1)}`, stitches: next });
        width = next;
    }
    for (const side of [0, 1]) {
        lines.push({
            from: widestRow + 1,
            to: widestRow + 1,
            instruction: side === 0 ? t.phrase("firstLobe", { stitches: lobe }) : t.phrase("secondLobe", { row: widestRow, stitches: lobe }),
            stitches: 0,
            note: true,
        });
        lobeRows.forEach((row, i) => {
            const number = widestRow + 1 + i;
            const last = i === lobeRows.length - 1;
            stitchCount += row.stitches;
            lines.push({ from: number, to: number, instruction: last ? row.instruction : `${row.instruction}, ${turn}`, stitches: row.stitches, inRows: true });
        });
    }
    const lastRow = widestRow + lobeRows.length;

    // De rand: langs beide zijkanten één vaste per rij-eind, over de bogen één per steek
    // (ongeveer), en 2 in de punt.
    const border = 2 * lastRow + widest + 2;
    stitchCount += border;
    lines.push({ from: lastRow, to: lastRow, instruction: t.phrase("heartBorder"), stitches: 0, note: true });

    // Een plat motief naai je met de rand vast.
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: lastRow, bottomRow: lastRow }));

    return {
        ...patternBase(shape),
        rows: lastRow,
        incRows: widestRow - 1,
        closed: false,
        flat: true,
        lastRow,
        stitchCount,
        firstRow,
        incArray: lines,
        scArray: [],
        decArray: [],
        rowArray: Array.from({ length: lastRow }, (_, i) => i + 1),
        intersectionRows,
    };
}
