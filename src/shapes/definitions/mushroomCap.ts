import type { ShapeDefinition } from "../types";
import { profileShape } from "../profileShape";
import { normalizeProfile } from "../profile";

// Paddenstoelhoed (ook: kwal, lampenkap, bolhoedje): een bol kapje dat aan de rand naar binnen
// omkrult, met in het midden van de onderkant een opening voor de steel. Je begint bovenop; bij
// de rand komt een ronde in de achterste lus, daarna mindert de onderkant naar binnen.
const DOME = Array.from({ length: 25 }, (_, i) => {
    const angle = ((Math.PI / 2) * i) / 24;
    return { r: Math.sin(angle), y: 0.3 + 0.7 * Math.cos(angle) };
});
const PROFILE = normalizeProfile([
    ...DOME,
    { r: 0.97, y: 0.1 },
    { r: 0.75, y: 0.06 },
    { r: 0.55, y: 0.03 },
    { r: 0.35, y: 0 },
]);

export const mushroomCap: ShapeDefinition = {
    ...profileShape({ type: "MushroomCap", profile: () => PROFILE, centerY: 0.4, finishKey: "pattern.fastenOffMushroom" }),
    dropDefaults: ({ width }) => ({ height: width * 0.6 }),
};
