// Haaktermen waarmee generateSpherePattern/generateArmPattern hun rijen opbouwen. Ze komen
// uit de vertaalbestanden (zie usePatternTerms in i18n/usePatternTerms.ts), want elke taal
// heeft eigen afkortingen en schrijfwijze: Engels "Row 3: [1inc, 2sc]", Nederlands
// "Ronde 3: [1 meer, 2 v]". `row` krijgt ook reeksen als "5-6" mee.
export type PatternTerms = {
    row: (row: number | string) => string;
    sc: (count: number) => string;
    inc: (count: number) => string;
    dec: (count: number) => string;
};

// Meerderingsronde van `previous` naar `previous + 6` steken: in elk van de zes delen één
// meerdering. Vanaf de magische ring (6) is dat gewoon "6 meer (12)".
export function increaseRow(t: PatternTerms, row: number, previous: number): string {
    const next = previous + 6;
    return previous === 6
        ? `${t.row(row)}: ${t.inc(6)} (${next})`
        : `${t.row(row)}: [${t.inc(1)}, ${t.sc(previous / 6 - 1)}] * 6 (${next})`;
}

// Terugval voor aanroepen zonder vertaling (bv. in een los script of test).
export const englishPatternTerms: PatternTerms = {
    row: (row) => `Row ${row}`,
    sc: (count) => `${count}sc`,
    inc: (count) => `${count}inc`,
    dec: (count) => `${count}dec`,
};
