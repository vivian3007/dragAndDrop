import { describe, expect, it } from "vitest";
import { computePatternBounds, computePatternHeightCm, computePatternWidthCm } from "./patternBounds";
import { mirrorShape } from "./mirrorShape";
import { meshScaleOf, sizeFromMeshScale } from "./units";
import { stitchRepeat } from "./yarnLook";
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

    it("cilinder en kegel: breedte is de diameter, hoogte van onderkant tot boven", () => {
        for (const type of ["Cylinder", "Cone"]) {
            const shape = shapeOfCm(type, { width: 4, height: 6, length: 4 }, { y: 1 });
            expect(computePatternWidthCm([shape])).toBeCloseTo(4, 6);
            expect(computePatternHeightCm([shape])).toBeCloseTo(6, 6);
            // De oorsprong is de onderkant: y=1 is de bodem, niet het midden.
            expect(computePatternBounds([shape])!.min[1]).toBeCloseTo(1, 6);
        }
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

describe("meshScaleOf / sizeFromMeshScale (schalen met de gizmo)", () => {
    it.each(["Sphere", "Arm", "Cylinder", "Cone"])("%s: heen en terug geeft dezelfde maat", (type) => {
        const shape = makeShape({ type, width: 80, height: 150, length: 60, zoom: 1.3 });
        const [x, y, z] = meshScaleOf(shape);
        const size = sizeFromMeshScale(shape, { x, y, z });
        expect(size.width * size.zoom).toBeCloseTo(shape.width * shape.zoom, 8);
        expect(size.height * size.zoom).toBeCloseTo(shape.height * shape.zoom, 8);
        expect(size.length * size.zoom).toBeCloseTo(shape.length * shape.zoom, 8);
    });

    it("een arm twee keer zo groot schalen: de hoogte verdubbelt ook (sprong vroeger naar ⅔)", () => {
        const arm = makeShape({ type: "Arm", width: 80, height: 150, length: 80, zoom: 1 });
        const [x, y, z] = meshScaleOf(arm);
        const size = sizeFromMeshScale(arm, { x: x * 2, y: y * 2, z: z * 2 });
        expect(size.height * size.zoom).toBeCloseTo(300, 8);
    });
});

describe("stitchRepeat (steken in 3D op echte maat)", () => {
    it("een twee keer zo grote bol krijgt twee keer zoveel herhalingen: steken blijven even groot", () => {
        const small = stitchRepeat(shapeOfCm("Sphere", { width: 4, height: 4, length: 4 }));
        const big = stitchRepeat(shapeOfCm("Sphere", { width: 8, height: 8, length: 8 }));
        expect(big[0]).toBeCloseTo(small[0] * 2, 6);
        expect(big[1]).toBeCloseTo(small[1] * 2, 6);
    });

    it("rond een cilinder: de omtrek; over de lengte: de hoogte", () => {
        const low = stitchRepeat(shapeOfCm("Cylinder", { width: 4, height: 2, length: 4 }));
        const high = stitchRepeat(shapeOfCm("Cylinder", { width: 4, height: 6, length: 4 }));
        expect(high[0]).toBeCloseTo(low[0], 6);
        expect(high[1]).toBeCloseTo(low[1] * 3, 6);
    });
});
