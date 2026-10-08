import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import TransformControlsThree from "./TransformControlsThree.tsx";
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import { isGizmoAxisActive } from "./editor/types";
import type { ShapeComponentProps } from "./editor/types";
import { meshScaleOf } from "./geometry/units";
import { useStitchTexture } from "./editor/useStitchTexture";
import { YARN_MATERIAL, YARN_TINT } from "./geometry/yarnLook";
import { useStripedGeometry } from "./editor/useStripedGeometry";

function Arm({
                                         id,
                                         shape,
                                         orbitControlsRef,
                                         isSelected,
                                         onSelect,
                                         onUpdateShape,
                                         transformMode,
                                         setTransformMode,
                                         onDraggingChange,
                                         activeTransformControlsRef,
                                         onTransformEnd,
                                     }: ShapeComponentProps) {

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
    const meshRef = useRef<THREE.Mesh>(null);
    const transformControlsRef = useRef<TransformControlsImpl | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDraggingChange = (value: boolean) => {
        setIsDragging(value);
        onDraggingChange?.(value);
    };

    const texture = useStitchTexture(shape);
    // Open cilinder (lichaam) en kapje, elk verschoven binnen de arm; zie Arm-opbouw hieronder.
    const bodyGeometry = useStripedGeometry(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1, true), shape, 0.5);
    const capGeometry = useStripedGeometry(() => new THREE.SphereGeometry(0.5, 48, 24), shape, 1);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.uuid = id; // Ensure mesh uuid matches shape.id
        }
    }, [id]);

    useEffect(() => {
        // `height` staat voor de TOTALE zichtbare armlengte (cilinder + bolvormig kapje);
        // meshScaleOf deelt daarvoor door ARM_TOTAL_LOCAL_LENGTH.
        const [scaleX, scaleY, scaleZ] = meshScaleOf({ type: 'Arm', width, height, length, zoom });

        if (meshRef.current && !isDragging) {
            meshRef.current.scale.set(scaleX, scaleY, scaleZ);
            meshRef.current.position.set(x, y, z);
            meshRef.current.rotation.set(
                rotation_x * (Math.PI / 180),
                rotation_y * (Math.PI / 180),
                rotation_z * (Math.PI / 180)
            );
        }
    }, [width, height, length, zoom, x, y, z, rotation_x, rotation_y, rotation_z, isSelected, isDragging]);


    return (
        <>
            <group
                onPointerDown={(e) => {
                    if (isGizmoAxisActive(activeTransformControlsRef)) {
                        return;
                    }
                    e.stopPropagation();
                    onSelect(id);
                }}
            >
                <mesh position={[0, 0.5, 0]} ref={meshRef}>
                    <mesh position={[0, 0.5, 0]} geometry={bodyGeometry}>
                        <meshStandardMaterial map={texture} bumpMap={texture} {...YARN_MATERIAL} vertexColors color={YARN_TINT} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, 1, 0]} geometry={capGeometry}>
                        <meshStandardMaterial map={texture} bumpMap={texture} {...YARN_MATERIAL} vertexColors color={YARN_TINT} side={THREE.DoubleSide} />
                    </mesh>
                </mesh>
            </group>
            {isSelected && (
                <TransformControlsThree transformRef={transformControlsRef} object={meshRef.current} transformMode={transformMode} setTransformMode={setTransformMode} isSelected={isSelected} setIsDragging={handleDraggingChange} orbitControlsRef={orbitControlsRef} meshRef={meshRef} onUpdateShape={onUpdateShape} shape={shape} width={width} activeTransformControlsRef={activeTransformControlsRef} onTransformEnd={() => onTransformEnd?.(id, transformMode)} />
            )}
        </>
    );
}

export default React.memo(Arm, (prev, next) =>
    prev.shape === next.shape &&
    prev.isSelected === next.isSelected &&
    prev.id === next.id
);