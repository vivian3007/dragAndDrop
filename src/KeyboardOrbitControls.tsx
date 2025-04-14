import { Canvas, useThree } from '@react-three/fiber';
import React, { useEffect } from 'react';

export default function KeyboardOrbitControls() {
    const { camera } = useThree();

    useEffect(() => {
        // Stel een initiële camera positie in (optioneel, indien nodig)
        camera.position.set(0, 0, 5);

        // Toetsenbindevenement voor rotatie
        const handleKeyDown = (event) => {
            const rotationSpeed = 0.05; // Rotatiesnelheid in radialen
            switch (event.code) {
                case 'ArrowLeft':
                    camera.rotation.y += rotationSpeed; // Roteer naar links (horizontaal)
                    break;
                case 'ArrowRight':
                    camera.rotation.y -= rotationSpeed; // Roteer naar rechts (horizontaal)
                    break;
                case 'ArrowUp':
                    camera.rotation.x = Math.max(-Math.PI / 2, camera.rotation.x - rotationSpeed); // Roteer omhoog (verticaal)
                    break;
                case 'ArrowDown':
                    camera.rotation.x = Math.min(Math.PI / 2, camera.rotation.x + rotationSpeed); // Roteer omlaag (verticaal)
                    break;
                default:
                    return;
            }
        };

        const handleWheel = (event) => {
            const zoomSpeed = 0.1; // Zoomgevoeligheid
            const minZoom = 1; // Minimale afstand (maximaal ingezoomd)
            const maxZoom = 10; // Maximale afstand (maximaal uitgezoomd)

            // Pas camera.position.z aan op basis van scrollrichting
            const newZ = camera.position.z + event.deltaY * zoomSpeed;

            // Beperk de zoom binnen minZoom en maxZoom
            camera.position.z = Math.max(minZoom, Math.min(maxZoom, newZ));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel);

        // Schoonmaak bij unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [camera]);

    return null;
}

// Example usage
function Scene() {
    return (
        <Canvas>
            <KeyboardOrbitControls />
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
            </mesh>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
        </Canvas>
    );
}

export { Scene };