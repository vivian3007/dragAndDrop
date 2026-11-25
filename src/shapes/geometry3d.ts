import * as THREE from "three";
import { shapeDefinition } from "./registry";
import { createSphereGeometry } from "../geometry/sphereGeometry";
import { coneTop } from "../geometry/coneShape";
import { domeCapFraction } from "../geometry/domeShape";
import { createEmbroideryGeometry } from "../geometry/embroideryGeometry";
import { createOutlineGeometry, createProfileGeometry } from "./geometryBuilders";

// De 3D-vorm van elk vormtype (de rest van een vorm staat in z'n definitie, shapes/definitions/;
// die is bewust zonder three.js). Gedeeld door de editor (Sphere.tsx, SolidShape.tsx) en de
// ontwerp-snapshots (designSnapshot.ts).
//
// Elke geometrie ligt in de eigen ruimte van de vorm (zie ShapeSpace in shapes/types.ts): een
// bol met straal 1, of diameter 1 van y = 0 tot 1. Voor de Arm is er een eigen component
// (Arm.tsx), die is opgebouwd uit twee delen.

type GeometryFactory = (shape: Partial<Shape>) => THREE.BufferGeometry;

// Vormen met diameter 1, van y = 0 tot 1. three.js zet cilinders en kegels gecentreerd neer
// (−0,5..0,5); `upright` schuift ze naar 0..1.
const upright = (geometry: THREE.BufferGeometry) => geometry.translate(0, 0.5, 0);

const SOLID_FACTORIES: Record<string, GeometryFactory> = {
    Cylinder: () => upright(new THREE.CylinderGeometry(0.5, 0.5, 1, 48)),
    // Plat rondje en ovaal: een dunne cilinder; de dikte komt uit `height`, ovaal door een
    // andere breedte en lengte.
    Disc: () => upright(new THREE.CylinderGeometry(0.5, 0.5, 1, 48)),
    Oval: () => upright(new THREE.CylinderGeometry(0.5, 0.5, 1, 48)),
    // Zonder bodem en bovenkant.
    Tube: () => upright(new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1, true)),
    // Met punt, of taps toelopend met een platte bovenkant (geometry/coneShape.ts).
    Cone: (shape) => {
        const top = coneTop({ ...shape, type: "Cone" });
        return upright(top > 0 ? new THREE.CylinderGeometry(0.5 * top, 0.5, 1, 48) : new THREE.ConeGeometry(0.5, 1, 48));
    },
    Dome: (shape) => createDomeGeometry(domeCapFraction(shape)),
    Embroidery: (shape) => createEmbroideryGeometry(shape),
};

// Heeft dit vormtype een 3D-vorm? Uit de lijst hierboven, of uit z'n profiel of omtrek.
export function hasShapeGeometry(type: string): boolean {
    const definition = shapeDefinition(type);
    return definition.space === "sphere" || type in SOLID_FACTORIES || !!definition.profile || !!definition.outline;
}

// De 3D-geometrie van een vorm (zonder kleuren; die zet geometry/stripes.ts erop).
export function createShapeGeometry(shape: Partial<Shape> & { type: string }): THREE.BufferGeometry {
    if (shapeDefinition(shape.type).space === "sphere") return createSphereGeometry(shape);
    const definition = shapeDefinition(shape.type);
    const factory = SOLID_FACTORIES[shape.type];
    const geometry = factory
        ? factory(shape)
        : definition.profile
            ? createProfileGeometry(definition.profile(shape as Shape))
            : definition.outline
                ? createOutlineGeometry(definition.outline(shape as Shape))
                : null;
    if (!geometry) throw new Error(`Geen 3D-vorm voor ${shape.type}`);
    // calculateIntersections maakt voor CSG een grovere kopie uit `parameters`, maar die kent
    // de verschuiving hierboven niet: gebruik voor deze vormen de geometrie zelf.
    geometry.userData.skipCsgProxy = true;
    return geometry;
}

// Zie je de vorm ook van binnen (open aan een kant)?
export function isDoubleSided(shape: Partial<Shape> & { type: string }): boolean {
    const definition = shapeDefinition(shape.type);
    return definition.doubleSided?.(shape as Shape) ?? false;
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
