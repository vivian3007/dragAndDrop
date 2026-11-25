import type { Point } from "../geometry/shapeSpace";
import { halfEllipsePerimeter } from "../patterns/stitchGeometry";
import { eggFactor, eggRadiusAt, eggTaper } from "../geometry/eggShape";
import { sphereEndAngle, sphereOpening } from "../geometry/sphereOpening";

// Gedeelde stukjes voor de vormdefinities.

// Dikte van een plat onderdeel (een laag vasten), in opslag-eenheden (zie units.ts): ±0,3 cm.
export const FLAT_THICKNESS = 0.3 * 37.8;

export const clamp01 =(value: number) => Math.min(1, Math.max(0, value));

export const radialOf = (p: Point) => Math.hypot(p.x, p.z);

// Cilinder met diameter 1 van y = 0 tot 1 (cilinder, buis, plat rondje/ovaal, borduursel).
export const insideUnitCylinder = (_shape: Shape, p: Point) => p.y >= 0 && p.y <= 1 && radialOf(p) <= 0.5;

// Bol met straal 1 (of een ei, zie geometry/eggShape.ts).
export function insideSphere(shape: Shape, p: Point): boolean {
    const taper = eggTaper(shape);
    if (taper > 0) return Math.abs(p.y) <= 1 && radialOf(p) <= eggRadiusAt(p.y, taper);
    return Math.hypot(p.x, p.y, p.z) <= 1;
}

// Bol: van de bovenpool naar de onderpool, of naar de opening. Een ei eerst terug naar de bol
// waar het uit gemaakt is.
export function sphereCrochetFraction(shape: Shape, point: Point): number {
    const g = eggFactor(point.y, eggTaper(shape));
    const length = Math.hypot(point.x / g, point.y, point.z / g);
    return clamp01(Math.acos(Math.min(1, Math.max(-1, point.y / Math.max(length, 1e-9)))) / sphereEndAngle(sphereOpening(shape)));
}

// Garentextuur van een bol: rond de omtrek, en van pool tot pool.
export const sphereYarnSize = (_shape: Shape, cm: { height: number; diameter: number }) => ({
    around: Math.PI * cm.diameter,
    along: halfEllipsePerimeter(cm.diameter / 2, cm.height / 2),
});

// Gewone maat voor de garentextuur: rond de omtrek, en `along` lang.
export const aroundAnd = (diameter: number, along: number) => ({ around: Math.PI * diameter, along });

// Velden die elk gegenereerd patroon van z'n vorm overneemt.
export function patternBase(shape: Shape) {
    return {
        type: shape.type,
        color: shape.color,
        name: shape.name,
        width: shape.width,
        height: shape.height,
        rotation_x: shape.rotation_x,
        rotation_y: shape.rotation_y,
        rotation_z: shape.rotation_z,
    };
}
