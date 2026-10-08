import * as THREE from "three";
import { domeCapFraction } from "./domeShape";

// 3D-geometrie van de vormen met een vlakke kant (cilinder, kegel). Net als de Arm: diameter
// 1, lokale hoogte 0..1, en de oorsprong in het midden van de onderkant. Daardoor werken de
// maat in cm (units.ts), de afmetingen (patternBounds.ts) en de kruispunten
// (calculateIntersections.tsx) voor deze vormen op dezelfde manier als voor de Arm.
//
// Gedeeld door de editor (SolidShape.tsx) en de ontwerp-snapshots (designSnapshot.ts).

export const SOLID_SHAPE_TYPES = ["Cylinder", "Cone", "Disc", "Dome"] as const;
export type SolidShapeType = (typeof SOLID_SHAPE_TYPES)[number];

export function isSolidShapeType(type: string | null | undefined): type is SolidShapeType {
    return (SOLID_SHAPE_TYPES as readonly string[]).includes(type ?? "");
}

// `shape` alleen nodig voor de halve bol: hoe hoog het kapje is t.o.v. de buis (domeShape.ts).
export function createSolidGeometry(type: SolidShapeType, shape?: Parameters<typeof domeCapFraction>[0]): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry;
    if (type === "Dome") {
        geometry = createDomeGeometry(shape ? domeCapFraction(shape) : 1);
    } else {
        // Cilinder en plat rondje (een dunne cilinder; de dikte komt uit `height`), of kegel.
        geometry = type === "Cone"
            ? new THREE.ConeGeometry(0.5, 1, 48)
            : new THREE.CylinderGeometry(0.5, 0.5, 1, 48);
        // three.js zet deze vormen gecentreerd neer (-0.5..0.5); wij willen 0..1.
        geometry.translate(0, 0.5, 0);
    }
    // calculateIntersections maakt voor CSG een grovere kopie uit `parameters`, maar die kent
    // de verschuiving hierboven niet: gebruik voor deze vormen de geometrie zelf.
    geometry.userData.skipCsgProxy = true;
    return geometry;
}

// Halve bol (zie domeShape.ts): profiel van de open onderkant omhoog langs de buis en dan over
// het kapje naar de top, rondgedraaid. De punten liggen ongeveer gelijk verdeeld over de
// lengte, zodat de steektextuur (v langs het profiel) overal even groot is.
function createDomeGeometry(cap: number): THREE.BufferGeometry {
    const tubeTop = 1 - cap;
    const capSteps = 24;
    const tubeSteps = tubeTop > 1e-3 ? Math.max(1, Math.round((capSteps * tubeTop) / (cap * 1.2 + 0.4))) : 0;
    const points: THREE.Vector2[] = [];
    for (let i = 0; i < tubeSteps; i++) points.push(new THREE.Vector2(0.5, (tubeTop * i) / tubeSteps));
    for (let i = 0; i <= capSteps; i++) {
        const angle = (Math.PI / 2) * (i / capSteps);
        // Precies 0 op de top, anders een minuscuul gaatje in het midden.
        points.push(new THREE.Vector2(i === capSteps ? 0 : 0.5 * Math.cos(angle), tubeTop + cap * Math.sin(angle)));
    }
    return new THREE.LatheGeometry(points, 48);
}
