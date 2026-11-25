import { meshScaleOf } from "./units";
import { shapeDefinition } from "../shapes/registry";

// De eigen (ongeschaalde) ruimte van een vorm, zonder three.js: zodat de patroonpagina kan
// rekenen waar iets op een vorm zit (borduursels, zie patterns/embroidery.ts) zonder three.js
// te laden. Zelfde transformatie als de mesh in de scene en geometry/patternBounds.ts:
// schalen, draaien (Euler XYZ), verplaatsen. Het aansluiten (attach.ts) en de kleurwissels
// (stripes.ts) gebruiken dezelfde vormdefinities.

export type Point = { x: number; y: number; z: number };

const toRad = Math.PI / 180;

// Wereld → eigen ruimte: verplaatsing eraf, terugdraaien (de omgekeerde volgorde van
// patternBounds' transformPoint: eerst X, dan Y, dan Z terug), dan terugschalen.
export function worldToLocal(shape: Shape, point: Point): Point {
    let x = point.x - (shape.x ?? 0);
    let y = point.y - (shape.y ?? 0);
    let z = point.z - (shape.z ?? 0);
    const rx = -(shape.rotation_x ?? 0) * toRad;
    const ry = -(shape.rotation_y ?? 0) * toRad;
    const rz = -(shape.rotation_z ?? 0) * toRad;
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    const [sx, sy, sz] = meshScaleOf(shape);
    return { x: x / sx, y: y / sy, z: z / sz };
}

// Eigen ruimte → wereld.
export function localToWorld(shape: Shape, point: Point): Point {
    const [sx, sy, sz] = meshScaleOf(shape);
    let [x, y, z] = [point.x * sx, point.y * sy, point.z * sz];
    const rx = (shape.rotation_x ?? 0) * toRad;
    const ry = (shape.rotation_y ?? 0) * toRad;
    const rz = (shape.rotation_z ?? 0) * toRad;
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    return { x: x + (shape.x ?? 0), y: y + (shape.y ?? 0), z: z + (shape.z ?? 0) };
}

// Ligt een punt (in de eigen ruimte van de vorm) in de vorm? Elke vorm weet dat zelf (zie z'n
// definitie in shapes/definitions/).
export function insideLocal(shape: Shape, p: Point): boolean {
    return shapeDefinition(shape.type).inside(shape, p);
}

// Waar in de haakvolgorde (0 = ronde 1, 1 = laatste ronde) ligt dit punt, in de eigen
// (ongeschaalde) ruimte van de vorm? Ook dat weet elke vorm zelf.
export function crochetFraction(shape: Shape, point: Point): number {
    return shapeDefinition(shape.type).crochetFraction(shape, point);
}
