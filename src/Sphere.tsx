import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';

export default function Sphere({
                                   id,
                                   data,
                                   orbitControlsRef,
                                   isSelected,
                                   onSelect,
                                   onUpdateShape
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
    const { camera, size } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const transformControlsRef = useRef<any>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
            <mesh ref={meshRef} scale={[1, 1, 1]}>
                {/*position={[x, y, z]*/}
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={shape?.color ?? 'white'}
                    metalness={0.3}
                    roughness={0.4}
                />
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
                            const mesh = meshRef.current;
                            const updatedShape: any = { ...shape };

                            if (transformMode === 'translate') {
                                updatedShape.x = mesh.position.x;
                                updatedShape.y = mesh.position.y;
                                updatedShape.z = mesh.position.z;
                            } else if (transformMode === 'rotate') {
                                updatedShape.rotateX = mesh.rotation.x * (180 / Math.PI);
                                updatedShape.rotateY = mesh.rotation.y * (180 / Math.PI);
                                updatedShape.rotateZ = mesh.rotation.z * (180 / Math.PI);
                            } else if (transformMode === 'scale') {
                                const canvasWidth = size.width;
                                const canvasHeight = size.height;
                                const scaleFactor = 0.01;

                                const scaleX = mesh.scale.x;
                                const scaleY = mesh.scale.y;
                                const scaleZ = mesh.scale.z;

                                const scaledWidth = (scaleX / scaleFactor) * canvasWidth / canvasWidth;
                                const scaledHeight = (scaleY / scaleFactor) * canvasHeight / canvasHeight;
                                const scaledLength = (scaleZ / scaleFactor) * canvasWidth / canvasWidth;
                                const newZoom = scaleX / (width * scaleFactor);

                                updatedShape.width = scaledWidth / newZoom;
                                updatedShape.height = scaledHeight / newZoom;
                                updatedShape.length = scaledLength / newZoom;
                                updatedShape.zoom = newZoom;
                            }

                            console.log("updatedShape", updatedShape)

                            onUpdateShape(updatedShape);
                        }
                    }}
                />
            )}
        </group>
    );
}