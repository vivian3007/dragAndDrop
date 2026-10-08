import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { attachToNearest, containsPoint, findAttachedTarget, nudgeShape, rimPoints } from "./attach";
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

describe("aansluiten: platte vormen", () => {
    it("een buiklapje (plat rondje) ligt plat op het lijf, de hele rand erin", () => {
        const patch = makeShape({ id: "lapje", type: "Disc", width: 80, height: 11, length: 80, x: 0.2, y: 0.1, z: 2.2 });
        const result = attachToNearest(patch, [body])!;
        expectRimInside(result.shape, body);
        // Plat: de as (dikte) wijst van het lijf af, naar voren.
        const axis = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(result.shape.rotation_x),
            THREE.MathUtils.degToRad(result.shape.rotation_y),
            THREE.MathUtils.degToRad(result.shape.rotation_z),
        ));
        expect(axis.z).toBeGreaterThan(0.7);
    });

    it("een muts (halve bol) zit rondom op het hoofd", () => {
        const head = makeShape({ id: "hoofd", type: "Sphere", width: 130, height: 120, length: 125, y: 2.6 });
        const hat = makeShape({ id: "muts", type: "Dome", width: 110, height: 55, length: 110, y: 4.2 });
        const result = attachToNearest(hat, [head])!;
        expectRimInside(result.shape, head);
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

describe("pijltjestoetsen (nudgeShape)", () => {
    // Camera recht van voren (zoals de editor begint): rechts = +x, omhoog = +y.
    const front = { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    const head = makeShape({ id: "hoofd", type: "Sphere", width: 130, height: 120, length: 125, y: 2.6 });
    const loose = makeShape({ id: "oor", type: "Cone", width: 90, height: 70, length: 60, x: 0.3, y: 3.8 });
    const ear = attachToNearest(loose, [head])!.shape;
    const position = (shape: Shape) => new THREE.Vector3(shape.x, shape.y, shape.z);

    it("een aangesloten oor zit vast aan het hoofd", () => {
        expect(findAttachedTarget(ear, [head, ear])?.id).toBe("hoofd");
    });

    it("→ schuift het oor naar rechts over het hoofd, en het blijft rondom aangesloten", () => {
        let moved = ear;
        for (let i = 0; i < 5; i++) moved = nudgeShape(moved, [head], "right", front).shape;
        expect(moved.x).toBeGreaterThan(ear.x);
        expectRimInside(moved, head);
        expect(findAttachedTarget(moved, [head])?.id).toBe("hoofd");
    });

    it("↓ schuift het oor omlaag, ← weer naar links", () => {
        const down = nudgeShape(ear, [head], "down", front).shape;
        expect(down.y).toBeLessThan(ear.y);
        const left = nudgeShape(ear, [head], "left", front).shape;
        expect(left.x).toBeLessThan(ear.x);
        expectRimInside(down, head);
        expectRimInside(left, head);
    });

    it("heen en terug: weer op dezelfde plek", () => {
        const back = nudgeShape(nudgeShape(ear, [head], "up", front).shape, [head], "down", front).shape;
        // Niet exact (de draaias hangt af van waar hij zit), maar veel kleiner dan een stap.
        expect(position(back).distanceTo(position(ear))).toBeLessThan(0.02);
    });

    it("met Shift (fijn) een kleinere stap", () => {
        const normal = position(nudgeShape(ear, [head], "right", front).shape).distanceTo(position(ear));
        const fine = position(nudgeShape(ear, [head], "right", front, true).shape).distanceTo(position(ear));
        expect(fine).toBeLessThan(normal / 2);
    });

    it("rechts volgt de camera: van achteren gezien is rechts de andere kant op", () => {
        const back = { right: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
        const fromFront = nudgeShape(ear, [head], "right", front).shape;
        const fromBack = nudgeShape(ear, [head], "right", back).shape;
        expect(Math.sign(fromFront.x - ear.x)).toBe(-Math.sign(fromBack.x - ear.x));
    });

    it("een losse vorm schuift recht op", () => {
        const far = makeShape({ id: "los", type: "Sphere", width: 50, height: 50, length: 50, x: 6, y: 0 });
        const result = nudgeShape(far, [head, far], "up", front);
        expect(result.targetId).toBeNull();
        expect(result.shape.y).toBeCloseTo(0.15, 6);
        expect(result.shape.x).toBe(6);
    });

    it("een losse poot die het lijf raakt, klikt er netjes tegenaan", () => {
        // Net onder het lijf (onderkant ±-1,7), één stap omhoog raakt hij.
        const leg = makeShape({ id: "poot", type: "Cylinder", width: 75, height: 70, length: 75, x: 0.5, y: -2.4, rotation_z: 180 });
        let result = nudgeShape(leg, [body, leg], "up", front);
        for (let i = 0; i < 6 && !result.targetId; i++) result = nudgeShape(result.shape, [body, leg], "up", front);
        expect(result.targetId).toBe("lijf");
        expectRimInside(result.shape, body);
    });
});
