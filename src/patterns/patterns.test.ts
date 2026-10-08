import { describe, expect, it } from "vitest";
import generateSpherePattern from "./generateSpherePattern";
import generateArmPattern from "./generateArmPattern";
import generateCylinderPattern from "./generateCylinderPattern";
import generateConePattern from "./generateConePattern";
import generateDiscPattern from "./generateDiscPattern";
import generateDomePattern from "./generateDomePattern";
import { generatePattern } from "./generators";
import { englishPatternTerms, formatRow, PatternRow } from "./patternTerms";
import { halfEllipsePerimeter, maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { estimateYarnByColor, estimateYarnMeters, ROW_HEIGHTS, yarnWeightKey } from "./estimateYarn";
import { pixelsPerCm, shapeDimensionCm } from "../geometry/units";
import { shapeOfCm } from "./testShapes";

const medium = ROW_HEIGHTS.Medium;

// Alle rondes van een patroon zoals de patroonpagina ze toont, als steekaantallen per ronde:
// ronde 1 (magische ring, 6) en — bij een gesloten vorm — de slotronde (6) schrijft
// Pattern.tsx zelf.
type RowsOf = { incArray: PatternRow[]; scArray: PatternRow[]; decArray: PatternRow[]; closed: boolean };

function stitchesPerRow(pattern: RowsOf): number[] {
    const rows = [6];
    for (const line of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let i = line.from; i <= line.to; i++) rows.push(line.stitches);
    }
    if (pattern.closed) rows.push(6);
    return rows;
}

// Elke ronde verschilt hooguit 6 steken van de vorige (één meerdering of mindering per deel).
function expectSmoothSteps(rows: number[]) {
    rows.slice(1).forEach((stitches, i) => expect(Math.abs(stitches - rows[i])).toBeLessThanOrEqual(6));
    rows.forEach((stitches) => expect(stitches % 6).toBe(0));
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
    const rows = stitchesPerRow(pattern);

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
    const rows = stitchesPerRow(pattern);

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

describe.each([
    ["cilinder 4 × 6 cm", shapeOfCm("Cylinder", { width: 4, height: 6, length: 4 })],
    ["platte brede cilinder", shapeOfCm("Cylinder", { width: 8, height: 1, length: 8 })],
    ["dunne hoge cilinder", shapeOfCm("Cylinder", { width: 1.5, height: 10, length: 1.5 })],
])("generateCylinderPattern: %s", (_label, shape) => {
    const pattern = generateCylinderPattern(shape, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern);

    it("is dicht en telt precies het opgegeven aantal rondes", () => {
        expect(pattern.closed).toBe(true);
        expect(rows.length).toBe(pattern.rows);
    });

    it("platte bodem, rechte zijkant op de volle omtrek, platte bovenkant tot 6", () => {
        expectSmoothSteps(rows);
        const max = Math.max(...rows);
        expect(rows.slice(0, pattern.incRows)).toEqual(Array.from({ length: pattern.incRows }, (_, i) => (i + 1) * 6));
        expect(rows.filter((n) => n === max).length).toBeGreaterThan(1);
        expect(rows[rows.length - 1]).toBe(6);
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("generateCylinderPattern: platte bodem en bovenkant (achterste lus)", () => {
    const sideRowsOf = (pattern: RowsOf) =>
        pattern.scArray.flatMap((line) => Array.from({ length: line.to - line.from + 1 }, () => line.instruction));

    it("de eerste en de laatste zijronde zijn in de achterste lus, de rest niet", () => {
        const pattern = generateCylinderPattern(shapeOfCm("Cylinder", { width: 4, height: 6, length: 4 }), "Medium", ROW_HEIGHTS, []);
        const sides = sideRowsOf(pattern);
        expect(sides.length).toBeGreaterThanOrEqual(3);
        expect(sides[0]).toMatch(/BLO/);
        expect(sides[sides.length - 1]).toMatch(/BLO/);
        sides.slice(1, -1).forEach((line) => expect(line).not.toMatch(/BLO/));
    });

    it("bij één of twee zijrondes: alle zijrondes in de achterste lus", () => {
        for (const height of [0.4, 0.9]) {
            const pattern = generateCylinderPattern(shapeOfCm("Cylinder", { width: 4, height, length: 4 }), "Medium", ROW_HEIGHTS, []);
            const sides = sideRowsOf(pattern);
            expect(sides.length).toBeLessThanOrEqual(2);
            sides.forEach((line) => expect(line).toMatch(/BLO/));
        }
    });

    it("een bol heeft geen rondes in de achterste lus", () => {
        const ball = generateSpherePattern(shapeOfCm("Sphere", { width: 4, height: 6, length: 4 }), "Medium", ROW_HEIGHTS, []);
        [...ball.incArray, ...ball.scArray, ...ball.decArray].forEach((line) => expect(line.instruction).not.toMatch(/BLO/));
    });
});

describe("generateCylinderPattern: verhoudingen", () => {
    it("een hogere cilinder krijgt meer zijrondes, niet meer steken", () => {
        const low = generateCylinderPattern(shapeOfCm("Cylinder", { width: 4, height: 3, length: 4 }), "Medium", ROW_HEIGHTS, []);
        const high = generateCylinderPattern(shapeOfCm("Cylinder", { width: 4, height: 9, length: 4 }), "Medium", ROW_HEIGHTS, []);
        expect(high.incRows).toBe(low.incRows);
        expect(high.rows).toBeGreaterThan(low.rows);
    });
});

describe.each([
    ["kegel 3 × 4 cm (oor)", shapeOfCm("Cone", { width: 3, height: 4, length: 3 })],
    ["spitse kegel (hoorn)", shapeOfCm("Cone", { width: 1.5, height: 6, length: 1.5 })],
    ["platte brede kegel", shapeOfCm("Cone", { width: 10, height: 1, length: 10 })],
])("generateConePattern: %s", (_label, shape) => {
    const pattern = generateConePattern(shape, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern);

    it("is aan de onderkant open en telt precies het opgegeven aantal rondes", () => {
        expect(pattern.closed).toBe(false);
        expect(rows.length).toBe(pattern.rows);
    });

    it("loopt van de punt (6) gelijkmatig op naar de onderkant, nooit smaller", () => {
        expectSmoothSteps(rows);
        expect(rows[0]).toBe(6);
        rows.slice(1).forEach((stitches, i) => expect(stitches).toBeGreaterThanOrEqual(rows[i]));
        expect(rows[rows.length - 1]).toBe(Math.max(...rows));
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("generateDiscPattern: plat rondje", () => {
    const disc = shapeOfCm("Disc", { width: 4, height: 0.3, length: 4 });
    const pattern = generateDiscPattern(disc, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern);

    it("alleen meerderingsrondes, plat en open", () => {
        expect(pattern.flat).toBe(true);
        expect(pattern.closed).toBe(false);
        expect(rows).toEqual(Array.from({ length: pattern.rows }, (_, i) => (i + 1) * 6));
    });

    it("de doorsnede bepaalt het aantal rondes, de dikte niet", () => {
        const thick = generateDiscPattern(shapeOfCm("Disc", { width: 4, height: 2, length: 4 }), "Medium", ROW_HEIGHTS, []);
        const wide = generateDiscPattern(shapeOfCm("Disc", { width: 8, height: 0.3, length: 8 }), "Medium", ROW_HEIGHTS, []);
        expect(thick.rows).toBe(pattern.rows);
        expect(wide.rows).toBeGreaterThan(pattern.rows);
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe.each([
    ["halve bol 6 × 3 cm (muts)", shapeOfCm("Dome", { width: 6, height: 3, length: 6 })],
    ["hoge koepel", shapeOfCm("Dome", { width: 4, height: 5, length: 4 })],
    ["platte koepel", shapeOfCm("Dome", { width: 8, height: 1, length: 8 })],
    ["halve bol met buis (arm)", shapeOfCm("Dome", { width: 2, height: 8, length: 2 })],
])("generateDomePattern: %s", (_label, shape) => {
    const pattern = generateDomePattern(shape, "Medium", ROW_HEIGHTS, []);
    const rows = stitchesPerRow(pattern);

    it("open onderkant, niet plat, juist aantal rondes", () => {
        expect(pattern.closed).toBe(false);
        expect(pattern.flat).toBe(false);
        expect(rows.length).toBe(pattern.rows);
    });

    it("meerdert per ronde met 6 en haakt daarna recht door tot de rand", () => {
        const max = Math.max(...rows);
        const peak = rows.indexOf(max);
        rows.slice(0, peak + 1).forEach((stitches, i) => expect(stitches).toBe((i + 1) * 6));
        rows.slice(peak).forEach((stitches) => expect(stitches).toBe(max));
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("halve bol met buis", () => {
    it("hoger dan de halve breedte: zelfde kapje, de extra hoogte zijn rechte rondes", () => {
        const dome = generateDomePattern(shapeOfCm("Dome", { width: 3, height: 1.5, length: 3 }), "Medium", ROW_HEIGHTS, []);
        const arm = generateDomePattern(shapeOfCm("Dome", { width: 3, height: 7.5, length: 3 }), "Medium", ROW_HEIGHTS, []);
        expect(arm.incRows).toBe(dome.incRows);
        // 6 cm buis extra, op een ronde na (afronding van het totaal).
        expect(Math.abs(arm.rows - dome.rows - 6 / ROW_HEIGHTS.Medium)).toBeLessThanOrEqual(1);
    });
});

describe("generatePattern (register)", () => {
    it("kent alle vormtypen en geeft null voor een onbekend type", () => {
        for (const type of ["Sphere", "Arm", "Cylinder", "Cone", "Disc", "Dome"]) {
            expect(generatePattern(shapeOfCm(type, { width: 3, height: 3, length: 3 }), "Medium", ROW_HEIGHTS, [])).not.toBeNull();
        }
        expect(generatePattern(shapeOfCm("Driehoek", { width: 3, height: 3, length: 3 }), "Medium", ROW_HEIGHTS, [])).toBeNull();
    });
});

describe("formatRow (tekst van een patroonregel)", () => {
    it("zelfde tekst als vóór de omzetting naar gegevens", () => {
        const pattern = generateSpherePattern(shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }), "Medium", ROW_HEIGHTS, []);
        const lines = [...pattern.incArray, ...pattern.scArray, ...pattern.decArray].map((row) => formatRow(englishPatternTerms, row));
        expect(lines[0]).toBe("Row 2: 6inc (12)");
        expect(lines[1]).toBe("Row 3: [1inc, 1sc] * 6 (18)");
        expect(lines).toContain(`Row ${pattern.scArray[0].from}-${pattern.scArray[0].to}: ${pattern.scArray[0].stitches}sc (${pattern.scArray[0].stitches})`);
        expect(lines[lines.length - 1]).toBe("Row " + pattern.decArray[pattern.decArray.length - 1].from + ": [1dec, 1sc] * 6 (12)");
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

    it("nieuwe vormen tellen mee in de garenschatting", () => {
        const { total } = estimateYarnByColor([
            shapeOfCm("Cylinder", { width: 4, height: 6, length: 4 }, { id: "a" }),
            shapeOfCm("Cone", { width: 3, height: 4, length: 3 }, { id: "b" }),
        ], "Medium");
        expect(total).toBeGreaterThan(0);
    });

    it("een grotere vorm kost meer garen", () => {
        const small = estimateYarnByColor([shapeOfCm("Sphere", { width: 4, height: 4, length: 4 })], "Medium").total;
        const big = estimateYarnByColor([shapeOfCm("Sphere", { width: 10, height: 10, length: 10 })], "Medium").total;
        expect(big).toBeGreaterThan(small);
    });
});
