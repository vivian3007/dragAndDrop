import React, {useContext, useEffect, useRef, useState} from 'react';
import {useLoader, useThree, useFrame} from '@react-three/fiber';
import TransformControlsThree from "./TransformControlsThree.tsx";
import * as THREE from 'three';
import { RenderContext } from "./RenderProvider.tsx";

export default function Sphere({
                                   id,
                                   data,
                                   orbitControlsRef,
                                   isSelected,
                                   onSelect,
                                   onUpdateShape,
                                   transformMode,
                                   setTransformMode,
                               }: {
    id: string;
    data: { shape: any };
    orbitControlsRef: React.MutableRefObject<any>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdateShape: (shape: any) => void;
    transformMode: any;
    setTransformMode: any;
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
    const { camera, size } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const transformControlsRef = useRef<any>(null);
    const [isDragging, setIsDragging] = useState(false);

    const texture = useLoader(THREE.TextureLoader, '/textures/stitch-texture.jpg');

    // const meshRendered = useContext(RenderContext)
    // const [hasRendered, setHasRendered] = useState(false);

    // useFrame(() => {
    //     if (meshRef.current && !hasRendered) {
    //         meshRendered(id);
    //         setHasRendered(true);
    //     }
    // });

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.uuid = id; // Ensure mesh uuid matches shape.id
            console.log('Sphere mesh UUID set to:', meshRef.current.uuid);
        }
    }, [id]);

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
            <mesh ref={meshRef} scale={[1, 1, 1]}>
                {/*position={[x, y, z]*/}
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    map={texture}
                    color={shape?.color ?? 'white'}
                    metalness={0}
                    roughness={0.8}
                />
            </mesh>
            {isSelected && (
                <TransformControlsThree transformRef={transformControlsRef} object={meshRef.current} transformMode={transformMode} setTransformMode={setTransformMode} isSelected={isSelected} setIsDragging={setIsDragging} orbitControlsRef={orbitControlsRef} meshRef={meshRef} size={size} onUpdateShape={onUpdateShape} shape={shape} width={width} />
            )}
        </group>
    );
}