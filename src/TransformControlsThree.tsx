import {TransformControls} from "@react-three/drei";
import React, {useEffect} from "react";
import type * as THREE from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import type { OrbitControlsRef, TransformControlsRef, TransformMode } from "./editor/types";
import { sizeFromMeshScale } from "./geometry/units";

export default function TransformControlsThree ({transformRef, object, transformMode, setTransformMode, setIsDragging, orbitControlsRef, meshRef, shape, width, onUpdateShape, isSelected, activeTransformControlsRef, onTransformEnd} : {
    transformRef: React.RefObject<TransformControlsImpl | null>;
    object: THREE.Object3D | null;
    transformMode: TransformMode;
    setTransformMode: (mode: TransformMode) => void;
    setIsDragging: (isDragging: boolean) => void;
    orbitControlsRef: OrbitControlsRef;
    meshRef: React.RefObject<THREE.Mesh | null>;
    shape: Shape;
    width: number;
    onUpdateShape: (shape: Shape) => void;
    isSelected: boolean;
    activeTransformControlsRef?: TransformControlsRef;
    onTransformEnd?: () => void;
}) {

    useEffect(() => {
        if (activeTransformControlsRef) {
            activeTransformControlsRef.current = transformRef.current;
            return () => {
                if (activeTransformControlsRef.current === transformRef.current) {
                    activeTransformControlsRef.current = null;
                }
            };
        }
    }, []);

    useEffect(() => {
        if (transformRef.current) {
            transformRef.current.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.renderOrder = 999;
                }
            });
        }
    }, [isSelected]);

    useEffect(() => {
        return () => {
            transformRef.current?.detach();
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (!isSelected) return;
            switch (event.key.toLowerCase()) {
                case 't':
                    setTransformMode('translate');
                    break;
                case 'r':
                    setTransformMode('rotate');
                    break;
                case 's':
                    setTransformMode('scale');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isSelected]);

    return (

        <TransformControls
            ref={transformRef}
            object={object ?? undefined}
            mode={transformMode}
            onMouseDown={() => {
                setIsDragging(true);
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = false;
                }
            }}
            onMouseUp={() => {
                setIsDragging(false);
                onTransformEnd?.();
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = true;
                }
            }}
            onObjectChange={() => {
                if (meshRef.current && shape) {
                    const mesh = meshRef.current;
                    const updatedShape: Shape = {...shape};

                    if (transformMode === 'translate') {
                        updatedShape.x = mesh.position.x;
                        updatedShape.y = mesh.position.y;
                        updatedShape.z = mesh.position.z;
                    } else if (transformMode === 'rotate') {
                        updatedShape.rotation_x = mesh.rotation.x * (180 / Math.PI);
                        updatedShape.rotation_y = mesh.rotation.y * (180 / Math.PI);
                        updatedShape.rotation_z = mesh.rotation.z * (180 / Math.PI);
                    } else if (transformMode === 'scale') {
                        // Terug van mesh-schaal naar vormmaat (zie sizeFromMeshScale). Voorheen
                        // werd de lokale hoogte van de Arm (1,5) vergeten, waardoor de hoogte van
                        // een arm bij het schalen naar ⅔ sprong.
                        Object.assign(updatedShape, sizeFromMeshScale({ type: shape.type, width }, mesh.scale));
                    }

                    onUpdateShape(updatedShape);
                }
            }}
        />
    );
}