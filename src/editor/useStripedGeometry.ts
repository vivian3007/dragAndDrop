import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { paintStripes, stripeKey } from "../geometry/stripes";

// Eigen geometrie voor één vorm, met de kleuren (en kleurwissels) als vertex colors erop
// (zie geometry/stripes.ts). Alleen opnieuw opgebouwd als kleur of kleurwissels veranderen.
// `create` maakt de kale geometrie; `offsetY` voor onderdelen die binnen de vorm verschoven
// liggen (het lichaam en kapje van de Arm).
export function useStripedGeometry(create: () => THREE.BufferGeometry, shape: Shape, offsetY = 0): THREE.BufferGeometry {
    const key = stripeKey(shape);
    const geometry = useMemo(
        () => paintStripes(create(), shape, offsetY),
        // `create` en `shape` zitten in `key` (de vorm van de geometrie verandert niet).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key, offsetY],
    );
    useEffect(() => () => geometry.dispose(), [geometry]);
    return geometry;
}
