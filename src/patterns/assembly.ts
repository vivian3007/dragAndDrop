import { shapeDimensionCm } from "../geometry/units";

// Welke onderdelen je aan elkaar naait. Een onderdeel kan meer vormen raken dan waar het aan
// vast hoort (een mutsje raakt ook de oren); in een haakpatroon naai je elk onderdeel aan één
// ander. Per vastgemaakt onderdeel (shapeId1) houden we daarom alleen de verbinding met het
// grootste onderdeel dat het raakt: het mutsje aan het hoofd, niet aan de oren.

const sizeOf = (shape: Shape | undefined) =>
    shape ? shapeDimensionCm(shape, "width") * shapeDimensionCm(shape, "height") * shapeDimensionCm(shape, "length") : 0;

export function mainConnections(rows: IntersectionRow[], shapes: Shape[]): IntersectionRow[] {
    const byId = new Map(shapes.map((shape) => [shape.id, shape]));
    const best = new Map<string, IntersectionRow>();
    for (const row of rows) {
        const current = best.get(row.shapeId1);
        if (!current || sizeOf(byId.get(row.shapeId2)) > sizeOf(byId.get(current.shapeId2))) {
            best.set(row.shapeId1, row);
        }
    }
    // In de oorspronkelijke volgorde.
    return rows.filter((row) => best.get(row.shapeId1) === row);
}
