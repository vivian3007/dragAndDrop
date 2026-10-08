import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { attachToNearest, containsPoint, rimPoints } from "./attach";
import { makeShape } from "../patterns/testShapes";

// Lijf: (uitgerekte) bol rond de oorsprong. Maten in opslag-eenheden (×0,01 = wereld).
const body = makeShape({ id: "lijf", type: "Sphere", width: 150, height: 170, length: 140 });

function expectRimInside(attached: Shape, target: Shape) {
    for (const point of rimPoints(attached)) {
        expect(containsPoint(target, point)).toBe(true);
    }
}

describe.each(["Cylinder", "Arm", "Cone"])("aansluiten: %s op een uitgerekte bol", (type) => {
    // Schuin onder het lijf losgelaten, scheef gedraaid en met een kier.
    const leg = makeShape({ id: "poot", type, width: 75, height: 70, length: 75, x: 0.8, y: -2.4, z: 0.3, rotation_z: 40 });
    const result = attachToNearest(leg, [body, leg])!;

    it("kiest het lijf", () => {
        expect(result.targetId).toBe("lijf");
    });

    it("sluit rondom aan: de hele rand van de onderkant zit in het lijf", () => {
        expectRimInside(result.shape, body);
    });

    it("zakt niet verder dan nodig: het uiteinde steekt nog ruim naar buiten", () => {
        const matrix = new THREE.Matrix4().compose(
            new THREE.Vector3(result.shape.x, result.shape.y, result.shape.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(result.shape.rotation_x),
                THREE.MathUtils.degToRad(result.shape.rotation_y),
                THREE.MathUtils.degToRad(result.shape.rotation_z),
            )),
            new THREE.Vector3(1, 1, 1),
        );
        // Het einde van de vorm (lokale y = hoogte) ligt buiten het lijf.
        const tip = new THREE.Vector3(0, result.shape.height * 0.01 * 0.9, 0).applyMatrix4(matrix);
        expect(containsPoint(body, tip)).toBe(false);
    });

    it("komt haaks uit het oppervlak: de as wijst van het lijf af", () => {
        const axis = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(result.shape.rotation_x),
            THREE.MathUtils.degToRad(result.shape.rotation_y),
            THREE.MathUtils.degToRad(result.shape.rotation_z),
        ));
        const outward = new THREE.Vector3(result.shape.x, result.shape.y, result.shape.z).normalize();
        expect(axis.dot(outward)).toBeGreaterThan(0.7);
    });
});

describe("aansluiten: overige gevallen", () => {
    it("een poot op een cilinder-lijf sluit rondom aan", () => {
        const cylBody = makeShape({ id: "lijf", type: "Cylinder", width: 200, height: 250, length: 200 });
        const arm = makeShape({ id: "arm", type: "Arm", width: 50, height: 100, length: 50, x: 1.4, y: 1.2 });
        const result = attachToNearest(arm, [cylBody])!;
        expectRimInside(result.shape, cylBody);
    });

    it("een snuit (bol) zakt een stukje in het hoofd en raakt het rondom", () => {
        const head = makeShape({ id: "hoofd", type: "Sphere", width: 130, height: 120, length: 125, y: 2.6 });
        const snout = makeShape({ id: "snuit", type: "Sphere", width: 55, height: 45, length: 45, y: 2.4, z: 2 });
        const result = attachToNearest(snout, [head])!;
        const center = new THREE.Vector3(result.shape.x, result.shape.y, result.shape.z);
        expect(containsPoint(head, center)).toBe(false);
        // Het deel van de snuit richting het hoofd zit erin.
        const towardHead = center.clone().lerp(new THREE.Vector3(0, 2.6, 0), 0.4);
        expect(containsPoint(head, towardHead)).toBe(true);
    });

    it("kiest de dichtstbijzijnde vorm", () => {
        const head = makeShape({ id: "hoofd", type: "Sphere", width: 130, height: 120, length: 125, y: 2.6 });
        const ear = makeShape({ id: "oor", type: "Cone", width: 90, height: 70, length: 60, x: 0.9, y: 3.6 });
        expect(attachToNearest(ear, [body, head, ear])!.targetId).toBe("hoofd");
    });

    it("zonder andere vormen: niets te doen", () => {
        expect(attachToNearest(body, [body])).toBeNull();
    });
});
