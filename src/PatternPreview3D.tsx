import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Sphere from './Sphere.tsx';
import Arm from './Arm.tsx';
import { Cone, Cylinder } from './SolidShape';
import { GroundShadow, YarnLights } from './editor/YarnScene';
import { computePatternBox } from './geometry/patternBox';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ShapeComponentProps } from './editor/types';
import calculateIntersections from './calculateIntersections';
import { useT } from './i18n/LanguageProvider';

const shapeComponents: Record<string, React.ComponentType<ShapeComponentProps>> = {
    Sphere,
    Arm,
    Cylinder,
    Cone,
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

// Berekent de intersections opnieuw uit de meshes van deze preview, zodat de Assembly op de
// patroonpagina niet afhangt van de (in-memory) intersections uit de editor. Die zijn er
// alleen als je net vanuit de editor komt; vanuit Home/My patterns/Favorites/de detail-dialoog
// waren ze leeg of hoorden ze bij een ander amigurumi. We wachten tot alle meshes in de
// scene staan (Sphere/Arm suspenden op hun texture en zetten hun uuid pas in een effect).
// Bewust een interval i.p.v. useFrame: requestAnimationFrame staat stil in een tabblad op de
// achtergrond, waardoor de Assembly dan nooit verscheen.
function IntersectionReporter({ shapes, onIntersections }: { shapes: Shape[]; onIntersections: (intersections: Intersection[]) => void }) {
    const { scene } = useThree();

    useEffect(() => {
        const tryCalculate = () => {
            const allMeshesReady = shapes.every((shape) => scene.getObjectByProperty('uuid', shape.id));
            if (!allMeshesReady) {
                return false;
            }
            calculateIntersections(shapes, scene, onIntersections);
            return true;
        };

        if (tryCalculate()) {
            return;
        }
        const interval = setInterval(() => {
            if (tryCalculate()) {
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [shapes, scene, onIntersections]);

    return null;
}

// Alleen-lezen live weergave van het threejs-ontwerp — hergebruikt Sphere.tsx/Arm.tsx
// rechtstreeks, altijd met isSelected=false, dus TransformControlsThree mount nooit en
// er is geen selectie/gizmo-gedrag nodig; onSelect/onUpdateShape zijn dan ook no-ops.
const PatternPreview3D = ({ shapes, onIntersections }: { shapes: Shape[]; onIntersections?: (intersections: Intersection[]) => void }) => {
    const box = useMemo(() => computePatternBox(shapes), [shapes]);
    const dummyOrbitControlsRef = useRef<OrbitControlsImpl | null>(null);
    const t = useT();

    if (!shapes || shapes.length === 0 || !box) {
        return (
            <div className="pattern-preview-empty">{t("pattern.noPreview")}</div>
        );
    }

    return (
        <Canvas className="pattern-preview-canvas" camera={{ fov: 50 }}>
            <YarnLights />
            <GroundShadow shapes={shapes} />
            <CameraFraming box={box} />
            {onIntersections ? <IntersectionReporter shapes={shapes} onIntersections={onIntersections} /> : null}
            {shapes.map((shape) => {
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
