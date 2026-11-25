import { flatMotif } from "../flatMotif";
import { normalizeOutline } from "../outline";
import { generateHeartPattern } from "../../patterns/generateHeartPattern";

// Hartje (op een buik, een kussentje, een wang): plat, in rijen van de punt onderaan naar
// boven; bovenaan haak je de twee bogen elk apart af, en tot slot een rand van vasten rondom
// (generateHeartPattern.ts). Omtrek in 3D: de klassieke hartkromme.
const OUTLINE = normalizeOutline(
    Array.from({ length: 120 }, (_, i) => {
        const angle = (2 * Math.PI * i) / 120;
        return {
            x: 16 * Math.sin(angle) ** 3,
            y: 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle),
        };
    }),
);

export const heart = flatMotif({
    type: "Heart",
    outline: () => OUTLINE,
    worked: "rows",
    pattern: (shape, weight, rowHeights, intersections, t) => generateHeartPattern(shape, weight, rowHeights, intersections, t),
    extraStitches: ["ch"],
    aspect: 0.9,
});
