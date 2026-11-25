// Haaktermen waarmee generateSpherePattern/generateArmPattern hun rijen opbouwen. Ze komen
// uit de vertaalbestanden (zie usePatternTerms in i18n/usePatternTerms.ts), want elke taal
// heeft eigen afkortingen en schrijfwijze: Engels "Row 3: [1inc, 2sc]", Nederlands
// "Ronde 3: [1 meer, 2 v]". `row` krijgt ook reeksen als "5-6" mee.
export type PatternTerms = {
    row: (row: number | string) => string;
    sc: (count: number) => string;
    inc: (count: number) => string;
    dec: (count: number) => string;
    // Vasten alleen in de achterste lus (BLO): daardoor knikt het werk en krijg je een
    // scherpe rand, bv. tussen de platte bodem en de zijkant van een cilinder.
    scBackLoop: (count: number) => string;
    // Ronde 1 van een plat ovaal: rond een rij lossen (zie generateOvalPattern.ts).
    ovalStart: (chains: number, middle: number) => string;
    // Ronde 1 van een open buis: een ring van lossen (zie generateTubePattern.ts).
    tubeStart: (chains: number) => string;
    // Platte motieven (shapes/definitions/heart.ts enz.): heen en weer in rijen in plaats van in
    // rondes ("Rij 3"), andere steken, en een begin met lossen of een magische ring.
    flatRow: (row: number | string) => string;
    rowsStart: (chains: number, stitches: number) => string;
    magicRing: (stitches: number) => string;
    ch: (count: number) => string;
    slst: (count: number) => string;
    hdc: (count: number) => string;
    dc: (count: number) => string;
    tr: (count: number) => string;
    // Zinnetjes voor de platte motieven ("1 l, keer", "(…) in de volgende steek", ...): zie
    // PHRASES hieronder. Uit de vertalingen als pattern.phrase.<naam>.
    phrase: (id: PhraseId, values?: Record<string, string | number>) => string;
};

// De zinnetjes waarmee de platte motieven hun instructies opbouwen, met de Engelse tekst (voor
// aanroepen zonder vertaling). De vertalingen staan als pattern.phrase.<naam> in de
// taalbestanden, met dezelfde {plekken}.
export const PHRASES = {
    // Aan het eind van een rij die heen en weer gaat.
    turn: "ch 1, turn",
    inNextSt: "({stitches}) in the next st",
    inEachOfNext: "{stitch} in each of the next {count} st",
    chainStart: "ch {chains}; starting in the 2nd ch from the hook: {stitches}",
    inLastChain: "({stitches}) in the last ch",
    otherSide: "along the other side of the chain: {stitches}",
    joinRound: "1sl st in the first st",
    roundAround: "1sc in each st around, with ({tip}) in the ch-space at the tip",
    firstLobe: "First lobe: continue over the first {stitches} stitches only",
    secondLobe: "Second lobe: join the yarn in the next stitch of row {row} and work over the remaining {stitches} stitches",
    intoSecondChain: "ch {chains}; {stitches} in the 2nd ch from the hook",
    heartBorder: "Border: do not turn; work 1sc in each row end and each stitch all around the heart, with 2sc in the point at the bottom; join with 1sl st in the first st",
} as const;
export type PhraseId = keyof typeof PHRASES;

function fillIn(template: string, values: Record<string, string | number> = {}): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

// Eén regel van een patroon: één ronde of een reeks rondes met dezelfde instructie. Als
// gegevens (niet als kant-en-klare tekst), zodat een reeks voor een kleurwissel opgesplitst
// kan worden; formatRow maakt er de tekst van ("Ronde 5-7: 18 v (18)").
export type PatternRow = {
    from: number;
    to: number;
    instruction: string;
    stitches: number;
    // Heen en weer gehaakte rijen ("Rij 3") in plaats van rondes.
    inRows?: boolean;
    // Een losse aanwijzing tussen de rijen (bv. "Eerste boog: ..."), zonder rijnummer.
    note?: boolean;
    // Een eigen label in plaats van "Ronde 3"/"Rij 3" (bv. de rijen van een sterpunt, die
    // weer bij 1 beginnen, terwijl `from`/`to` doortellen voor de kleurwissels).
    label?: string;
    // Kleur van deze rondes, als die afwijkt van de kleur van de vorm (zie colorChanges.ts).
    color?: string | null;
    // In de achterste lus gehaakt: dan staat die uitleg bij de afkortingen (Pattern.tsx).
    backLoop?: boolean;
};

// Steken van ronde 1: de magische ring (6), tenzij de vorm anders begint (`firstRow`, bv. een
// ovaal rond een rij lossen of een buis vanuit een ring van lossen).
export function firstRowStitches(pattern: object): number {
    return "firstRow" in pattern && pattern.firstRow ? (pattern.firstRow as PatternRow).stitches : 6;
}

export function formatRow(t: PatternTerms, row: PatternRow): string {
    if (row.note) return row.instruction;
    const label = row.label ?? (row.inRows ? t.flatRow : t.row)(row.from === row.to ? row.from : `${row.from}-${row.to}`);
    return `${label}: ${row.instruction} (${row.stitches})`;
}

// Meerderingsronde van `previous` naar `previous + 6` steken: in elk van de zes delen één
// meerdering. Vanaf de magische ring (6) is dat gewoon "6 meer (12)".
export function increaseRow(t: PatternTerms, row: number, previous: number): PatternRow {
    const instruction = previous === 6 ? t.inc(6) : `[${t.inc(1)}, ${t.sc(previous / 6 - 1)}] * 6`;
    return { from: row, to: row, instruction, stitches: previous + 6 };
}

// Minderingsronde naar `stitches` steken: in elk van de zes delen één mindering.
export function decreaseRow(t: PatternTerms, row: number, stitches: number): PatternRow {
    // Naar 6 steken: elke steek is een mindering ("6 min"), net als "6 meer" bij het meerderen.
    const instruction = stitches === 6 ? t.dec(6) : `[${t.dec(1)}, ${t.sc(stitches / 6 - 1)}] * 6`;
    return { from: row, to: row, instruction, stitches };
}

// Rondes zonder meerderen of minderen, eventueel alleen in de achterste lus.
export function evenRows(t: PatternTerms, from: number, to: number, stitches: number, backLoop = false): PatternRow {
    return backLoop
        ? { from, to, instruction: t.scBackLoop(stitches), stitches, backLoop: true }
        : { from, to, instruction: t.sc(stitches), stitches };
}

// Terugval voor aanroepen zonder vertaling (bv. in een los script of test).
export const englishPatternTerms: PatternTerms = {
    row: (row) => `Row ${row}`,
    sc: (count) => `${count}sc`,
    inc: (count) => `${count}inc`,
    dec: (count) => `${count}dec`,
    scBackLoop: (count) => `${count}sc BLO`,
    ovalStart: (chains, middle) => `ch ${chains}; starting in the 2nd ch from the hook: 3sc in that ch, ${middle}sc, 3sc in the last ch, then along the other side of the chain ${middle}sc`,
    tubeStart: (chains) => `ch ${chains} and join with a sl st into a ring without twisting; 1sc in each ch`,
    flatRow: (row) => `Row ${row}`,
    rowsStart: (chains, stitches) => `ch ${chains}; starting in the 2nd ch from the hook: ${stitches}sc`,
    magicRing: (stitches) => `${stitches}sc in a magic ring`,
    ch: (count) => `${count}ch`,
    slst: (count) => `${count}sl st`,
    hdc: (count) => `${count}hdc`,
    dc: (count) => `${count}dc`,
    tr: (count) => `${count}tr`,
    phrase: (id, values) => fillIn(PHRASES[id], values),
};
