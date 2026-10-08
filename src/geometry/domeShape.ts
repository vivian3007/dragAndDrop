import { halfEllipsePerimeter } from "../patterns/stitchGeometry";

// Halve bol: een rond kapje met, als de vorm hoger is dan de halve breedte, een buis eronder —
// dan is het een arm, been of slurf. Zo is er één vorm voor allebei: maak je een halve bol
// hoger, dan groeit de buis; maak je hem lager, dan wordt het kapje platter.
//
// In de eigen ruimte van de vorm (diameter 1, hoogte 1, oorsprong in het midden van de open
// onderkant): het kapje beslaat de bovenste `cap` (0..1) van de hoogte, de buis de rest.
// Gedeeld door de 3D-geometrie (solidGeometry.ts), het aansluiten (attach.ts), de
// kleurwissels (stripes.ts), de steektextuur (yarnLook.ts) en het patroon
// (generateDomePattern.ts), zodat die allemaal dezelfde vorm bedoelen.

type Dimensions = { width?: number | null; height?: number | null; length?: number | null };

// Welk deel van de hoogte het kapje is: een rond kapje (hoogte = halve breedte), of de hele
// hoogte als de vorm lager is dan dat.
export function domeCapFraction(shape: Dimensions): number {
    const diameter = ((shape.width ?? 50) + (shape.length ?? shape.width ?? 50)) / 2;
    const height = shape.height ?? 50;
    if (height <= 0) return 1;
    return Math.min(1, diameter / 2 / height);
}

// Lengte langs het werk (van de top over het kapje, dan de buis af), in dezelfde eenheid als
// `diameter` en `height`.
export function domeLengths(diameter: number, height: number, cap: number) {
    const capArc = halfEllipsePerimeter(diameter / 2, cap * height) / 2;
    const tube = (1 - cap) * height;
    return { capArc, tube, total: capArc + tube };
}

// Waar in de haakvolgorde (0 = top/ronde 1, 1 = open rand) ligt hoogte `y` (0..1, eigen ruimte)?
export function domeFractionAtHeight(y: number, diameter: number, height: number, cap: number): number {
    const { capArc, total } = domeLengths(diameter, height, cap);
    if (total <= 0) return 0;
    const tubeTop = 1 - cap;
    let along: number;
    if (y >= tubeTop && cap > 0) {
        const angle = Math.acos(Math.min(1, Math.max(-1, (y - tubeTop) / cap)));
        along = (angle / (Math.PI / 2)) * capArc;
    } else {
        along = capArc + (tubeTop - Math.max(0, y)) * height;
    }
    return Math.min(1, Math.max(0, along / total));
}

// Ligt een punt (eigen ruimte) in de halve bol?
export function insideDome(x: number, y: number, z: number, cap: number): boolean {
    if (y < 0 || y > 1) return false;
    const radial = Math.hypot(x, z);
    const tubeTop = 1 - cap;
    if (y <= tubeTop) return radial <= 0.5;
    return (radial / 0.5) ** 2 + ((y - tubeTop) / cap) ** 2 <= 1;
}
