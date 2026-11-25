import type { Point } from "../geometry/shapeSpace";
import type { ProfilePoint } from "./types";

// Profielvormen: een bolle vorm die je in rondes haakt, is rond om z'n as en dus helemaal
// beschreven door z'n profiel — hoe breed hij is langs het werk, van ronde 1 tot de laatste
// ronde. Uit dat ene profiel volgt alles: de 3D-vorm (rondgedraaid, geometryBuilders.ts), "zit
// dit punt erin", de haakvolgorde voor kleurwissels, en het patroon
// (patterns/generateProfilePattern.ts). Een nieuwe bolle vorm is dus alleen een nieuw profiel.
//
// Een profiel is een lijst punten { r, y } in de eigen ruimte van de vorm (diameter 1, y van 0
// tot 1, zie shapes/types.ts), in haakvolgorde. Begint of eindigt het op r = 0, dan is die kant
// dicht (magische ring, of dichtminderen); anders open.

const EPS = 1e-6;

// Schaalt een profiel zo dat het precies de vorm vult: breedste punt r = 0,5, y van 0 tot 1.
export function normalizeProfile(points: ProfilePoint[]): ProfilePoint[] {
    const maxR = Math.max(...points.map((p) => p.r));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const height = Math.max(maxY - minY, EPS);
    return points.map((p) => ({ r: Math.max(0, (p.r / maxR) * 0.5), y: (p.y - minY) / height }));
}

// Een vloeiende kromme door een paar punten (Catmull-Rom), met `perSegment` tussenpunten per
// stuk. Handig om een profiel met een handvol punten te beschrijven.
export function smoothProfile(points: ProfilePoint[], perSegment = 12): ProfilePoint[] {
    const result: ProfilePoint[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        for (let j = 0; j < perSegment; j++) {
            const t = j / perSegment;
            const t2 = t * t;
            const t3 = t2 * t;
            const blend = (a: number, b: number, c: number, d: number) =>
                0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            result.push({ r: Math.max(0, blend(p0.r, p1.r, p2.r, p3.r)), y: blend(p0.y, p1.y, p2.y, p3.y) });
        }
    }
    result.push(points[points.length - 1]);
    return result;
}

// Lengtes langs het profiel (cumulatief), met de straal × `radiusScale` en de hoogte × `heightScale`.
function cumulativeLengths(points: ProfilePoint[], radiusScale = 1, heightScale = 1): number[] {
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dr = (points[i].r - points[i - 1].r) * radiusScale;
        const dy = (points[i].y - points[i - 1].y) * heightScale;
        lengths.push(lengths[i - 1] + Math.hypot(dr, dy));
    }
    return lengths;
}

// Totale lengte langs het werk.
export function profileLength(points: ProfilePoint[], radiusScale = 1, heightScale = 1): number {
    const lengths = cumulativeLengths(points, radiusScale, heightScale);
    return lengths[lengths.length - 1];
}

// Het punt op `fraction` (0..1) van de lengte langs het profiel.
export function profilePointAt(points: ProfilePoint[], fraction: number, radiusScale = 1, heightScale = 1): ProfilePoint & { index: number } {
    const lengths = cumulativeLengths(points, radiusScale, heightScale);
    const target = Math.min(1, Math.max(0, fraction)) * lengths[lengths.length - 1];
    for (let i = 1; i < points.length; i++) {
        if (lengths[i] >= target - EPS) {
            const span = Math.max(lengths[i] - lengths[i - 1], EPS);
            const t = Math.min(1, Math.max(0, (target - lengths[i - 1]) / span));
            return {
                r: points[i - 1].r + (points[i].r - points[i - 1].r) * t,
                y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
                index: i - 1,
            };
        }
    }
    const last = points[points.length - 1];
    return { ...last, index: points.length - 2 };
}

// `count` punten gelijk verdeeld over de lengte (voor de 3D-vorm).
export function resampleProfile(points: ProfilePoint[], count: number): ProfilePoint[] {
    return Array.from({ length: count + 1 }, (_, i) => {
        const { r, y } = profilePointAt(points, i / count);
        // Precies 0 aan een dicht uiteinde, anders een minuscuul gaatje.
        return { r: r < 1e-4 ? 0 : r, y };
    });
}

// Hoe breed is de vorm op hoogte y? Het breedste stuk profiel dat die hoogte kruist.
export function profileRadiusAtHeight(points: ProfilePoint[], y: number): number {
    let radius = -1;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const low = Math.min(a.y, b.y);
        const high = Math.max(a.y, b.y);
        if (y < low - EPS || y > high + EPS) continue;
        const t = high - low < EPS ? 1 : (y - a.y) / (b.y - a.y);
        const r = high - low < EPS ? Math.max(a.r, b.r) : a.r + (b.r - a.r) * t;
        radius = Math.max(radius, r);
    }
    return radius;
}

// Ligt een punt (eigen ruimte) in de vorm? Een open kant telt mee alsof hij dicht is: zo kun je
// er nog steeds iets tegenaan zetten.
export function insideProfile(points: ProfilePoint[], p: Point): boolean {
    if (p.y < -EPS || p.y > 1 + EPS) return false;
    return Math.hypot(p.x, p.z) <= profileRadiusAtHeight(points, p.y) + EPS;
}

// Waar in de haakvolgorde (0..1) ligt een punt op de vorm? Het dichtstbijzijnde punt op het
// profiel, gemeten in echte verhoudingen (`radiusScale`, `heightScale`: de diameter en hoogte).
export function profileFraction(points: ProfilePoint[], p: Point, radiusScale = 1, heightScale = 1): number {
    const lengths = cumulativeLengths(points, radiusScale, heightScale);
    const total = Math.max(lengths[lengths.length - 1], EPS);
    const pr = Math.hypot(p.x, p.z) * radiusScale;
    const py = p.y * heightScale;
    let best = { distance: Infinity, along: 0 };
    for (let i = 1; i < points.length; i++) {
        const ar = points[i - 1].r * radiusScale;
        const ay = points[i - 1].y * heightScale;
        const br = points[i].r * radiusScale;
        const by = points[i].y * heightScale;
        const dr = br - ar;
        const dy = by - ay;
        const lengthSq = dr * dr + dy * dy;
        const t = lengthSq < EPS ? 0 : Math.min(1, Math.max(0, ((pr - ar) * dr + (py - ay) * dy) / lengthSq));
        const distance = Math.hypot(pr - (ar + dr * t), py - (ay + dy * t));
        if (distance < best.distance) best = { distance, along: lengths[i - 1] + t * Math.sqrt(lengthSq) };
    }
    return Math.min(1, Math.max(0, best.along / total));
}

// Dicht aan het begin (magische ring) / aan het eind (dichtminderen)?
export const startsClosed = (points: ProfilePoint[]) => points[0].r < 1e-3;
export const endsClosed = (points: ProfilePoint[]) => points[points.length - 1].r < 1e-3;
