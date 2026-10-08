import { generatePattern } from "./generators";
import { stitchesWithColor } from "./colorChanges";

// Rijhoogte in cm per garendikte. Gedeeld door de patroonpagina (rij-aantallen) en de
// garenschatting hieronder.
export const ROW_HEIGHTS: Record<string, number> = {
    Lace: 0.25,
    SuperFine: 0.3,
    Fine: 0.35,
    Light: 0.4,
    Medium: 0.45,
    Bulky: 0.55,
    SuperBulky: 0.7,
    Jumbo: 1.0,
};

// YarnSettings slaat diktes op zoals ze in de lijst staan ("Super Fine"), ROW_HEIGHTS heeft
// sleutels zonder spatie. Onbekend of leeg valt terug op Medium, net als op de patroonpagina.
export function yarnWeightKey(weight: string | null | undefined): string {
    const key = weight?.replace(/\s+/g, "") ?? "";
    return key in ROW_HEIGHTS ? key : "Medium";
}

// Vuistregel: een vaste losse kost ongeveer 8× de rijhoogte aan garen. Bij medium garen
// (rijhoogte 0,45 cm) is dat ±3,6 cm per steek, ofwel ±28 steken per meter — wat goed
// overeenkomt met wat haaksters in de praktijk tellen. Daarbovenop 15% marge voor de
// magische ring, aanhechten en afhechtdraden.
const YARN_PER_STITCH_IN_ROW_HEIGHTS = 8;
const SAFETY_MARGIN = 1.15;

export function estimateYarnMeters(stitchCount: number, rowHeightCm: number): number {
    return (stitchCount * rowHeightCm * YARN_PER_STITCH_IN_ROW_HEIGHTS * SAFETY_MARGIN) / 100;
}

// Aantal bollen voor een hoeveelheid garen, of null als de meters per bol onbekend zijn.
export function skeinsNeeded(meters: number, metersPerSkein: number | null | undefined): number | null {
    if (!metersPerSkein || metersPerSkein <= 0) {
        return null;
    }
    return Math.max(1, Math.ceil(meters / metersPerSkein));
}

// Geschatte hoeveelheid garen per kleur (hele meters, naar boven afgerond) en het totaal.
// Het totaal is de som van de afgeronde kleuren, zodat de getallen die naast elkaar op de
// patroonpagina staan ook echt optellen. Gebruikt door de patroonpagina én de
// detailweergave, zodat die altijd hetzelfde zeggen.
export function estimateYarnByColor(
    shapes: Shape[],
    weight: string | null | undefined,
): { byColor: Record<string, number>; total: number } {
    const weightKey = yarnWeightKey(weight);
    const rawByColor: Record<string, number> = {};
    shapes.forEach((shape) => {
        const pattern = generatePattern(shape, weightKey, ROW_HEIGHTS, []);
        if (!pattern) return;
        // Per ronde in z'n eigen kleur, zodat kleurwissels apart meetellen.
        for (const { stitches, color } of stitchesWithColor(pattern, shape.color ?? "#cccccc")) {
            rawByColor[color] = (rawByColor[color] ?? 0) + estimateYarnMeters(stitches, ROW_HEIGHTS[weightKey]);
        }
    });
    const byColor = Object.fromEntries(
        Object.entries(rawByColor).map(([color, meters]) => [color, Math.max(1, Math.ceil(meters))]),
    );
    const total = Object.values(byColor).reduce((sum, meters) => sum + meters, 0);
    return { byColor, total };
}
