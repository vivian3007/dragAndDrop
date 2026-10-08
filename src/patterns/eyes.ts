import { PIXELS_PER_CM, shapeDimensionCm, WORLD_SCALE_FACTOR } from "../geometry/units";
import { STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

// Veiligheidsoogjes (vormtype "Eye"): geen eigen haakpatroon, maar een plek op een ander
// onderdeel. Voor het patroon: tussen welke rondes van welk onderdeel, hoeveel steken
// van het andere oog, en welke maat.

export const isEye = (shape: Pick<Shape, "type">) => shape.type === "Eye";

export type EyePlacement = {
    eye: Shape;
    target: Shape;
    // Het oog komt tússen deze twee rondes (zo zet je een veiligheidsoogje vast).
    betweenRows: [number, number];
    // Steken tot het andere oog op hetzelfde onderdeel, of null als er geen is.
    stitchesApart: number | null;
    sizeMm: number;
};

export function eyeSizeMm(eye: Shape): number {
    return Math.round(shapeDimensionCm(eye, "width") * 10);
}

// Waar elk oog komt, uit de kruispunten die de patroongenerators al berekenden (de ronde op
// het onderdeel waar het oog in zit).
export function eyePlacements(
    shapes: Shape[],
    intersectionRows: IntersectionRow[],
    rowHeightCm: number,
): EyePlacement[] {
    const placements: EyePlacement[] = [];
    for (const eye of shapes.filter(isEye)) {
        const attachment = intersectionRows.find((row) => row.shapeId1 === eye.id || row.shapeId2 === eye.id);
        if (!attachment) continue;
        const targetId = attachment.shapeId1 === eye.id ? attachment.shapeId2 : attachment.shapeId1;
        const target = shapes.find((shape) => shape.id === targetId);
        if (!target) continue;
        const row = Math.round((attachment.topRow + attachment.bottomRow) / 2);
        placements.push({ eye, target, betweenRows: [row, row + 1], stitchesApart: null, sizeMm: eyeSizeMm(eye) });
    }

    // Afstand tot het andere oog op hetzelfde onderdeel, in steken.
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;
    const worldPerCm = PIXELS_PER_CM * WORLD_SCALE_FACTOR;
    for (const placement of placements) {
        const other = placements.find((p) => p !== placement && p.target.id === placement.target.id);
        if (!other) continue;
        const distanceCm = Math.hypot(
            placement.eye.x - other.eye.x,
            placement.eye.y - other.eye.y,
            placement.eye.z - other.eye.z,
        ) / worldPerCm;
        placement.stitchesApart = Math.max(1, Math.round(distanceCm / stitchWidthCm));
    }
    return placements;
}

// "2 × 10 mm" per maat, voor de materialenlijst.
export function eyeSupplies(shapes: Shape[]): { sizeMm: number; count: number }[] {
    const counts = new Map<number, number>();
    for (const eye of shapes.filter(isEye)) counts.set(eyeSizeMm(eye), (counts.get(eyeSizeMm(eye)) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a - b).map(([sizeMm, count]) => ({ sizeMm, count }));
}
