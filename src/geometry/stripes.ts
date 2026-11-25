import * as THREE from "three";
import { stripeColorAt } from "../patterns/colorChanges";
import { shapeDefinition } from "../shapes/registry";
import { crochetFraction } from "./shapeSpace";

// Kleurwissels in 3D: elk hoekpunt van een vorm krijgt de kleur van de ronde waar het op ligt
// (vertex colors), in dezelfde haakvolgorde als het patroon (zie patterns/colorChanges.ts en
// crochetFraction in shapeSpace.ts).
export { crochetFraction };

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

// Sleutel om geometrie opnieuw op te bouwen als kleur, kleurwissels of de vorm zelf veranderen
// (wat dat laatste is, weet elke vorm zelf: geometryKey in shapes/definitions/).
export function stripeKey(shape: Shape): string {
    return JSON.stringify([
        shape.type,
        shape.color,
        shape.stripes ?? [],
        shapeDefinition(shape.type).geometryKey?.(shape) ?? null,
    ]);
}
