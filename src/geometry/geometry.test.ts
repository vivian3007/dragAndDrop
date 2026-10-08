import { describe, expect, it } from "vitest";
import { computePatternBounds, computePatternHeightCm, computePatternWidthCm } from "./patternBounds";
import { mirrorShape } from "./mirrorShape";
import { makeShape, shapeOfCm } from "../patterns/testShapes";

describe("patternBounds", () => {
    it("een bol van 6 cm is 6 cm breed en hoog", () => {
        const ball = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 });
        expect(computePatternWidthCm([ball])).toBeCloseTo(6, 6);
        expect(computePatternHeightCm([ball])).toBeCloseTo(6, 6);
    });

    it("een arm 90° om de z-as gedraaid: lengte wordt breedte", () => {
        const arm = shapeOfCm("Arm", { width: 2, height: 8, length: 2 });
        const turned = { ...arm, rotation_z: 90 };
        expect(computePatternHeightCm([arm])).toBeCloseTo(8, 6);
        expect(computePatternWidthCm([turned])).toBeCloseTo(8, 6);
        expect(computePatternHeightCm([turned])).toBeCloseTo(2, 6);
    });

    it("twee vormen naast elkaar: de omhullende van beide", () => {
        const left = makeShape({ id: "l", x: -1 });
        const right = makeShape({ id: "r", x: 1 });
        const bounds = computePatternBounds([left, right])!;
        expect(bounds.min[0]).toBeLessThan(-1);
        expect(bounds.max[0]).toBeGreaterThan(1);
    });

    it("geen vormen: geen afmetingen", () => {
        expect(computePatternBounds([])).toBeNull();
        expect(computePatternWidthCm([])).toBeNull();
    });
});

describe("mirrorShape", () => {
    const body = makeShape({ id: "lijf", x: 2 });

    it("spiegelt in het midden van de overige vormen (ook als dat niet op x=0 ligt)", () => {
        const arm = makeShape({ id: "arm", type: "Arm", x: 5, rotation_z: 30, rotation_y: 10, rotation_x: 20 });
        const mirrored = mirrorShape(arm, [body, arm]);
        expect(mirrored.x).toBeCloseTo(-1, 10);
        expect(mirrored.rotation_x).toBe(20);
        expect(mirrored.rotation_y).toBe(-10);
        expect(mirrored.rotation_z).toBe(-30);
    });

    it("twee keer spiegelen geeft weer het origineel", () => {
        const arm = makeShape({ id: "arm", type: "Arm", x: 5, rotation_z: 30 });
        const once = { ...mirrorShape(arm, [body, arm]), id: "arm" } as Shape;
        const twice = mirrorShape(once, [body, once]);
        expect(twice.x).toBeCloseTo(arm.x, 10);
        expect(twice.rotation_z).toBeCloseTo(arm.rotation_z, 10);
    });
});
