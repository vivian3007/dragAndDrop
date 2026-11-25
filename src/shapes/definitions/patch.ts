import { flatMotif } from "../flatMotif";
import { generateRowsPattern } from "../../patterns/generateRowsPattern";

// Lapje (sjaal, vleugel, dekentje, boekje, kraagje, oor van een konijn): een rechthoek, heen en
// weer in rijen vasten.
const OUTLINE = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
];

export const patch = flatMotif({
    type: "Patch",
    outline: () => OUTLINE,
    worked: "rows",
    pattern: (shape, weight, rowHeights, intersections, t) => generateRowsPattern(shape, OUTLINE, weight, rowHeights, intersections, t),
    extraStitches: ["ch"],
    aspect: 0.7,
});
