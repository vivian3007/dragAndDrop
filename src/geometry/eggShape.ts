// Ei of peer: een bol (of open bol) die aan één kant smaller toeloopt. `shape.taper` (0 = gewone
// bol) zegt hoe sterk. De brede, ronde kant is de lokale bovenkant (ronde 1: daar begin je en
// meerder je snel), de smalle kant de lokale onderkant (daar minder je geleidelijk, en daar zit
// ook de opening van een open bol). Een peer met de smalle kant boven draai je dus om.
//
// Vorm in de eigen ruimte van de bol (straal 1): op hoogte y is de straal
//     sqrt(1 − y²) · g(y),   met g(y) = (1 + taper·y) / m
// waarbij m zo gekozen is dat de breedste ronde precies straal 1 heeft. Daardoor blijven de
// breedte, lengte en hoogte van de vorm wat je instelt: alleen de onderkant wordt smaller.
//
// Gedeeld door de 3D-vorm (Sphere.tsx, designSnapshot.ts), de kruispunten
// (calculateIntersections.tsx), "zit dit punt erin" en de haakvolgorde (shapeSpace.ts) en het
// patroon (generateSpherePattern.tsx). Geen three.js hier: de patroonpagina laadt dit ook.

export const MAX_TAPER = 0.7;

// Hoe sterk de vorm toeloopt (0..MAX_TAPER), of 0 voor alles wat geen bol is.
export function eggTaper(shape: { type?: string; taper?: number | null }): number {
    if (shape.type !== "Sphere" && shape.type !== "OpenSphere") return 0;
    return Math.min(MAX_TAPER, Math.max(0, shape.taper || 0));
}

// Hoogte (−1..1) van de breedste ronde: daar is de afgeleide van sqrt(1 − y²)·(1 + a·y) nul,
// oftewel 2a·y² + y − a = 0.
export function eggWidestY(taper: number): number {
    return taper > 0 ? (Math.sqrt(1 + 8 * taper * taper) - 1) / (4 * taper) : 0;
}

function eggNorm(taper: number): number {
    const y = eggWidestY(taper);
    return Math.sqrt(1 - y * y) * (1 + taper * y);
}

// g(y): hoeveel smaller (of breder) dan een gewone bol de vorm op hoogte y is.
export function eggFactor(y: number, taper: number): number {
    if (taper <= 0) return 1;
    return (1 + taper * Math.max(-1, Math.min(1, y))) / eggNorm(taper);
}

// Straal (eigen ruimte) op hoogte y.
export function eggRadiusAt(y: number, taper: number): number {
    const clamped = Math.max(-1, Math.min(1, y));
    return Math.sqrt(1 - clamped * clamped) * eggFactor(clamped, taper);
}

// Vervormt een eenheidsbol (posities en normalen, als platte arrays van x,y,z) in-place tot ei.
// De normalen komen uit de formule, niet uit de driehoeken: dan blijft de naad van de bol
// onzichtbaar.
export function deformToEgg(positions: ArrayLike<number> & { [i: number]: number }, normals: (ArrayLike<number> & { [i: number]: number }) | null, taper: number): void {
    if (taper <= 0) return;
    const m = eggNorm(taper);
    for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        const g = (1 + taper * y) / m;
        const x = positions[i] * g;
        const z = positions[i + 2] * g;
        positions[i] = x;
        positions[i + 2] = z;
        if (normals) {
            // Oppervlak x² + z² = (1 − y²)·g(y)²; de gradiënt daarvan is de normaal.
            const ny = y * g * g - (1 - y * y) * g * (taper / m);
            const length = Math.hypot(x, ny, z) || 1;
            normals[i] = x / length;
            normals[i + 1] = ny / length;
            normals[i + 2] = z / length;
        }
    }
}
