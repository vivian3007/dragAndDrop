import * as THREE from "three";
import {CSG} from "three-csg-ts";
import {computeSphereSphereIntersection} from "./geometry/sphereIntersection";

// CSG boolean intersecties zijn duur en schalen met het aantal driehoeken van
// de operanden. De zichtbare vormen (Sphere/Arm) zijn vrij hoog-poly voor een
// mooie ronding, maar voor de overlap-berekening is die precisie niet nodig —
// hier bouwen we een laag-poly variant van dezelfde geometrie (zelfde radius/
// hoogte/etc., minder segmenten) zodat de CSG-operatie een stuk sneller gaat
// zonder dat de gerenderde vorm zelf minder gedetailleerd wordt.
const MAX_CSG_SEGMENTS = 12;

function getCsgProxyGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const params: any = (geometry as any).parameters;
    if (!params) {
        return geometry;
    }

    if (geometry.type === 'SphereGeometry') {
        return new THREE.SphereGeometry(
            params.radius,
            Math.min(params.widthSegments ?? MAX_CSG_SEGMENTS, MAX_CSG_SEGMENTS),
            Math.min(params.heightSegments ?? MAX_CSG_SEGMENTS, MAX_CSG_SEGMENTS),
            params.phiStart,
            params.phiLength,
            params.thetaStart,
            params.thetaLength
        );
    }

    if (geometry.type === 'CylinderGeometry') {
        return new THREE.CylinderGeometry(
            params.radiusTop,
            params.radiusBottom,
            params.height,
            Math.min(params.radialSegments ?? MAX_CSG_SEGMENTS, MAX_CSG_SEGMENTS),
            params.heightSegments,
            params.openEnded,
            params.thetaStart,
            params.thetaLength
        );
    }

    return geometry;
}

function createCsgProxyMesh(mesh: THREE.Mesh): THREE.Mesh {
    const proxyGeometry = getCsgProxyGeometry(mesh.geometry as THREE.BufferGeometry);
    const proxyMesh = new THREE.Mesh(proxyGeometry);
    proxyMesh.matrix.copy(mesh.matrix);
    return proxyMesh;
}

// Bolgeometrie heeft lokale radius 1 (zie Sphere.tsx: <sphereGeometry args={[1,32,32]}/>),
// dus de wereld-radius per as = mesh.scale per as. Non-uniforme scale (ellipsoïde) wordt
// benaderd door de drie assen te middelen — zie sphereIntersection.ts voor de beperking.
function getSphereWorldRadius(mesh: THREE.Mesh): number {
    return (mesh.scale.x + mesh.scale.y + mesh.scale.z) / 3;
}

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
        const mesh = scene.getObjectByProperty('uuid', shape.id);
        if (mesh instanceof THREE.Mesh) {
            if (!meshesArray.find((m) => m.id === shape.id)) {
                meshesArray.push({id: shape.id, mesh});
            }
        } else {
            console.warn(`No mesh found for shape ID: ${shape.id}`);
        }
    });

    const shapeById = new Map(droppedShapes.map((s) => [s.id, s]));

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

                const shapeA = shapeById.get(meshesArray[i].id);
                const shapeB = shapeById.get(meshesArray[j].id);

                if (shapeA?.type === "Sphere" && shapeB?.type === "Sphere") {
                    const radiusA = getSphereWorldRadius(meshA);
                    const radiusB = getSphereWorldRadius(meshB);

                    // Het kleinste object wordt vastgemaakt aan het grootste (basis-object). Bij
                    // (nagenoeg) gelijke grootte is het onderste object de basis en wordt het
                    // andere object daaraan vastgemaakt.
                    const sizeIsEqual = Math.abs(radiusA - radiusB) < 1e-6;
                    const aIsBase = sizeIsEqual ? meshA.position.y < meshB.position.y : radiusA > radiusB;

                    const attached = aIsBase
                        ? {id: meshesArray[j].id, mesh: meshB, radius: radiusB}
                        : {id: meshesArray[i].id, mesh: meshA, radius: radiusA};
                    const base = aIsBase
                        ? {id: meshesArray[i].id, mesh: meshA, radius: radiusA}
                        : {id: meshesArray[j].id, mesh: meshB, radius: radiusB};

                    const result = computeSphereSphereIntersection(
                        {center: attached.mesh.position.clone(), radius: attached.radius},
                        {center: base.mesh.position.clone(), radius: base.radius}
                    );

                    if (result.intersects) {
                        // Gerelateerd aan de basis-vorm (niet de vastgemaakte vorm): in de assembly
                        // willen we de rijen van de basis noemen waar het andere object aan vastzit.
                        const upAxisWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(base.mesh.quaternion).normalize();
                        const centerOffset = result.circleCenter!.clone().sub(base.mesh.position);

                        // Dimensieloze fracties van de radius van de basis-vorm — voorkomt gedoe met
                        // world-unit vs. shape.height-unit conversiefactoren verderop in de
                        // pattern-generatie.
                        const axisOffsetFraction = centerOffset.dot(upAxisWorld) / base.radius; // -1 (onderpool) .. +1 (bovenpool)
                        const axisRadiusFraction = result.circleRadius! / base.radius;

                        intersectionArray.push({
                            shape1: attached.id,
                            shape2: base.id,
                            source: "sphere-analytic",
                            intersectionCircleCenter: {
                                x: result.circleCenter!.x,
                                y: result.circleCenter!.y,
                                z: result.circleCenter!.z,
                            },
                            intersectionCircleRadius: result.circleRadius,
                            intersectionAxis: {x: result.axis!.x, y: result.axis!.y, z: result.axis!.z},
                            axisOffsetFraction,
                            axisRadiusFraction,
                        });
                    }
                } else {
                    try {
                        const csgA = CSG.fromMesh(createCsgProxyMesh(meshA));
                        const csgB = CSG.fromMesh(createCsgProxyMesh(meshB));
                        const intersectionCSG = csgA.intersect(csgB);
                        const intersectionMesh = CSG.toMesh(intersectionCSG, meshA.matrix);

                        const geometry = intersectionMesh.geometry;
                        const positionAttribute = geometry.attributes.position;
                        if (positionAttribute && positionAttribute.count > 0) {
                            const uniqueVertices = new Set<string>();
                            const intersectionPoints: { x: number; y: number; z: number }[] = [];

                            let leftmostPoint: { x: number; y: number; z: number } | null = null;
                            let rightmostPoint: { x: number; y: number; z: number } | null = null;
                            let highestPoint: { x: number, y: number, z: number } | null = null;
                            let lowestPoint: { x: number, y: number, z: number } | null = null;

                            // De CSG-geometrie ligt in de lokale ruimte van meshA (zie three-csg-ts'
                            // CSG.toGeometry, die de inverse van meshA.matrix toepast) — meshA.matrix
                            // terug toepassen geeft de echte wereld-coördinaten.
                            const worldVertex = new THREE.Vector3();
                            for (let k = 0; k < positionAttribute.count; k++) {
                                worldVertex.set(
                                    positionAttribute.getX(k),
                                    positionAttribute.getY(k),
                                    positionAttribute.getZ(k)
                                ).applyMatrix4(meshA.matrix);
                                const x = worldVertex.x;
                                const y = worldVertex.y;
                                const z = worldVertex.z;
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
                                }
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
    }

    setIntersections(intersectionArray.length > 0 ? intersectionArray : []);
    setMeshes(meshesArray.length > 0 ? meshesArray : []);
}