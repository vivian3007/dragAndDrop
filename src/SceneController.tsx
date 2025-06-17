import React, { useEffect } from "react";
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

    console.log(meshes);

    useEffect(() => {
        setTimeout(() => calculateIntersections(
            droppedShapes,
            scene,
            threeJsContainerRef,
            camera,
            meshes,
            setIntersections,
            setMeshes
        ), 1000)
    // }, [droppedShapes, scene, threeJsContainerRef, camera, amigurumi]);
    }, [droppedShapes]);

    return null;
}