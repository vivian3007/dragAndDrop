import { describe, expect, it } from "vitest";
import * as THREE from "three";
import calculateIntersections from "./calculateIntersections";
import { createSolidGeometry, isSolidShapeType } from "./geometry/solidGeometry";
import { WORLD_SCALE_FACTOR } from "./geometry/units";
import { generatePattern } from "./patterns/generators";
import { ROW_HEIGHTS } from "./patterns/estimateYarn";
import { shapeOfCm } from "./patterns/testShapes";

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
