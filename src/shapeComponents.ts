import type React from "react";
import Sphere from "./Sphere";
import Arm from "./Arm";
import SolidShape from "./SolidShape";
import type { ShapeComponentProps } from "./editor/types";
import { shapeDefinition } from "./shapes/registry";
import type { ShapeSpace } from "./shapes/types";

// Welk 3D-component bij een vorm hoort (editor en patroonpreview), naar de eigen ruimte van de
// vorm (zie shapes/types.ts): een bol (ook oog en open bol, Sphere.tsx), de oude arm (Arm.tsx),
// of al het andere (SolidShape.tsx, met de geometrie uit shapes/geometry3d.ts).
const COMPONENTS: Record<ShapeSpace, React.ComponentType<ShapeComponentProps>> = {
    sphere: Sphere,
    arm: Arm,
    solid: SolidShape,
};

export function shapeComponentFor(type: string): React.ComponentType<ShapeComponentProps> {
    return COMPONENTS[shapeDefinition(type).space];
}
