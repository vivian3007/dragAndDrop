import { describe, expect, it } from "vitest";
import * as THREE from "three";
import generateSpherePattern from "./generateSpherePattern";
import generateConePattern from "./generateConePattern";
import { englishPatternTerms, formatRow, PatternRow } from "./patternTerms";
import { ROW_HEIGHTS } from "./estimateYarn";
import { makeShape, shapeOfCm } from "./testShapes";
import { eggRadiusAt, eggWidestY } from "../geometry/eggShape";
import { coneTop } from "../geometry/coneShape";
import { createSphereGeometry } from "../geometry/sphereGeometry";
import { createSolidGeometry } from "../geometry/solidGeometry";
import { crochetFraction, insideLocal } from "../geometry/shapeSpace";
import { attachToNearest } from "../geometry/attach";

type RowsOf = { incArray: PatternRow[]; scArray: PatternRow[]; decArray: PatternRow[]; closed: boolean; rows: number };

// Steken per ronde, met ronde 1 (magische ring, 6) en bij een dichte vorm de slotronde (6).
function stitchesPerRow(pattern: RowsOf): number[] {
    const rows = [6];
    for (const line of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let i = line.from; i <= line.to; i++) rows.push(line.stitches);
    }
    if (pattern.closed) rows.push(6);
    return rows;
}

function expectSmoothSteps(rows: number[]) {
    rows.slice(1).forEach((stitches, i) => expect(Math.abs(stitches - rows[i])).toBeLessThanOrEqual(6));
    rows.forEach((stitches) => expect(stitches % 6).toBe(0));
}

describe("ei en peer: de vorm", () => {
    it("de breedste ronde heeft precies straal 1, wat de vorm ook is", () => {
        for (const taper of [0.1, 0.3, 0.5, 0.7]) {
            expect(eggRadiusAt(eggWidestY(taper), taper)).toBeCloseTo(1, 6);
            for (let y = -1; y <= 1; y += 0.01) expect(eggRadiusAt(y, taper)).toBeLessThanOrEqual(1 + 1e-9);
        }
    });

    it("de onderkant is smaller dan de bovenkant", () => {
        expect(eggRadiusAt(-0.6, 0.5)).toBeLessThan(eggRadiusAt(0.6, 0.5));
        expect(eggRadiusAt(-0.6, 0)).toBeCloseTo(eggRadiusAt(0.6, 0), 9);
    });

    it("3D: zelfde maat (bounding box) als de bol, maar onder smaller", () => {
        const egg = createSphereGeometry({ type: "Sphere", taper: 0.5 });
        const box = egg.boundingBox!;
        expect(box.max.x).toBeCloseTo(1, 2);
        expect(box.min.y).toBeCloseTo(-1, 6);
        expect(box.max.y).toBeCloseTo(1, 6);
        const position = egg.attributes.position;
        const normal = egg.attributes.normal;
        for (let i = 0; i < position.count; i++) {
            const p = new THREE.Vector3().fromBufferAttribute(position, i);
            expect(Math.hypot(p.x, p.z)).toBeCloseTo(eggRadiusAt(p.y, 0.5), 5);
            // Normalen wijzen naar buiten.
            const n = new THREE.Vector3().fromBufferAttribute(normal, i);
            expect(n.length()).toBeCloseTo(1, 5);
            if (Math.hypot(p.x, p.z) > 0.1) expect(n.x * p.x + n.z * p.z).toBeGreaterThan(0);
        }
    });

    it("een gewone bol blijft precies hetzelfde", () => {
        const ball = createSphereGeometry({ type: "Sphere" });
        const plain = new THREE.SphereGeometry(1, 64, 48);
        expect(Array.from(ball.attributes.position.array)).toEqual(Array.from(plain.attributes.position.array));
        expect(ball.userData.eggTaper).toBeUndefined();
    });

    it("zit erin / haakvolgorde volgen de vorm", () => {
        const egg = makeShape({ type: "Sphere", taper: 0.6 });
        const narrow = eggRadiusAt(-0.7, 0.6);
        expect(insideLocal(egg, { x: narrow * 0.95, y: -0.7, z: 0 })).toBe(true);
        expect(insideLocal(egg, { x: narrow * 1.05, y: -0.7, z: 0 })).toBe(false);
        // Op het oppervlak: dezelfde ronde als de bol op die hoogte (gelijke poolhoek).
        const ball = makeShape({ type: "Sphere" });
        const angle = 2.2;
        const y = Math.cos(angle);
        expect(crochetFraction(egg, { x: eggRadiusAt(y, 0.6), y, z: 0 })).toBeCloseTo(crochetFraction(ball, { x: Math.sin(angle), y, z: 0 }), 6);
    });

    it("aansluiten werkt ook op en met een ei", () => {
        const body = makeShape({ id: "lijf", type: "Sphere", width: 150, height: 200, length: 150, taper: 0.5 });
        const head = makeShape({ id: "hoofd", type: "Sphere", width: 100, height: 100, length: 100, y: 5 });
        const placed = attachToNearest(head, [body])!.shape;
        expect(placed.y).toBeGreaterThan(0);
        const egg = makeShape({ id: "ei", type: "Sphere", width: 60, height: 80, length: 60, taper: 0.5, y: 6 });
        const onHead = attachToNearest(egg, [head])!.shape;
        expect(Number.isFinite(onHead.y)).toBe(true);
    });
});

describe.each([
    ["ei 5 × 7 cm", shapeOfCm("Sphere", { width: 5, height: 7, length: 5 }, { taper: 0.3 })],
    ["peer 6 × 8 cm", shapeOfCm("Sphere", { width: 6, height: 8, length: 6 }, { taper: 0.7 })],
    ["klein eitje", shapeOfCm("Sphere", { width: 3, height: 4, length: 3 }, { taper: 0.4 })],
    ["open peer (lijf voor het hoofd)", shapeOfCm("OpenSphere", { width: 6, height: 8, length: 6 }, { taper: 0.6, opening: 0.5 })],
])("generateSpherePattern als ei/peer: %s", (_label, shape) => {
    const pattern = generateSpherePattern(shape, "Medium", ROW_HEIGHTS, [], englishPatternTerms);
    const rows = stitchesPerRow(pattern);
    const ball = generateSpherePattern({ ...shape, taper: 0 }, "Medium", ROW_HEIGHTS, [], englishPatternTerms);
    const ballRows = stitchesPerRow(ball);

    it("telt precies het opgegeven aantal rondes, in stappen van 6", () => {
        expect(rows.length).toBe(pattern.rows);
        expect(pattern.lastRow).toBe(pattern.rows);
        expectSmoothSteps(rows);
    });

    it("eerst alleen meerderen, dan alleen minderen", () => {
        const peak = rows.indexOf(Math.max(...rows));
        rows.slice(1, peak + 1).forEach((stitches, i) => expect(stitches).toBeGreaterThanOrEqual(rows[i]));
        rows.slice(peak + 1).forEach((stitches, i) => expect(stitches).toBeLessThanOrEqual(rows[peak + i]));
    });

    it("de brede kant gaat net zo snel als bij een bol; de smalle kant is smaller", () => {
        expect(rows.slice(0, 3)).toEqual(ballRows.slice(0, 3));
        // Nergens breder dan de bol, en in de onderste helft ergens smaller.
        // (Met een opening kan het ei een ronde langer zijn: de opening aan de smalle kant is kleiner.)
        rows.slice(0, ballRows.length).forEach((stitches, i) => expect(stitches).toBeLessThanOrEqual(ballRows[i]));
        const half = Math.floor(rows.length / 2);
        expect(rows.slice(half).some((stitches, i) => stitches < ballRows[half + i])).toBe(true);
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("generateSpherePattern: een bol zonder toelopen blijft gelijk", () => {
    it("taper 0 of leeg geeft hetzelfde patroon", () => {
        const shape = shapeOfCm("Sphere", { width: 5, height: 7, length: 4 });
        expect(generateSpherePattern({ ...shape, taper: 0 }, "Medium", ROW_HEIGHTS, [])).toEqual(generateSpherePattern(shape, "Medium", ROW_HEIGHTS, []));
    });
});

describe.each([
    ["poot 3 → 4 cm", shapeOfCm("Cone", { width: 4, height: 4, length: 4 }, { topWidth: 0.75 })],
    ["snuit, smalle bovenkant", shapeOfCm("Cone", { width: 4, height: 2, length: 4 }, { topWidth: 0.4 })],
    ["bijna een cilinder", shapeOfCm("Cone", { width: 3, height: 5, length: 3 }, { topWidth: 0.9 })],
    ["platte brede", shapeOfCm("Cone", { width: 10, height: 1, length: 10 }, { topWidth: 0.3 })],
])("generateConePattern taps toelopend: %s", (_label, shape) => {
    const pattern = generateConePattern(shape, "Medium", ROW_HEIGHTS, [], englishPatternTerms);
    const rows = stitchesPerRow(pattern);
    const topStitches = rows.find((stitches, i) => rows[i + 1] === stitches)!;
    const edge = rows.indexOf(topStitches) + 2;

    it("open onderkant, juist aantal rondes, nooit smaller", () => {
        expect(pattern.closed).toBe(false);
        expect(rows.length).toBe(pattern.rows);
        expectSmoothSteps(rows);
        rows.slice(1).forEach((stitches, i) => expect(stitches).toBeGreaterThanOrEqual(rows[i]));
    });

    it("eerst een plat rondje tot de bovenkant, dan één ronde in de achterste lus", () => {
        rows.slice(0, edge - 1).forEach((stitches, i) => expect(stitches).toBe((i + 1) * 6));
        expect(topStitches).toBeGreaterThanOrEqual(12);
        const edgeLine = pattern.incArray.find((line) => line.from === edge)!;
        expect(edgeLine.to).toBe(edge);
        expect(formatRow(englishPatternTerms, edgeLine)).toContain("BLO");
        expect(pattern.incArray.filter((line) => line.instruction.includes("BLO"))).toHaveLength(1);
    });

    it("de onderkant is minstens zo breed als de bovenkant (bij een heel kleine vorm kan dat afronden tot evenveel)", () => {
        expect(rows[rows.length - 1]).toBeGreaterThanOrEqual(topStitches);
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rows.reduce((sum, n) => sum + n, 0));
    });
});

describe("taps toelopende kegel: vorm en haakvolgorde", () => {
    it("zonder bovenkant blijft het precies de oude kegel", () => {
        const shape = shapeOfCm("Cone", { width: 3, height: 4, length: 3 });
        expect(generateConePattern({ ...shape, topWidth: 0 }, "Medium", ROW_HEIGHTS, [])).toEqual(generateConePattern(shape, "Medium", ROW_HEIGHTS, []));
        expect(createSolidGeometry("Cone", shape).type).toBe("ConeGeometry");
    });

    it("3D: een afgeknotte kegel met de bovenkant op hoogte 1", () => {
        const geometry = createSolidGeometry("Cone", { type: "Cone", topWidth: 0.5 }) as THREE.CylinderGeometry;
        expect(geometry.parameters.radiusTop).toBeCloseTo(0.25, 9);
        expect(geometry.parameters.radiusBottom).toBeCloseTo(0.5, 9);
        geometry.computeBoundingBox();
        expect(geometry.boundingBox!.min.y).toBeCloseTo(0, 9);
        expect(geometry.boundingBox!.max.y).toBeCloseTo(1, 9);
    });

    it("alleen een kegel heeft een bovenkant, en die blijft binnen de grenzen", () => {
        expect(coneTop({ type: "Cylinder", topWidth: 0.5 })).toBe(0);
        expect(coneTop({ type: "Cone", topWidth: 2 })).toBe(0.9);
    });

    it("zit erin en haakvolgorde: van het midden bovenop via de rand naar de onderkant", () => {
        const shape = makeShape({ type: "Cone", topWidth: 0.5 });
        expect(insideLocal(shape, { x: 0.24, y: 0.99, z: 0 })).toBe(true);
        expect(insideLocal(shape, { x: 0.3, y: 0.99, z: 0 })).toBe(false);
        const middle = crochetFraction(shape, { x: 0, y: 1, z: 0 });
        const rim = crochetFraction(shape, { x: 0.25, y: 1, z: 0 });
        const side = crochetFraction(shape, { x: 0.375, y: 0.5, z: 0 });
        expect(middle).toBeCloseTo(0, 9);
        expect(rim).toBeGreaterThan(middle);
        expect(side).toBeGreaterThan(rim);
        expect(crochetFraction(shape, { x: 0.5, y: 0, z: 0 })).toBe(1);
    });
});
