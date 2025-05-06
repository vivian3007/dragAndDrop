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
    const width = shape?.width ?? 50; // Base pixel width
    const height = shape?.height ?? 50; // Base pixel height
    const length = shape?.length ?? 50; // Base pixel length
    const x = shape?.x ?? 0;
    const y = shape?.y ?? 0;
    const z = shape?.z ?? 0;
    const rotateX = shape?.rotateX ?? 0; // Degrees
    const rotateY = shape?.rotateY ?? 0; // Degrees
    const rotateZ = shape?.rotateZ ?? 0; // Degrees
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
        const baseRadius = 1;

        // Compute scaled pixel values
        const scaledWidth = width * zoom; // Pixels
        const scaledHeight = height * zoom; // Pixels
        const scaledLength = length * zoom; // Pixels

        // Convert pixel values to Three.js units
        const scaleFactor = 0.01; // 1 pixel = 0.01 Three.js units
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

    // Render-volgorde voor TransformControls
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

                            // Update based on transformMode
                            if (transformMode === 'translate') {
                                updatedShape.x = mesh.position.x;
                                updatedShape.y = mesh.position.y;
                                updatedShape.z = mesh.position.z;
                            } else if (transformMode === 'rotate') {
                                updatedShape.rotateX = mesh.rotation.x * (180 / Math.PI); // Degrees
                                updatedShape.rotateY = mesh.rotation.y * (180 / Math.PI); // Degrees
                                updatedShape.rotateZ = mesh.rotation.z * (180 / Math.PI); // Degrees
                            } else if (transformMode === 'scale') {
                                // Compute base pixel dimensions from mesh scale
                                const canvasWidth = size.width;
                                const canvasHeight = size.height;
                                const scaleFactor = 0.01; // Same as in useEffect

                                const scaleX = mesh.scale.x;
                                const scaleY = mesh.scale.y;
                                const scaleZ = mesh.scale.z;

                                // Convert Three.js units to scaled pixel values
                                const scaledWidth = (scaleX / scaleFactor) * canvasWidth / canvasWidth; // Scaled pixels
                                const scaledHeight = (scaleY / scaleFactor) * canvasHeight / canvasHeight; // Scaled pixels
                                const scaledLength = (scaleZ / scaleFactor) * canvasWidth / canvasWidth; // Scaled pixels
                                const newZoom = scaleX / (width * scaleFactor); // New zoom based on base width

                                // Compute base pixel values
                                updatedShape.width = scaledWidth / newZoom; // Base width in pixels
                                updatedShape.height = scaledHeight / newZoom; // Base height in pixels
                                updatedShape.length = scaledLength / newZoom; // Base length in pixels
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