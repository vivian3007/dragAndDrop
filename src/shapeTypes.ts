// De vormen die je in de editor kunt slepen, in de volgorde van de vormenbalk. Eén lijst, zodat
// 3D-weergave (shapeComponents.ts), patronen (patterns/generators.ts) en de vormenbalk niet uit
// elkaar kunnen lopen — een test controleert dat elke vorm overal bekend is.
export const SHAPE_TYPES = ["Sphere", "Arm", "Cylinder", "Cone", "Disc", "Dome", "Eye"] as const;

export type ShapeType = (typeof SHAPE_TYPES)[number];

// De vormen in de vormenbalk. De Arm staat er niet meer in: een halve bol die hoger is dan z'n
// halve breedte krijgt een buis en is dan een arm of been (geometry/domeShape.ts). Bestaande
// ontwerpen met een Arm blijven gewoon werken.
export const PALETTE_SHAPE_TYPES: readonly ShapeType[] = SHAPE_TYPES.filter((type) => type !== "Arm");
