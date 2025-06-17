import React, {createContext, Ref, useEffect, useRef, useState} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GridHelper } from 'three';
import Sphere from './Sphere';
import Arm from './Arm';
import SceneController from "./SceneController.tsx";
import RenderProvider from "./RenderProvider.tsx";
import calculateIntersections from "./calculateIntersections.tsx";

const shapeComponents: { [key: string]: React.ComponentType<any> } = {
    Sphere,
    Arm,
};

export default function ThreeJsField({
                                         droppedShapes,
                                        setDroppedShapes,
                                         threeJsContainerRef,
                                         activeId,
                                         setActiveId,
                                         onUpdateShape,
                                         onDeleteShape,
                                         onSetView,
                                         transformMode,
                                         setTransformMode,
                                        camera,
                                         setCamera,
                                         setIntersections,
                                         intersections,
                                        meshes,
                                        setMeshes,
                                        scene,
                                        setScene,
                                     }: {
    droppedShapes: any[];
    setDroppedShapes: any;
    threeJsContainerRef: Ref<HTMLCanvasElement>;
    activeId: any;
    setActiveId: any;
    onUpdateShape: any;
    onDeleteShape: any;
    onSetView: (setView: (viewKey: string) => void) => void;
    transformMode: any;
    setTransformMode: any;
    camera: any;
    setCamera: any;
    setIntersections: any;
    intersections: any;
    meshes: any;
    setMeshes: any;
    scene: any;
    setScene: any;
}) {
    const orbitControlsRef = useRef<any>(null);
    const [showGrid, setShowGrid] = useState(false);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (event.key.toLowerCase() === 'g') {
                setShowGrid((prev) => !prev);
            }
            if (event.key.toLowerCase() === 'delete' && activeId) {
                onDeleteShape(activeId);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [activeId, onDeleteShape]);

    const handleSelect = (id: any) => {
        setActiveId(activeId === id ? null : id);
    };

    // const [allMeshesReady, setAllMeshesReady] = useState(false);
    // const meshCount = droppedShapes.length // total number of meshes

    // const handleAllRendered = () => {
    //     setAllMeshesReady(true);
    // };

    // useEffect(() => {
    //     if (allMeshesReady) {
    //         calculateIntersections(
    //             droppedShapes,
    //             scene,
    //             threeJsContainerRef,
    //             camera,
    //             meshes,
    //             setIntersections,
    //             setMeshes
    //         );
    //         setAllMeshesReady(false); // reset zodat het opnieuw kan bij volgende render
    //     }
    // // Voeg alle relevante dependencies toe!
    // }, [allMeshesReady, droppedShapes]);

    return (
        <Canvas
            camera={{ position: [40, 0, 0], fov: 75, zoom: 3 }}
            ref={threeJsContainerRef}
            style={{ height: '92vh' }}
        >
            <SceneController
                orbitControlsRef={orbitControlsRef}
                onSetView={onSetView}
                activeId={activeId}
                droppedShapes={droppedShapes}
                setCamera={setCamera}
                setScene={setScene}
                threeJsContainerRef={threeJsContainerRef}
                setIntersections={setIntersections}
                intersections={intersections}
                meshes={meshes}
                setMeshes={setMeshes}
            />
            {showGrid && (
                <primitive
                    object={new GridHelper(50, 30, '#6f6f6f', '#9d9d9d')}
                    position={[0, 0, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            )}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
            <spotLight position={[100, 1000, 100]} intensity={1.2} />
            <OrbitControls
                ref={orbitControlsRef}
                enableRotate={false}
                enablePan={true}
                enableZoom={true}
            />
            {/* <RenderProvider meshCount={meshCount} onAllRendered={handleAllRendered}> */}
                {droppedShapes.map((shape: any) => {
                    const ShapeComponent = shapeComponents[shape.type] || Sphere;
                    return (
                            <ShapeComponent
                                key={shape.id}
                                id={shape.id}
                                data={{ shape }}
                                orbitControlsRef={orbitControlsRef}
                                isSelected={activeId === shape.id}
                                onSelect={handleSelect}
                                onUpdateShape={onUpdateShape}
                                transformMode={transformMode}
                                setTransformMode={setTransformMode}
                            />
                    );
                })}
            {/* </RenderProvider> */}
        </Canvas>
    );
}