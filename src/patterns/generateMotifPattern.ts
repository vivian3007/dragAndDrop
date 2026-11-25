import { englishPatternTerms, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import type { GeneratedPattern, OutlinePoint } from "../shapes/types";
import { patternBase } from "../shapes/common";
import { centerRounds, FLOWER_CENTER, petalCount, STAR_CENTER } from "../shapes/motifs";
import { outlineSegmentsAt } from "../shapes/outline";

// Bloem, ster en blaadje: platte motieven die je niet in gewone rijen of rondes vasten haakt,
// maar met de technieken die je in haakpatronen voor zulke motieven tegenkomt:
// - bloem: een rondje als hart, en dan één ronde blaadjes, elk over een paar steken van het
//   hart (1 hv, dan steeds hogere en weer lagere steken);
// - ster: een rondje als hart, en dan één ronde punten, elk over een paar steken van het hart
//   (steeds hogere steken naar een top en weer terug);
// - blaadje: rond een rij lossen, met lage steken bij de punten en hoge in het midden.

type StitchKey = "slst" | "sc" | "hdc" | "dc" | "tr";

const stitch = (t: PatternTerms, key: StitchKey, count = 1) => ({ slst: t.slst, sc: t.sc, hdc: t.hdc, dc: t.dc, tr: t.tr })[key](count);

// Een rijtje steken met gelijke naast elkaar samen: [sc, sc, hdc] → "2 v, 1 hstk".
function grouped(t: PatternTerms, keys: StitchKey[]): string {
    const parts: string[] = [];
    for (let i = 0; i < keys.length; ) {
        let j = i;
        while (j + 1 < keys.length && keys[j + 1] === keys[i]) j++;
        parts.push(stitch(t, keys[i], j - i + 1));
        i = j + 1;
    }
    return parts.join(", ");
}

type Sizes = { rowHeightCm: number; stitchWidthCm: number; radiusCm: number; petals: number };

function sizesOf(shape: Shape, yarnWeight: string, rowHeights: Record<string, number>): Sizes {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    return {
        rowHeightCm,
        stitchWidthCm: rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT,
        radiusCm: (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 4,
        petals: petalCount(shape),
    };
}

// Het hart van een bloem of ster: ronde 1 een magische ring met evenveel vasten als er
// blaadjes of punten komen, daarna per ronde evenveel erbij. Minstens 2 rondes, zodat elk
// blaadje of elke punt over minstens 2 steken gaat.
function centerRows(t: PatternTerms, petals: number, rounds: number): { firstRow: PatternRow; rows: PatternRow[]; stitchCount: number } {
    const firstRow: PatternRow = { from: 1, to: 1, instruction: t.magicRing(petals), stitches: petals };
    const rows: PatternRow[] = [];
    let stitchCount = petals;
    for (let round = 2; round <= rounds; round++) {
        const instruction = round === 2 ? t.inc(petals) : `[${t.inc(1)}, ${t.sc(round - 2)}] * ${petals}`;
        rows.push({ from: round, to: round, instruction, stitches: round * petals });
        stitchCount += round * petals;
    }
    return { firstRow, rows, stitchCount };
}

function result(shape: Shape, rows: number, firstRow: PatternRow, lines: PatternRow[], stitchCount: number, intersections: Intersection[]): GeneratedPattern {
    // Een plat motief naai je met de rand vast: de laatste ronde.
    const intersectionRows: IntersectionRow[] = intersections
        .filter((intersection) => intersection.source === "csg-world-axis" && intersection.shape1 === shape.id)
        .map((intersection) => ({ shapeId1: intersection.shape1, shapeId2: intersection.shape2, topRow: rows, bottomRow: rows }));
    return {
        ...patternBase(shape),
        rows,
        incRows: rows - 1,
        closed: false,
        flat: true,
        lastRow: rows,
        stitchCount,
        firstRow,
        incArray: lines,
        scArray: [],
        decArray: [],
        rowArray: Array.from({ length: rows }, (_, i) => i + 1),
        intersectionRows,
    };
}

// Bloem: elk blaadje gaat over `k` steken van het hart (k = het aantal rondes van het hart):
//   k = 2: 1 hv, (1 hstk, 3 stk, 1 hstk) in de volgende steek
//   k ≥ 3: 1 hv, (1 hstk, 1 stk) in de volgende, 2 stk in elk van de volgende k−3,
//          (1 stk, 1 hstk) in de volgende
// Hoe langer de blaadjes, hoe hoger de steken (half stokje, stokje of dubbel stokje); hoe
// breder, hoe meer hoge steken in de eerste en laatste steek ("(1 hstk, 2 stk)").
export function generateFlowerPattern(shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms): GeneratedPattern {
    const { rowHeightCm, stitchWidthCm, radiusCm, petals } = sizesOf(shape, yarnWeight, rowHeights);
    const k = Math.max(2, centerRounds(radiusCm * FLOWER_CENTER, rowHeightCm));
    const center = centerRows(t, petals, k);

    const petalLength = (radiusCm * (1 - FLOWER_CENTER)) / rowHeightCm;
    const tall: StitchKey = petalLength < 1.75 ? "hdc" : petalLength < 2.6 ? "dc" : "tr";
    const short: StitchKey = tall === "hdc" ? "sc" : tall === "dc" ? "hdc" : "dc";
    // Zoveel steken als er langs de buitenrand van een blaadje passen.
    const wanted = (2 * Math.PI * radiusCm * 0.8) / petals / stitchWidthCm;
    const inNext = (text: string) => t.phrase("inNextSt", { stitches: text });
    let petal: string[];
    let petalStitches: number;
    if (k === 2) {
        const middle = Math.min(5, Math.max(3, Math.round(wanted - 2)));
        petal = [stitch(t, "slst"), inNext(`${stitch(t, short)}, ${stitch(t, tall, middle)}, ${stitch(t, short)}`)];
        petalStitches = middle + 2;
    } else {
        const side = Math.min(3, Math.max(1, Math.round((wanted - 2 - 2 * (k - 3)) / 2)));
        petal = [
            stitch(t, "slst"),
            inNext(`${stitch(t, short)}, ${stitch(t, tall, side)}`),
            ...(k > 3 ? [t.phrase("inEachOfNext", { stitch: stitch(t, tall, 2), count: k - 3 })] : []),
            inNext(`${stitch(t, tall, side)}, ${stitch(t, short)}`),
        ];
        petalStitches = 2 + 2 * side + 2 * (k - 3);
    }
    const row = k + 1;
    const petalRow: PatternRow = { from: row, to: row, instruction: `[${petal.join(", ")}] * ${petals}`, stitches: petals * petalStitches };
    return result(shape, row, center.firstRow, [...center.rows, petalRow], center.stitchCount + petals * petalStitches, intersections);
}

// Ster: na het hart één ronde met de punten, zoals in gangbare sterpatronen (bv. Stitch by Fay,
// Viv Crochets). Elke punt gaat over `k` steken van het hart (k = het aantal rondes van het
// hart, altijd even): de steken lopen op naar een top van twee hoge steken met een losse
// ertussen, en weer af naar een halve vaste in het dal tussen twee punten.
//   k = 2: (1 v, 1 l, 1 stk) in de volgende, 2 l, (1 stk, 1 l, 1 v) in de volgende
//   k = 4: 1 v, (1 stk, 2 l, 1 stk) in de volgende, 1 v, 1 hv
//   k = 6: 1 v, (1 hstk, 1 stk) in de volgende, (1 dstk, 1 l, 1 dstk) in de volgende,
//          (1 stk, 1 hstk) in de volgende, 1 v, 1 hv
// Een grotere ster krijgt een groter hart en bredere punten; de punten worden niet langer dan
// een dubbel stokje.
export function generateStarPattern(shape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms): GeneratedPattern {
    const { rowHeightCm, radiusCm, petals } = sizesOf(shape, yarnWeight, rowHeights);
    const k = Math.max(2, Math.round(centerRounds(radiusCm * STAR_CENTER, rowHeightCm) / 2) * 2);
    const center = centerRows(t, petals, k);
    const inNext = (text: string) => t.phrase("inNextSt", { stitches: text });

    let point: string[];
    let pointStitches: number;
    if (k === 2) {
        point = [inNext(`${t.sc(1)}, ${t.ch(1)}, ${t.dc(1)}`), t.ch(2), inNext(`${t.dc(1)}, ${t.ch(1)}, ${t.sc(1)}`)];
        pointStitches = 4;
    } else {
        // Aan elke kant van de top `side` steken van het hart: eerst een vaste, dan paren steeds
        // hogere steken.
        const side = (k - 2) / 2;
        const ladder: StitchKey[] = ["sc", "hdc", "dc"];
        const rising: string[] = [t.sc(1)];
        const falling: string[] = [t.sc(1)];
        for (let j = 2; j <= side; j++) {
            const low = ladder[Math.min(2 * j - 3, 2)];
            const high = ladder[Math.min(2 * j - 2, 2)];
            rising.push(low === high ? inNext(stitch(t, low, 2)) : inNext(`${stitch(t, low)}, ${stitch(t, high)}`));
            falling.unshift(low === high ? inNext(stitch(t, low, 2)) : inNext(`${stitch(t, high)}, ${stitch(t, low)}`));
        }
        const tip = side === 1 ? inNext(`${t.dc(1)}, ${t.ch(2)}, ${t.dc(1)}`) : inNext(`${t.tr(1)}, ${t.ch(1)}, ${t.tr(1)}`);
        point = [...rising, tip, ...falling, t.slst(1)];
        pointStitches = 4 * side;
    }
    const row = k + 1;
    const pointRow: PatternRow = { from: row, to: row, instruction: `[${point.join(", ")}] * ${petals}`, stitches: petals * pointStitches };
    return result(shape, row, center.firstRow, [...center.rows, pointRow], center.stitchCount + petals * pointStitches, intersections);
}

// Blaadje: rond een rij lossen. Langs de lossen steeds hogere steken naar het midden van het
// blaadje en weer lagere naar de punt, in de punt (1 v, 2 l, 1 v), en aan de andere kant van de
// lossen hetzelfde terug. Hoe breder het blaadje, hoe hoger de steken; past het niet met een
// dubbel stokje, dan komen er rondes vasten omheen.
export function generateLeafPattern(shape: Shape, outline: OutlinePoint[], yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms): GeneratedPattern {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const widthCm = shapeDimensionCm(shape, "width");
    const lengthCm = shapeDimensionCm(shape, "length");
    const chains = Math.max(3, Math.round(lengthCm / stitchWidthCm));

    // De halve breedte van het blaadje langs de lossen (punt 1 tot de laatste losse vóór de punt), in rondehoogtes.
    const halfWidths = Array.from({ length: chains - 1 }, (_, i) => {
        const y = -0.5 + (i + 0.5) / chains;
        const width = outlineSegmentsAt(outline, y).reduce((sum, [x0, x1]) => sum + (x1 - x0), 0);
        return (width * widthCm) / 2 / rowHeightCm;
    });
    // Hooguit stokjes (zoals in gangbare blaadjespatronen); een breder blaadje krijgt rondes
    // vasten rondom.
    const extraRounds = Math.max(0, Math.round(Math.max(...halfWidths) - LEAF_LADDER_HEIGHTS[LEAF_LADDER_HEIGHTS.length - 1]));
    const along = leafSteps(halfWidths.map((height) => height - extraRounds));

    const tip = `${t.sc(1)}, ${t.ch(2)}, ${t.sc(1)}`;
    const firstRow: PatternRow = {
        from: 1,
        to: 1,
        instruction: [
            t.phrase("chainStart", { chains: chains + 1, stitches: grouped(t, along) }),
            t.phrase("inLastChain", { stitches: tip }),
            t.phrase("otherSide", { stitches: grouped(t, [...along].reverse()) }),
            t.phrase("joinRound"),
        ].join("; "),
        stitches: 2 * along.length + 2,
    };
    let stitchCount = firstRow.stitches;
    const lines: PatternRow[] = [];
    for (let round = 2; round <= extraRounds + 1; round++) {
        const stitches = firstRow.stitches + 4 * (round - 1);
        stitchCount += stitches;
        lines.push({ from: round, to: round, instruction: `${t.phrase("roundAround", { tip })}; ${t.phrase("joinRound")}`, stitches });
    }
    return result(shape, extraRounds + 1, firstRow, lines, stitchCount, intersections);
}

// Steken van een blaadje van laag naar hoog, met hun hoogte in rondehoogtes.
const LEAF_LADDER: StitchKey[] = ["slst", "sc", "hdc", "dc"];
const LEAF_LADDER_HEIGHTS = [0.3, 1, 1.5, 2];

// De steken langs de lossen bij deze hoogtes. Zoals in een gangbaar blaadje: aan het begin een
// halve vaste, dan steeds één steeksoort hoger (v, hstk, stk), en vóór de punt weer omlaag tot
// een vaste (de punt zelf is (1 v, 2 l, 1 v)). Nooit meer dan één steeksoort ineens erbij of af.
function leafSteps(heights: number[]): StitchKey[] {
    const levels = heights.map((height) =>
        LEAF_LADDER_HEIGHTS.reduce((best, h, i) => (Math.abs(h - height) < Math.abs(LEAF_LADDER_HEIGHTS[best] - height) ? i : best), 0));
    levels[0] = 0;
    for (let i = 1; i < levels.length; i++) levels[i] = Math.min(levels[i], levels[i - 1] + 1);
    levels[levels.length - 1] = Math.min(levels[levels.length - 1], 1);
    for (let i = levels.length - 2; i >= 0; i--) levels[i] = Math.min(levels[i], levels[i + 1] + 1);
    levels[0] = 0;
    return levels.map((level) => LEAF_LADDER[level]);
}
