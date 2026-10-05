// Gedeelde omrekenconstanten tussen cm (zoals de gebruiker invoert) en de wereld-eenheden
// van de three.js scene. World = cm_input * PIXELS_PER_CM * zoom * WORLD_SCALE_FACTOR
// (zie Sphere.tsx/Arm.tsx voor de mesh.scale-berekening en ShapeSettings.tsx voor de
// cm-conversie in de UI) — hou deze twee getallen hier als enige bron van waarheid.
export const PIXELS_PER_CM = 37.8;
export const WORLD_SCALE_FACTOR = 0.01;

// Hoeveel "pixels" (de eenheid van width/height/length in Firestore) één echte centimeter
// zijn, per vormtype. Een Sphere is in 3D een eenheidsbol met STRAAL 1 die met width/height/
// length wordt geschaald (Sphere.tsx), dus z'n echte diameter is 2× de waarde — terwijl de
// Arm een cilinder met diameter 1 is (Arm.tsx). Alles wat cm toont of ermee rekent
// (vorminstellingen, patroongenerators) moet deze functie gebruiken, anders zijn bollen in
// cijfers half zo groot als in 3D.
export function pixelsPerCm(shapeType: string | null | undefined): number {
    return shapeType === "Sphere" ? PIXELS_PER_CM / 2 : PIXELS_PER_CM;
}

// Echte afmeting in cm van één as van een vorm (zoom meegerekend).
export function shapeDimensionCm(shape: Shape, axis: "width" | "height" | "length"): number {
    return ((shape[axis] ?? 0) * (shape.zoom ?? 1)) / pixelsPerCm(shape.type);
}
