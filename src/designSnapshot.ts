import * as THREE from 'three';
import { ARM_TOTAL_LOCAL_LENGTH } from './geometry/armGeometry';
import { computePatternBox } from './geometry/patternBox';
import { createSolidGeometry, isSolidShapeType } from './geometry/solidGeometry';
import { WORLD_SCALE_FACTOR } from './geometry/units';
import { addYarnLights, STITCH_TEXTURE_URL, stitchTextureFor, YARN_MATERIAL, YARN_TINT } from './geometry/yarnLook';
import { paintStripes } from './geometry/stripes';

// Maakt een stilstaand plaatje van een ontwerp, als fallback voor kaarten zonder foto.
// Bewust geen <Canvas> per kaart: browsers staan maar ~16 WebGL-contexten tegelijk toe,
// en een overzicht heeft er al snel meer. Eén gedeelde renderer tekent de ontwerpen dus
// één voor één en levert een data-URL op. Dit bestand wordt dynamisch geïmporteerd
// (zie DesignSnapshot.tsx), zodat three.js pas laadt als er een snapshot nodig is.

const WIDTH = 480;
const HEIGHT = 360; // 4:3, zelfde verhouding als .amigurumi-image
const FOV = 40;

let renderer: THREE.WebGLRenderer | null = null;
let texturePromise: Promise<THREE.Texture> | null = null;
// Renders na elkaar: ze delen één renderer en één canvas.
let queue: Promise<unknown> = Promise.resolve();

function getRenderer() {
    if (!renderer) {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1);
        renderer.setSize(WIDTH, HEIGHT, false);
        renderer.setClearColor(0x000000, 0);
        // Zelfde als de standaard van react-three-fiber in de editor, anders kloppen de kleuren niet.
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }
    return renderer;
}

function getTexture() {
    texturePromise ??= new THREE.TextureLoader().loadAsync(STITCH_TEXTURE_URL);
    return texturePromise;
}

// Zelfde opbouw als Sphere.tsx/Arm.tsx/SolidShape.tsx: een object op (x,y,z) met de rotatie in
// graden en de schaal uit width/height/length × zoom × WORLD_SCALE_FACTOR, in hetzelfde
// garenmateriaal (zie geometry/yarnLook.ts).
function buildShape(shape: Shape, baseTexture: THREE.Texture): THREE.Object3D {
    const zoom = shape.zoom ?? 1;
    const texture = stitchTextureFor(baseTexture, shape);
    const material = new THREE.MeshStandardMaterial({
        map: texture, bumpMap: texture, ...YARN_MATERIAL, vertexColors: true, color: YARN_TINT, side: THREE.DoubleSide,
    });
    const object = new THREE.Group();

    if (shape.type === 'Arm') {
        const cylinder = new THREE.Mesh(paintStripes(new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1, true), shape, 0.5), material);
        cylinder.position.y = 0.5;
        const cap = new THREE.Mesh(paintStripes(new THREE.SphereGeometry(0.5, 48, 24), shape, 1), material);
        cap.position.y = 1;
        object.add(cylinder, cap);
        object.scale.set(
            (shape.width ?? 50) * zoom * WORLD_SCALE_FACTOR,
            ((shape.height ?? 50) * zoom / ARM_TOTAL_LOCAL_LENGTH) * WORLD_SCALE_FACTOR,
            (shape.length ?? 50) * zoom * WORLD_SCALE_FACTOR,
        );
    } else {
        // Bol: eenheidsbol; cilinder en kegel: zie geometry/solidGeometry.ts. Alle drie met
        // dezelfde schaal (width/height/length × zoom).
        const geometry = isSolidShapeType(shape.type) ? createSolidGeometry(shape.type) : new THREE.SphereGeometry(1, 64, 48);
        const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: shape.color ?? '#111111', roughness: 0.15, clearcoat: 1 });
        object.add(new THREE.Mesh(paintStripes(geometry, shape), shape.type === 'Eye' ? eyeMaterial : material));
        object.scale.set(
            (shape.width ?? 50) * zoom * WORLD_SCALE_FACTOR,
            (shape.height ?? 50) * zoom * WORLD_SCALE_FACTOR,
            (shape.length ?? 50) * zoom * WORLD_SCALE_FACTOR,
        );
    }

    object.position.set(shape.x ?? 0, shape.y ?? 0, shape.z ?? 0);
    object.rotation.set(
        (shape.rotation_x ?? 0) * (Math.PI / 180),
        (shape.rotation_y ?? 0) * (Math.PI / 180),
        (shape.rotation_z ?? 0) * (Math.PI / 180),
    );
    return object;
}

async function render(shapes: Shape[]): Promise<string | null> {
    const box = computePatternBox(shapes);
    if (!box) return null;

    const texture = await getTexture();
    const scene = new THREE.Scene();
    addYarnLights(scene);
    shapes.forEach((shape) => scene.add(buildShape(shape, texture)));

    // Licht schuin van voren (zoals het vooraanzicht in de editor, met wat diepte), op
    // een afstand waarop de omhullende bol van het ontwerp precies in beeld past.
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.5);
    const verticalHalfFov = THREE.MathUtils.degToRad(FOV / 2);
    const distance = (radius / Math.sin(verticalHalfFov)) * 1.05;
    const camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, 0.1, distance * 4);
    camera.position.copy(center).add(new THREE.Vector3(0.35, 0.2, 1).normalize().multiplyScalar(distance));
    camera.lookAt(center);

    const gl = getRenderer();
    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/webp', 0.85);

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const material = object.material as THREE.MeshStandardMaterial;
            // De textuurkopie per vorm (stitchTextureFor); de gedeelde foto blijft.
            material.map?.dispose();
            material.dispose();
        }
    });
    return dataUrl;
}

// Cache per ontwerp, met een handtekening van de vormen erbij: komt iemand terug uit de
// editor met gewijzigde vormen, dan wordt er gewoon opnieuw getekend.
const cache = new Map<string, { signature: string; image: Promise<string | null> }>();

export function renderDesignSnapshot(amigurumiId: string, shapes: Shape[]): Promise<string | null> {
    // Zonder `mesh`: dat is een three.js-object, geen ontwerpgegeven.
    const signature = JSON.stringify(shapes, (key, value) => (key === 'mesh' ? undefined : value));
    const cached = cache.get(amigurumiId);
    if (cached?.signature === signature) {
        return cached.image;
    }
    const image = queue.then(() => render(shapes)).catch((error) => {
        console.error('Kon geen snapshot van het ontwerp maken:', error);
        return null;
    });
    queue = image;
    cache.set(amigurumiId, { signature, image });
    return image;
}
