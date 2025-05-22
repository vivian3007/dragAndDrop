import React, {Ref, useEffect, useRef, useState} from 'react'
import {Canvas, useThree} from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import Sphere from './Sphere'
import Arm from './Arm'
import {GridHelper} from "three";

const shapeComponents: { [key: string]: React.ComponentType<any> } = {
    Sphere,
    Arm,
};

export default function ThreeJsField({
                                         droppedShapes,
                                         threeJsContainerRef,
    activeId,
    setActiveId,
    onUpdateShape,
    setCamera,
    onDeleteShape,
                                     }: {
    droppedShapes: [];
    threeJsContainerRef: Ref<HTMLCanvasElement>;
    activeId: any;
    setActiveId: any;
    onUpdateShape: any;
    setCamera: any;
    onDeleteShape: any;
}) {
    const orbitControlsRef = useRef(null);
    const [showGrid, setShowGrid] = useState(false);

    function CameraSetter({ setCamera }) {
        const { camera } = useThree();
        React.useEffect(() => {
            setCamera(camera);
        }, [camera, setCamera]);
        return null;
    }

    const handleSelect = (id) => {
        console.log(id)
        setActiveId(activeId === id ? null : id);
    };

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key.toLowerCase() === 'g') {
                setShowGrid((prev) => !prev);
            }
            if (event.key.toLowerCase() === "delete" && activeId) {
                onDeleteShape(activeId);
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [activeId]);



    return (
        <Canvas
            camera={{position: [0, 0, 40], fov: 75}}
            ref={threeJsContainerRef}
            style={{height: "92vh"}}
        >
            <CameraSetter setCamera={setCamera}/>
            {showGrid &&
                <primitive
                    object={new GridHelper(
                        50,
                        30,
                        '#6f6f6f',
                        '#9d9d9d'
                    )}
                    position={[0, 0, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            }
            <ambientLight intensity={0.4}/>
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow/>
            <spotLight position={[100, 1000, 100]} intensity={1.2}/>

            <OrbitControls ref={orbitControlsRef}/>

            {/*{droppedShapes.map((shape: any) => (*/}
            {/*    // <Arm*/}
            {/*    //     key={shape.id}*/}
            {/*    //      id={shape.id}*/}
            {/*    //      data={{shape}}*/}
            {/*    //      orbitControlsRef={orbitControlsRef}*/}
            {/*    //      isSelected={activeId === shape.id}*/}
            {/*    //      onSelect={handleSelect}*/}
            {/*    //      onUpdateShape={onUpdateShape}*/}
            {/*    // />*/}
            {/*    <Sphere*/}
            {/*    key={shape.id}*/}
            {/*    id={shape.id}*/}
            {/*    data={{shape}}*/}
            {/*    orbitControlsRef={orbitControlsRef}*/}
            {/*    isSelected={activeId === shape.id}*/}
            {/*    onSelect={handleSelect}*/}
            {/*    onUpdateShape={onUpdateShape}*/}
            {/*    />*/}
            {/*    )*/}
            {/*)}*/}


            {droppedShapes.map((shape: any) => {
                const ShapeComponent = shapeComponents[shape.type] ?? "Sphere";

                if (!ShapeComponent) {
                    console.warn(`No component found for shape type: ${shape.type}`);
                    return null;
                }

                return (
                    <ShapeComponent
                        key={shape.id}
                        id={shape.id}
                        data={{ shape }}
                        orbitControlsRef={orbitControlsRef}
                        isSelected={activeId === shape.id}
                        onSelect={handleSelect}
                        onUpdateShape={onUpdateShape}
                    />
                );
            })}
        </Canvas>
    )
        ;
}
