import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { outlineSegmentsAt } from "../shapes/outline";
import type { GeneratedPattern, OutlinePoint } from "../shapes/types";
import { patternBase } from "../shapes/common";

// Een plat motief dat je heen en weer in rijen haakt, van onder naar boven, met de vorm uit z'n
// omtrek (shapes/outline.ts), zoals het lapje. (Het hartje heeft een eigen, vaste opbouw: zie
// generateHeartPattern.ts.) Zo haak je dat:
// - Rij 1 is een rij vasten op lossen; elke rij eindigt met 1 losse en keren.
// - Breder of smaller worden gaat aan beide kanten tegelijk: een meerdering in de eerste en de
//   laatste steek ("1 meer, 6 v, 1 meer"), of een mindering ("1 min, 4 v, 1 min"). Per rij dus
//   2 steken erbij of eraf, of evenveel. Waar de omtrek sneller verloopt, blijft het werk iets
//   binnen de omtrek.
// - Splitst de omtrek bovenaan in twee stukken, dan haak je eerst het ene stuk over de ene
//   helft van de rij en daarna het andere over de andere helft.

export function generateRowsPattern(
    shape: Shape,
    outline: OutlinePoint[],
    yarnWeight: string,
    rowHeights: Record<string, number>,
    intersections: Intersection[],
    t: PatternTerms = englishPatternTerms,
): GeneratedPattern {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const widthCm = shapeDimensionCm(shape, "width");
    const lengthCm = shapeDimensionCm(shape, "length");
    const rows = Math.max(2, Math.round(lengthCm / rowHeightCm));
    const across = Math.max(2, widthCm / stitchWidthCm);

    // Per rij de stukken van de omtrek (breedte in steken), van onder naar boven.
    const segments = Array.from({ length: rows }, (_, i) =>
        outlineSegmentsAt(outline, -0.5 + (i + 0.5) / rows).map(([x0, x1]) => (x1 - x0) * across));
    const split = segments.findIndex((pieces) => pieces.length >= 2);
    const trunkRows = split > 0 ? split : rows;

    // Het doorlopende stuk: even breedtes (2, 4, 6, ...), zodat er aan beide kanten evenveel bij
    // of af kan. Rij 1 minstens 2 steken.
    const trunkTargets = Array.from({ length: trunkRows }, (_, i) => toParity(segments[i].reduce((sum, w) => sum + w, 0), 0, 2));
    const trunk = limitSteps(trunkTargets);

    const lines: PatternRow[] = [];
    let stitchCount = 0;
    const turn = t.phrase("turn");
    const row = (number: number, instruction: string, stitches: number, last: boolean): PatternRow => {
        stitchCount += stitches;
        return { from: number, to: number, instruction: last ? instruction : `${instruction}, ${turn}`, stitches, inRows: true };
    };

    // Rij 1: lossen, en terug een rij vasten.
    const singlePiece = split <= 0;
    stitchCount += trunk[0];
    const firstRow: PatternRow = {
        from: 1,
        to: 1,
        instruction: `${t.rowsStart(trunk[0] + 1, trunk[0])}${singlePiece && trunk.length === 1 ? "" : `, ${turn}`}`,
        stitches: trunk[0],
        inRows: true,
    };
    for (let i = 1; i < trunk.length; i++) {
        lines.push(row(i + 1, rowInstruction(t, trunk[i - 1], trunk[i]), trunk[i], singlePiece && i === trunk.length - 1));
    }

    let lastRow = trunk.length;
    if (!singlePiece) {
        // De bovenste rij van het doorlopende stuk in twee helften; elke boog gaat daarop verder.
        const half = trunk[trunk.length - 1] / 2;
        for (const side of [0, 1]) {
            const targets: number[] = [];
            for (let i = split; i < rows; i++) {
                const piece = segments[i][side] ?? segments[i][0];
                if (piece === undefined) break;
                targets.push(toParity(piece, half % 2, half % 2 === 0 ? 2 : 3));
            }
            const lobe = limitSteps(targets, half);
            lines.push({
                from: split + 1,
                to: split + 1,
                instruction: side === 0 ? t.phrase("firstLobe", { stitches: half }) : t.phrase("secondLobe", { row: split, stitches: half }),
                stitches: 0,
                note: true,
            });
            let previous = half;
            lobe.forEach((width, i) => {
                lines.push(row(split + i + 1, rowInstruction(t, previous, width), width, i === lobe.length - 1));
                previous = width;
            });
            lastRow = Math.max(lastRow, split + lobe.length);
        }
    }

    // Een plat motief naai je met de rand vast: de laatste rij als verbinding.
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: lastRow, bottomRow: lastRow }));

    return {
        ...patternBase(shape),
        rows: lastRow,
        incRows: 0,
        closed: false,
        flat: true,
        lastRow,
        stitchCount,
        firstRow,
        incArray: mergeRepeats(lines),
        scArray: [],
        decArray: [],
        rowArray: Array.from({ length: lastRow }, (_, i) => i + 1),
        intersectionRows,
    };
}

// Afronden op een even (parity 0) of oneven (1) aantal, minstens `min`.
function toParity(width: number, parity: number, min: number): number {
    const rounded = Math.round((width - parity) / 2) * 2 + parity;
    return Math.max(min, rounded);
}

// Per rij hooguit 2 erbij of eraf (1 aan elke kant), zonder ergens breder te worden dan de
// omtrek. `start`: de breedte van de rij eronder (bij een boog van een hart).
function limitSteps(targets: number[], start?: number): number[] {
    const limited = targets.map((_, i) =>
        Math.min(...targets.map((value, j) => value + 2 * Math.abs(i - j)), start === undefined ? Infinity : start + 2 * (i + 1)));
    // Vanaf `start` ook niet sneller smaller dan 2 per rij.
    if (start !== undefined) {
        let previous = start;
        for (let i = 0; i < limited.length; i++) {
            limited[i] = Math.max(limited[i], previous - 2);
            previous = limited[i];
        }
    }
    // Aan beide kanten minderen kan pas vanaf 4 steken: kleiner wordt het stuk niet, daar
    // houdt het op.
    const end = limited.findIndex((width, i) => i > 0 && width < limited[i - 1] && limited[i - 1] < 4);
    return end > 0 ? limited.slice(0, end) : limited;
}

// Eén rij: van `previous` naar `width` steken, symmetrisch aan beide kanten.
function rowInstruction(t: PatternTerms, previous: number, width: number): string {
    if (width > previous) return previous === 2 ? t.inc(2) : `${t.inc(1)}, ${t.sc(previous - 2)}, ${t.inc(1)}`;
    if (width < previous) return previous === 4 ? t.dec(2) : `${t.dec(1)}, ${t.sc(previous - 4)}, ${t.dec(1)}`;
    return t.sc(previous);
}

// Opeenvolgende rijen met dezelfde instructie samen: "Rij 2-7: 8 v, 1 l, keer (8)".
function mergeRepeats(lines: PatternRow[]): PatternRow[] {
    const merged: PatternRow[] = [];
    for (const line of lines) {
        const last = merged[merged.length - 1];
        if (last && !last.note && !line.note && last.instruction === line.instruction && last.stitches === line.stitches && last.to + 1 === line.from) {
            last.to = line.to;
        } else {
            merged.push({ ...line });
        }
    }
    return merged;
}
