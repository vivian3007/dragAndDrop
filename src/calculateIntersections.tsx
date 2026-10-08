import * as THREE from "three";
import {CSG} from "three-csg-ts";
import type { ShapeMesh } from "./editor/types";
import { isSolidShapeType } from "./geometry/solidGeometry";
import {computeSphereSphereIntersection} from "./geometry/sphereIntersection";
import {ARM_TOTAL_LOCAL_LENGTH} from "./geometry/armGeometry";

// CSG boolean intersecties zijn duur en schalen met het aantal driehoeken van
// de operanden. De zichtbare vormen (Sphere/Arm) zijn vrij hoog-poly voor een
// mooie ronding, maar voor de overlap-berekening is die precisie niet nodig —
// hier bouwen we een laag-poly variant van dezelfde geometrie (zelfde radius/
// hoogte/etc., minder segmenten) zodat de CSG-operatie een stuk sneller gaat
// zonder dat de gerenderde vorm zelf minder gedetailleerd wordt.
const MAX_CSG_SEGMENTS = 12;

function getCsgProxyGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // SphereGeometry en CylinderGeometry hebben een `parameters`-object; BufferGeometry als
    // basistype kent dat niet.
    const params = (geometry as THREE.BufferGeometry & { parameters?: Record<string, number | boolean | undefined> }).parameters as
        | (Record<string, number | undefined> & { openEnded?: boolean })
        | undefined;
    if (!params || geometry.userData.skipCsgProxy) {
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

function createCsgProxyMesh(mesh: THREE.Mesh, worldBounds: THREE.Box3): THREE.Mesh {
    // Een react-three-fiber <mesh> zonder eigen <xxxGeometry>-kind krijgt van THREE.Mesh's
    // constructor standaard een lege (maar wél truthy) BufferGeometry — "attributes.position
    // ontbreekt" is dus de betrouwbare check, niet "!mesh.geometry" (dat is altijd truthy).
    if (!mesh.geometry.attributes.position) {
        // Samengestelde vorm zonder eigen geometry (bv. Arm: cilinder-lichaam + bolvormig
        // kapje als losse kind-meshes) — gebruik de al-berekende wereld-bounding-box als
        // eenvoudige doosvormige CSG-proxy i.p.v. de exacte samengestelde vorm te
        // reconstrueren (dat zou lokale-vs-wereld matrix-gedoe van geneste kind-meshes
        // vereisen). CSG.fromMesh bakt vertices met déze proxy z'n eigen matrix naar
        // wereldruimte, dus een pure translatie naar het midden van de (as-uitgelijnde)
        // wereld-bounding-box volstaat.
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        worldBounds.getSize(size);
        worldBounds.getCenter(center);
        const proxyMesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z));
        proxyMesh.matrix.identity().setPosition(center);
        return proxyMesh;
    }

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

// Generieke grootte-maat voor niet-Sphere-paren (CSG-branch): wereld-AABB-volume.
// Voor Sphere-Sphere gebruiken we getSphereWorldRadius (preciezer); voor Arm-Sphere/
// Arm-Arm hebben we geen radius-begrip, dus een bounding-box-volume-proxy volstaat om
// consistent te bepalen welke vorm de kleinere/"self" vorm is.
function getBoxVolume(box: THREE.Box3): number {
    const size = new THREE.Vector3();
    box.getSize(size);
    return size.x * size.y * size.z;
}

export default function calculateIntersections(
    droppedShapes: Shape[],
    scene: THREE.Scene,
    setIntersections: (intersections: Intersection[]) => void,
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


    const meshesArray: ShapeMesh[] = [];

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

    const intersectionArray: Intersection[] = [];

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
                    // Order-onafhankelijke shape1/self-toewijzing, zelfde conventie als de
                    // sphere-analytic tak hierboven (aIsBase) maar gegeneraliseerd via
                    // bounding-box-volume: de kleinste vorm wordt altijd "self" (shape1),
                    // ongeacht de volgorde waarin de vormen op canvas zijn gesleept.
                    const volumeA = getBoxVolume(boxA);
                    const volumeB = getBoxVolume(boxB);
                    const volumeIsEqual = Math.abs(volumeA - volumeB) < 1e-6 * Math.max(volumeA, volumeB, 1);
                    // Tie-break spiegelt sphere-analytic: bij gelijke grootte is de laagste
                    // vorm "base/other", de hoogste vorm "self/attached".
                    const aIsSelf = volumeIsEqual ? meshA.position.y > meshB.position.y : volumeA < volumeB;

                    const self = aIsSelf
                        ? {id: meshesArray[i].id, mesh: meshA, shape: shapeA, box: boxA}
                        : {id: meshesArray[j].id, mesh: meshB, shape: shapeB, box: boxB};
                    const other = aIsSelf
                        ? {id: meshesArray[j].id, mesh: meshB, shape: shapeB, box: boxB}
                        : {id: meshesArray[i].id, mesh: meshA, shape: shapeA, box: boxA};

                    try {
                        const csgSelf = CSG.fromMesh(createCsgProxyMesh(self.mesh, self.box));
                        const csgOther = CSG.fromMesh(createCsgProxyMesh(other.mesh, other.box));
                        const intersectionCSG = csgSelf.intersect(csgOther);
                        // three-csg-ts bakt de output-vertices relatief aan de matrix die hier wordt
                        // meegegeven — dit MOET self.mesh.matrix zijn, en elke plek verderop die
                        // wereldcoördinaten reconstrueert moet exact dezelfde matrix gebruiken (zie
                        // de vertex-loop hieronder). De intersectie zelf is symmetrisch (intersect(A,B)
                        // == intersect(B,A) als volume), dus de operand-volgorde omdraaien is veilig —
                        // de enige eis is dat "self" hierna consistent blijft.
                        const intersectionMesh = CSG.toMesh(intersectionCSG, self.mesh.matrix);

                        const geometry = intersectionMesh.geometry;
                        const positionAttribute = geometry.attributes.position;
                        if (positionAttribute && positionAttribute.count > 0) {
                            const uniqueVertices = new Set<string>();
                            const intersectionPoints: { x: number; y: number; z: number }[] = [];

                            let leftmostPoint: { x: number; y: number; z: number } | null = null;
                            let rightmostPoint: { x: number; y: number; z: number } | null = null;
                            let highestPoint: { x: number, y: number, z: number } | null = null;
                            let lowestPoint: { x: number, y: number, z: number } | null = null;

                            // De CSG-geometrie ligt in de lokale ruimte van self.mesh (zie three-csg-ts'
                            // CSG.toGeometry, die de inverse van self.mesh.matrix toepast) — self.mesh.matrix
                            // terug toepassen geeft de echte wereld-coördinaten.
                            const worldVertex = new THREE.Vector3();
                            for (let k = 0; k < positionAttribute.count; k++) {
                                worldVertex.set(
                                    positionAttribute.getX(k),
                                    positionAttribute.getY(k),
                                    positionAttribute.getZ(k)
                                ).applyMatrix4(self.mesh.matrix);
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

                                // Camera-onafhankelijk: projecteer highestPoint/lowestPoint op shape1
                                // (self.mesh) z'n eigen wereld-omhoog-as, als fractie van shape1 z'n eigen
                                // referentiegrootte — dezelfde aanpak als bij de analytische
                                // Sphere-Sphere berekening hierboven, nu toegepast op de al berekende
                                // CSG-overlappunten i.p.v. een analytische cirkel.
                                const upAxisWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(self.mesh.quaternion).normalize();

                                // Sphere: mesh.position is het middelpunt, radius als referentie
                                // (fractie -1..+1). Arm: mesh.position is de open onderkant, de totale
                                // lengte incl. bolvormig kapje (scale.y * ARM_TOTAL_LOCAL_LENGTH) als
                                // referentie (fractie 0..1, basis naar kapje) — zie Arm.tsx voor de
                                // T·R·S-opbouw en geometry/armGeometry.ts voor de kapje-afleiding.
                                // Cilinder en kegel: zelfde opbouw als de Arm, maar lokale hoogte 1
                                // (zie geometry/solidGeometry.ts).
                                const referenceSize = self.shape?.type === "Arm"
                                    ? self.mesh.scale.y * ARM_TOTAL_LOCAL_LENGTH
                                    : isSolidShapeType(self.shape?.type)
                                        ? self.mesh.scale.y
                                        : getSphereWorldRadius(self.mesh);

                                const axisHighFraction = new THREE.Vector3(highestPoint.x, highestPoint.y, highestPoint.z)
                                    .sub(self.mesh.position).dot(upAxisWorld) / referenceSize;
                                const axisLowFraction = new THREE.Vector3(lowestPoint.x, lowestPoint.y, lowestPoint.z)
                                    .sub(self.mesh.position).dot(upAxisWorld) / referenceSize;

                                intersectionArray.push({
                                    shape1: self.id,
                                    shape2: other.id,
                                    source: "csg-world-axis",
                                    leftmostPoint,
                                    rightmostPoint,
                                    highestPoint,
                                    lowestPoint,
                                    distanceWidth,
                                    distanceHeight,
                                    axisHighFraction,
                                    axisLowFraction,
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

    setIntersections(intersectionArray);
}