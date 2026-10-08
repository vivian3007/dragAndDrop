import { describe, expect, it } from "vitest";
import { mainConnections } from "./assembly";
import { shapeOfCm } from "./testShapes";

describe("in elkaar zetten", () => {
    const head = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { id: "hoofd" });
    const ear = shapeOfCm("Cone", { width: 2, height: 2, length: 2 }, { id: "oor" });
    const hat = shapeOfCm("Dome", { width: 3, height: 1.5, length: 3 }, { id: "muts" });
    const row = (shapeId1: string, shapeId2: string): IntersectionRow => ({ shapeId1, shapeId2, topRow: 1, bottomRow: 2 });

    it("een onderdeel dat meer vormen raakt, naai je alleen aan de grootste", () => {
        const rows = [row("muts", "oor"), row("muts", "hoofd"), row("oor", "hoofd")];
        expect(mainConnections(rows, [head, ear, hat])).toEqual([row("muts", "hoofd"), row("oor", "hoofd")]);
    });
});
