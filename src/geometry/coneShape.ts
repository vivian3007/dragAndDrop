// Taps toelopende kegel (afgeknotte kegel): een kegel zonder punt, met een platte bovenkant.
// `shape.topWidth` is de breedte van die bovenkant als deel van de onderkant (0 = gewone kegel
// met punt). Zo maak je een poot die naar onder breder wordt, een snuit, een lijf of een hoed.
//
// Gehaakt vanaf de bovenkant: eerst een plat rondje tot de bovenkant, één ronde in de achterste
// lus (daar knikt het werk, zoals bij de cilinder), en dan langs de schuine zijde steeds iets
// breder tot de open onderkant. In 3D ligt de oorsprong in het midden van de onderkant en de
// bovenkant op lokale hoogte 1 (zie solidGeometry.ts).
//
// Gedeeld door de 3D-vorm, "zit dit punt erin" en de haakvolgorde (shapeSpace.ts), de
// garentextuur (yarnLook.ts) en het patroon (generateConePattern.ts). Geen three.js hier.

export const MAX_CONE_TOP = 0.9;

// Breedte van de bovenkant (deel van de onderkant), of 0 voor een kegel met punt (en voor elke
// andere vorm).
export function coneTop(shape: { type?: string; topWidth?: number | null }): number {
    if (shape.type !== "Cone") return 0;
    return Math.min(MAX_CONE_TOP, Math.max(0, shape.topWidth || 0));
}

// Straal (eigen ruimte, onderkant 0,5) op hoogte y (0..1).
export function coneRadiusAt(y: number, top: number): number {
    return 0.5 * (1 - Math.min(1, Math.max(0, y)) * (1 - top));
}
