import generateSpherePattern from "./generateSpherePattern";
import generateArmPattern from "./generateArmPattern";
import { PIXELS_PER_CM } from "../geometry/units";

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

// Totale geschatte hoeveelheid garen voor een heel ontwerp, voor plekken zonder het
// volledige patroon (zoals de detailweergave). Zelfde generators als de patroonpagina.
export function estimateDesignYarnMeters(shapes: Shape[], weight: string | null | undefined): number {
    const weightKey = yarnWeightKey(weight);
    return shapes.reduce((total, shape) => {
        const generate = shape.type === "Arm" ? generateArmPattern : shape.type === "Sphere" ? generateSpherePattern : null;
        if (!generate) return total;
        const pattern = generate(shape, weightKey, PIXELS_PER_CM, ROW_HEIGHTS, [], shapes);
        return total + estimateYarnMeters(pattern.stitchCount ?? 0, ROW_HEIGHTS[weightKey]);
    }, 0);
}
