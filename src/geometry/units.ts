// Gedeelde omrekenconstanten tussen cm (zoals de gebruiker invoert) en de wereld-eenheden
// van de three.js scene. World = cm_input * PIXELS_PER_CM * zoom * WORLD_SCALE_FACTOR
// (zie Sphere.tsx/Arm.tsx voor de mesh.scale-berekening en ShapeSettings.tsx voor de
// cm-conversie in de UI) — hou deze twee getallen hier als enige bron van waarheid.
import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";

export const PIXELS_PER_CM = 37.8;
export const WORLD_SCALE_FACTOR = 0.01;

// Hoeveel "pixels" (de eenheid van width/height/length in Firestore) één echte centimeter
// zijn, per vormtype. Een Sphere is in 3D een eenheidsbol met STRAAL 1 die met width/height/
// length wordt geschaald (Sphere.tsx), dus z'n echte diameter is 2× de waarde — terwijl de
// Arm een cilinder met diameter 1 is (Arm.tsx). Alles wat cm toont of ermee rekent
// (vorminstellingen, patroongenerators) moet deze functie gebruiken, anders zijn bollen in
// cijfers half zo groot als in 3D.
export function pixelsPerCm(shapeType: string | null | undefined): number {
    return shapeType === "Sphere" || shapeType === "OpenSphere" || shapeType === "Eye" ? PIXELS_PER_CM / 2 : PIXELS_PER_CM;
}

// Echte afmeting in cm van één as van een vorm (zoom meegerekend).
export function shapeDimensionCm(shape: Shape, axis: "width" | "height" | "length"): number {
    return ((shape[axis] ?? 0) * (shape.zoom ?? 1)) / pixelsPerCm(shape.type);
}

// Lokale hoogte van de 3D-geometrie per vormtype: de Arm heeft een kapje bovenop de cilinder
// (zie armGeometry.ts), de andere vormen zijn 1 hoog (de bol: straal 1, zie pixelsPerCm).
function localHeight(shapeType: string | null | undefined): number {
    return shapeType === "Arm" ? ARM_TOTAL_LOCAL_LENGTH : 1;
}

// mesh.scale voor een vorm: width/height/length × zoom × WORLD_SCALE_FACTOR, waarbij de
// hoogte door de lokale hoogte gaat zodat de zichtbare hoogte klopt.
export function meshScaleOf(shape: Pick<Shape, "type" | "width" | "height" | "length" | "zoom">): [number, number, number] {
    const zoom = shape.zoom ?? 1;
    return [
        shape.width * zoom * WORLD_SCALE_FACTOR,
        (shape.height * zoom / localHeight(shape.type)) * WORLD_SCALE_FACTOR,
        shape.length * zoom * WORLD_SCALE_FACTOR,
    ];
}

// Het omgekeerde: na schalen met de gizmo de nieuwe maat uit mesh.scale. De zoom volgt de
// breedte; width/height/length worden daarop teruggerekend.
export function sizeFromMeshScale(
    shape: Pick<Shape, "type" | "width">,
    scale: { x: number; y: number; z: number },
): Pick<Shape, "width" | "height" | "length" | "zoom"> {
    const zoom = scale.x / (shape.width * WORLD_SCALE_FACTOR);
    return {
        width: scale.x / WORLD_SCALE_FACTOR / zoom,
        height: (scale.y / WORLD_SCALE_FACTOR) * localHeight(shape.type) / zoom,
        length: scale.z / WORLD_SCALE_FACTOR / zoom,
        zoom,
    };
}
