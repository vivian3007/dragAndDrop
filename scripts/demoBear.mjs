// De Demobeer: een complete beer met alle vormtypen, om de editor en de patroonpagina te
// laten zien. Gedeeld door scripts/emulator-seed.mjs (emulator) en scripts/add-demo-bear.mjs
// (echte database). Draait via tsx, want het gebruikt de TypeScript-code van de editor.
import { attachToNearest } from '../src/geometry/attach.ts';
import { localToWorld } from '../src/geometry/shapeSpace.ts';
import { embroideryDefaults } from '../src/patterns/embroidery.ts';

export const demoBear = { name: 'Demobeer', tags: ['Dier', 'Beer', 'Demo'] };

// Posities en maten in wereld-eenheden / opslag-eenheden, zoals de editor ze bewaart.
const brown = '#b07a4f';
// Volledige vorm met de standaardwaarden die de editor ook gebruikt.
const full = (shape) => ({ zoom: 1, rotation_x: 0, rotation_y: 0, rotation_z: 0, z: 0, ...shape });

// Alle onderdelen worden met de echte aansluit-functie van de editor geplaatst
// (src/geometry/attach.ts, zelfde als de knop Aansluiten), zodat ze precies op elkaar
// aansluiten — daarom draait dit script via tsx. De x/y/z hieronder is alleen de richting
// van waaruit het onderdeel tegen z'n doel geschoven wordt.
// Lijf: bovenaan open voor het hoofd (omgedraaid, dus van onder naar boven gehaakt).
const body = full({ id: 'lijf', type: 'OpenSphere', name: 'Lijf', x: 0, y: 0, width: 150, height: 170, length: 140, color: brown,
    rotation_x: 180, opening: 0.45 });
const attached = (shape, targets) => attachToNearest(full(shape), targets).shape;
const head = attached({ id: 'hoofd', type: 'Sphere', name: 'Hoofd', x: 0, y: 2.6, width: 130, height: 120, length: 125, color: brown }, [body]);
// Snuit: een bolletje dat aan de achterkant open is; de opening gaat tegen het hoofd.
const snout = attached({ id: 'snuit', type: 'OpenSphere', name: 'Snuit', x: 0, y: 2.3, z: 1.05, width: 60, height: 32, length: 48, opening: 0.75, color: '#e8cfa9' }, [head]);
const snoutTip = localToWorld(snout, { x: 0, y: 1, z: 0 });
const legL = attached({ id: 'pootL', type: 'Cylinder', name: 'Linkerpoot', x: -0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' }, [body]);
const legR = attached({ id: 'pootR', type: 'Cylinder', name: 'Rechterpoot', x: 0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' }, [body]);
// Voetzool (plat ovaal) onder een poot: tegen het uiteinde van de poot geschoven.
const sole = (id, name, leg) => {
    const tip = localToWorld(leg, { x: 0, y: 1.3, z: 0.1 });
    return attached({ id, type: 'Oval', name, ...tip, width: 70, height: 11, length: 95, color: '#e8cfa9' }, [leg]);
};
// Borduursel van de opgegeven soort, vanaf `from` tegen `target` geschoven.
const embroidery = (id, name, detail, from, target) => attached({ id, type: 'Embroidery', name, ...from, ...embroideryDefaults(detail) }, [target]);
// Elke vorm heeft een korte `id` (bv. 'hoofd'); die hoort niet in het shape-document zelf.
export const demoShapes = [
    body,
    head,
    snout,
    // Neusje en mondje op de snuit, wangetjes op het hoofd.
    embroidery('neus', 'Neusje', 'nose', { x: snoutTip.x, y: snoutTip.y + 0.12, z: snoutTip.z + 0.3 }, snout),
    embroidery('mond', 'Mondje', 'mouth', { x: snoutTip.x, y: snoutTip.y - 0.24, z: snoutTip.z + 0.3 }, snout),
    embroidery('wangL', 'Linkerwang', 'cheek', { x: -0.85, y: 2.2, z: 1.1 }, head),
    embroidery('wangR', 'Rechterwang', 'cheek', { x: 0.85, y: 2.2, z: 1.1 }, head),
    // Sjaal (open buis) om de hals, waar hoofd en lijf in elkaar overgaan: net wijd genoeg om
    // over de bovenkant van het lijf en de onderkant van het hoofd te passen.
    full({ id: 'sjaal', type: 'Tube', name: 'Sjaal', x: 0, y: 1.36, width: 176, height: 30, length: 168, color: '#c0392b' }),
    attached({ id: 'oorL', type: 'Cone', name: 'Linkeroor', x: -0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: 25, color: brown }, [head]),
    attached({ id: 'oorR', type: 'Cone', name: 'Rechteroor', x: 0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: -25, color: brown }, [head]),
    // Lichte pootjes: het kapje van de arm in een andere kleur.
    attached({ id: 'armL', type: 'Dome', name: 'Linkerarm', x: -1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: 60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] }, [body]),
    attached({ id: 'armR', type: 'Dome', name: 'Rechterarm', x: 1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: -60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] }, [body]),
    legL,
    legR,
    sole('zoolL', 'Linkervoetzool', legL),
    sole('zoolR', 'Rechtervoetzool', legR),
    // Veiligheidsoogjes van 10 mm, boven de snuit.
    attached({ id: 'oogL', type: 'Eye', name: 'Linkeroog', x: -0.28, y: 2.85, z: 1.2, width: 18.9, height: 18.9, length: 18.9, color: '#111111' }, [head]),
    attached({ id: 'oogR', type: 'Eye', name: 'Rechteroog', x: 0.28, y: 2.85, z: 1.2, width: 18.9, height: 18.9, length: 18.9, color: '#111111' }, [head]),
    // Buiklapje (plat rondje) en een mutsje (halve bol) met een gekleurde rand.
    attached({ id: 'buik', type: 'Disc', name: 'Buiklapje', x: 0, y: -0.2, z: 1.8, width: 90, height: 11, length: 90, color: '#e8cfa9' }, [body]),
    attached({ id: 'muts', type: 'Dome', name: 'Mutsje', x: 0, y: 4, width: 95, height: 50, length: 95, color: '#2e86c1', stripes: [{ from: 0.75, to: 1, color: '#ffffff' }] }, [head]),
];
