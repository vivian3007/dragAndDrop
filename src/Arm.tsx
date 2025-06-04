import React, { useEffect, useRef, useState } from 'react';
import {useLoader, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import TransformControlsThree from "./TransformControlsThree.tsx";

export default function Arm({
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
    const rotation_x = shape?.rotation_x ?? 0;
    const rotation_y = shape?.rotation_y ?? 0;
    const rotation_z = shape?.rotation_z ?? 0;
    const zoom = shape?.zoom ?? 1;
    const color = shape?.color ?? 'white';
    const { camera, size } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const transformControlsRef = useRef<any>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [isDragging, setIsDragging] = useState(false);

    const texture = useLoader(THREE.TextureLoader, '/textures/stitch-texture.jpg');

    useEffect(() => {
        const canvasWidth = size.width;
        const canvasHeight = size.height;

        const scaledWidth = width * zoom;
        const scaledHeight = height * zoom - width / 2;
        const scaledLength = length * zoom;

        const scaleFactor = 0.01;
        const scaleX = (scaledWidth / canvasWidth) * canvasWidth * scaleFactor;
        const scaleY = (scaledHeight / canvasHeight) * canvasHeight * scaleFactor;
        const scaleZ = (scaledLength / canvasWidth) * canvasWidth * scaleFactor;

        if (meshRef.current && !isDragging) {
            meshRef.current.scale.set(scaleX, scaleY, scaleZ);
            meshRef.current.position.set(x, y, z);
            meshRef.current.rotation.set(
                rotation_x * (Math.PI / 180),
                rotation_y * (Math.PI / 180),
                rotation_z * (Math.PI / 180)
            );
        }
    }, [camera, size, width, height, length, zoom, x, y, z, rotation_x, rotation_y, rotation_z, isSelected, isDragging]);


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
                    <meshBasicMaterial map={texture} color={color} metalness={0} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 1, 0]} ref={meshRef}>
                    <sphereGeometry args={[0.5, 32, 16]} />
                    <meshBasicMaterial map={texture} color={color} metalness={0} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
            </mesh>
            {isSelected && (
                <TransformControlsThree transformRef={transformControlsRef} object={meshRef.current} transformMode={transformMode} setTransformMode={setTransformMode} isSelected={isSelected} setIsDragging={setIsDragging} orbitControlsRef={orbitControlsRef} meshRef={meshRef} size={size} onUpdateShape={onUpdateShape} shape={shape} width={width} />
            )}
        </group>
    );
}