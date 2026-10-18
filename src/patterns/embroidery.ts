import { PIXELS_PER_CM, shapeDimensionCm } from "../geometry/units";
import { crochetFraction, insideLocal, localToWorld, worldToLocal } from "../geometry/shapeSpace";
import { generatePattern } from "./generators";
import { ROW_HEIGHTS } from "./estimateYarn";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { isEye } from "./eyes";

// Borduurdetails (vormtype "Embroidery"): een mondje, neusje, wenkbrauw of wangetje dat je
// met borduurgaren op een onderdeel borduurt. Net als de veiligheidsoogjes geen eigen
// haakpatroon, maar een plek op een ander onderdeel: tussen welke rondes, hoe breed in steken
// en hoe ver van de ogen.
//
// In de eigen ruimte van het borduursel (zie geometry/embroideryGeometry.ts) is de lokale
// y-as de normaal van het oppervlak, x loopt van links naar rechts en z van boven naar onder
// (−z is boven). `width` is de breedte, `length` de hoogte op het oppervlak en `height` de
// dikte van de draad.

export const EMBROIDERY_DETAILS = ["mouth", "nose", "brow", "cheek"] as const;
export type EmbroideryDetail = (typeof EMBROIDERY_DETAILS)[number];

// Standaardmaat (cm) en kleur per soort; bij het wisselen van soort komen deze terug.
export const EMBROIDERY_DEFAULTS: Record<EmbroideryDetail, { widthCm: number; lengthCm: number; color: string }> = {
    mouth: { widthCm: 1.6, lengthCm: 0.5, color: "#111111" },
    nose: { widthCm: 1, lengthCm: 0.7, color: "#4e3020" },
    brow: { widthCm: 1, lengthCm: 0.25, color: "#111111" },
    cheek: { widthCm: 1.2, lengthCm: 0.7, color: "#f48fb1" },
};

// Dikte van de borduurdraad (cm).
export const EMBROIDERY_THREAD_CM = 0.2;

export const isEmbroidery = (shape: Pick<Shape, "type">) => shape.type === "Embroidery";
// Ogen en borduursels: geen eigen onderdeel, maar iets óp een onderdeel.
export const isDecoration = (shape: Pick<Shape, "type">) => isEye(shape) || isEmbroidery(shape);

export function embroideryDetail(shape: Pick<Shape, "detail">): EmbroideryDetail {
    return (EMBROIDERY_DETAILS as readonly string[]).includes(shape.detail ?? "") ? (shape.detail as EmbroideryDetail) : "mouth";
}

// Een nieuw borduursel van deze soort, of een bestaand dat van soort wisselt.
export function embroideryDefaults(detail: EmbroideryDetail): Pick<Shape, "detail" | "width" | "length" | "height" | "color" | "zoom"> {
    const { widthCm, lengthCm, color } = EMBROIDERY_DEFAULTS[detail];
    return {
        detail,
        width: widthCm * PIXELS_PER_CM,
        length: lengthCm * PIXELS_PER_CM,
        height: EMBROIDERY_THREAD_CM * PIXELS_PER_CM,
        color,
        zoom: 1,
    };
}

// Op welk onderdeel zit het borduursel? Het onderdeel waar het punt net onder het midden van
// het borduursel in ligt (het oppervlak zelf), het dichtstbijzijnde als het er meer zijn.
export function embroideryTarget(embroidery: Shape, shapes: Shape[]): Shape | null {
    const below = localToWorld(embroidery, { x: 0, y: -1, z: 0 });
    let best: { shape: Shape; distance: number } | null = null;
    for (const shape of shapes) {
        if (shape.id === embroidery.id || isDecoration(shape)) continue;
        if (!insideLocal(shape, worldToLocal(shape, below))) continue;
        const distance = Math.hypot(shape.x - embroidery.x, shape.y - embroidery.y, shape.z - embroidery.z);
        if (!best || distance < best.distance) best = { shape, distance };
    }
    return best?.shape ?? null;
}

export type EmbroideryPlacement = {
    embroidery: Shape;
    detail: EmbroideryDetail;
    target: Shape;
    // Van ronde t/m ronde op het onderdeel.
    rows: [number, number];
    stitchesWide: number;
    // Het dichtstbijzijnde oog op hetzelfde onderdeel: hoeveel rondes erboven of eronder.
    eye: { eye: Shape; rowsApart: number; below: boolean } | null;
};

// In welke ronde van `target` (van `rows`) ligt dit wereldpunt?
function rowAt(target: Shape, rows: number, point: { x: number; y: number; z: number }): number {
    const fraction = crochetFraction(target, worldToLocal(target, point));
    return Math.min(rows, Math.max(1, Math.ceil(fraction * rows)));
}

export function embroideryPlacements(shapes: Shape[], yarnWeightKey: string): EmbroideryPlacement[] {
    const rowHeightCm = ROW_HEIGHTS[yarnWeightKey] ?? ROW_HEIGHTS.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const placements: EmbroideryPlacement[] = [];
    for (const embroidery of shapes.filter(isEmbroidery)) {
        const target = embroideryTarget(embroidery, shapes);
        const rows = target ? generatePattern(target, yarnWeightKey, ROW_HEIGHTS, [])?.rows : null;
        if (!target || !rows) continue;

        // Boven- en onderrand van het borduursel (−z is boven), en het midden.
        const top = rowAt(target, rows, localToWorld(embroidery, { x: 0, y: 0, z: -0.5 }));
        const bottom = rowAt(target, rows, localToWorld(embroidery, { x: 0, y: 0, z: 0.5 }));
        const middle = rowAt(target, rows, embroidery);

        let eye: EmbroideryPlacement["eye"] = null;
        let nearest = Infinity;
        for (const candidate of shapes.filter(isEye)) {
            // Een oog zit half in het werk: z'n middelpunt ligt op het oppervlak. Iets naar het
            // midden van het onderdeel toe ligt het er dus in.
            const local = worldToLocal(target, candidate);
            if (!insideLocal(target, { x: local.x * 0.9, y: local.y * 0.9, z: local.z * 0.9 })) continue;
            const distance = Math.hypot(candidate.x - embroidery.x, candidate.y - embroidery.y, candidate.z - embroidery.z);
            if (distance >= nearest) continue;
            nearest = distance;
            eye = { eye: candidate, rowsApart: Math.abs(rowAt(target, rows, candidate) - middle), below: embroidery.y < candidate.y };
        }

        placements.push({
            embroidery,
            detail: embroideryDetail(embroidery),
            target,
            rows: [Math.min(top, bottom), Math.max(top, bottom)],
            stitchesWide: Math.max(1, Math.round(shapeDimensionCm(embroidery, "width") / stitchWidthCm)),
            eye,
        });
    }
    return placements;
}

// Borduurgaren per kleur, met welke details erin geborduurd worden — voor de materialenlijst.
export function embroiderySupplies(shapes: Shape[]): { color: string; details: EmbroideryDetail[] }[] {
    const byColor = new Map<string, EmbroideryDetail[]>();
    for (const embroidery of shapes.filter(isEmbroidery)) {
        const details = byColor.get(embroidery.color) ?? [];
        const detail = embroideryDetail(embroidery);
        if (!details.includes(detail)) details.push(detail);
        byColor.set(embroidery.color, details);
    }
    return [...byColor.entries()].map(([color, details]) => ({ color, details }));
}
