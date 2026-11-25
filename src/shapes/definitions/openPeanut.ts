import type { ShapeDefinition } from "../types";
import { profileShape } from "../profileShape";
import { normalizeProfile } from "../profile";
import { peanutRadius } from "./peanut";

// Open pinda: dezelfde vorm als de pinda, maar bovenaan open, bijvoorbeeld een lijf waar het
// hoofd op komt. Je begint onderaan met een magische ring en haakt naar boven; de bovenste bol
// stopt voor de top, zodat er een opening overblijft van ongeveer twee derde van de breedte van
// die bol: genoeg om een hoofd op te naaien.
const OPEN_AT = 0.95;
const PROFILE = normalizeProfile(
    Array.from({ length: 60 }, (_, i) => {
        const y = (OPEN_AT * i) / 59;
        return { r: peanutRadius(y), y };
    }),
);

export const openPeanut: ShapeDefinition = {
    ...profileShape({ type: "OpenPeanut", profile: () => PROFILE, centerY: 0.33, finishKey: "pattern.stuffOpening" }),
    dropDefaults: ({ width }) => ({ height: width * 1.55 }),
};
