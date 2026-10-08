import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { computePatternBox } from "./geometry/patternBox";
import type { OrbitControlsRef, SetView, ViewKey } from "./editor/types";

// Camera-offsets t.o.v. het midden van het patroon (zie patternCenterRef hieronder).
const views = {
    front: { position: [0, 0, 40] },
    back: { position: [0, 0, -40] },
    left: { position: [-40, 0, 0] },
    right: { position: [40, 0, 0] },
    top: { position: [0, 40, 0] },
};

export default function SceneController({
                                            orbitControlsRef,
                                            onSetView,
                                            droppedShapes,
                                            setCamera,
                                            setCurrentView,
                                            isDragging,
                                        }: {
    orbitControlsRef: OrbitControlsRef;
    onSetView: (setView: SetView) => void;
    droppedShapes: Shape[];
    setCamera: (camera: THREE.Camera) => void;
    setCurrentView: (view: ViewKey) => void;
    isDragging: boolean;
}) {
    const { camera } = useThree();
    const patternCenterRef = useRef(new THREE.Vector3(0, 0, 0));

    const setView = (viewKey: string) => {
        const view = views[viewKey as keyof typeof views];
        if (view) {
            const center = patternCenterRef.current;
            camera.position.set(
                center.x + view.position[0],
                center.y + view.position[1],
                center.z + view.position[2]
            );
            camera.lookAt(center);
            camera.updateProjectionMatrix();
            if (orbitControlsRef.current) {
                orbitControlsRef.current.target.copy(center);
                orbitControlsRef.current.update();
            }
            setCamera(camera);
            setCurrentView(viewKey as keyof typeof views);
        }
    };

    useEffect(() => {
        onSetView(setView);
    }, [onSetView]);

    useEffect(() => {
        camera.position.set(0, 0, 40);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        if (orbitControlsRef.current) {
            orbitControlsRef.current.update();
        }
        setCamera(camera);
    }, [camera, orbitControlsRef]);

    // Houdt het rotatie-/zoom-middelpunt van OrbitControls gelijk aan het midden van alle
    // vormen samen, zodat draaien en inzoomen om het patroon heen gebeurt in plaats van om de
    // wereld-oorsprong. Berekend uit de vormgegevens (computePatternBox), niet uit de scene;
    // niet tijdens het slepen, en pas even na de laatste wijziging.
    const recenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isDragging) return;
        recenterTimeoutRef.current = setTimeout(() => {
            const box = computePatternBox(droppedShapes);
            if (!box || !orbitControlsRef.current) return;
            const center = box.getCenter(new THREE.Vector3());
            patternCenterRef.current.copy(center);
            orbitControlsRef.current.target.copy(center);
            orbitControlsRef.current.update();
        }, 200);
        return () => {
            if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
        };
    }, [droppedShapes, isDragging, orbitControlsRef]);

    return null;
}