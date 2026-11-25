import { flatMotif } from "../flatMotif";
import { polarOutline } from "../outline";
import { generateStarPattern } from "../../patterns/generateMotifPattern";
import { petalCount, STAR_CENTER } from "../motifs";

// Sterretje (op een muts, een buik, aan een mobiel; ook een zeester): een rondje met punten
// eromheen, in rondes vanuit het midden. Het aantal punten kies je zelf (4–8).
const outline = (shape: Shape) => {
    const points = petalCount(shape);
    // Rechte lijnen van de binnenhoeken (zo breed als het midden) naar de punten.
    const corners = Array.from({ length: points * 2 }, (_, i) => ({ angle: (Math.PI * i) / points, r: i % 2 === 0 ? 1 : STAR_CENTER }));
    return polarOutline((theta) => {
        const step = Math.PI / points;
        const i = Math.floor(theta / step) % corners.length;
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];
        const t = (theta - i * step) / step;
        // Rechte lijn tussen twee hoeken in poolcoördinaten: 1/r lineair in de hoek benadert dat goed.
        return 1 / ((1 - t) / a.r + t / b.r);
    }, points * 24);
};

export const star = flatMotif({
    type: "Star",
    outline,
    worked: "rounds",
    pattern: (shape, weight, rowHeights, intersections, t) => generateStarPattern(shape, weight, rowHeights, intersections, t),
    settings: ["petals", "stripes"],
    extraStitches: ["ch", "slst", "hdc", "dc", "tr"],
});
