import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';

export default function TeddyBearArm({
                                         id,
                                         data,
                                         orbitControlsRef,
                                         isSelected,
                                         onSelect,
                                         onUpdateShape,
                                     }: {
    id: string;
    data: { shape: any };
    orbitControlsRef: React.MutableRefObject<any>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdateShape: (shape: any) => void;
}) {

    const shape = data?.shape;
    const width = shape?.width ?? 50;
    const height = shape?.height ?? 50;
    const length = shape?.length ?? 50;
    const x = shape?.x ?? 0;
    const y = shape?.y ?? 0;
    const z = shape?.z ?? 0;
    const rotateX = shape?.rotateX ?? 0;
    const rotateY = shape?.rotateY ?? 0;
    const rotateZ = shape?.rotateZ ?? 0;
    const zoom = shape?.zoom ?? 1;
    const color = shape?.color ?? 'white';
    const { camera, size } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const transformControlsRef = useRef<any>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [isDragging, setIsDragging] = useState(false);


    useEffect(() => {
        const canvasWidth = size.width;
        const canvasHeight = size.height;

        const scaledWidth = width * zoom;
        const scaledHeight = height * zoom;
        const scaledLength = length * zoom;

        const scaleFactor = 0.01;
        const scaleX = (scaledWidth / canvasWidth) * canvasWidth * scaleFactor;
        const scaleY = (scaledHeight / canvasHeight) * canvasHeight * scaleFactor;
        const scaleZ = (scaledLength / canvasWidth) * canvasWidth * scaleFactor;

        if (meshRef.current && !isDragging) {
            meshRef.current.scale.set(scaleX, scaleY, scaleZ);
            meshRef.current.position.set(x, y, z);
            meshRef.current.rotation.set(
                rotateX * (Math.PI / 180),
                rotateY * (Math.PI / 180),
                rotateZ * (Math.PI / 180)
            );
        }
    }, [camera, size, width, height, length, zoom, x, y, z, rotateX, rotateY, rotateZ, isSelected, isDragging]);

    useEffect(() => {
        if (transformControlsRef.current) {
            transformControlsRef.current.traverse((child: any) => {
                if (child.isMesh) {
                    child.renderOrder = 999;
                }
            });
        }
    }, [isSelected]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
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
        <group

            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
        >
            <mesh position={[0, 0.5, 0]} ref={meshRef}>
                <mesh position={[0, 0.5, 0]} ref={meshRef}>
                    <cylinderGeometry args={[0.5, 0.5, 1, 32, 1, true]} />
                    <meshStandardMaterial color={shape?.color ?? 'white'} metalness={0} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 1, 0]} ref={meshRef}>
                    <sphereGeometry args={[0.5, 32, 16]} />
                    <meshStandardMaterial color={shape?.color ?? 'white'} metalness={0} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
            </mesh>
            {isSelected && (
                <TransformControls
                    ref={transformControlsRef}
                    object={meshRef.current}
                    mode={transformMode}
                    onMouseDown={() => {
                        setIsDragging(true);
                        if (orbitControlsRef.current) {
                            orbitControlsRef.current.enabled = false;
                        }
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (orbitControlsRef.current) {
                            orbitControlsRef.current.enabled = true;
                        }
                    }}
                    onObjectChange={() => {
                        if (meshRef.current && shape) {
                            const group = meshRef.current;
                            const updatedShape: any = { ...shape };

                            if (transformMode === 'translate') {
                                updatedShape.x = group.position.x;
                                updatedShape.y = group.position.y;
                                updatedShape.z = group.position.z;
                            } else if (transformMode === 'rotate') {
                                updatedShape.rotateX = group.rotation.x * (180 / Math.PI);
                                updatedShape.rotateY = group.rotation.y * (180 / Math.PI);
                                updatedShape.rotateZ = group.rotation.z * (180 / Math.PI);
                            } else if (transformMode === 'scale') {
                                const canvasWidth = size.width;
                                const canvasHeight = size.height;
                                const scaleFactor = 0.01;

                                const scaleX = group.scale.x;
                                const scaleY = group.scale.y;
                                const scaleZ = group.scale.z;

                                const scaledWidth = (scaleX / scaleFactor) * canvasWidth / canvasWidth;
                                const scaledHeight = (scaleY / scaleFactor) * canvasHeight / canvasHeight;
                                const scaledLength = (scaleZ / scaleFactor) * canvasWidth / canvasWidth;
                                const newZoom = scaleX / (width * scaleFactor);

                                updatedShape.width = scaledWidth / newZoom;
                                updatedShape.height = scaledHeight / newZoom;
                                updatedShape.length = scaledLength / newZoom;
                                updatedShape.zoom = newZoom;
                            }

                            onUpdateShape(updatedShape);
                        }
                    }}
                />
            )}
        </group>
    );
}