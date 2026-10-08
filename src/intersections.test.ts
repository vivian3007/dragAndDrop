import { describe, expect, it } from "vitest";
import * as THREE from "three";
import calculateIntersections from "./calculateIntersections";
import { createSolidGeometry, isSolidShapeType } from "./geometry/solidGeometry";
import { WORLD_SCALE_FACTOR } from "./geometry/units";
import { generatePattern } from "./patterns/generators";
import { ROW_HEIGHTS } from "./patterns/estimateYarn";
import { shapeOfCm } from "./patterns/testShapes";
import { attachToNearest, containsPoint } from "./geometry/attach";
import { eyePlacements, eyeSupplies } from "./patterns/eyes";

// Bouwt de scene zoals Sphere.tsx en SolidShape.tsx dat doen (mesh met uuid = vorm-id,
// schaal uit width/height/length), zonder te renderen.
function sceneOf(shapes: Shape[]): THREE.Scene {
    const scene = new THREE.Scene();
    for (const shape of shapes) {
        const geometry = isSolidShapeType(shape.type) ? createSolidGeometry(shape.type) : new THREE.SphereGeometry(1, 32, 32);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.uuid = shape.id;
        mesh.scale.set(shape.width * WORLD_SCALE_FACTOR, shape.height * WORLD_SCALE_FACTOR, shape.length * WORLD_SCALE_FACTOR);
        mesh.position.set(shape.x, shape.y, shape.z);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(shape.rotation_x),
            THREE.MathUtils.degToRad(shape.rotation_y),
            THREE.MathUtils.degToRad(shape.rotation_z),
        );
        scene.add(mesh);
    }
    scene.updateMatrixWorld(true);
    return scene;
}

function intersectionsOf(shapes: Shape[]): Intersection[] {
    let result: Intersection[] = [];
    calculateIntersections(shapes, sceneOf(shapes), (found) => { result = found; });
    return result;
}

describe("kruispunten met de nieuwe vormen", () => {
    // Hoofd: bol van 6 cm rond y=2 (in wereld-eenheden: straal 1). Oor: kegel van 3 cm met
    // de onderkant in de bovenkant van het hoofd gestoken.
    const head = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { id: "hoofd", name: "Hoofd", y: 2 });
    const ear = shapeOfCm("Cone", { width: 3, height: 3, length: 3 }, { id: "oor", name: "Oor", x: 0.4, y: 2.7 });

    it("vindt een verbinding tussen een kegel en een bol", () => {
        const [intersection] = intersectionsOf([head, ear]);
        expect(intersection).toBeDefined();
        expect(intersection.source).toBe("csg-world-axis");
        expect([intersection.shape1, intersection.shape2].sort()).toEqual(["hoofd", "oor"]);
    });

    it("de kegel (de kleinste) wordt bij de onderste rondes vastgezet", () => {
        const intersections = intersectionsOf([head, ear]);
        const pattern = generatePattern(ear, "Medium", ROW_HEIGHTS, intersections)!;
        const [attachment] = pattern.intersectionRows;
        expect(attachment).toBeDefined();
        // Ronde 1 is de punt; de onderkant (het vastgezette deel) zit in de laatste rondes.
        expect(Math.max(attachment.topRow, attachment.bottomRow)).toBe(pattern.rows);
    });

    it("een cilinder onder het lijf wordt aan z'n bovenkant vastgezet", () => {
        const body = shapeOfCm("Sphere", { width: 8, height: 8, length: 8 }, { id: "lijf", name: "Lijf" });
        const leg = shapeOfCm("Cylinder", { width: 2, height: 3, length: 2 }, { id: "poot", name: "Poot", x: 0.6, y: -1.6 });
        const intersections = intersectionsOf([body, leg]);
        const pattern = generatePattern(leg, "Medium", ROW_HEIGHTS, intersections)!;
        const [attachment] = pattern.intersectionRows;
        expect(attachment).toBeDefined();
        // De cilinder wordt vanaf de bodem gehaakt: de bovenkant zit in de laatste zijrondes.
        const lastSideRow = pattern.incRows + (pattern.rows - pattern.incRows - (pattern.incRows - 1));
        expect(Math.max(attachment.topRow, attachment.bottomRow)).toBe(lastSideRow);
    });

    it("vormen die elkaar niet raken: geen verbinding", () => {
        const far = { ...ear, x: 10 };
        expect(intersectionsOf([head, far])).toEqual([]);
    });
});

describe("ogen", () => {
    const head = shapeOfCm("Sphere", { width: 6, height: 6, length: 6 }, { id: "hoofd", name: "Hoofd", y: 2 });
    // Twee veiligheidsoogjes van 10 mm, voor op het hoofd, links en rechts.
    const looseLeft = shapeOfCm("Eye", { width: 1, height: 1, length: 1 }, { id: "oogL", name: "Linkeroog", x: -0.4, y: 2.3, z: 1.3, color: "#111111" });
    const looseRight = { ...looseLeft, id: "oogR", name: "Rechteroog", x: 0.4 };
    const left = attachToNearest(looseLeft, [head])!.shape;
    const right = attachToNearest(looseRight, [head])!.shape;
    const shapes = [head, left, right];

    it("een oog zit half in het hoofd", () => {
        expect(containsPoint(head, new THREE.Vector3(left.x, left.y, left.z))).toBe(false);
        const radius = left.width * WORLD_SCALE_FACTOR;
        const center = new THREE.Vector3(left.x, left.y, left.z);
        const toHead = new THREE.Vector3(0, 2, 0).sub(center).normalize();
        // Een stuk richting het hoofd zit erin; het midden net niet.
        expect(containsPoint(head, center.clone().addScaledVector(toHead, radius * 0.7))).toBe(true);
    });

    it("het patroon van het hoofd weet tussen welke rondes de ogen komen", () => {
        const pattern = generatePattern(head, "Medium", ROW_HEIGHTS, intersectionsOf(shapes))!;
        const eyeRows = pattern.intersectionRows.filter((row) => row.shapeId1.startsWith("oog"));
        expect(eyeRows.map((row) => row.shapeId1).sort()).toEqual(["oogL", "oogR"]);
    });

    it("plaatsing: zelfde rondes voor beide ogen, en de afstand in steken", () => {
        const headPattern = generatePattern(head, "Medium", ROW_HEIGHTS, intersectionsOf(shapes))!;
        const placements = eyePlacements(shapes, headPattern.intersectionRows, ROW_HEIGHTS.Medium);
        expect(placements).toHaveLength(2);
        const [a, b] = placements;
        expect(a.target.id).toBe("hoofd");
        expect(a.betweenRows).toEqual(b.betweenRows);
        expect(a.betweenRows[1]).toBe(a.betweenRows[0] + 1);
        // Op de bovenste helft van het hoofd (rondes tellen vanaf de top).
        expect(a.betweenRows[0]).toBeLessThan(headPattern.rows / 2 + 1);
        // ±0,8 wereld-eenheden uit elkaar = ±2,1 cm = ±4 steken van 0,5 cm.
        expect(a.stitchesApart).toBeGreaterThanOrEqual(3);
        expect(a.stitchesApart).toBeLessThanOrEqual(6);
        expect(a.sizeMm).toBe(10);
    });

    it("ogen hebben geen eigen patroon en tellen niet mee als garen", () => {
        expect(generatePattern(left, "Medium", ROW_HEIGHTS, [])).toBeNull();
        expect(eyeSupplies(shapes)).toEqual([{ sizeMm: 10, count: 2 }]);
    });
});
