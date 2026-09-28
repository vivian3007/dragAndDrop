// Haaktermen waarmee generateSpherePattern/generateArmPattern hun rijen opbouwen. Ze komen
// uit de vertaalbestanden (zie usePatternTerms in i18n/usePatternTerms.ts), want elke taal
// heeft eigen afkortingen en schrijfwijze: Engels "Row 3: [1inc, 2sc]", Nederlands
// "Toer 3: [1 meer, 2 v]". `row` krijgt ook reeksen als "5-6" mee.
export type PatternTerms = {
    row: (row: number | string) => string;
    sc: (count: number) => string;
    inc: (count: number) => string;
    dec: (count: number) => string;
};

// Terugval voor aanroepen zonder vertaling (bv. in een los script of test).
export const englishPatternTerms: PatternTerms = {
    row: (row) => `Row ${row}`,
    sc: (count) => `${count}sc`,
    inc: (count) => `${count}inc`,
    dec: (count) => `${count}dec`,
};
