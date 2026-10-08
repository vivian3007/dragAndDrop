import * as THREE from 'three';
import { ARM_TOTAL_LOCAL_LENGTH } from './geometry/armGeometry';
import { computePatternBox } from './geometry/patternBox';
import { WORLD_SCALE_FACTOR } from './geometry/units';

// Maakt een stilstaand plaatje van een ontwerp, als fallback voor kaarten zonder foto.
// Bewust geen <Canvas> per kaart: browsers staan maar ~16 WebGL-contexten tegelijk toe,
// en een overzicht heeft er al snel meer. Eén gedeelde renderer tekent de ontwerpen dus
// één voor één en levert een data-URL op. Dit bestand wordt dynamisch geïmporteerd
// (zie DesignSnapshot.tsx). Let op: three.js zit nu toch al in de hoofdbundel, omdat
// Pattern.tsx (met PatternPreview3D) niet lazy geladen wordt — dat apart trekken is
// nodig voordat dit echt bundelgrootte scheelt.

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
    texturePromise ??= new THREE.TextureLoader().loadAsync('/textures/stitch-texture.jpg');
    return texturePromise;
}

// Zelfde opbouw als Sphere.tsx/Arm.tsx: een object op (x,y,z) met de rotatie in graden en
// de schaal uit width/height/length × zoom × WORLD_SCALE_FACTOR.
function buildShape(shape: Shape, texture: THREE.Texture): THREE.Object3D {
    const zoom = shape.zoom ?? 1;
    const material = new THREE.MeshBasicMaterial({ map: texture, color: shape.color ?? 'white', side: THREE.DoubleSide });
    const object = new THREE.Group();

    if (shape.type === 'Arm') {
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1, true), material);
        cylinder.position.y = 0.5;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), material);
        cap.position.y = 1;
        object.add(cylinder, cap);
        object.scale.set(
            (shape.width ?? 50) * zoom * WORLD_SCALE_FACTOR,
            ((shape.height ?? 50) * zoom / ARM_TOTAL_LOCAL_LENGTH) * WORLD_SCALE_FACTOR,
            (shape.length ?? 50) * zoom * WORLD_SCALE_FACTOR,
        );
    } else {
        object.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material));
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
            (object.material as THREE.Material).dispose();
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
