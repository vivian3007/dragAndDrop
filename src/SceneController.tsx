import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import calculateIntersections from "./calculateIntersections.tsx";

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
                                            setIntersections,
                                            meshes,
                                            setMeshes,
                                            setCurrentView,
                                            isDragging,
                                        }: {
    orbitControlsRef: React.RefObject<any>;
    onSetView: (setView: (viewKey: string) => void) => void;
    activeId: any;
    droppedShapes: Shape[];
    setCamera: any;
    setScene: any;
    threeJsContainerRef: any;
    setIntersections: any;
    intersections: any;
    meshes: any;
    setMeshes: any;
    setCurrentView: (view: 'front' | 'back' | 'left' | 'right' | 'top') => void;
    isDragging: boolean;
}) {
    const { camera, scene } = useThree();
    const patternCenterRef = useRef(new THREE.Vector3(0, 0, 0));

    // useEffect(() => {
    //     setScene(scene);
    // }, [amigurumi]);

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

    // Houdt het rotatie-/zoom-middelpunt van OrbitControls gelijk aan het midden
    // van de bounding box van alle vormen samen, zodat draaien en inzoomen om
    // het patroon heen gebeurt in plaats van om de wereld-oorsprong.
    useEffect(() => {
        if (!meshes || meshes.length === 0 || !orbitControlsRef.current) {
            return;
        }

        const box = new THREE.Box3();
        meshes.forEach(({ mesh }: { mesh: THREE.Mesh }) => {
            box.expandByObject(mesh);
        });

        if (box.isEmpty()) {
            return;
        }

        const center = box.getCenter(new THREE.Vector3());
        patternCenterRef.current.copy(center);
        orbitControlsRef.current.target.copy(center);
        orbitControlsRef.current.update();
    }, [meshes, orbitControlsRef]);

    const intersectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (intersectionTimeoutRef.current) {
            clearTimeout(intersectionTimeoutRef.current);
            intersectionTimeoutRef.current = null;
        }

        if (isDragging) {
            return;
        }

        intersectionTimeoutRef.current = setTimeout(() => calculateIntersections(
            droppedShapes,
            scene,
            meshes,
            setIntersections,
            setMeshes
        ), 200);

        return () => {
            if (intersectionTimeoutRef.current) {
                clearTimeout(intersectionTimeoutRef.current);
            }
        };
    // }, [droppedShapes, scene, threeJsContainerRef, camera, amigurumi]);
    }, [droppedShapes, isDragging]);

    return null;
}