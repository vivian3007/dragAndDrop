import type { Point } from "../geometry/shapeSpace";
import type { OutlinePoint } from "./types";

// Platte motieven (hart, blaadje, bloem, ster, lapje): een dun plaatje met een omtrek. De omtrek
// is een lijst punten in een vak van −0,5..0,5 (x naar rechts, y naar boven). In 3D ligt het
// plaatje in het x/z-vlak van y = 0 tot 1, met de bovenkant van het motief op −z (zie
// geometryBuilders.ts): breedte = width, hoogte op het oppervlak = length, dikte = height.

// Schaalt een omtrek zo dat hij het vak precies vult (breedte en hoogte los van elkaar).
export function normalizeOutline(points: OutlinePoint[]): OutlinePoint[] {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const w = Math.max(maxX - minX, 1e-9);
    const h = Math.max(maxY - minY, 1e-9);
    return points.map((p) => ({ x: (p.x - minX) / w - 0.5, y: (p.y - minY) / h - 0.5 }));
}

// Ligt (x, y) binnen de omtrek? (Even-oneven-regel.)
export function insideOutline(points: OutlinePoint[], x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i];
        const b = points[j];
        if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}

// Een punt in de eigen ruimte van het motief → de plek in de omtrek.
export const outlineCoordinates = (p: Point) => ({ x: p.x, y: -p.z });

// Ligt een punt (eigen ruimte) in het plaatje?
export function insideMotif(points: OutlinePoint[], p: Point): boolean {
    if (p.y < -1e-6 || p.y > 1 + 1e-6) return false;
    const { x, y } = outlineCoordinates(p);
    return insideOutline(points, x, y);
}

// De stukken van een horizontale lijn op hoogte y die binnen de omtrek vallen, van links naar
// rechts: [[x0, x1], ...]. Eén stuk voor een blaadje, twee voor de bovenkant van een hart.
export function outlineSegmentsAt(points: OutlinePoint[], y: number): [number, number][] {
    const xs: number[] = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i];
        const b = points[j];
        if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    xs.sort((a, b) => a - b);
    const segments: [number, number][] = [];
    for (let i = 0; i + 1 < xs.length; i += 2) segments.push([xs[i], xs[i + 1]]);
    return segments;
}

// Silhouet als SVG-pad in een vak van 100 × 100 (pictogram).
export function outlineIcon(points: OutlinePoint[]): string {
    const coords = points.map((p) => `${(50 + p.x * 92).toFixed(1)} ${(50 - p.y * 92).toFixed(1)}`);
    return `M${coords.join(" L")} Z`;
}

// Hoek-omtrek (bloem, ster): r(θ) als deel van de buitenste straal, met θ = 0 recht naar boven.
export function polarOutline(radius: (theta: number) => number, samples = 180): OutlinePoint[] {
    return Array.from({ length: samples }, (_, i) => {
        const theta = (2 * Math.PI * i) / samples;
        const r = radius(theta) * 0.5;
        return { x: r * Math.sin(theta), y: r * Math.cos(theta) };
    });
}
