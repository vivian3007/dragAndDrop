// De vormen die je in de editor kunt slepen, in de volgorde van de vormenbalk. Eén lijst, zodat
// 3D-weergave (shapeComponents.ts), patronen (patterns/generators.ts) en de vormenbalk niet uit
// elkaar kunnen lopen — een test controleert dat elke vorm overal bekend is.
export const SHAPE_TYPES = ["Sphere", "Arm", "Cylinder", "Cone", "Disc", "Dome", "Eye"] as const;

export type ShapeType = (typeof SHAPE_TYPES)[number];
