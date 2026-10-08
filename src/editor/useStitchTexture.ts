import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { STITCH_TEXTURE_URL, stitchTextureFor } from "../geometry/yarnLook";

// Steekfoto op de juiste steekmaat voor deze vorm. De foto zelf laadt één keer en wordt
// gedeeld; elke vorm krijgt een eigen kopie met z'n eigen herhaling.
export function useStitchTexture(shape: Shape): THREE.Texture {
    const base = useLoader(THREE.TextureLoader, STITCH_TEXTURE_URL);
    const { type, width, height, length, zoom } = shape;
    const texture = useMemo(
        () => stitchTextureFor(base, { ...shape, type, width, height, length, zoom }),
        // Alleen opnieuw als de maat verandert, niet bij elke verplaatsing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [base, type, width, height, length, zoom],
    );
    useEffect(() => () => texture.dispose(), [texture]);
    return texture;
}
