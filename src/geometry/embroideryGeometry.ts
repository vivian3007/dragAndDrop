import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { embroideryDetail, type EmbroideryDetail } from "../patterns/embroidery";
import { shapeDimensionCm } from "./units";

// 3D-geometrie van een borduursel (zie patterns/embroidery.ts): draadjes garen die op het
// oppervlak liggen. Opgebouwd in echte centimeters (zodat de draad overal rond en even dik
// is) en daarna gedeeld door de maat van de vorm: de mesh-schaal (width/height/length, zie
// units.ts) maakt er weer centimeters van. Zo werken aansluiten, afmetingen en spiegelen
// voor een borduursel net als voor de andere vormen.
//
// Eigen ruimte: y is de normaal van het oppervlak (de oorsprong ligt óp het oppervlak), x van
// links naar rechts, z van boven (−) naar onder (+). Het oppervlak eronder is bol
// (`shape.curvature`, 1/straal in cm): de draden buigen mee zodat ze er overal op liggen.

type Stroke = [number, number][]; // punten (x, z) in cm

// De draden per soort, binnen een vlak van w × l cm rond de oorsprong.
function strokes(detail: EmbroideryDetail, w: number, l: number, thread: number): Stroke[] {
    const curve = (z: (u: number) => number, steps = 16): Stroke =>
        Array.from({ length: steps + 1 }, (_, i) => {
            const u = -1 + (2 * i) / steps; // -1 (links) .. 1 (rechts)
            // De draad zelf is ook dik: de uiteinden een halve draad naar binnen.
            return [(u * Math.max(w - thread, 0)) / 2, z(u)];
        });
    // Een vlak gevuld met liggende steken naast elkaar (satijnsteek), elke steek zo breed als
    // de vorm op die hoogte.
    const filled = (widthAt: (v: number) => number): Stroke[] => {
        const count = Math.max(2, Math.round(l / (thread * 0.9)));
        return Array.from({ length: count }, (_, i) => {
            const v = count === 1 ? 0 : -1 + (2 * i) / (count - 1); // -1 (boven) .. 1 (onder)
            const half = Math.max(thread / 2, (widthAt(v) * w) / 2 - thread / 2);
            const z = (v * (l - thread)) / 2;
            return [[-half, z], [half, z]] as Stroke;
        });
    };
    switch (detail) {
        case "mouth":
            // Glimlach: hoeken omhoog, midden omlaag.
            return [curve((u) => (l - thread) * (0.5 - u * u))];
        case "brow":
            // Boogje: midden omhoog.
            return [curve((u) => (l - thread) * (u * u - 0.5))];
        case "nose":
            // Driehoekje met de punt naar beneden.
            return filled((v) => (1 - v) / 2);
        case "cheek":
            // Ovaal vlakje.
            return filled((v) => Math.sqrt(Math.max(0, 1 - v * v)));
    }
}

export function createEmbroideryGeometry(shape: Partial<Shape>): THREE.BufferGeometry {
    const full = { width: 50, height: 10, length: 20, zoom: 1, type: "Embroidery", ...shape } as Shape;
    const w = Math.max(shapeDimensionCm(full, "width"), 0.05);
    const l = Math.max(shapeDimensionCm(full, "length"), 0.05);
    const thread = Math.max(shapeDimensionCm(full, "height"), 0.02);
    const radius = thread / 2;
    const curvature = full.curvature ?? 0;
    // Hoogte boven het oppervlak: de draad zakt een beetje in het werk.
    const lift = (x: number, z: number) => radius * 0.6 - (curvature * (x * x + z * z)) / 2;

    const parts: THREE.BufferGeometry[] = [];
    for (const stroke of strokes(embroideryDetail(full), w, l, thread)) {
        const points = stroke.map(([x, z]) => new THREE.Vector3(x, lift(x, z), z));
        // Lange steken buigen mee met het oppervlak: tussenpunten erbij.
        const dense: THREE.Vector3[] = [];
        points.forEach((point, i) => {
            if (i > 0) {
                const previous = points[i - 1];
                const steps = Math.max(1, Math.ceil(previous.distanceTo(point) / 0.1));
                for (let s = 1; s < steps; s++) {
                    const p = previous.clone().lerp(point, s / steps);
                    p.y = lift(p.x, p.z);
                    dense.push(p);
                }
            }
            dense.push(point);
        });
        const path = new THREE.CatmullRomCurve3(dense);
        parts.push(new THREE.TubeGeometry(path, Math.max(4, dense.length * 2), radius, 8, false));
        // Ronde uiteinden.
        for (const end of [dense[0], dense[dense.length - 1]]) {
            parts.push(new THREE.SphereGeometry(radius, 8, 6).translate(end.x, end.y, end.z));
        }
    }
    const geometry = mergeGeometries(parts.map((part) => part.toNonIndexed()))!;
    parts.forEach((part) => part.dispose());

    // Van centimeters naar de eigen ruimte (de mesh-schaal maakt er weer cm van). Normalen
    // omgekeerd geschaald, zodat ze na de mesh-schaal weer kloppen.
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const n = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        position.setXYZ(i, position.getX(i) / w, position.getY(i) / thread, position.getZ(i) / l);
        n.set(normal.getX(i) * w, normal.getY(i) * thread, normal.getZ(i) * l).normalize();
        normal.setXYZ(i, n.x, n.y, n.z);
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData.skipCsgProxy = true;
    return geometry;
}
