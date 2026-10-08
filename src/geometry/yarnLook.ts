import * as THREE from "three";
import { ARM_TOTAL_LOCAL_LENGTH } from "./armGeometry";
import { halfEllipsePerimeter } from "../patterns/stitchGeometry";
import { shapeDimensionCm } from "./units";
import { domeCapFraction, domeLengths } from "./domeShape";

// Hoe een vorm er in 3D uitziet: als gehaakt garen. Gedeeld door de editor, de
// patroonpreview (via useStitchTexture/YarnLights) en de ontwerp-snapshots.

export const STITCH_TEXTURE_URL = "/textures/stitch-texture.jpg";

// De steekfoto is ±32 vasten breed en ±22 rondes hoog. Bij medium garen is een vaste
// ±0,5 cm breed en een ronde ±0,45 cm hoog (zie stitchGeometry.ts / estimateYarn.ts), dus één
// keer de foto beslaat zoveel echte centimeters.
const TILE_WIDTH_CM = 32 * 0.495;
const TILE_HEIGHT_CM = 22 * 0.45;

// Hoe vaak de foto rond (u) en over de lengte (v) van een vorm herhaald moet worden, zodat de
// steken op elke vorm even groot zijn — i.p.v. één foto die over een groot lijf tot
// reuzensteken wordt uitgerekt en op een oortje piepklein wordt.
export function stitchRepeat(shape: Shape): [number, number] {
    const width = shapeDimensionCm(shape, "width");
    const height = shapeDimensionCm(shape, "height");
    const length = shapeDimensionCm(shape, "length");
    const diameter = (width + length) / 2;
    const around = Math.PI * diameter;

    let along: number;
    switch (shape.type) {
        case "Arm":
            // De textuur ligt over het cilinderdeel; het kapje is de rest van de lengte.
            along = height / ARM_TOTAL_LOCAL_LENGTH;
            break;
        case "Cylinder":
            along = height;
            break;
        case "Cone":
            along = Math.hypot(height, diameter / 2);
            break;
        case "Disc":
            // Vanuit het midden naar de rand.
            along = diameter / 2;
            break;
        case "Dome":
            // Over het kapje en (als die er is) de buis.
            along = domeLengths(diameter, height, domeCapFraction(shape)).total;
            break;
        default:
            // Bol: van pool tot pool.
            along = halfEllipsePerimeter(diameter / 2, height / 2);
    }
    return [Math.max(around / TILE_WIDTH_CM, 0.05), Math.max(along / TILE_HEIGHT_CM, 0.05)];
}

// Eigen kopie van de steekfoto voor één vorm (de afbeelding zelf wordt gedeeld), herhaald
// op de juiste steekmaat.
export function stitchTextureFor(base: THREE.Texture, shape: Shape): THREE.Texture {
    const texture = base.clone();
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...stitchRepeat(shape));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
}

// Mat, zonder glans, met reliëf uit dezelfde steekfoto (lichte plekken steken uit).
export const YARN_MATERIAL = {
    roughness: 1,
    metalness: 0,
    bumpScale: 2.5,
} as const;

// De steekfoto is beige; zonder correctie zou elke kleur er grauw door worden. Iets lichter
// maken compenseert dat, zodat de gekozen kleur herkenbaar blijft.
const COLOR_BOOST = 1.35;

// De echte kleuren zitten per hoekpunt (vertex colors, zie geometry/stripes.ts); de
// materiaalkleur doet alleen die ophelping.
export const YARN_TINT = new THREE.Color(1, 1, 1).multiplyScalar(COLOR_BOOST);

// Zacht, warm licht: een hemellicht (licht van boven, warme weerkaatsing van onder), een
// hoofdlicht schuin van voren-boven en een zwak invullicht van achteren.
export const LIGHTS = {
    hemisphere: { sky: "#fff4e8", ground: "#9c7b6a", intensity: 1.6 },
    key: { position: [4, 8, 6] as [number, number, number], intensity: 2.2 },
    fill: { position: [-6, 2, -5] as [number, number, number], intensity: 0.6 },
};

// Dezelfde lichten als losse three.js-objecten (voor de snapshots, zonder React).
export function addYarnLights(scene: THREE.Scene) {
    scene.add(new THREE.HemisphereLight(LIGHTS.hemisphere.sky, LIGHTS.hemisphere.ground, LIGHTS.hemisphere.intensity));
    const key = new THREE.DirectionalLight("#ffffff", LIGHTS.key.intensity);
    key.position.set(...LIGHTS.key.position);
    const fill = new THREE.DirectionalLight("#ffffff", LIGHTS.fill.intensity);
    fill.position.set(...LIGHTS.fill.position);
    scene.add(key, fill);
}
