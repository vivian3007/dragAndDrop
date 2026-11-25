import type { ShapeDefinition } from "../types";
import { profileShape } from "../profileShape";
import { normalizeProfile } from "../profile";

// Druppel (vlammetje, ui, traan, vogellijfje, puntmuts met bolle onderkant): je begint in de
// punt bovenaan met een magische ring, wordt geleidelijk breder en mindert onderaan rond dicht.
// Profiel: de klassieke druppelkromme r = sin θ · sin(θ/2), y = cos θ.
const PROFILE = normalizeProfile(
    Array.from({ length: 49 }, (_, i) => {
        const theta = (Math.PI * i) / 48;
        return { r: Math.sin(theta) * Math.sin(theta / 2), y: Math.cos(theta) };
    }),
);

export const drop: ShapeDefinition = {
    ...profileShape({ type: "Drop", profile: () => PROFILE, centerY: 0.4 }),
    dropDefaults: ({ width }) => ({ height: width * 1.3 }),
};
