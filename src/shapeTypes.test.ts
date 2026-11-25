import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { SHAPE_TYPES, PALETTE_GROUPS, PALETTE_SHAPE_TYPES } from "./shapeTypes";
import { shapeComponentFor } from "./shapeComponents";
import { generatePattern } from "./patterns/generators";
import { ROW_HEIGHTS } from "./patterns/estimateYarn";
import { computePatternBounds } from "./geometry/patternBounds";
import { shapeOfCm } from "./patterns/testShapes";
import { isDecoration } from "./patterns/embroidery";
import { shapeDefinition } from "./shapes/registry";
import { createShapeGeometry, hasShapeGeometry } from "./shapes/geometry3d";
import { stitchRepeat } from "./geometry/yarnLook";
import { crochetFraction, insideLocal } from "./geometry/shapeSpace";
import nl from "./i18n/locales/nl.json";
import en from "./i18n/locales/en.json";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const locales: Record<string, Record<string, string>> = { nl, en };

// Elke vorm moet overal bekend zijn — anders wordt hij bv. als bol getekend of krijgt hij geen
// patroon (zoals bij het platte rondje en de halve bol ooit gebeurde). Alles over een vorm staat
// in z'n definitie (shapes/definitions/); deze test controleert dat die compleet is.
describe.each(SHAPE_TYPES)("vormtype %s", (type) => {
    const shape = shapeOfCm(type, { width: 3, height: 3, length: 3 });
    const definition = shapeDefinition(type);

    it("heeft een eigen definitie", () => {
        expect(definition.type).toBe(type);
    });

    it("heeft een 3D-component en (behalve de oude arm) een 3D-vorm", () => {
        expect(shapeComponentFor(type)).toBeDefined();
        if (definition.space !== "arm") {
            expect(hasShapeGeometry(type)).toBe(true);
            const geometry = createShapeGeometry(shape);
            expect(geometry.attributes.position.count).toBeGreaterThan(0);
            geometry.computeBoundingBox();
            const box = geometry.boundingBox!;
            // De 3D-vorm vult precies de eigen ruimte (zie ShapeSpace in shapes/types.ts).
            const expected = definition.space === "sphere"
                ? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
                : new THREE.Box3(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
            if (definition.attach !== "embroidery") {
                // (Een open bol houdt onderaan op: daar zit de opening.)
                if (definition.attach !== "openSphere") expect(box.min.y).toBeCloseTo(expected.min.y, 1);
                expect(box.max.y).toBeCloseTo(expected.max.y, 1);
                expect(Math.max(box.max.x, box.max.z)).toBeCloseTo(expected.max.x, 1);
            }
        }
    });

    it(isDecoration(shape) ? "heeft (als oog of borduursel) geen eigen patroon" : "heeft een patroon", () => {
        const pattern = generatePattern(shape, "Medium", ROW_HEIGHTS, []);
        if (isDecoration(shape)) expect(pattern).toBeNull();
        else {
            expect(pattern).not.toBeNull();
            expect(pattern!.rows).toBeGreaterThan(0);
            expect(pattern!.stitchCount).toBeGreaterThan(0);
        }
    });

    it("heeft afmetingen en een garentextuur", () => {
        expect(computePatternBounds([shape])).not.toBeNull();
        stitchRepeat(shape).forEach((repeat) => expect(Number.isFinite(repeat)).toBe(true));
    });

    it("het midden ligt in de vorm, en de haakvolgorde loopt van 0 tot 1", () => {
        if (definition.attach !== "embroidery") expect(insideLocal(shape, { x: 0, y: definition.centerY, z: 0 })).toBe(true);
        const fraction = crochetFraction(shape, { x: 0.2, y: definition.centerY, z: 0.1 });
        expect(fraction).toBeGreaterThanOrEqual(0);
        expect(fraction).toBeLessThanOrEqual(1);
    });

    it("heeft een naam en uitleg in elke taal", () => {
        for (const messages of Object.values(locales)) {
            expect(messages[`shapes.${type}`]).toBeTruthy();
            if (definition.inPalette) expect(messages[`shapes.${type}.hint`]).toBeTruthy();
            if (definition.settings.includes("stripes")) expect(messages[`stripes.direction.${type}`]).toBeTruthy();
            if (definition.finishKey) expect(messages[definition.finishKey]).toBeTruthy();
            for (const stitch of definition.extraStitches ?? []) expect(messages[`pattern.abbr.${stitch}`]).toBeTruthy();
        }
    });

    it("heeft een pictogram in de vormenbalk", () => {
        if (!definition.inPalette) return;
        // Een SVG-pad uit de definitie, of (de oudere vormen) een klasse in styles.css.
        expect(!!definition.icon || new RegExp(`\\.${type}\\s*\\{`).test(styles)).toBe(true);
    });
});

describe("vormenbalk", () => {
    it("elke vorm uit de balk staat in precies één groep", () => {
        expect(PALETTE_GROUPS.flatMap((group) => group.types).sort()).toEqual([...PALETTE_SHAPE_TYPES].sort());
    });

    it("de groepen hebben een naam in elke taal", () => {
        for (const messages of Object.values(locales)) {
            PALETTE_GROUPS.forEach(({ category }) => expect(messages[`shapebar.group.${category}`]).toBeTruthy());
        }
    });
});
