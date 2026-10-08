import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { domeCapFraction, domeFractionAtHeight, insideDome } from "./domeShape";
import { createSolidGeometry } from "./solidGeometry";

describe("halve bol (met buis)", () => {
    it("kapje is de hele hoogte tot de halve breedte, daarboven groeit de buis", () => {
        expect(domeCapFraction({ width: 100, height: 30, length: 100 })).toBe(1);
        expect(domeCapFraction({ width: 100, height: 50, length: 100 })).toBe(1);
        expect(domeCapFraction({ width: 100, height: 200, length: 100 })).toBeCloseTo(0.25, 10);
    });

    it("haakvolgorde loopt van de top (0) naar de open rand (1)", () => {
        const fractions = [1, 0.9, 0.75, 0.5, 0.25, 0].map((y) => domeFractionAtHeight(y, 2, 8, 0.125));
        expect(fractions[0]).toBe(0);
        expect(fractions[fractions.length - 1]).toBe(1);
        fractions.slice(1).forEach((fraction, i) => expect(fraction).toBeGreaterThan(fractions[i]));
    });

    it("binnen: buis recht, kapje rond", () => {
        expect(insideDome(0.49, 0.2, 0, 0.25)).toBe(true);
        expect(insideDome(0.49, 0.95, 0, 0.25)).toBe(false);
        expect(insideDome(0, 0.99, 0, 0.25)).toBe(true);
        expect(insideDome(0, -0.01, 0, 0.25)).toBe(false);
    });

    it("3D-geometrie: diameter 1, van 0 tot 1 hoog, ook met buis", () => {
        for (const height of [30, 50, 200]) {
            const geometry = createSolidGeometry("Dome", { width: 100, height, length: 100 });
            geometry.computeBoundingBox();
            const box = geometry.boundingBox as THREE.Box3;
            expect(box.min.y).toBeCloseTo(0, 6);
            expect(box.max.y).toBeCloseTo(1, 6);
            expect(box.max.x).toBeCloseTo(0.5, 2);
        }
    });
});
