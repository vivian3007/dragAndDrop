import { describe, expect, it } from "vitest";
import { applyStripes, rowColor, stitchesWithColor, stripeFromRows, stripeRows } from "./colorChanges";
import { generatePattern } from "./generators";
import { estimateYarnByColor, ROW_HEIGHTS } from "./estimateYarn";
import { englishPatternTerms } from "./patternTerms";
import { shapeOfCm } from "./testShapes";

const white = "#ffffff";
const brown = "#8b5a2b";

describe("kleurwissels", () => {
    const ball = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { color: brown });

    it("zonder banen: alles in de kleur van de vorm", () => {
        const pattern = generatePattern(ball, "Medium", ROW_HEIGHTS, [], englishPatternTerms)!;
        [...pattern.incArray, ...pattern.scArray, ...pattern.decArray].forEach((row) => expect(row.color).toBeNull());
        expect(pattern.startColor).toBeNull();
    });

    it("een witte baan in het midden: de reeks rechte rondes wordt opgesplitst", () => {
        const striped = { ...ball, stripes: [{ from: 0.4, to: 0.6, color: white }] };
        const pattern = generatePattern(striped, "Medium", ROW_HEIGHTS, [], englishPatternTerms)!;
        const rows = [...pattern.incArray, ...pattern.scArray, ...pattern.decArray];
        // Elke ronde precies één keer, op volgorde.
        const numbers = rows.flatMap((row) => Array.from({ length: row.to - row.from + 1 }, (_, i) => row.from + i));
        expect(numbers).toEqual(Array.from({ length: numbers.length }, (_, i) => i + 2));
        // De witte rondes liggen rond het midden, de rest is bruin (null).
        for (const row of rows) {
            for (let r = row.from; r <= row.to; r++) {
                expect(row.color).toBe(rowColor(r, pattern.rows, striped.stripes));
            }
        }
        expect(rows.some((row) => row.color === white)).toBe(true);
        expect(pattern.startColor).toBeNull();
        expect(pattern.closingColor).toBeNull();
    });

    it("een gekleurde top: ronde 1 begint al in die kleur", () => {
        const pattern = generatePattern({ ...ball, stripes: [{ from: 0, to: 0.2, color: white }] }, "Medium", ROW_HEIGHTS, [])!;
        expect(pattern.startColor).toBe(white);
    });

    it("latere banen gaan voor eerdere", () => {
        expect(rowColor(5, 10, [{ from: 0, to: 1, color: white }, { from: 0.4, to: 0.5, color: "#000000" }])).toBe("#000000");
    });

    it("garenschatting: per kleur, en samen evenveel steken als zonder banen", () => {
        const striped = { ...ball, stripes: [{ from: 0.4, to: 0.6, color: white }] };
        const plain = estimateYarnByColor([ball], "Medium");
        const split = estimateYarnByColor([striped], "Medium");
        expect(Object.keys(split.byColor).sort()).toEqual([brown, white].sort());
        const pattern = generatePattern(striped, "Medium", ROW_HEIGHTS, [])!;
        const total = stitchesWithColor(pattern, brown).reduce((sum, row) => sum + row.stitches, 0);
        expect(total).toBe(pattern.stitchCount);
        // Afronding per kleur kan er hooguit een meter bij doen.
        expect(split.total).toBeGreaterThanOrEqual(plain.total);
        expect(split.total).toBeLessThanOrEqual(plain.total + 1);
    });

    it("werkt voor elk vormtype", () => {
        for (const type of ["Sphere", "Arm", "Cylinder", "Cone", "Disc", "Dome"]) {
            const shape = shapeOfCm(type, { width: 4, height: 6, length: 4 }, { stripes: [{ from: 0.5, to: 1, color: white }] });
            const pattern = applyStripes(generatePattern(shape, "Medium", ROW_HEIGHTS, [])!, shape.stripes);
            const all = [...pattern.incArray, ...pattern.scArray, ...pattern.decArray];
            expect(all.some((row) => row.color === white) || pattern.closingColor === white).toBe(true);
        }
    });
});

describe("kleurwissels in rondes (editor)", () => {
    it("rondes 4 t/m 6 van 20 heen en terug", () => {
        const stripe = stripeFromRows(4, 6, 20, "#ff0000");
        expect(stripeRows(stripe, 20)).toEqual({ from: 4, to: 6 });
        for (let row = 1; row <= 20; row++) {
            expect(rowColor(row, 20, [stripe])).toBe(row >= 4 && row <= 6 ? "#ff0000" : null);
        }
    });

    it("blijft minstens één ronde, ook bij weinig rondes", () => {
        expect(stripeRows({ from: 0.41, to: 0.42, color: "#fff" }, 5)).toEqual({ from: 3, to: 3 });
        expect(stripeRows({ from: 0, to: 1, color: "#fff" }, 7)).toEqual({ from: 1, to: 7 });
    });
});
