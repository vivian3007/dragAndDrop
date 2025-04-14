import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';

export default function Sphere({
                                   id,
                                   data,
                                   orbitControlsRef,
                                   isSelected,
                                   onSelect,
                               }) {
    const width = data?.shape?.width;
    const height = data?.shape?.height;
    const length = data?.shape?.length;
    const x = data?.shape?.x;
    const y = data?.shape?.y;
    const { camera, size } = useThree();
    const meshRef = useRef(null); // Verwijderde incorrecte type (geen HTMLDivElement, maar THREE.Mesh)

    useEffect(() => {
        const baseRadius = 1;
        const fov = camera.fov * (Math.PI / 180);
        const distance = camera.position.z;
        const visibleWidth = 2 * distance * Math.tan(fov / 2);
        const canvasWidth = size.width;

        const desiredWidthUnits = (width / canvasWidth) * visibleWidth;
        const desiredHeightUnits = (height / canvasWidth) * visibleWidth;
        const desiredLengthUnits = (length / canvasWidth) * visibleWidth;

        const scaleX = desiredWidthUnits / (baseRadius * 2);
        const scaleY = desiredHeightUnits / (baseRadius * 2);
        const scaleZ = desiredLengthUnits / (baseRadius * 2);

        if (meshRef.current) {
            meshRef.current.scale.set(scaleX, scaleY, scaleZ);
        }
    }, [camera, size, width, height, length]);

    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
        >
            <mesh ref={meshRef} position={[x, y, 0]} scale={[1, 1, 1]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={data?.shape?.color}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>
            {isSelected && (
                <TransformControls
                    object={meshRef.current}
                    onMouseDown={() => {
                        if (orbitControlsRef.current) {
                            orbitControlsRef.current.enabled = false;
                        }
                    }}
                    onMouseUp={() => {
                        if (orbitControlsRef.current) {
                            orbitControlsRef.current.enabled = true;
                        }
                    }}
                />
            )}
        </group>
    );
}