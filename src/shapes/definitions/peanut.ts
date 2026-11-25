import type { ShapeDefinition } from "../types";
import { profileShape } from "../profileShape";
import { normalizeProfile } from "../profile";

// Pinda (sneeuwpop, rups, lijf en hoofd in één stuk, achtje): twee bollen met een taille
// ertussen, de onderste iets groter. Van boven naar onder in één stuk, dicht aan beide kanten.
// Profiel: de twee bollen vloeiend samengevoegd (een "zachte" grootste van de twee).
const lobe = (y: number, center: number, radius: number) => Math.sqrt(Math.max(0, radius * radius - (y - center) * (y - center)));

// Straal van de pinda op hoogte y (0 = onder, 1 = boven), vóór het normaliseren. Ook gebruikt
// door de open pinda (openPeanut.ts).
export function peanutRadius(y: number): number {
    const upper = lobe(y, 0.75, 0.25);
    const lower = lobe(y, 0.3, 0.3);
    return (upper ** 4 + lower ** 4) ** 0.25;
}

const PROFILE = normalizeProfile(
    Array.from({ length: 65 }, (_, i) => {
        const y = 1 - i / 64;
        return { r: peanutRadius(y), y };
    }),
);

export const peanut: ShapeDefinition = {
    ...profileShape({ type: "Peanut", profile: () => PROFILE, centerY: 0.3 }),
    dropDefaults: ({ width }) => ({ height: width * 1.7 }),
};
