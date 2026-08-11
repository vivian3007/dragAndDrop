import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import calculateIntersections from "./calculateIntersections.tsx";

const views = {
    front: { position: [0, 0, 40], lookAt: [0, 0, 0] },
    back: { position: [0, 0, -40], lookAt: [0, 0, 0] },
    left: { position: [-40, 0, 0], lookAt: [0, 0, 0] },
    right: { position: [40, 0, 0], lookAt: [0, 0, 0] },
    top: { position: [0, 40, 0], lookAt: [0, 0, 0] },
};

export default function SceneController({
                                            orbitControlsRef,
                                            onSetView,
                                            droppedShapes,
                                            setCamera,
                                            setScene,
                                            threeJsContainerRef,
                                            intersections,
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

    // useEffect(() => {
    //     setScene(scene);
    // }, [amigurumi]);

    const setView = (viewKey: string) => {
        const view = views[viewKey as keyof typeof views];
        if (view) {
            camera.position.set(...view.position);
            camera.lookAt(...view.lookAt);
            camera.updateProjectionMatrix();
            if (orbitControlsRef.current) {
                orbitControlsRef.current.update();
            }
            setCamera(camera);
            setCurrentView(viewKey);
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