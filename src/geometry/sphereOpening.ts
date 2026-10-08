// Open bol (vormtype OpenSphere): een bol die je niet helemaal dichtmindert maar open laat,
// bv. een snuit (open aan de achterkant, de rand loopt een beetje naar binnen) of een lijf dat
// bovenaan open is voor het hoofd. `shape.opening` is de breedte van de opening als deel van
// de breedste doorsnede. De opening zit aan het eind van de haakvolgorde: de lokale onderkant
// (ronde 1 is de lokale bovenkant). Een lijf dat bovenaan open moet, draai je dus om.
//
// Gedeeld door de 3D-vorm (Sphere.tsx), de kleurwissels (stripes.ts), het aansluiten
// (attach.ts) en het patroon (generateSpherePattern.tsx).

export const MIN_OPENING = 0.1;
export const MAX_OPENING = 0.9;
export const DEFAULT_OPENING = 0.6;

// Breedte van de opening (deel van de doorsnede), of 0 voor elke andere vorm dan de open bol.
export function sphereOpening(shape: { type?: string; opening?: number | null }): number {
    if (shape.type !== "OpenSphere") return 0;
    return Math.min(MAX_OPENING, Math.max(MIN_OPENING, shape.opening || DEFAULT_OPENING));
}

// Poolhoek (vanaf de lokale bovenpool) waar de bol ophoudt: π voor een dichte bol.
export function sphereEndAngle(opening: number): number {
    return opening > 0 ? Math.PI - Math.asin(opening) : Math.PI;
}
