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
