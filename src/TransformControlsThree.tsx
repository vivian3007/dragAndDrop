import {TransformControls} from "@react-three/drei";
import React, {useEffect} from "react";

export default function TransformControlsThree ({transformRef, object, transformMode, setTransformMode, setIsDragging, orbitControlsRef, meshRef, shape, size, width, onUpdateShape, isSelected} : {transformRef: any, object: any, transformMode: any, setTransformMode: any, setIsDragging: any, orbitControlsRef: any, meshRef: any, shape: any, size: any, width: any, onUpdateShape: any, isSelected: boolean}) {

    useEffect(() => {
        if (transformRef.current) {
            transformRef.current.traverse((child: any) => {
                if (child.isMesh) {
                    child.renderOrder = 999;
                }
            });
        }
    }, [isSelected]);

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
            object={object}
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
                    const updatedShape: any = {...shape};

                    if (transformMode === 'translate') {
                        updatedShape.x = mesh.position.x;
                        updatedShape.y = mesh.position.y;
                        updatedShape.z = mesh.position.z;
                    } else if (transformMode === 'rotate') {
                        updatedShape.rotation_x = mesh.rotation.x * (180 / Math.PI);
                        updatedShape.rotation_y = mesh.rotation.y * (180 / Math.PI);
                        updatedShape.rotation_z = mesh.rotation.z * (180 / Math.PI);
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
    );
}