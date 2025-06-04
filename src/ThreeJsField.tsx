import React, { Ref, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Sphere from './Sphere';
import Arm from './Arm';
import {GridHelper, Vector3} from 'three';
import * as THREE from 'three';

const shapeComponents: { [key: string]: React.ComponentType<any> } = {
    Sphere,
    Arm,
};

const views = {
    front: { position: [0, 0, 40], lookAt: [0, 0, 0] },
    back: { position: [0, 0, -40], lookAt: [0, 0, 0] },
    left: { position: [-40, 0, 0], lookAt: [0, 0, 0] },
    right: { position: [40, 0, 0], lookAt: [0, 0, 0] },
    top: { position: [0, 40, 0], lookAt: [0, 0, 0] },
};

function SceneController({
                             orbitControlsRef,
                             onSetView,
                             activeId,
                             droppedShapes,
                         }: {
    orbitControlsRef: React.RefObject<any>;
    onSetView: (setView: (viewKey: string) => void) => void;
    activeId: any;
    droppedShapes: Shape[];
}) {
    const { camera } = useThree();

    const setView = (viewKey: string) => {
        console.log('setView called with:', viewKey);
        const view = views[viewKey as keyof typeof views];
        if (view) {
            camera.position.set(...view.position);
            camera.lookAt(...view.lookAt);
            camera.updateProjectionMatrix();
            if (orbitControlsRef.current) {
                orbitControlsRef.current.update();
            }
            console.log('Camera position updated to:', camera.position.toArray());
        } else {
            console.warn('Invalid view key:', viewKey);
        }
    };

    useEffect(() => {
        console.log('Setting setView function in SceneController');
        onSetView(setView);
    }, [onSetView]);

    useEffect(() => {
        camera.position.set(0, 0, 40);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        if (orbitControlsRef.current) {
            orbitControlsRef.current.update();
        }
        console.log('Initial camera position set to:', camera.position.toArray());
    }, [camera, orbitControlsRef]);

    // useEffect(() => {
    //     if (orbitControlsRef.current && droppedShapes) {
    //         const selectedShape = droppedShapes.find((shape) => shape.id === activeId);
    //         if (selectedShape && selectedShape.position) {
    //             const { position } = selectedShape;
    //             // Handle position as either { x, y, z } or [x, y, z]
    //             const target = Array.isArray(position)
    //                 ? new Vector3(...position)
    //                 : new Vector3(position.x || 0, position.y || 0, position.z || 0);
    //             orbitControlsRef.current.target.copy(target);
    //             console.log('OrbitControls target set to:', target.toArray());
    //         } else {
    //             // Default to origin if no shape is selected or position is missing
    //             orbitControlsRef.current.target.set(0, 0, 0);
    //             console.log('OrbitControls target reset to origin: [0, 0, 0]');
    //         }
    //         orbitControlsRef.current.update();
    //     }
    // }, [activeId, droppedShapes, orbitControlsRef]);

    return null;
}

export default function ThreeJsField({
                                         droppedShapes,
                                         threeJsContainerRef,
                                         activeId,
                                         setActiveId,
                                         onUpdateShape,
                                         onDeleteShape,
                                         onSetView,
    transformMode,
    setTransformMode
                                     }: {
    droppedShapes: any[];
    threeJsContainerRef: Ref<HTMLCanvasElement>;
    activeId: any;
    setActiveId: any;
    onUpdateShape: any;
    onDeleteShape: any;
    onSetView: (setView: (viewKey: string) => void) => void;
    transformMode: any,
    setTransformMode: any,
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

    return (
        <Canvas
            camera={{ position: [40, 0, 0], fov: 75 }}
            ref={threeJsContainerRef}
            style={{ height: '92vh' }}
        >
            <SceneController orbitControlsRef={orbitControlsRef} onSetView={onSetView} activeId={activeId} droppedShapes={droppedShapes} />
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
        </Canvas>
    );
}