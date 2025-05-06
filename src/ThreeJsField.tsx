import React, {Ref, useRef, useState} from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import Sphere from './Sphere'

export default function ThreeJsField({
                                         droppedShapes,
                                         threeJsContainerRef,
    activeId,
    setActiveId,
    onUpdateShape,
                                     }: {
    droppedShapes: [];
    threeJsContainerRef: Ref<HTMLCanvasElement>;
    activeId: any;
    setActiveId: any;
    onUpdateShape: any;
}) {
    const orbitControlsRef = useRef(null);
    // const [selectedSphereId, setSelectedSphereId] = useState(null);

    const handleSelect = (id) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <Canvas
            camera={{ position: [0, 0, 40], fov: 75 }}
            ref={threeJsContainerRef}
            style={{height: "100vh"}}
        >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
            <spotLight position={[100, 1000, 100]} intensity={1.2} />

            <OrbitControls ref={orbitControlsRef} />

            {droppedShapes.map((shape: any) => (
                <Sphere
                    key={shape.id}
                    id={shape.id}
                    data={{ shape }}
                    orbitControlsRef={orbitControlsRef}
                    isSelected={activeId === shape.id}
                    onSelect={handleSelect}
                    onUpdateShape={onUpdateShape}
                />
            ))}
        </Canvas>
    );
}
