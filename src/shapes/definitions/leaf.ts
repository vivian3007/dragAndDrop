import { flatMotif } from "../flatMotif";
import { normalizeOutline } from "../outline";
import { generateLeafPattern } from "../../patterns/generateMotifPattern";

// Blaadje (aan een bloem, een appeltje, een tak; ook een vin of een veertje): plat, rond een
// rij lossen, met lage steken bij de punten en hoge in het midden (generateLeafPattern).
const OUTLINE = normalizeOutline([
    ...Array.from({ length: 41 }, (_, i) => {
        const s = i / 40;
        return { x: 0.5 * Math.sin(Math.PI * s) ** 0.85, y: s - 0.5 };
    }),
    ...Array.from({ length: 39 }, (_, i) => {
        const s = 1 - (i + 1) / 40;
        return { x: -0.5 * Math.sin(Math.PI * s) ** 0.85, y: s - 0.5 };
    }),
]);

export const leaf = flatMotif({
    type: "Leaf",
    outline: () => OUTLINE,
    worked: "chain",
    pattern: (shape, weight, rowHeights, intersections, t) => generateLeafPattern(shape, OUTLINE, weight, rowHeights, intersections, t),
    extraStitches: ["ch", "slst", "hdc", "dc", "tr"],
    aspect: 1.8,
});
