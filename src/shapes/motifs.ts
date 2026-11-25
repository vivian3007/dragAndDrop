// Gedeelde maten van de bloem en de ster (shapes/definitions/flower.ts en star.ts), zodat de
// 3D-vorm, de omtrek en het patroon hetzelfde bedoelen.

// Een bloem of ster is een rondje in het midden met blaadjes of punten eromheen. Het midden
// is dit deel van de straal; de rest zijn de blaadjes of punten.
export const FLOWER_CENTER = 0.5;
export const STAR_CENTER = 0.45;

export const MIN_PETALS = 4;
export const MAX_PETALS = 8;
export const DEFAULT_PETALS = 5;

// Hoeveel blaadjes (bloem) of punten (ster).
export function petalCount(shape: { petals?: number | null }): number {
    return Math.min(MAX_PETALS, Math.max(MIN_PETALS, Math.round(shape.petals || DEFAULT_PETALS)));
}

// Hoeveel rondes het midden heeft: het rondje groeit per ronde met één rondehoogte.
export function centerRounds(centerRadiusCm: number, rowHeightCm: number): number {
    return Math.max(1, Math.round(centerRadiusCm / rowHeightCm));
}
