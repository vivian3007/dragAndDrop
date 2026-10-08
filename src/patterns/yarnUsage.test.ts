import { describe, expect, it } from "vitest";
import { rowRanges, yarnUsage } from "./yarnUsage";
import { colorName } from "./colorNames";
import { shapeOfCm } from "./testShapes";

describe("garenoverzicht", () => {
    const body = { ...shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }), name: "Lijf", color: "#8b5a2b", stripes: [{ from: 0.1, to: 0.2, color: "#c62828" }] };
    const head = { ...shapeOfCm("Sphere", { width: 5, height: 5, length: 5 }), id: "hoofd", name: "Hoofd", color: "#8b5a2b" };
    const eye = { ...shapeOfCm("Eye", { width: 1, height: 1, length: 1 }), id: "oog", name: "Oog", color: "#111111" };
    const { colors, total } = yarnUsage([body, head, eye], "Medium");

    it("per kleur de onderdelen; een kleurwissel met z'n rondes", () => {
        expect(colors.map(({ color }) => color)).toEqual(["#8b5a2b", "#c62828"]);
        expect(colors[0].uses.map(({ name }) => name)).toEqual(["Lijf", "Hoofd"]);
        expect(colors[0].uses.every(({ rows }) => rows === null)).toBe(true); // eigen kleur: alleen de naam
        expect(colors[1].uses).toHaveLength(1);
        expect(colors[1].uses[0].name).toBe("Lijf");
        expect(colors[1].uses[0].rows?.length).toBeGreaterThan(0);
    });

    it("ogen zijn geen garen; het totaal is de som van de kleuren", () => {
        expect(colors.some(({ color }) => color === "#111111")).toBe(false);
        expect(total).toBe(colors.reduce((sum, { meters }) => sum + meters, 0));
    });

    it("rondes worden reeksen", () => {
        expect(rowRanges([7, 1, 2, 3])).toEqual([[1, 3], [7, 7]]);
    });
});

describe("kleurnamen", () => {
    it("geeft de dichtstbijzijnde gewone naam", () => {
        expect(colorName("#c0392b", "nl")).toBe("rood");
        expect(colorName("#2e86c1", "nl")).toBe("blauw");
        expect(colorName("#ffffff", "en")).toBe("white");
        expect(colorName("#e8cfa9", "nl")).toBe("beige");
        expect(colorName("geen kleur", "nl")).toBeNull();
    });
});
