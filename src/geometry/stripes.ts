import * as THREE from "three";
import { stripeColorAt } from "../patterns/colorChanges";
import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";
import { meshScaleOf } from "./units";
import { domeCapFraction, domeFractionAtHeight } from "./domeShape";
import { sphereEndAngle, sphereOpening } from "./sphereOpening";

// Kleurwissels in 3D: elk hoekpunt van een vorm krijgt de kleur van de ronde waar het op ligt
// (vertex colors), in dezelfde haakvolgorde als het patroon (zie patterns/colorChanges.ts):
// bol en halve bol van de top omlaag, arm van het kapje naar de open kant, cilinder van het
// midden van de bodem via de zijkant naar het midden van de bovenkant, kegel van de punt naar
// de rand, plat rondje van het midden naar de rand.

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Waar in de haakvolgorde (0 = ronde 1, 1 = laatste ronde) ligt dit punt, in de eigen
// (ongeschaalde) ruimte van de vorm? Zie Sphere.tsx, Arm.tsx en geometry/solidGeometry.ts.
export function crochetFraction(shape: Shape, point: THREE.Vector3): number {
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
        case "Cone":
            // De bodem van de 3D-kegel is de open rand: de laatste ronde.
            return point.y <= 1e-4 ? 1 : clamp01(1 - point.y);
        case "Disc":
            return clamp01(radial / 0.5);
        case "Dome": {
            const [sx, sy, sz] = meshScaleOf(shape);
            return domeFractionAtHeight(point.y, (sx + sz) / 2, sy, domeCapFraction(shape));
        }
        default:
            // Bol: van de bovenpool naar de onderpool, of naar de opening.
            return clamp01(Math.acos(Math.min(1, Math.max(-1, point.y))) / sphereEndAngle(sphereOpening(shape)));
    }
}

// Zet de kleuren van de vorm (en z'n kleurwissels) als vertex colors op `geometry`.
// `offsetY` voor geometrie die binnen de vorm verschoven ligt (de onderdelen van de Arm).
export function paintStripes(geometry: THREE.BufferGeometry, shape: Shape, offsetY = 0): THREE.BufferGeometry {
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const base = new THREE.Color(shape.color ?? "#ffffff");
    const cache = new Map<string, THREE.Color>();
    const point = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i);
        point.y += offsetY;
        const stripe = stripeColorAt(crochetFraction(shape, point), shape.stripes);
        let color = base;
        if (stripe) {
            color = cache.get(stripe) ?? new THREE.Color(stripe);
            cache.set(stripe, color);
        }
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
}

// Sleutel om geometrie opnieuw te kleuren als kleur, kleurwissels of (bij de cilinder) de
// verhoudingen veranderen.
export function stripeKey(shape: Shape): string {
    return JSON.stringify([shape.color, shape.stripes ?? [], shape.type === "Cylinder" || shape.type === "Dome" ? meshScaleOf(shape) : null, sphereOpening(shape)]);
}
