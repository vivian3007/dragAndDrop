// Gedeelde omrekenconstanten tussen cm (zoals de gebruiker invoert) en de wereld-eenheden
// van de three.js scene. World = cm_input * PIXELS_PER_CM * zoom * WORLD_SCALE_FACTOR
// (zie Sphere.tsx/Arm.tsx voor de mesh.scale-berekening en ShapeSettings.tsx voor de
// cm-conversie in de UI) — hou deze twee getallen hier als enige bron van waarheid.
export const PIXELS_PER_CM = 37.8;
export const WORLD_SCALE_FACTOR = 0.01;
