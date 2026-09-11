import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Sphere from './Sphere.tsx';
import Arm from './Arm.tsx';
import { computePatternBox } from './geometry/patternBounds';

const shapeComponents: { [key: string]: React.ComponentType<any> } = {
    Sphere,
    Arm,
};

const noop = () => {};

// Richt de camera op het midden van de vormen en zet de kijkafstand op basis van de
// grootte van het patroon, i.p.v. een vaste positie zoals in de levende editor
// (ThreeJsField.tsx/SceneController.tsx) — hier is er geen "front view"-knop, dus moet
// het meteen goed staan voor patronen van elke grootte/positie. Bewust geen OrbitControls:
// die kapen scroll/drag boven de preview weg van de paginascroll, wat op deze (niet-sticky
// t.o.v. de muis) plek verwarrend werkt — dit is dus een statisch, niet-interactief plaatje.
function CameraFraming({ box }: { box: THREE.Box3 }) {
    const { camera } = useThree();

    useLayoutEffect(() => {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z, 1) * 0.9 + 2;

        camera.position.set(center.x + radius, center.y + radius * 0.4, center.z + radius);
        camera.lookAt(center);
        camera.updateProjectionMatrix();
    }, [box, camera]);

    return null;
}

// Alleen-lezen live weergave van het threejs-ontwerp — hergebruikt Sphere.tsx/Arm.tsx
// rechtstreeks, altijd met isSelected=false, dus TransformControlsThree mount nooit en
// er is geen selectie/gizmo-gedrag nodig; onSelect/onUpdateShape zijn dan ook no-ops.
const PatternPreview3D = ({ shapes }: { shapes: Shape[] }) => {
    const box = useMemo(() => computePatternBox(shapes), [shapes]);
    const dummyOrbitControlsRef = useRef<any>(null);

    if (!shapes || shapes.length === 0 || !box) {
        return (
            <div className="pattern-preview-empty">Geen 3D-voorbeeld beschikbaar</div>
        );
    }

    return (
        <Canvas className="pattern-preview-canvas" camera={{ fov: 50 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[100, 1000, 100]} intensity={1.2} />
            <CameraFraming box={box} />
            {shapes.map((shape: any) => {
                const ShapeComponent = shapeComponents[shape.type] || Sphere;
                return (
                    <ShapeComponent
                        key={shape.id}
                        id={shape.id}
                        shape={shape}
                        orbitControlsRef={dummyOrbitControlsRef}
                        isSelected={false}
                        onSelect={noop}
                        onUpdateShape={noop}
                        transformMode="translate"
                        setTransformMode={noop}
                    />
                );
            })}
        </Canvas>
    );
};

export default PatternPreview3D;
