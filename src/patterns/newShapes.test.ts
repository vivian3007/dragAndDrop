import { describe, expect, it } from "vitest";
import * as THREE from "three";
import generateOvalPattern from "./generateOvalPattern";
import generateTubePattern from "./generateTubePattern";
import generateDiscPattern from "./generateDiscPattern";
import { generatePattern } from "./generators";
import { stitchesWithColor } from "./colorChanges";
import { englishPatternTerms, formatRow, PatternRow } from "./patternTerms";
import { ROW_HEIGHTS } from "./estimateYarn";
import { shapeOfCm } from "./testShapes";
import { crochetFraction, insideLocal, localToWorld, worldToLocal } from "../geometry/shapeSpace";
import { createSolidGeometry } from "../geometry/solidGeometry";
import { meshScaleOf } from "../geometry/units";

type RowsOf = { firstRow: PatternRow; incArray: PatternRow[]; scArray: PatternRow[]; decArray: PatternRow[] };

// Steken per ronde, met ronde 1 uit `firstRow` (ovaal en buis beginnen niet met een magische ring).
function stitchesPerRow(pattern: RowsOf): number[] {
    const rows = [pattern.firstRow.stitches];
    for (const line of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let i = line.from; i <= line.to; i++) rows.push(line.stitches);
    }
    return rows;
}

describe("generateOvalPattern: plat ovaal", () => {
    const sole = shapeOfCm("Oval", { width: 3, height: 0.3, length: 6 });
    const pattern = generateOvalPattern(sole, "Medium", ROW_HEIGHTS, [], englishPatternTerms);
    const rows = stitchesPerRow(pattern);
    const middle = (rows[0] - 6) / 2;

    it("begint rond een rij lossen: 3 steken aan elk uiteinde plus het middenstuk aan beide kanten", () => {
        expect(pattern.firstRow.from).toBe(1);
        expect(formatRow(englishPatternTerms, pattern.firstRow)).toContain(`ch ${middle + 3}`);
        expect(Number.isInteger(middle)).toBe(true);
        expect(middle).toBeGreaterThanOrEqual(1);
    });

    it("elke ronde 6 steken meer (3 per uiteinde), plat en open", () => {
        rows.slice(1).forEach((stitches, i) => expect(stitches - rows[i]).toBe(6));
        expect(rows.length).toBe(pattern.rows);
        expect(pattern.flat).toBe(true);
        expect(pattern.closed).toBe(false);
    });

    it("de uiteinden zijn halve rondjes: evenveel rondes als een plat rondje van de breedte", () => {
        const disc = generateDiscPattern(shapeOfCm("Disc", { width: 3, height: 0.3, length: 3 }), "Medium", ROW_HEIGHTS, []);
        expect(pattern.rows).toBe(disc.rows);
    });

    it("hoe langer, hoe langer het middenstuk (en niet meer rondes)", () => {
        const longer = generateOvalPattern(shapeOfCm("Oval", { width: 3, height: 0.3, length: 9 }), "Medium", ROW_HEIGHTS, []);
        expect(longer.rows).toBe(pattern.rows);
        expect(longer.firstRow.stitches).toBeGreaterThan(pattern.firstRow.stitches);
    });

    it("breedte en lengte omgedraaid geeft hetzelfde patroon", () => {
        const turned = generateOvalPattern(shapeOfCm("Oval", { width: 6, height: 0.3, length: 3 }), "Medium", ROW_HEIGHTS, []);
        expect(stitchesPerRow(turned)).toEqual(rows);
    });

    it("het totaal aantal steken is de som van alle rondes, ook in de garenschatting", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
        const colored = generatePattern(sole, "Medium", ROW_HEIGHTS, [])!;
        expect(stitchesWithColor(colored, "#fff").map((row) => row.stitches)).toEqual(rows);
    });

    it("tweede ronde: 3 meerderingen per uiteinde, het middenstuk recht door", () => {
        expect(formatRow(englishPatternTerms, pattern.incArray[0])).toBe(`Row 2: [3inc, ${middle}sc] * 2 (${rows[1]})`);
        expect(formatRow(englishPatternTerms, pattern.incArray[1])).toBe(`Row 3: [[1inc, 1sc] * 3, ${middle}sc] * 2 (${rows[2]})`);
    });
});

describe("generateTubePattern: open buis", () => {
    const neck = shapeOfCm("Tube", { width: 4, height: 3, length: 4 });
    const pattern = generateTubePattern(neck, "Medium", ROW_HEIGHTS, [], englishPatternTerms);
    const rows = stitchesPerRow(pattern);

    it("begint met een ring van lossen en haakt recht door, zonder meerderen of minderen", () => {
        expect(formatRow(englishPatternTerms, pattern.firstRow)).toContain(`ch ${rows[0]}`);
        rows.forEach((stitches) => expect(stitches).toBe(rows[0]));
        expect(pattern.incArray).toEqual([]);
        expect(pattern.decArray).toEqual([]);
    });

    it("open aan beide kanten, niet plat", () => {
        expect(pattern.closed).toBe(false);
        expect(pattern.flat).toBe(false);
    });

    it("de omtrek bepaalt de steken, de hoogte de rondes", () => {
        expect(rows[0]).toBe(Math.round((Math.PI * 4) / (ROW_HEIGHTS.Medium * 1.1)));
        expect(pattern.rows).toBe(Math.round(3 / ROW_HEIGHTS.Medium));
        expect(rows.length).toBe(pattern.rows);
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("shapeSpace (zonder three.js)", () => {
    const shape = shapeOfCm("Sphere", { width: 5, height: 7, length: 4 }, { x: 0.3, y: -1.2, z: 0.8, rotation_x: 25, rotation_y: -40, rotation_z: 70 });

    it("zelfde transformatie als de mesh in three.js", () => {
        const matrix = new THREE.Matrix4().compose(
            new THREE.Vector3(shape.x, shape.y, shape.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(shape.rotation_x),
                THREE.MathUtils.degToRad(shape.rotation_y),
                THREE.MathUtils.degToRad(shape.rotation_z),
            )),
            new THREE.Vector3(...meshScaleOf(shape)),
        );
        const local = { x: 0.2, y: -0.7, z: 0.4 };
        const expected = new THREE.Vector3(local.x, local.y, local.z).applyMatrix4(matrix);
        const world = localToWorld(shape, local);
        expect(world.x).toBeCloseTo(expected.x, 10);
        expect(world.y).toBeCloseTo(expected.y, 10);
        expect(world.z).toBeCloseTo(expected.z, 10);
        const back = worldToLocal(shape, world);
        expect(back.x).toBeCloseTo(local.x, 10);
        expect(back.y).toBeCloseTo(local.y, 10);
        expect(back.z).toBeCloseTo(local.z, 10);
    });

    it("buis en ovaal: binnen/buiten en de haakvolgorde", () => {
        const tube = shapeOfCm("Tube", { width: 2, height: 4, length: 2 });
        expect(insideLocal(tube, { x: 0, y: 0.5, z: 0 })).toBe(true);
        expect(crochetFraction(tube, { x: 0.5, y: 0, z: 0 })).toBe(0);
        expect(crochetFraction(tube, { x: 0.5, y: 1, z: 0 })).toBe(1);

        const oval = shapeOfCm("Oval", { width: 2, height: 0.3, length: 4 });
        // Het middenstuk (de lossen) is ronde 1, de punt van de lange kant en de zijkant de rand.
        expect(crochetFraction(oval, { x: 0, y: 0, z: 0.2 })).toBe(0);
        expect(crochetFraction(oval, { x: 0, y: 0, z: 0.5 })).toBeCloseTo(1, 6);
        expect(crochetFraction(oval, { x: 0.5, y: 0, z: 0 })).toBeCloseTo(1, 6);
    });

    it("open buis in 3D: een cilinder zonder bodem en bovenkant", () => {
        const geometry = createSolidGeometry("Tube") as THREE.CylinderGeometry;
        expect(geometry.parameters.openEnded).toBe(true);
    });
});
