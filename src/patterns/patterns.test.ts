import { describe, expect, it } from "vitest";
import generateSpherePattern from "./generateSpherePattern";
import generateArmPattern from "./generateArmPattern";
import { halfEllipsePerimeter, maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { estimateYarnByColor, estimateYarnMeters, ROW_HEIGHTS, skeinsNeeded, yarnWeightKey } from "./estimateYarn";
import { pixelsPerCm, shapeDimensionCm } from "../geometry/units";
import { rowSpan, shapeOfCm, stitchesOf } from "./testShapes";

const medium = ROW_HEIGHTS.Medium;

// Alle rondes van een patroon zoals de patroonpagina ze toont, als steekaantallen per ronde:
// ronde 1 (6) en 2 (12) en — bij een bol — de slotronde (6) schrijft Pattern.tsx zelf.
function stitchesPerRow(pattern: ReturnType<typeof generateSpherePattern> | ReturnType<typeof generateArmPattern>, closed: boolean): number[] {
    const rows = [6];
    if (pattern.incRows >= 2) rows.push(12);
    for (const line of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let i = 0; i < rowSpan(line); i++) rows.push(stitchesOf(line));
    }
    if (closed) rows.push(6);
    return rows;
}

describe("stitchGeometry", () => {
    it("rondt het steekaantal af op een veelvoud van 6, minimaal 12", () => {
        for (const diameter of [0.5, 2, 3.7, 8, 15]) {
            const stitches = maxStitchesForDiameter(diameter, medium * STITCH_WIDTH_PER_ROW_HEIGHT);
            expect(stitches % 6).toBe(0);
            expect(stitches).toBeGreaterThanOrEqual(12);
        }
        expect(maxStitchesForDiameter(0.1, 0.5)).toBe(12);
    });

    it("meer steken bij een grotere doorsnede", () => {
        const width = medium * STITCH_WIDTH_PER_ROW_HEIGHT;
        expect(maxStitchesForDiameter(10, width)).toBeGreaterThan(maxStitchesForDiameter(5, width));
    });

    it("halve omtrek van een cirkel is π·r", () => {
        expect(halfEllipsePerimeter(3, 3)).toBeCloseTo(Math.PI * 3, 10);
    });
});

describe("units", () => {
    it("een bol is in 3D twee keer zo groot als z'n width (straal vs diameter)", () => {
        expect(pixelsPerCm("Sphere")).toBe(pixelsPerCm("Arm") / 2);
    });

    it("rekent zoom mee in de echte maat", () => {
        const shape = shapeOfCm("Sphere", { width: 4, height: 4, length: 4 }, { zoom: 1.5 });
        expect(shapeDimensionCm(shape, "width")).toBeCloseTo(6, 10);
    });
});

describe.each([
    ["bol van 6 cm", shapeOfCm("Sphere", { width: 6, height: 6, length: 6 })],
    ["kleine bol van 1 cm", shapeOfCm("Sphere", { width: 1, height: 1, length: 1 })],
    ["langwerpige bol", shapeOfCm("Sphere", { width: 5, height: 12, length: 5 })],
    ["platte bol", shapeOfCm("Sphere", { width: 10, height: 3, length: 10 })],
])("generateSpherePattern: %s", (_label, shape) => {
    const pattern = generateSpherePattern(shape, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern, true);

    it("telt precies het opgegeven aantal rondes", () => {
        expect(rows.length).toBe(pattern.rows);
        expect(pattern.lastRow).toBe(pattern.rows);
        expect(pattern.rowArray).toEqual(Array.from({ length: pattern.rows }, (_, i) => i + 1));
    });

    it("meerdert per ronde met 6, minderd per ronde met 6, en sluit af op 6", () => {
        const max = Math.max(...rows);
        const peak = rows.indexOf(max);
        rows.slice(0, peak + 1).forEach((stitches, i) => expect(stitches).toBe((i + 1) * 6));
        const afterPeak = rows.slice(rows.lastIndexOf(max));
        afterPeak.forEach((stitches, i) => expect(stitches).toBe(max - i * 6));
        expect(rows[rows.length - 1]).toBe(6);
    });

    it("het totaal aantal steken (garenschatting) is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("generateSpherePattern: verhoudingen", () => {
    const ball = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 });

    it("dikker garen geeft minder rondes", () => {
        const fine = generateSpherePattern(ball, "Fine", ROW_HEIGHTS, []);
        const bulky = generateSpherePattern(ball, "Bulky", ROW_HEIGHTS, []);
        expect(bulky.rows).toBeLessThan(fine.rows);
    });

    it("een langere vorm krijgt meer rondes zonder meerderen/minderen", () => {
        const long = generateSpherePattern(shapeOfCm("Sphere", { width: 6, height: 12, length: 6 }), "Medium", ROW_HEIGHTS, []);
        const round = generateSpherePattern(ball, "Medium", ROW_HEIGHTS, []);
        expect(long.incRows).toBe(round.incRows);
        expect(long.rows).toBeGreaterThan(round.rows);
    });

    it("een vorm die aan de evenaar vastzit, komt in de middelste rondes", () => {
        const pattern = generateSpherePattern({ ...ball, id: "lijf" }, "Medium", ROW_HEIGHTS, [{
            source: "sphere-analytic", shape1: "arm", shape2: "lijf", axisOffsetFraction: 0, axisRadiusFraction: 0.2,
        }]);
        const [attachment] = pattern.intersectionRows;
        const middle = (pattern.rows + 1) / 2;
        expect(attachment.shapeId2).toBe("lijf");
        expect(attachment.topRow).toBeLessThan(middle);
        expect(attachment.bottomRow).toBeGreaterThan(middle);
    });

    it("negeert kruispunten van andere vormen", () => {
        const pattern = generateSpherePattern({ ...ball, id: "lijf" }, "Medium", ROW_HEIGHTS, [{
            source: "sphere-analytic", shape1: "a", shape2: "iets-anders", axisOffsetFraction: 0, axisRadiusFraction: 0.2,
        }]);
        expect(pattern.intersectionRows).toEqual([]);
    });
});

describe.each([
    ["arm van 8 cm", shapeOfCm("Arm", { width: 2, height: 8, length: 2 })],
    ["korte dikke arm", shapeOfCm("Arm", { width: 5, height: 4, length: 5 })],
    ["dunne lange arm", shapeOfCm("Arm", { width: 1, height: 15, length: 1 })],
])("generateArmPattern: %s", (_label, shape) => {
    const pattern = generateArmPattern(shape, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern, false);

    it("is aan de onderkant open: geen minderingsrondes", () => {
        expect(pattern.decArray).toEqual([]);
        expect(rows.length).toBe(pattern.rows);
    });

    it("meerdert per ronde met 6 en haakt daarna recht door", () => {
        const max = Math.max(...rows);
        const peak = rows.indexOf(max);
        rows.slice(0, peak + 1).forEach((stitches, i) => expect(stitches).toBe((i + 1) * 6));
        rows.slice(peak).forEach((stitches) => expect(stitches).toBe(max));
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("estimateYarn", () => {
    it("onbekende of lege garendikte valt terug op Medium; spaties tellen niet", () => {
        expect(yarnWeightKey(null)).toBe("Medium");
        expect(yarnWeightKey("Onzin")).toBe("Medium");
        expect(yarnWeightKey("Super Fine")).toBe("SuperFine");
    });

    it("±28 steken per meter bij medium garen (vuistregel), plus 15% marge", () => {
        expect(estimateYarnMeters(28, medium)).toBeCloseTo((28 * 0.45 * 8 * 1.15) / 100, 10);
        expect(estimateYarnMeters(28, medium)).toBeGreaterThan(1);
        expect(estimateYarnMeters(28, medium)).toBeLessThan(1.25);
    });

    it("aantal bollen naar boven afgerond, minimaal 1, onbekend als meters per bol ontbreken", () => {
        expect(skeinsNeeded(150, 100)).toBe(2);
        expect(skeinsNeeded(5, 100)).toBe(1);
        expect(skeinsNeeded(150, null)).toBeNull();
        expect(skeinsNeeded(150, 0)).toBeNull();
    });

    it("totaal is de som van de (afgeronde) kleuren", () => {
        const shapes = [
            shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { id: "a", color: "#ff0000" }),
            shapeOfCm("Arm", { width: 2, height: 8, length: 2 }, { id: "b", color: "#ff0000" }),
            shapeOfCm("Sphere", { width: 3, height: 3, length: 3 }, { id: "c", color: "#00ff00" }),
        ];
        const { byColor, total } = estimateYarnByColor(shapes, "Medium");
        expect(Object.keys(byColor).sort()).toEqual(["#00ff00", "#ff0000"]);
        expect(total).toBe(byColor["#ff0000"] + byColor["#00ff00"]);
        Object.values(byColor).forEach((meters) => expect(Number.isInteger(meters)).toBe(true));
    });

    it("een grotere vorm kost meer garen", () => {
        const small = estimateYarnByColor([shapeOfCm("Sphere", { width: 4, height: 4, length: 4 })], "Medium").total;
        const big = estimateYarnByColor([shapeOfCm("Sphere", { width: 10, height: 10, length: 10 })], "Medium").total;
        expect(big).toBeGreaterThan(small);
    });
});
