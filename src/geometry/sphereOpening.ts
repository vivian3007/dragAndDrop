// Bol met een opening: niet helemaal dichtminderen maar open eindigen, bv. een snuit (open
// aan de achterkant, de rand loopt een beetje naar binnen) of een lijf dat bovenaan open is
// voor het hoofd. `shape.opening` is de breedte van de opening als deel van de breedste
// doorsnede (0 = dicht). De opening zit aan het eind van de haakvolgorde: de lokale onderkant
// (ronde 1 is de lokale bovenkant). Een lijf dat bovenaan open moet, draai je dus om.
//
// Gedeeld door de 3D-vorm (Sphere.tsx), de kleurwissels (stripes.ts), het aansluiten
// (attach.ts) en het patroon (generateSpherePattern.tsx).

export const MAX_OPENING = 0.9;

export function sphereOpening(shape: { type?: string; opening?: number | null }): number {
    if (shape.type !== "Sphere") return 0;
    return Math.min(MAX_OPENING, Math.max(0, shape.opening ?? 0));
}

// Poolhoek (vanaf de lokale bovenpool) waar de bol ophoudt: π voor een dichte bol.
export function sphereEndAngle(opening: number): number {
    return opening > 0 ? Math.PI - Math.asin(opening) : Math.PI;
}
