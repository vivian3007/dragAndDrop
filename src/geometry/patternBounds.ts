import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";
import { PIXELS_PER_CM, WORLD_SCALE_FACTOR } from "./units";

// Bewust zonder three.js: de detail-popup (op Home) gebruikt dit voor de afmetingen, en
// three.js hoort pas geladen te worden als er echt een 3D-scene getoond wordt. Wie een
// THREE.Box3 nodig heeft, gebruikt computePatternBox in ./patternBox.

type Vec3 = [number, number, number];

export type Bounds = { min: Vec3; max: Vec3 };

// Lokale (ongeschaalde) bounding box per vorm-type, exact zoals de geometrie die
// Sphere.tsx/Arm.tsx ook renderen — zie die bestanden voor de bijbehorende mesh-opbouw.
function getLocalBounds(shape: Shape): Bounds {
    if (shape.type === "Arm") {
        return { min: [-0.5, 0, -0.5], max: [0.5, ARM_TOTAL_LOCAL_LENGTH, 0.5] };
    }
    // Sphere: eenheidsbol (radius 1) rond de oorsprong.
    return { min: [-1, -1, -1], max: [1, 1, 1] };
}

// Reproduceert exact de mesh.scale-berekening uit Sphere.tsx/Arm.tsx (de canvasWidth/
// canvasHeight-termen daar vallen wiskundig weg, dus hier niet nodig).
function getWorldScale(shape: Shape): Vec3 {
    const zoom = shape.zoom ?? 1;
    const yScale = shape.type === "Arm" ? shape.height * zoom / ARM_TOTAL_LOCAL_LENGTH : shape.height * zoom;
    return [shape.width * zoom * WORLD_SCALE_FACTOR, yScale * WORLD_SCALE_FACTOR, shape.length * zoom * WORLD_SCALE_FACTOR];
}

// Schalen, dan draaien (Euler-volgorde XYZ, zoals three.js: eerst om Z, dan Y, dan X), dan
// verplaatsen — dezelfde transformatie als de mesh-matrix in de scene.
function transformPoint(point: Vec3, shape: Shape): Vec3 {
    const [sx, sy, sz] = getWorldScale(shape);
    let [x, y, z] = [point[0] * sx, point[1] * sy, point[2] * sz];
    const toRad = Math.PI / 180;
    const rx = (shape.rotation_x ?? 0) * toRad;
    const ry = (shape.rotation_y ?? 0) * toRad;
    const rz = (shape.rotation_z ?? 0) * toRad;
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    return [x + (shape.x ?? 0), y + (shape.y ?? 0), z + (shape.z ?? 0)];
}

// Wereld-bounding box van één vorm: de 8 hoeken van de lokale box getransformeerd, en daar
// weer de omhullende (assen-uitgelijnde) box van — net als THREE.Box3.applyMatrix4.
function getShapeWorldBounds(shape: Shape): Bounds {
    const local = getLocalBounds(shape);
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const cx of [local.min[0], local.max[0]]) {
        for (const cy of [local.min[1], local.max[1]]) {
            for (const cz of [local.min[2], local.max[2]]) {
                const p = transformPoint([cx, cy, cz], shape);
                for (let i = 0; i < 3; i++) {
                    min[i] = Math.min(min[i], p[i]);
                    max[i] = Math.max(max[i], p[i]);
                }
            }
        }
    }
    return { min, max };
}

// Wereld-space bounding box van het volledige patroon, op basis van de vorm-data alleen —
// geen levende three.js scene nodig, zie SceneController.tsx voor de vergelijkbare (live)
// bounding-box-berekening die dit hier spiegelt.
export function computePatternBounds(shapes: Shape[]): Bounds | null {
    if (!shapes || shapes.length === 0) {
        return null;
    }
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    shapes.forEach((shape) => {
        const box = getShapeWorldBounds(shape);
        for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i], box.min[i]);
            max[i] = Math.max(max[i], box.max[i]);
        }
    });
    return max.every((v, i) => v >= min[i]) ? { min, max } : null;
}

// Berekent de breedte (wereld-X) van het volledige patroon in cm.
export function computePatternWidthCm(shapes: Shape[]): number | null {
    const bounds = computePatternBounds(shapes);
    return bounds ? (bounds.max[0] - bounds.min[0]) / (PIXELS_PER_CM * WORLD_SCALE_FACTOR) : null;
}

// Berekent de hoogte (wereld-Y) van het volledige patroon in cm.
export function computePatternHeightCm(shapes: Shape[]): number | null {
    const bounds = computePatternBounds(shapes);
    return bounds ? (bounds.max[1] - bounds.min[1]) / (PIXELS_PER_CM * WORLD_SCALE_FACTOR) : null;
}
