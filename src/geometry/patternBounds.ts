import * as THREE from "three";
import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";
import { PIXELS_PER_CM, WORLD_SCALE_FACTOR } from "./units";

// Lokale (ongeschaalde) bounding box per vorm-type, exact zoals de geometrie die
// Sphere.tsx/Arm.tsx ook renderen — zie die bestanden voor de bijbehorende mesh-opbouw.
function getLocalBox(shape: Shape): THREE.Box3 {
    if (shape.type === "Arm") {
        return new THREE.Box3(
            new THREE.Vector3(-0.5, 0, -0.5),
            new THREE.Vector3(0.5, ARM_TOTAL_LOCAL_LENGTH, 0.5)
        );
    }
    // Sphere: eenheidsbol (radius 1) rond de oorsprong.
    return new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
}

// Reproduceert exact de mesh.scale-berekening uit Sphere.tsx/Arm.tsx (de canvasWidth/
// canvasHeight-termen daar vallen wiskundig weg, dus hier niet nodig).
function getWorldScale(shape: Shape): THREE.Vector3 {
    const zoom = shape.zoom ?? 1;
    if (shape.type === "Arm") {
        return new THREE.Vector3(
            shape.width * zoom * WORLD_SCALE_FACTOR,
            (shape.height * zoom / ARM_TOTAL_LOCAL_LENGTH) * WORLD_SCALE_FACTOR,
            shape.length * zoom * WORLD_SCALE_FACTOR
        );
    }
    return new THREE.Vector3(
        shape.width * zoom * WORLD_SCALE_FACTOR,
        shape.height * zoom * WORLD_SCALE_FACTOR,
        shape.length * zoom * WORLD_SCALE_FACTOR
    );
}

function getShapeWorldBox(shape: Shape): THREE.Box3 {
    const object = new THREE.Object3D();
    object.position.set(shape.x ?? 0, shape.y ?? 0, shape.z ?? 0);
    object.rotation.set(
        (shape.rotation_x ?? 0) * (Math.PI / 180),
        (shape.rotation_y ?? 0) * (Math.PI / 180),
        (shape.rotation_z ?? 0) * (Math.PI / 180)
    );
    object.scale.copy(getWorldScale(shape));
    object.updateMatrix();

    return getLocalBox(shape).applyMatrix4(object.matrix);
}

// Wereld-space bounding box van het volledige patroon, op basis van de vorm-data alleen —
// geen levende three.js scene nodig, zie SceneController.tsx voor de vergelijkbare (live)
// bounding-box-berekening die dit hier spiegelt. Gebruikt door computePatternWidthCm
// (hieronder) en door PatternPreview3D.tsx om de camera op het patroon te richten.
export function computePatternBox(shapes: Shape[]): THREE.Box3 | null {
    if (!shapes || shapes.length === 0) {
        return null;
    }

    const unionBox = new THREE.Box3();
    shapes.forEach((shape) => {
        unionBox.union(getShapeWorldBox(shape));
    });

    return unionBox.isEmpty() ? null : unionBox;
}

// Berekent de breedte (wereld-X) van het volledige patroon in cm.
export function computePatternWidthCm(shapes: Shape[]): number | null {
    const box = computePatternBox(shapes);
    if (!box) {
        return null;
    }

    const size = box.getSize(new THREE.Vector3());
    return size.x / (PIXELS_PER_CM * WORLD_SCALE_FACTOR);
}

// Berekent de hoogte (wereld-Y) van het volledige patroon in cm.
export function computePatternHeightCm(shapes: Shape[]): number | null {
    const box = computePatternBox(shapes);
    if (!box) {
        return null;
    }

    const size = box.getSize(new THREE.Vector3());
    return size.y / (PIXELS_PER_CM * WORLD_SCALE_FACTOR);
}
