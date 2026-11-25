import type { ShapeDefinition } from "../types";
import { profileShape } from "../profileShape";
import { normalizeProfile, smoothProfile } from "../profile";

// Flesje of vaasje (potje, vaas, lijf met een hals): een platte bodem, een bolle buik, een
// smalle hals en een iets uitlopende, open rand. Je begint in het midden van de bodem; bij de
// rand van de bodem komt een ronde in de achterste lus, zodat de bodem plat blijft.
const BOTTOM = [
    { r: 0, y: 0 },
    { r: 0.2, y: 0 },
    { r: 0.4, y: 0 },
    { r: 0.62, y: 0 },
];
const SIDE = smoothProfile([
    { r: 0.62, y: 0 },
    { r: 0.7, y: 0.12 },
    { r: 0.95, y: 0.25 },
    { r: 1, y: 0.4 },
    { r: 0.85, y: 0.58 },
    { r: 0.42, y: 0.76 },
    { r: 0.36, y: 0.88 },
    { r: 0.46, y: 1 },
]);
const PROFILE = normalizeProfile([...BOTTOM, ...SIDE.slice(1)]);

export const bottle: ShapeDefinition = {
    ...profileShape({ type: "Bottle", profile: () => PROFILE, centerY: 0.4 }),
    dropDefaults: ({ width }) => ({ height: width * 1.5 }),
};
