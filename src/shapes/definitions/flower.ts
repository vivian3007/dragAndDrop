import { flatMotif } from "../flatMotif";
import { polarOutline } from "../outline";
import { generateFlowerPattern } from "../../patterns/generateMotifPattern";
import { FLOWER_CENTER, petalCount } from "../motifs";

// Bloemetje (op een hoed, in het haar, op een jurkje): een rondje met ronde blaadjes eromheen,
// in rondes vanuit het midden. Het aantal blaadjes kies je zelf (4–8).
const outline = (shape: Shape) => {
    const petals = petalCount(shape);
    // Tussen de blaadjes zo breed als het midden, op een blaadje de hele straal.
    return polarOutline((theta) => FLOWER_CENTER + (1 - FLOWER_CENTER) * Math.abs(Math.cos((petals * theta) / 2)) ** 0.7);
};

export const flower = flatMotif({
    type: "Flower",
    outline,
    worked: "rounds",
    pattern: (shape, weight, rowHeights, intersections, t) => generateFlowerPattern(shape, weight, rowHeights, intersections, t),
    settings: ["petals", "stripes"],
    extraStitches: ["slst", "hdc", "dc", "tr"],
});
