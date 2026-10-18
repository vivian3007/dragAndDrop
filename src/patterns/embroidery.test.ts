import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { attachToNearest, containsPoint, snapIfTouching } from "../geometry/attach";
import { createSolidGeometry } from "../geometry/solidGeometry";
import { mirrorShape } from "../geometry/mirrorShape";
import { shapeDimensionCm } from "../geometry/units";
import { generatePattern } from "./generators";
import { ROW_HEIGHTS } from "./estimateYarn";
import { yarnUsage } from "./yarnUsage";
import { shapeOfCm } from "./testShapes";
import {
    embroideryDefaults,
    embroideryPlacements,
    embroiderySupplies,
    embroideryTarget,
} from "./embroidery";

// Hoofd van 6 cm met twee oogjes en een mondje eronder.
const head = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { id: "hoofd", name: "Hoofd", y: 2 });
const eye = (id: string, name: string, x: number) =>
    attachToNearest(shapeOfCm("Eye", { width: 1, height: 1, length: 1 }, { id, name, x, y: 2.3, z: 1.3, color: "#111111" }), [head])!.shape;
const leftEye = eye("oogL", "Linkeroog", -0.4);
const rightEye = eye("oogR", "Rechteroog", 0.4);
const looseMouth = { ...shapeOfCm("Embroidery", { width: 1, height: 1, length: 1 }), id: "mond", name: null, x: 0, y: 1.6, z: 1.3, ...embroideryDefaults("mouth") };
const mouth = attachToNearest(looseMouth, [head, leftEye, rightEye])!.shape;
const shapes = [head, leftEye, rightEye, mouth];

const axes = (shape: Shape) => {
    const rotation = new THREE.Euler(
        THREE.MathUtils.degToRad(shape.rotation_x),
        THREE.MathUtils.degToRad(shape.rotation_y),
        THREE.MathUtils.degToRad(shape.rotation_z),
    );
    return {
        x: new THREE.Vector3(1, 0, 0).applyEuler(rotation),
        y: new THREE.Vector3(0, 1, 0).applyEuler(rotation),
        z: new THREE.Vector3(0, 0, 1).applyEuler(rotation),
    };
};

describe("borduursel aansluiten", () => {
    it("ligt óp het oppervlak van het hoofd, niet erin of erboven", () => {
        const radius = Math.hypot(mouth.x - head.x, mouth.y - head.y, mouth.z - head.z);
        expect(radius).toBeCloseTo(head.width * 0.01, 2);
    });

    it("staat recht: van links naar rechts horizontaal, de bovenkant naar boven, plat op het hoofd", () => {
        const { x, y, z } = axes(mouth);
        expect(Math.abs(x.y)).toBeLessThan(1e-6);
        expect(-z.y).toBeGreaterThan(0.5);
        const outward = new THREE.Vector3(mouth.x - head.x, mouth.y - head.y, mouth.z - head.z).normalize();
        expect(y.dot(outward)).toBeGreaterThan(0.999);
    });

    it("weet hoe bol het hoofd is (1/straal in cm), zodat de draad meebuigt", () => {
        expect(mouth.curvature).toBeCloseTo(1 / 3, 1);
    });

    it("niets sluit aan op een borduursel", () => {
        const nose = { ...looseMouth, id: "neus", ...embroideryDefaults("nose"), x: 0.05, y: mouth.y, z: mouth.z + 0.02 };
        expect(snapIfTouching(nose, [mouth])).toBeNull();
        expect(snapIfTouching(nose, [head, mouth])?.targetId).toBe("hoofd");
    });

    it("spiegelen houdt het recht en op het hoofd", () => {
        const cheek = attachToNearest({ ...looseMouth, id: "wang", ...embroideryDefaults("cheek"), x: 1.2, y: 1.8, z: 1 }, [head])!.shape;
        const mirrored = { ...mirrorShape(cheek, [head, cheek]), id: "wang2" } as Shape;
        expect(mirrored.x).toBeCloseTo(-cheek.x, 6);
        expect(Math.abs(axes(mirrored).x.y)).toBeLessThan(1e-6);
        expect(embroideryTarget(mirrored, [head])?.id).toBe("hoofd");
    });
});

describe("borduursel in 3D", () => {
    it.each(["mouth", "nose", "brow", "cheek"] as const)("%s: past binnen de eigen maat", (detail) => {
        const shape = { ...looseMouth, ...embroideryDefaults(detail), curvature: 1 / 3 };
        const geometry = createSolidGeometry("Embroidery", shape);
        const box = geometry.boundingBox!;
        expect(box.min.x).toBeGreaterThanOrEqual(-0.51);
        expect(box.max.x).toBeLessThanOrEqual(0.51);
        expect(box.min.z).toBeGreaterThanOrEqual(-0.51);
        expect(box.max.z).toBeLessThanOrEqual(0.51);
        // Geen garen onder het oppervlak in het midden; aan de randen buigt hij mee omlaag.
        expect(box.max.y).toBeGreaterThan(0);
    });

    it("de draad ligt op het oppervlak, ook aan de uiteinden van het mondje", () => {
        const geometry = createSolidGeometry("Embroidery", mouth);
        const matrix = new THREE.Matrix4().compose(
            new THREE.Vector3(mouth.x, mouth.y, mouth.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(mouth.rotation_x),
                THREE.MathUtils.degToRad(mouth.rotation_y),
                THREE.MathUtils.degToRad(mouth.rotation_z),
            )),
            new THREE.Vector3(mouth.width * 0.01, mouth.height * 0.01, mouth.length * 0.01),
        );
        const position = geometry.attributes.position;
        const threadWorld = mouth.height * 0.01;
        const point = new THREE.Vector3();
        let maxGap = 0;
        for (let i = 0; i < position.count; i++) {
            point.fromBufferAttribute(position, i).applyMatrix4(matrix);
            const gap = point.distanceTo(new THREE.Vector3(head.x, head.y, head.z)) - head.width * 0.01;
            maxGap = Math.max(maxGap, gap);
        }
        // Nergens meer dan één draaddikte boven het hoofd uit (dan zweeft hij).
        expect(maxGap).toBeLessThan(threadWorld * 1.05);
        expect(containsPoint(head, new THREE.Vector3(mouth.x, mouth.y, mouth.z).multiplyScalar(0.999))).toBe(true);
    });
});

describe("borduursel in het patroon", () => {
    const [placement] = embroideryPlacements(shapes, "Medium");
    const headRows = generatePattern(head, "Medium", ROW_HEIGHTS, [])!.rows;

    it("zit op het hoofd, onder de ogen", () => {
        expect(placement.target.id).toBe("hoofd");
        expect(placement.detail).toBe("mouth");
        expect(placement.eye).not.toBeNull();
        expect(placement.eye!.below).toBe(true);
        expect(placement.eye!.rowsApart).toBeGreaterThanOrEqual(1);
    });

    it("de rondes liggen in de onderste helft van de bol van boven naar onder gehaakt", () => {
        const [from, to] = placement.rows;
        expect(from).toBeLessThanOrEqual(to);
        expect(from).toBeGreaterThan(headRows / 2);
        expect(to).toBeLessThanOrEqual(headRows);
    });

    it("breedte in steken: de breedte gedeeld door de steekbreedte", () => {
        expect(placement.stitchesWide).toBe(Math.round(shapeDimensionCm(mouth, "width") / (ROW_HEIGHTS.Medium * 1.1)));
    });

    it("geen garen in het garenoverzicht, wel borduurgaren bij de benodigdheden", () => {
        const { colors } = yarnUsage(shapes, "Medium");
        expect(colors.flatMap((color) => color.uses.map((use) => use.name))).toEqual(["Hoofd"]);
        expect(embroiderySupplies(shapes)).toEqual([{ color: "#111111", details: ["mouth"] }]);
    });

    it("een los borduursel (op geen enkel onderdeel) komt niet in het patroon", () => {
        expect(embroideryPlacements([head, { ...mouth, z: 10 }], "Medium")).toEqual([]);
    });
});
