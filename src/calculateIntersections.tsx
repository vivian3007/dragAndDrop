import * as THREE from "three";
import {CSG} from "three-csg-ts";

export default function calculateIntersections(
    droppedShapes: Shape[],
    scene: THREE.Scene,
    threeJsContainerRef: any,
    camera: THREE.Camera,
    meshes: { id: string; mesh: THREE.Mesh }[],
    setIntersections: any,
    setMeshes: any
) {

    if (!scene) {
        console.warn("Scene is null, skipping intersection calculation.");
        return;
    }
    
    scene.children.forEach((child) => {
        if (child.userData.isIntersection || child.userData.isIntersectionPoint) {
            scene.remove(child);
        }
    });


    const meshesArray: { id: string; mesh: THREE.Mesh }[] = [];

    droppedShapes.forEach((shape) => {
        scene.children.forEach(o => {
            if(o.children.length > 0) {
                o.children.forEach(c => console.log(c.uuid))
            }
            }
        )
        const mesh = scene.getObjectByProperty('uuid', shape.id);
        if (mesh instanceof THREE.Mesh) {
            if (!meshesArray.find((m) => m.id === shape.id)) {
                meshesArray.push({id: shape.id, mesh});
            }
        } else {
            console.warn(`No mesh found for shape ID: ${shape.id}`);
        }
    });

    const intersectionArray = [];

    for (let i = 0; i < meshesArray.length; i++) {
        for (let j = i + 1; j < meshesArray.length; j++) {
            const meshA = meshesArray[i].mesh;
            const meshB = meshesArray[j].mesh;

            if (meshesArray[i].id === meshesArray[j].id) {
                continue;
            }

            meshA.updateMatrix();
            meshB.updateMatrix();

            const boxA = new THREE.Box3().setFromObject(meshA);
            const boxB = new THREE.Box3().setFromObject(meshB);

            if (boxA.intersectsBox(boxB)) {
                // console.log(`Overlap detected between shapes ${meshesArray[i].id} and ${meshesArray[j].id}`);
                try {
                    const csgA = CSG.fromMesh(meshA);
                    const csgB = CSG.fromMesh(meshB);
                    const intersectionCSG = csgA.intersect(csgB);
                    const intersectionMesh = CSG.toMesh(intersectionCSG, meshA.matrix);

                    const geometry = intersectionMesh.geometry;
                    const positionAttribute = geometry.attributes.position;
                    if (positionAttribute && positionAttribute.count > 0) {
                        const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                        // const pointMaterial = new THREE.MeshBasicMaterial();
                        const leftmostPointMaterial = new THREE.MeshBasicMaterial();
                        const rightmostPointMaterial = new THREE.MeshBasicMaterial();
                        const highestPointMaterial = new THREE.MeshBasicMaterial();
                        const lowestPointMaterial = new THREE.MeshBasicMaterial();
                        const uniqueVertices = new Set<string>();
                        const intersectionPoints: { x: number; y: number; z: number }[] = [];

                        let leftmostPoint: { x: number; y: number; z: number } | null = null;
                        let rightmostPoint: { x: number; y: number; z: number } | null = null;
                        let highestPoint: { x: number, y: number, z: number } | null = null;
                        let lowestPoint: { x: number, y: number, z: number } | null = null;

                        for (let k = 0; k < positionAttribute.count; k++) {
                            const x = positionAttribute.getX(k);
                            const y = positionAttribute.getY(k);
                            const z = positionAttribute.getZ(k);
                            const vertexKey = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;

                            if (!uniqueVertices.has(vertexKey)) {
                                uniqueVertices.add(vertexKey);
                                const point = { x, y, z };
                                intersectionPoints.push(point);

                                if (!leftmostPoint || x < leftmostPoint.x) {
                                    leftmostPoint = point;
                                }
                                if (!rightmostPoint || x > rightmostPoint.x) {
                                    rightmostPoint = point;
                                }

                                if (!highestPoint || y > highestPoint.y) {
                                    highestPoint = point;
                                }
                                if (!lowestPoint || y < lowestPoint.y) {
                                    lowestPoint = point;
                                }

                                // const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
                                // pointMesh.position.set(x, y, z);
                                // pointMesh.userData.isIntersectionPoint = true;
                                // scene.add(pointMesh);
                            }
                        }

                        if (leftmostPoint) {
                            const leftMesh = new THREE.Mesh(pointGeometry, leftmostPointMaterial);
                            leftMesh.position.set(leftmostPoint.x, leftmostPoint.y, leftmostPoint.z);
                            leftMesh.userData.isIntersectionPoint = true;
                            scene.add(leftMesh);
                        }
                        if (rightmostPoint) {
                            const rightMesh = new THREE.Mesh(pointGeometry, rightmostPointMaterial);
                            rightMesh.position.set(rightmostPoint.x, rightmostPoint.y, rightmostPoint.z);
                            rightMesh.userData.isIntersectionPoint = true;
                            scene.add(rightMesh);
                        }
                        if (highestPoint) {
                            const highMesh = new THREE.Mesh(pointGeometry, highestPointMaterial);
                            highMesh.position.set(highestPoint.x, highestPoint.y, highestPoint.z);
                            highMesh.userData.isIntersectionPoint = true;
                            scene.add(highMesh);
                        }
                        if (lowestPoint) {
                            const lowMesh = new THREE.Mesh(pointGeometry, lowestPointMaterial);
                            lowMesh.position.set(lowestPoint.x, lowestPoint.y, lowestPoint.z);
                            lowMesh.userData.isIntersectionPoint = true;
                            scene.add(lowMesh);
                        }

                        if (leftmostPoint && rightmostPoint && highestPoint && lowestPoint) {
                            const distanceWidth = Math.sqrt(
                                Math.pow(rightmostPoint.x - leftmostPoint.x, 2) +
                                Math.pow(rightmostPoint.y - leftmostPoint.y, 2) +
                                Math.pow(rightmostPoint.z - leftmostPoint.z, 2)
                            );

                            const distanceHeight = Math.sqrt(
                                Math.pow(highestPoint.x - lowestPoint.x, 2) +
                                Math.pow(highestPoint.y - lowestPoint.y, 2) +
                                Math.pow(highestPoint.z - lowestPoint.z, 2)
                            );

                            const leftVector = new THREE.Vector3(leftmostPoint.x, leftmostPoint.y, leftmostPoint.z);
                            const rightVector = new THREE.Vector3(rightmostPoint.x, rightmostPoint.y, rightmostPoint.z);
                            const highVector = new THREE.Vector3(highestPoint.x, highestPoint.y, highestPoint.z);
                            const lowVector = new THREE.Vector3(lowestPoint.x, lowestPoint.y, lowestPoint.z);
                            const yVector = new THREE.Vector3(meshesArray[i].mesh.position.x, meshesArray[i].mesh.position.y, meshesArray[i].mesh.position.z);

                            leftVector.project(camera);
                            rightVector.project(camera);
                            highVector.project(camera);
                            lowVector.project(camera);
                            yVector.project(camera);

                            const canvasWidth = threeJsContainerRef.current.width;
                            const canvasHeight = threeJsContainerRef.current.height;
                            const leftPixelX = ((leftVector.x + 1) / 2) * canvasWidth;
                            const leftPixelY = ((-leftVector.y + 1) / 2) * canvasHeight;
                            const rightPixelX = ((rightVector.x + 1) / 2) * canvasWidth;
                            const rightPixelY = ((-rightVector.y + 1) / 2) * canvasHeight;
                            const highPixelX = ((highVector.x + 1) / 2) * canvasWidth;
                            const highPixelY = ((-highVector.y + 1) / 2) * canvasHeight;
                            const lowPixelX = ((lowVector.x + 1) / 2) * canvasWidth;
                            const lowPixelY = ((-lowVector.y + 1) / 2) * canvasHeight;
                            const meshYPixels = ((yVector.y + 1) / 2) * canvasHeight;

                            const currentDroppedShape = droppedShapes.find((shape) => shape.id === meshesArray[i].id);

                            console.log("meshypixels", meshYPixels);
                            console.log("highpixely", highPixelY);

                            const mesh = meshesArray[i].mesh;
                            const sphereTopWorld = new THREE.Vector3(
                                mesh.position.x,
                                mesh.position.y + 1 * mesh.scale.y, // 1 is de geometry-radius
                                mesh.position.z
                            );
                            sphereTopWorld.project(camera);
                            const sphereTopPixelY = ((-sphereTopWorld.y + 1) / 2) * canvasHeight;

                            // const topToHighestPoint = sphereTopPixelY - highPixelY;
                            const topToRightmostPoint = sphereTopPixelY - rightPixelY;

                            const topToHighestPoint = meshYPixels - (currentDroppedShape?.height / 2) - highPixelY;
                            // const topToRightmostPoint = meshYPixels - rightPixelY;

                            console.log("toptohighestpoint", topToHighestPoint)
                            console.log("toptorightmostpoint", topToRightmostPoint)

                            const pixelDistanceWidth = Math.sqrt(
                                Math.pow(rightPixelX - leftPixelX, 2) +
                                Math.pow(rightPixelY - leftPixelY, 2)
                            );

                            const pixelDistanceHeight = Math.sqrt(
                                Math.pow(highPixelX - lowPixelX, 2) +
                                Math.pow(highPixelY - lowPixelY, 2)
                            );

                            intersectionArray.push({
                                shape1: meshesArray[i].id,
                                shape2: meshesArray[j].id,
                                leftmostPoint,
                                rightmostPoint,
                                highestPoint,
                                lowestPoint,
                                distanceWidth,
                                distanceHeight,
                                pixelDistanceWidth,
                                pixelDistanceHeight,
                                topToHighestPoint,
                                topToRightmostPoint,
                            });

                            console.log(intersectionArray)

                        } else {
                            console.warn(`Not enough points to determine leftmost and rightmost for shapes ${meshesArray[i].id} and ${meshesArray[j].id}`);
                        }
                    } else {
                        console.warn('No vertices found in intersection geometry');
                    }
                } catch (error) {
                    console.error('Error computing CSG intersection:', error);
                }
            }
        }
    }

    setIntersections(intersectionArray.length > 0 ? intersectionArray : []);
    setMeshes(meshesArray.length > 0 ? meshesArray : []);
}