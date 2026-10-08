import React, {useCallback, useEffect, useRef, useState} from 'react';
import type * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsImpl } from 'three-stdlib';
import { isGizmoAxisActive } from './editor/types';
import type { SetState, SetView, ShapeComponentProps, TransformMode, ViewKey } from './editor/types';
import {Canvas} from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GridHelper } from 'three';
import Sphere from './Sphere';
import Arm from './Arm';
import { Cone, Cylinder } from './SolidShape';
import SceneController from "./SceneController.tsx";

const shapeComponents: Record<string, React.ComponentType<ShapeComponentProps>> = {
    Sphere,
    Arm,
    Cylinder,
    Cone,
};

export default function ThreeJsField({
    droppedShapes,
    threeJsContainerRef,
    activeId,
    setActiveId,
    onUpdateShape,
    onDeleteShape,
    onSetView,
    transformMode,
    setTransformMode,
    showGrid,
    setShowGrid,
    setCamera,
}: {
    droppedShapes: Shape[];
    threeJsContainerRef: React.RefObject<HTMLCanvasElement | null>;
    activeId: string | null;
    setActiveId: SetState<string | null>;
    onUpdateShape: (shape: Shape) => void;
    onDeleteShape: (id: string) => void;
    onSetView: (setView: SetView) => void;
    transformMode: TransformMode;
    setTransformMode: (mode: TransformMode) => void;
    showGrid: boolean;
    setShowGrid: SetState<boolean>;
    setCamera: (camera: THREE.Camera) => void;
}) {
    const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
    const activeTransformControlsRef = useRef<TransformControlsImpl | null>(null);
    const [currentView, setCurrentView] = useState<ViewKey>('front');
    const [isDragging, setIsDragging] = useState(false);

    const gridRotations: Record<string, [number, number, number]> = {
        front: [Math.PI / 2, 0, 0],
        back: [Math.PI / 2, 0, 0],
        left: [Math.PI / 2, 0, Math.PI / 2],
        right: [Math.PI / 2, 0, -Math.PI / 2],
        top: [0, 0, 0],
    };

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (event.key.toLowerCase() === 'g') {
                setShowGrid((prev: boolean) => !prev);
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

    const handleSelect = useCallback((id: string) => {
        setActiveId((prevActiveId) => (prevActiveId === id ? null : id));
    }, [setActiveId]);


    return (
        <Canvas
            camera={{ position: [40, 0, 0], fov: 75, zoom: 3 }}
            ref={threeJsContainerRef}
            className="threejs-canvas"
            style={{ backgroundColor: 'var(--color-accent-soft)' }}
            onPointerMissed={() => {
                // Klik op een as van de gizmo telt niet als "naast de vormen klikken".
                if (isGizmoAxisActive(activeTransformControlsRef)) return;
                setActiveId(null);
            }}
        >
            <SceneController
                orbitControlsRef={orbitControlsRef}
                onSetView={onSetView}
                droppedShapes={droppedShapes}
                setCamera={setCamera}
                setCurrentView={setCurrentView}
                isDragging={isDragging}
            />
            {showGrid && (
                <primitive
                    object={new GridHelper(50, 30, '#6f6f6f', '#9d9d9d')}
                    position={[0, 0, 0]}
                    rotation={gridRotations[currentView] || [Math.PI / 2, 0, 0]}
                />
            )}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
            <spotLight position={[100, 1000, 100]} intensity={1.2} />
            <OrbitControls
                ref={orbitControlsRef}
                enableRotate={true}
                enablePan={true}
                enableZoom={true}
                zoomToCursor={true}
            />
                {droppedShapes.map((shape) => {
                    const ShapeComponent = shapeComponents[shape.type] || Sphere;
                    return (
                            <ShapeComponent
                                key={shape.id}
                                id={shape.id}
                                shape={shape}
                                orbitControlsRef={orbitControlsRef}
                                isSelected={activeId === shape.id}
                                onSelect={handleSelect}
                                onUpdateShape={onUpdateShape}
                                transformMode={transformMode}
                                setTransformMode={setTransformMode}
                                onDraggingChange={setIsDragging}
                                activeTransformControlsRef={activeTransformControlsRef}
                            />
                    );
                })}
        </Canvas>
    );
}