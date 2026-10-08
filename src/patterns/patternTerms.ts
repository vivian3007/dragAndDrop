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
};

// Eén regel van een patroon: één ronde of een reeks rondes met dezelfde instructie. Als
// gegevens (niet als kant-en-klare tekst), zodat een reeks voor een kleurwissel opgesplitst
// kan worden; formatRow maakt er de tekst van ("Ronde 5-7: 18 v (18)").
export type PatternRow = {
    from: number;
    to: number;
    instruction: string;
    stitches: number;
    // Kleur van deze rondes, als die afwijkt van de kleur van de vorm (zie colorChanges.ts).
    color?: string | null;
};

export function formatRow(t: PatternTerms, row: PatternRow): string {
    const label = row.from === row.to ? t.row(row.from) : t.row(`${row.from}-${row.to}`);
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
    return { from: row, to: row, instruction: `[${t.dec(1)}, ${t.sc(stitches / 6 - 1)}] * 6`, stitches };
}

// Rondes zonder meerderen of minderen, eventueel alleen in de achterste lus.
export function evenRows(t: PatternTerms, from: number, to: number, stitches: number, backLoop = false): PatternRow {
    return { from, to, instruction: backLoop ? t.scBackLoop(stitches) : t.sc(stitches), stitches };
}

// Terugval voor aanroepen zonder vertaling (bv. in een los script of test).
export const englishPatternTerms: PatternTerms = {
    row: (row) => `Row ${row}`,
    sc: (count) => `${count}sc`,
    inc: (count) => `${count}inc`,
    dec: (count) => `${count}dec`,
    scBackLoop: (count) => `${count}sc BLO`,
};
