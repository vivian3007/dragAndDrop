import * as THREE from "three";
import { meshScaleOf } from "./units";
import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";

// "Aansluiten": een vorm netjes tegen de dichtstbijzijnde andere vorm zetten, zodat hij er
// rondom op aansluit — zoals een aangenaaid been, oor of snuit.
//
// - Arm, kegel en cilinder sluiten aan met hun onderkant (de oorsprong, zie Arm.tsx en
//   geometry/solidGeometry.ts) en komen haaks uit het oppervlak.
// - Een platte onderkant op een bol(le) oppervlak raakt dat maar in één punt; aan de randen
//   zou een kier ontstaan. Daarom zakt de vorm precies zo ver in de andere vorm dat de hele
//   rand rondom binnen die vorm valt.
// - Een bol (snuit, hoofd) zakt een stukje in de andere vorm, zodat ze rondom in elkaar overgaan.
//
// Werkt met elke vorm als ondergrond (ook uitgerekte bollen en cilinders): het oppervlak wordt
// gezocht met een "zit dit punt erin?"-test per vormtype, niet met formules per combinatie.

// Hoeveel van z'n straal een bol in de andere vorm zakt.
const SPHERE_OVERLAP = 0.25;
// Rand net iets verder naar binnen dan strikt nodig, tegen afrondingsverschillen.
const RIM_MARGIN = 1.03;
const RIM_SAMPLES = 24;

function worldMatrix(shape: Shape): THREE.Matrix4 {
    const rotation = new THREE.Euler(
        THREE.MathUtils.degToRad(shape.rotation_x ?? 0),
        THREE.MathUtils.degToRad(shape.rotation_y ?? 0),
        THREE.MathUtils.degToRad(shape.rotation_z ?? 0),
    );
    return new THREE.Matrix4().compose(
        new THREE.Vector3(shape.x ?? 0, shape.y ?? 0, shape.z ?? 0),
        new THREE.Quaternion().setFromEuler(rotation),
        new THREE.Vector3(...meshScaleOf(shape)),
    );
}

// Ligt een punt (in de eigen, ongeschaalde ruimte van de vorm) in de vorm? Zelfde geometrie
// als in 3D: bol met straal 1; arm = cilinder (straal 0,5, y 0..1) met halve bol erop;
// cilinder en kegel: diameter 1, y 0..1.
function insideLocal(type: string, p: THREE.Vector3): boolean {
    const radial = Math.hypot(p.x, p.z);
    switch (type) {
        case "Arm":
            return (p.y >= 0 && p.y <= 1 && radial <= 0.5) || p.distanceTo(new THREE.Vector3(0, 1, 0)) <= 0.5;
        case "Cylinder":
        case "Disc":
            return p.y >= 0 && p.y <= 1 && radial <= 0.5;
        case "Dome":
            return p.y >= 0 && (radial / 0.5) ** 2 + p.y ** 2 <= 1;
        case "Cone":
            return p.y >= 0 && p.y <= 1 && radial <= 0.5 * (1 - p.y);
        default:
            return p.length() <= 1;
    }
}

// Het middelpunt van de vorm (in eigen ruimte), van waaruit het oppervlak gezocht wordt.
function localCenter(type: string): THREE.Vector3 {
    switch (type) {
        case "Arm":
            return new THREE.Vector3(0, ARM_TOTAL_LOCAL_LENGTH / 3, 0);
        case "Cylinder":
        case "Disc":
            return new THREE.Vector3(0, 0.5, 0);
        case "Dome":
            return new THREE.Vector3(0, 0.35, 0);
        case "Cone":
            return new THREE.Vector3(0, 0.3, 0);
        default:
            return new THREE.Vector3(0, 0, 0);
    }
}

class Solid {
    readonly matrix: THREE.Matrix4;
    readonly inverse: THREE.Matrix4;
    readonly center: THREE.Vector3;
    readonly size: number;

    constructor(readonly shape: Shape) {
        this.matrix = worldMatrix(shape);
        this.inverse = this.matrix.clone().invert();
        this.center = localCenter(shape.type).applyMatrix4(this.matrix);
        const [sx, sy, sz] = meshScaleOf(shape);
        this.size = Math.max(sx, sy, sz) * 2;
    }

    contains(world: THREE.Vector3): boolean {
        return insideLocal(this.shape.type, world.clone().applyMatrix4(this.inverse));
    }

    // Waar de straal van het middelpunt in richting `direction` het oppervlak verlaat.
    surfaceTowards(direction: THREE.Vector3): THREE.Vector3 {
        const dir = direction.clone().normalize();
        let inside = 0;
        let outside = this.size * 2;
        for (let i = 0; i < 40; i++) {
            const mid = (inside + outside) / 2;
            if (this.contains(this.center.clone().addScaledVector(dir, mid))) inside = mid;
            else outside = mid;
        }
        return this.center.clone().addScaledVector(dir, inside);
    }

    // Normaal (naar buiten) op het oppervlak in richting `direction`, uit twee naburige
    // oppervlaktepunten — werkt voor elke bolle vorm.
    normalTowards(direction: THREE.Vector3): THREE.Vector3 {
        const dir = direction.clone().normalize();
        const helper = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const t1 = new THREE.Vector3().crossVectors(dir, helper).normalize();
        const t2 = new THREE.Vector3().crossVectors(dir, t1).normalize();
        const eps = 0.02;
        const a = this.surfaceTowards(dir.clone().addScaledVector(t1, eps)).sub(this.surfaceTowards(dir.clone().addScaledVector(t1, -eps)));
        const b = this.surfaceTowards(dir.clone().addScaledVector(t2, eps)).sub(this.surfaceTowards(dir.clone().addScaledVector(t2, -eps)));
        const normal = new THREE.Vector3().crossVectors(a, b).normalize();
        return normal.dot(dir) < 0 ? normal.negate() : normal;
    }

    // Hoe ver je vanaf `point` langs `inward` moet om in de vorm te komen. Eerst in kleine
    // stappen tot het eerste punt erin (verder doorzoeken zou aan de andere kant er weer uit
    // komen), dan verfijnen.
    depthUntilInside(point: THREE.Vector3, inward: THREE.Vector3): number {
        if (this.contains(point)) return 0;
        const step = this.size / 400;
        let outside = 0;
        let inside = -1;
        for (let depth = step; depth <= this.size * 2; depth += step) {
            if (this.contains(point.clone().addScaledVector(inward, depth))) {
                inside = depth;
                break;
            }
            outside = depth;
        }
        if (inside < 0) return 0;
        for (let i = 0; i < 30; i++) {
            const mid = (outside + inside) / 2;
            if (this.contains(point.clone().addScaledVector(inward, mid))) inside = mid;
            else outside = mid;
        }
        return inside;
    }
}

// Het punt waarmee een vorm aansluit: de onderkant voor arm/cilinder/kegel, het middelpunt
// voor een bol.
function attachPoint(shape: Shape): THREE.Vector3 {
    return new THREE.Vector3(shape.x ?? 0, shape.y ?? 0, shape.z ?? 0);
}

function toDegrees(quaternion: THREE.Quaternion) {
    const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
    return {
        rotation_x: THREE.MathUtils.radToDeg(euler.x),
        rotation_y: THREE.MathUtils.radToDeg(euler.y),
        rotation_z: THREE.MathUtils.radToDeg(euler.z),
    };
}

export type AttachResult = { shape: Shape; targetId: string };

// Vormen die met hun (open of platte) onderkant aansluiten; een bol sluit aan met z'n ronding.
const isLimb = (shape: Shape) => ["Arm", "Cylinder", "Cone", "Disc", "Dome"].includes(shape.type);

// Zet `shape` tegen `target`, in de richting `direction` vanuit het middelpunt van `target`.
function attachTo(shape: Shape, solid: Solid, direction: THREE.Vector3): Shape {
    const surface = solid.surfaceTowards(direction);
    const normal = solid.normalTowards(direction);

    if (!isLimb(shape)) {
        // Bol: middelpunt langs de normaal naar buiten, een stukje in de andere vorm gezakt.
        const [sx, sy, sz] = meshScaleOf(shape);
        const local = normal.clone().applyQuaternion(
            new THREE.Quaternion().setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(shape.rotation_x ?? 0),
                THREE.MathUtils.degToRad(shape.rotation_y ?? 0),
                THREE.MathUtils.degToRad(shape.rotation_z ?? 0),
            )).invert(),
        );
        // Straal van de (mogelijk uitgerekte) bol in de richting van de normaal.
        const radius = 1 / Math.sqrt((local.x / sx) ** 2 + (local.y / sy) ** 2 + (local.z / sz) ** 2);
        const center = surface.clone().addScaledVector(normal, radius * (1 - SPHERE_OVERLAP));
        return { ...shape, x: center.x, y: center.y, z: center.z };
    }

    // Arm, cilinder, kegel: lokale y-as langs de normaal, onderkant op het oppervlak.
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const [sx, , sz] = meshScaleOf(shape);
    const t1 = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
    const t2 = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation);
    const inward = normal.clone().negate();

    // Hoe ver het oppervlak onder de rand wegbuigt: zover zakt de vorm erin.
    let sink = 0;
    for (let i = 0; i < RIM_SAMPLES; i++) {
        const angle = (i / RIM_SAMPLES) * Math.PI * 2;
        const rim = surface.clone()
            .addScaledVector(t1, Math.cos(angle) * 0.5 * sx * RIM_MARGIN)
            .addScaledVector(t2, Math.sin(angle) * 0.5 * sz * RIM_MARGIN);
        sink = Math.max(sink, solid.depthUntilInside(rim, inward));
    }

    const origin = surface.clone().addScaledVector(inward, sink);
    return { ...shape, x: origin.x, y: origin.y, z: origin.z, ...toDegrees(rotation) };
}

function directionFrom(solid: Solid, point: THREE.Vector3): THREE.Vector3 {
    const direction = point.clone().sub(solid.center);
    return direction.lengthSq() < 1e-9 ? new THREE.Vector3(0, 1, 0) : direction;
}

// Zet `shape` netjes tegen de dichtstbijzijnde van `others`. Null als er geen andere vorm is.
export function attachToNearest(shape: Shape, others: Shape[]): AttachResult | null {
    const candidates = others.filter((other) => other.id !== shape.id);
    if (candidates.length === 0) return null;

    const point = attachPoint(shape);
    let best: { solid: Solid; distance: number } | null = null;
    for (const other of candidates) {
        const solid = new Solid(other);
        const distance = solid.surfaceTowards(directionFrom(solid, point)).distanceTo(point);
        if (!best || distance < best.distance) best = { solid, distance };
    }
    const { solid } = best!;
    return { shape: attachTo(shape, solid, directionFrom(solid, point)), targetId: solid.shape.id };
}

// Het punt van `shape` dat in een andere vorm zit als ze aan elkaar vastzitten: de onderkant
// van een arm/cilinder/kegel, of het stukje bol dat richting `other` uitsteekt.
function contactPoint(shape: Shape, other: Solid): THREE.Vector3 {
    const point = attachPoint(shape);
    if (isLimb(shape)) return point;
    const [sx, sy, sz] = meshScaleOf(shape);
    const towards = other.center.clone().sub(point);
    if (towards.lengthSq() < 1e-9) return point;
    return point.addScaledVector(towards.normalize(), Math.min(sx, sy, sz) * 0.9);
}

// Aan welke vorm zit `shape` vast? De dichtstbijzijnde vorm waar z'n contactpunt in ligt, of
// null als hij los staat.
export function findAttachedTarget(shape: Shape, others: Shape[]): Shape | null {
    let best: { other: Shape; distance: number } | null = null;
    for (const other of others) {
        if (other.id === shape.id) continue;
        const solid = new Solid(other);
        if (!solid.contains(contactPoint(shape, solid))) continue;
        const distance = solid.center.distanceTo(attachPoint(shape));
        if (!best || distance < best.distance) best = { other, distance };
    }
    return best?.other ?? null;
}

export type NudgeDirection = "left" | "right" | "up" | "down";

// Stapgroottes voor de pijltjestoetsen (met Shift: fijn).
const SLIDE_DEGREES = { normal: 6, fine: 1.5 };
const MOVE_STEP = { normal: 0.15, fine: 0.03 };

// Verschuif `shape` één stap met de pijltjes, gezien vanuit de camera (`right`/`up` zijn de
// camera-assen in wereldruimte).
// - Zit hij vast aan een vorm: dan schuift hij óver dat oppervlak (eromheen draaien om het
//   middelpunt) en blijft hij rondom aangesloten.
// - Staat hij los: dan schuift hij recht op; raakt hij daarbij een andere vorm, dan sluit hij
//   er vanzelf netjes op aan.
export function nudgeShape(
    shape: Shape,
    others: Shape[],
    direction: NudgeDirection,
    camera: { right: THREE.Vector3; up: THREE.Vector3 },
    fine = false,
): AttachResult | { shape: Shape; targetId: null } {
    const target = findAttachedTarget(shape, others);
    const sign = direction === "right" || direction === "up" ? 1 : -1;
    const horizontal = direction === "left" || direction === "right";

    // De pijlrichting zoals je die op het scherm ziet, in wereldruimte.
    const screenDirection = (horizontal ? camera.right : camera.up).clone().normalize().multiplyScalar(sign);

    if (target) {
        const solid = new Solid(target);
        // Het aansluitpunt over het oppervlak duwen in de pijlrichting: draaien om het
        // middelpunt, om de as loodrecht op "waar hij zit" en "waar hij heen moet". Werkt
        // overal op de vorm, ook bovenop (waar draaien om de verticale as niets doet).
        const current = directionFrom(solid, attachPoint(shape));
        const axis = new THREE.Vector3().crossVectors(current, screenDirection);
        // Zit hij al helemaal aan die kant (pijl wijst recht van de vorm af)? Dan kan hij
        // niet verder die kant op.
        if (axis.lengthSq() < 1e-8) return { shape, targetId: target.id };
        const angle = THREE.MathUtils.degToRad(fine ? SLIDE_DEGREES.fine : SLIDE_DEGREES.normal);
        const turned = current.clone().applyAxisAngle(axis.normalize(), angle);
        return { shape: attachTo(shape, solid, turned), targetId: target.id };
    }

    const step = screenDirection.multiplyScalar(fine ? MOVE_STEP.fine : MOVE_STEP.normal);
    const moved = { ...shape, x: shape.x + step.x, y: shape.y + step.y, z: shape.z + step.z };
    const touched = findAttachedTarget(moved, others) ?? touchingTarget(moved, others);
    if (touched) {
        const solid = new Solid(touched);
        return { shape: attachTo(moved, solid, directionFrom(solid, attachPoint(moved))), targetId: touched.id };
    }
    return { shape: moved, targetId: null };
}

// Een losse vorm "raakt" een andere vorm als z'n contactpunt binnen een kleine afstand van
// het oppervlak ligt (zodat hij er bij het opschuiven niet doorheen springt).
function touchingTarget(shape: Shape, others: Shape[]): Shape | null {
    for (const other of others) {
        if (other.id === shape.id) continue;
        const solid = new Solid(other);
        const point = contactPoint(shape, solid);
        const surface = solid.surfaceTowards(directionFrom(solid, point));
        if (surface.distanceTo(point) < MOVE_STEP.normal * 0.75) return other;
    }
    return null;
}

// Voor tests: de rand (onderkant) van een aangesloten arm/cilinder/kegel in wereldruimte, en
// of een punt in een vorm ligt.
export function rimPoints(shape: Shape, samples = 32): THREE.Vector3[] {
    const matrix = worldMatrix(shape);
    return Array.from({ length: samples }, (_, i) => {
        const angle = (i / samples) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5).applyMatrix4(matrix);
    });
}

export function containsPoint(shape: Shape, point: THREE.Vector3): boolean {
    return new Solid(shape).contains(point);
}
