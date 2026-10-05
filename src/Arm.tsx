import React, { useEffect, useRef, useState } from 'react';
import {useLoader, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import TransformControlsThree from "./TransformControlsThree.tsx";
import { ARM_TOTAL_LOCAL_LENGTH } from "./geometry/armGeometry";
import { WORLD_SCALE_FACTOR } from "./geometry/units";

function Arm({
                                         id,
                                         shape,
                                         orbitControlsRef,
                                         isSelected,
                                         onSelect,
                                         onUpdateShape,
                                         onDraggingChange,
                                         activeTransformControlsRef,
                                     }: {
    id: string;
    shape: any;
    orbitControlsRef: React.MutableRefObject<any>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdateShape: (shape: any) => void;
    onDraggingChange?: (isDragging: boolean) => void;
    activeTransformControlsRef?: React.MutableRefObject<any>;
}) {

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

    const handleDraggingChange = (value: boolean) => {
        setIsDragging(value);
        onDraggingChange?.(value);
    };

    const texture = useLoader(THREE.TextureLoader, '/textures/stitch-texture.jpg');

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.uuid = id; // Ensure mesh uuid matches shape.id
        }
    }, [id]);

    useEffect(() => {
        const canvasWidth = size.width;
        const canvasHeight = size.height;

        const scaledWidth = width * zoom;
        // `height` (zoals de gebruiker die invoert, in cm) staat voor de TOTALE zichtbare
        // armlengte (cilinder + bolvormig kapje), niet alleen de cilinder. Los scaleY op
        // zodat ARM_TOTAL_LOCAL_LENGTH * scaleY gelijk is aan de gewenste totale wereldlengte.
        const scaledHeight = (height * zoom) / ARM_TOTAL_LOCAL_LENGTH;
        const scaledLength = length * zoom;

        const scaleFactor = WORLD_SCALE_FACTOR;
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
        <>
            <group
                onPointerDown={(e) => {
                    if (activeTransformControlsRef?.current?.axis) {
                        return;
                    }
                    e.stopPropagation();
                    onSelect(id);
                }}
            >
                <mesh position={[0, 0.5, 0]} ref={meshRef}>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 1, 32, 1, true]} />
                        <meshBasicMaterial map={texture} color={color} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, 1, 0]}>
                        <sphereGeometry args={[0.5, 32, 16]} />
                        <meshBasicMaterial map={texture} color={color} side={THREE.DoubleSide} />
                    </mesh>
                </mesh>
            </group>
            {isSelected && (
                <TransformControlsThree transformRef={transformControlsRef} object={meshRef.current} transformMode={transformMode} setTransformMode={setTransformMode} isSelected={isSelected} setIsDragging={handleDraggingChange} orbitControlsRef={orbitControlsRef} meshRef={meshRef} size={size} onUpdateShape={onUpdateShape} shape={shape} width={width} activeTransformControlsRef={activeTransformControlsRef} />
            )}
        </>
    );
}

export default React.memo(Arm, (prev, next) =>
    prev.shape === next.shape &&
    prev.isSelected === next.isSelected &&
    prev.id === next.id
);