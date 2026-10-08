import type React from "react";
import Sphere from "./Sphere";
import Arm from "./Arm";
import { Cone, Cylinder, Disc, Dome } from "./SolidShape";
import type { ShapeComponentProps } from "./editor/types";
import type { ShapeType } from "./shapeTypes";

// Welk 3D-component bij welk vormtype hoort (editor en patroonpreview). Een oog is een bol
// met een ander materiaal (zie Sphere.tsx).
export const SHAPE_COMPONENTS: Record<ShapeType, React.ComponentType<ShapeComponentProps>> = {
    Sphere,
    Arm,
    Cylinder,
    Cone,
    Disc,
    Dome,
    Eye: Sphere,
};

export function shapeComponentFor(type: string): React.ComponentType<ShapeComponentProps> {
    return SHAPE_COMPONENTS[type as ShapeType] ?? Sphere;
}
