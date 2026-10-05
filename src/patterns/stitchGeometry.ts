// Gedeelde maatvoering voor de patroongenerators.

// Een vaste losse is iets breder dan hoog (bij medium garen ±0,5 × 0,45 cm).
export const STITCH_WIDTH_PER_ROW_HEIGHT = 1.1;

// Aantal steken in de breedste toer: de omtrek gedeeld door de steekbreedte, afgerond op
// een veelvoud van 6 (er wordt in zes gelijke delen gemeerderd). Minimaal 12: de toer na
// de magische ring.
export function maxStitchesForDiameter(diameterCm: number, stitchWidthCm: number): number {
    return Math.max(12, Math.round((Math.PI * diameterCm) / stitchWidthCm / 6) * 6);
}

// Halve omtrek van een ellips met halve assen a en b (benadering van Ramanujan); voor een
// cirkel precies π·r. Een bol haak je van pool tot pool over die halve omtrek.
export function halfEllipsePerimeter(a: number, b: number): number {
    return (Math.PI / 2) * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}
