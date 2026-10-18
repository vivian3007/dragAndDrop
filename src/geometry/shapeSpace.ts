import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";
import { domeCapFraction, domeFractionAtHeight, insideDome } from "./domeShape";
import { sphereEndAngle, sphereOpening } from "./sphereOpening";
import { meshScaleOf } from "./units";

// De eigen (ongeschaalde) ruimte van een vorm, zonder three.js: zodat de patroonpagina kan
// rekenen waar iets op een vorm zit (borduursels, zie patterns/embroidery.ts) zonder three.js
// te laden. Zelfde transformatie als de mesh in de scene en geometry/patternBounds.ts:
// schalen, draaien (Euler XYZ), verplaatsen. Het aansluiten (attach.ts) en de kleurwissels
// (stripes.ts) gebruiken dezelfde vormdefinities.

export type Point = { x: number; y: number; z: number };

const toRad = Math.PI / 180;

// Wereld → eigen ruimte: verplaatsing eraf, terugdraaien (de omgekeerde volgorde van
// patternBounds' transformPoint: eerst X, dan Y, dan Z terug), dan terugschalen.
export function worldToLocal(shape: Shape, point: Point): Point {
    let x = point.x - (shape.x ?? 0);
    let y = point.y - (shape.y ?? 0);
    let z = point.z - (shape.z ?? 0);
    const rx = -(shape.rotation_x ?? 0) * toRad;
    const ry = -(shape.rotation_y ?? 0) * toRad;
    const rz = -(shape.rotation_z ?? 0) * toRad;
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    const [sx, sy, sz] = meshScaleOf(shape);
    return { x: x / sx, y: y / sy, z: z / sz };
}

// Eigen ruimte → wereld.
export function localToWorld(shape: Shape, point: Point): Point {
    const [sx, sy, sz] = meshScaleOf(shape);
    let [x, y, z] = [point.x * sx, point.y * sy, point.z * sz];
    const rx = (shape.rotation_x ?? 0) * toRad;
    const ry = (shape.rotation_y ?? 0) * toRad;
    const rz = (shape.rotation_z ?? 0) * toRad;
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    return { x: x + (shape.x ?? 0), y: y + (shape.y ?? 0), z: z + (shape.z ?? 0) };
}

// Ligt een punt (in de eigen ruimte van de vorm) in de vorm? Zelfde geometrie als in 3D: bol
// met straal 1; arm = cilinder (straal 0,5, y 0..1) met halve bol erop; cilinder, buis, plat
// rondje en ovaal: diameter 1, y 0..1; kegel van de onderkant naar de punt op y = 1.
export function insideLocal(shape: Shape, p: Point): boolean {
    const radial = Math.hypot(p.x, p.z);
    switch (shape.type) {
        case "Arm":
            return (p.y >= 0 && p.y <= 1 && radial <= 0.5) || Math.hypot(p.x, p.y - 1, p.z) <= 0.5;
        case "Cylinder":
        case "Tube":
        case "Disc":
        case "Oval":
        case "Embroidery":
            return p.y >= 0 && p.y <= 1 && radial <= 0.5;
        case "Dome":
            return insideDome(p.x, p.y, p.z, domeCapFraction(shape));
        case "Cone":
            return p.y >= 0 && p.y <= 1 && radial <= 0.5 * (1 - p.y);
        default:
            return Math.hypot(p.x, p.y, p.z) <= 1;
    }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Waar in de haakvolgorde (0 = ronde 1, 1 = laatste ronde) ligt dit punt, in de eigen
// (ongeschaalde) ruimte van de vorm? Bol en halve bol van de top omlaag, arm van het kapje naar
// de open kant, cilinder van het midden van de bodem via de zijkant naar het midden van de
// bovenkant, buis van onder naar boven, kegel van de punt naar de rand, plat rondje en ovaal
// van het midden naar de rand. Zie Sphere.tsx, Arm.tsx en geometry/solidGeometry.ts.
export function crochetFraction(shape: Shape, point: Point): number {
    const radial = Math.hypot(point.x, point.z);
    switch (shape.type) {
        case "Arm":
            return clamp01((ARM_TOTAL_LOCAL_LENGTH - point.y) / ARM_TOTAL_LOCAL_LENGTH);
        case "Cylinder": {
            // Bodem en bovenkant liggen plat; de rondes lopen er van het midden naar de rand.
            const [sx, sy, sz] = meshScaleOf(shape);
            const radius = (sx + sz) / 4;
            const total = 2 * radius + sy;
            if (point.y <= 1e-4) return (radial / 0.5) * radius / total;
            if (point.y >= 1 - 1e-4) return (radius + sy + (1 - radial / 0.5) * radius) / total;
            return (radius + point.y * sy) / total;
        }
        case "Tube":
            return clamp01(point.y);
        case "Cone":
            // De bodem van de 3D-kegel is de open rand: de laatste ronde.
            return point.y <= 1e-4 ? 1 : clamp01(1 - point.y);
        case "Disc":
            return clamp01(radial / 0.5);
        case "Oval": {
            // Rondes rond het rechte middenstuk (de lossen): de afstand tot dat middenstuk, als
            // deel van de halve korte kant.
            const [sx, , sz] = meshScaleOf(shape);
            const half = Math.min(sx, sz) / 2;
            const straight = Math.abs(sx - sz) / 2;
            const along = sx >= sz ? Math.abs(point.x * sx) : Math.abs(point.z * sz);
            const across = sx >= sz ? point.z * sz : point.x * sx;
            return clamp01(Math.hypot(across, Math.max(0, along - straight)) / half);
        }
        case "Dome": {
            const [sx, sy, sz] = meshScaleOf(shape);
            return domeFractionAtHeight(point.y, (sx + sz) / 2, sy, domeCapFraction(shape));
        }
        default:
            // Bol: van de bovenpool naar de onderpool, of naar de opening.
            return clamp01(Math.acos(Math.min(1, Math.max(-1, point.y / Math.max(Math.hypot(point.x, point.y, point.z), 1e-9)))) / sphereEndAngle(sphereOpening(shape)));
    }
}
