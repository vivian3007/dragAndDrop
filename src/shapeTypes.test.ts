import { describe, expect, it } from "vitest";
import { SHAPE_TYPES } from "./shapeTypes";
import { SHAPE_COMPONENTS } from "./shapeComponents";
import { generatePattern } from "./patterns/generators";
import { ROW_HEIGHTS } from "./patterns/estimateYarn";
import { computePatternBounds } from "./geometry/patternBounds";
import { shapeOfCm } from "./patterns/testShapes";
import { isEye } from "./patterns/eyes";

// Elke vorm in de vormenbalk moet overal bekend zijn — anders wordt hij bv. als bol getekend
// of krijgt hij geen patroon (zoals bij het platte rondje en de halve bol gebeurde).
describe.each(SHAPE_TYPES)("vormtype %s", (type) => {
    const shape = shapeOfCm(type, { width: 3, height: 3, length: 3 });

    it("heeft een eigen 3D-component", () => {
        expect(SHAPE_COMPONENTS[type]).toBeDefined();
    });

    it(isEye(shape) ? "heeft (als oog) geen eigen patroon" : "heeft een patroon", () => {
        const pattern = generatePattern(shape, "Medium", ROW_HEIGHTS, []);
        if (isEye(shape)) expect(pattern).toBeNull();
        else expect(pattern).not.toBeNull();
    });

    it("heeft afmetingen", () => {
        expect(computePatternBounds([shape])).not.toBeNull();
    });
});
