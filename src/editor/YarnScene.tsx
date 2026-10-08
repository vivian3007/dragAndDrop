import { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { computePatternBox } from "../geometry/patternBox";
import { LIGHTS } from "../geometry/yarnLook";

// Licht en schaduw voor de 3D-scenes van de editor en de patroonpreview (zie
// geometry/yarnLook.ts; het materiaal per vorm: useStitchTexture.ts).

export function YarnLights() {
    return (
        <>
            <hemisphereLight args={[LIGHTS.hemisphere.sky, LIGHTS.hemisphere.ground, LIGHTS.hemisphere.intensity]} />
            <directionalLight position={LIGHTS.key.position} intensity={LIGHTS.key.intensity} />
            <directionalLight position={LIGHTS.fill.position} intensity={LIGHTS.fill.intensity} />
        </>
    );
}

// Zachte schaduw onder de knuffel, op de hoogte van z'n laagste punt — alsof hij op tafel
// staat. Schuift mee als vormen verplaatst of groter worden.
export function GroundShadow({ shapes }: { shapes: Shape[] }) {
    const box = useMemo(() => computePatternBox(shapes), [shapes]);
    if (!box) return null;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.z, 1) * 2.5;
    return (
        <ContactShadows
            position={[center.x, box.min.y - 0.02, center.z]}
            scale={extent}
            far={Math.max(size.y, 1)}
            blur={2.4}
            opacity={0.4}
            resolution={512}
            color="#4a3328"
        />
    );
}
