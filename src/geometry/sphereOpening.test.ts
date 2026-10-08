import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { attachToNearest, containsPoint, findAttachedTarget } from "./attach";
import { sphereEndAngle, sphereOpening } from "./sphereOpening";
import { crochetFraction } from "./stripes";
import generateSpherePattern from "../patterns/generateSpherePattern";
import { ROW_HEIGHTS } from "../patterns/estimateYarn";
import { makeShape, shapeOfCm } from "../patterns/testShapes";

describe("bol met opening", () => {
    it("alleen voor een bol, en nooit helemaal open", () => {
        expect(sphereOpening({ type: "Sphere", opening: 0.5 })).toBe(0.5);
        expect(sphereOpening({ type: "Cylinder", opening: 0.5 })).toBe(0);
        expect(sphereOpening({ type: "Sphere", opening: 3 })).toBeLessThan(1);
        expect(sphereEndAngle(0)).toBe(Math.PI);
        expect(Math.sin(sphereEndAngle(0.6))).toBeCloseTo(0.6, 10);
    });

    it("patroon: minderen tot de opening, niet dichtnaaien", () => {
        const closed = generateSpherePattern(shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }), "Medium", ROW_HEIGHTS, []);
        const open = generateSpherePattern(shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { opening: 0.5 }), "Medium", ROW_HEIGHTS, []);
        expect(closed.closed).toBe(true);
        expect(open.closed).toBe(false);
        const max = Math.max(...open.incArray.map((row) => row.stitches));
        const last = open.decArray[open.decArray.length - 1];
        expect(last.stitches).toBe(Math.round((0.5 * max) / 6) * 6);
        expect(last.to).toBe(open.lastRow);
        expect(open.rows).toBeLessThan(closed.rows);
    });

    it("kleurwissels lopen tot de rand van de opening", () => {
        const shape = makeShape({ type: "Sphere", opening: 0.6 });
        const rim = new THREE.Vector3(0.6, Math.cos(sphereEndAngle(0.6)), 0);
        expect(crochetFraction(shape, rim)).toBeCloseTo(1, 6);
        expect(crochetFraction(shape, new THREE.Vector3(0, 1, 0))).toBeCloseTo(0, 6);
    });

    it("aansluiten: de opening naar het hoofd, de rand op het oppervlak", () => {
        const head = makeShape({ id: "hoofd", type: "Sphere", width: 130, height: 120, length: 125 });
        const snout = makeShape({ id: "snuit", type: "Sphere", width: 55, height: 45, length: 45, z: 2, y: -0.2, opening: 0.6 });
        const result = attachToNearest(snout, [head])!;
        expect(result.targetId).toBe("hoofd");
        expect(findAttachedTarget(result.shape, [head])?.id).toBe("hoofd");
        // Middelpunt buiten het hoofd, de opening wijst naar het hoofd.
        const center = new THREE.Vector3(result.shape.x, result.shape.y, result.shape.z);
        expect(containsPoint(head, center)).toBe(false);
        const down = new THREE.Vector3(0, -1, 0).applyEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(result.shape.rotation_x),
            THREE.MathUtils.degToRad(result.shape.rotation_y),
            THREE.MathUtils.degToRad(result.shape.rotation_z),
        ));
        expect(down.dot(center.clone().normalize())).toBeLessThan(-0.9);
    });
});

describe("open bol: haakrichting", () => {
    it("een platte snuit wordt naar de opening toe gehaakt, met breedte × lengte als doorsnede", () => {
        const snout = shapeOfCm("Sphere", { width: 3.2, height: 1.7, length: 2.5 }, { opening: 0.75 });
        const pattern = generateSpherePattern(snout, "Medium", ROW_HEIGHTS, []);
        const wide = generateSpherePattern({ ...snout, height: snout.width }, "Medium", ROW_HEIGHTS, []);
        // Zelfde doorsnede (breedte × lengte), dus evenveel steken; ondieper = minder rondes.
        expect(Math.max(...pattern.incArray.map((row) => row.stitches))).toBe(Math.max(...wide.incArray.map((row) => row.stitches)));
        expect(pattern.rows).toBeLessThan(wide.rows);
    });
});
