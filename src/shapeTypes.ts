import { SHAPE_DEFINITIONS } from "./shapes/registry";
import type { ShapeCategory } from "./shapes/types";

// De vormen die je in de editor kunt slepen, in de volgorde van de vormenbalk. Alles over een
// vorm staat in z'n definitie (shapes/definitions/, verzameld in shapes/registry.ts); hier
// alleen de lijsten.
export const SHAPE_TYPES: readonly string[] = SHAPE_DEFINITIONS.map((definition) => definition.type);

export type ShapeType = string;

// De vormen in de vormenbalk. De Arm staat er niet meer in: een halve bol die hoger is dan z'n
// halve breedte krijgt een buis en is dan een arm of been (geometry/domeShape.ts). Bestaande
// ontwerpen met een Arm blijven gewoon werken.
export const PALETTE_SHAPE_TYPES: readonly string[] = SHAPE_DEFINITIONS.filter((definition) => definition.inPalette).map((definition) => definition.type);

// De vormenbalk per groep: bolle vormen, platte vormen, details.
export const PALETTE_GROUPS: readonly { category: ShapeCategory; types: readonly string[] }[] = (["round", "flat", "detail"] as const).map((category) => ({
    category,
    types: SHAPE_DEFINITIONS.filter((definition) => definition.inPalette && definition.category === category).map((definition) => definition.type),
}));
