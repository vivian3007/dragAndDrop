import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import TransformControlsThree from "./TransformControlsThree.tsx";
import { useMeshObject } from "./editor/useMeshObject";
import { isGizmoAxisActive } from "./editor/types";
import type { ShapeComponentProps } from "./editor/types";
import { meshScaleOf } from "./geometry/units";
import { useStitchTexture } from "./editor/useStitchTexture";
import { YARN_MATERIAL, YARN_TINT } from "./geometry/yarnLook";
import { useStripedGeometry } from "./editor/useStripedGeometry";
import { createShapeGeometry, isDoubleSided } from "./shapes/geometry3d";
import { shapeDefinition } from "./shapes/registry";

// Elke vorm met diameter 1 en hoogte 0..1 (cilinder, kegel, plat rondje, halve bol, druppel,
// hartje, borduursel, ...) in de editor en de patroonpreview. Zelfde gedrag als Sphere.tsx
// (selecteren, de gizmo, schaal uit width/height/length × zoom); de geometrie komt uit
// shapes/geometry3d.ts.
function SolidShape({
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
    const type = shape.type;
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
    const { meshRef, mesh, meshCallbackRef } = useMeshObject();
    const transformControlsRef = useRef<TransformControlsImpl | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const geometry = useStripedGeometry(() => createShapeGeometry(shape), shape);

    const handleDraggingChange = (value: boolean) => {
        setIsDragging(value);
        onDraggingChange?.(value);
    };

    const texture = useStitchTexture(shape);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.uuid = id; // zodat de mesh in de scene bij de vorm te vinden is
        }
    }, [id, meshRef]);

    useEffect(() => {
        if (meshRef.current && !isDragging) {
            meshRef.current.scale.set(...meshScaleOf({ type, width, height, length, zoom }));
            meshRef.current.position.set(x, y, z);
            meshRef.current.rotation.set(
                rotation_x * (Math.PI / 180),
                rotation_y * (Math.PI / 180),
                rotation_z * (Math.PI / 180),
            );
        }
    }, [type, width, height, length, zoom, x, y, z, rotation_x, rotation_y, rotation_z, isDragging, meshRef]);

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
                <mesh ref={meshCallbackRef} geometry={geometry}>
                    {shapeDefinition(type).attach === "embroidery" ? (
                        // Borduurdraad: te dun voor de steekfoto, gewoon mat garen in z'n kleur.
                        <meshStandardMaterial roughness={1} metalness={0} vertexColors color={YARN_TINT} />
                    ) : (
                        // Een open vorm (buis, flesje) zie je ook van binnen.
                        <meshStandardMaterial map={texture} bumpMap={texture} {...YARN_MATERIAL} vertexColors color={YARN_TINT} side={isDoubleSided(shape) ? THREE.DoubleSide : THREE.FrontSide} />
                    )}
                </mesh>
            </group>
            {isSelected && (
                <TransformControlsThree transformRef={transformControlsRef} object={mesh} transformMode={transformMode} setTransformMode={setTransformMode} isSelected={isSelected} setIsDragging={handleDraggingChange} orbitControlsRef={orbitControlsRef} meshRef={meshRef} onUpdateShape={onUpdateShape} shape={shape} width={width} activeTransformControlsRef={activeTransformControlsRef} onTransformEnd={() => onTransformEnd?.(id, transformMode)} />
            )}
        </>
    );
}

const areEqual = (prev: ShapeComponentProps, next: ShapeComponentProps) =>
    prev.shape === next.shape &&
    prev.isSelected === next.isSelected &&
    prev.transformMode === next.transformMode &&
    prev.id === next.id;

export default React.memo(SolidShape, areEqual);
