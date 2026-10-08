// Zet testdata in de lokale Firebase-emulator, om de app met `npm run dev:emulators` uit te
// proberen zonder de echte database aan te raken. Maakt de emulator eerst leeg.
//   npm run emulators                      (in een ander venster)
//   npx tsx scripts/emulator-seed.mjs     (tsx: gebruikt de TypeScript-code van de editor)
//   npm run dev:emulators                  -> http://localhost:5174
//
// Testaccounts (alleen in de emulator, project "demo-stitchify"):
//   tester@test.nl / testwachtwoord123   (@tester, met het ontwerp "Testbeer")
//   maker@test.nl  / testwachtwoord123   (@maker, met het ontwerp "Testkonijn")
import { admin, resetEmulator } from './emulator-tests/helpers.mjs';
import { searchFields } from '../src/searchTerms.js';
import { attachToNearest } from '../src/geometry/attach.ts';

const PASSWORD = 'testwachtwoord123';

const { auth, db } = admin();
await resetEmulator();

async function user(uid, email, username) {
    await auth.createUser({ uid, email, password: PASSWORD, emailVerified: true, displayName: username });
    await db.doc(`users/${uid}`).set({ username, createdAt: new Date() });
    await db.doc(`usernames/${username}`).set({ uid });
}

async function design(id, ownerUid, name, tags, shapes) {
    const yarnId = `${id}-yarn`;
    await db.doc(`yarn/${yarnId}`).set({
        name: 'Katoen', weight: 'Medium', mPerSkein: 100, hooksize: 3.5, material: 'Katoen', color: '#c8a27c', user_id: ownerUid,
    });
    await db.doc(`amigurumi/${id}`).set({
        name, tags, height: 12, yarn_id: yarnId, user_id: ownerUid, notes: null, imageUrl: null,
        createdAt: new Date(), favoriteCount: 0, ...searchFields(name, tags),
    });
    for (const [i, shape] of shapes.entries()) {
        await db.doc(`shapes/${id}-shape-${i}`).set({
            amigurumi_id: id, zoom: 1, rotation_x: 0, rotation_y: 0, rotation_z: 0, z: 0, zIndex: 10, ...shape,
        });
    }
}

await user('tester', 'tester@test.nl', 'tester');
await user('maker', 'maker@test.nl', 'maker');

await design('testbeer', 'tester', 'Testbeer', ['Dier', 'Test'], [
    { type: 'Sphere', name: 'Hoofd', x: 0, y: 2, width: 100, height: 100, length: 100, color: '#c8a27c' },
    { type: 'Arm', name: 'Lijf', x: 0, y: -4, width: 120, height: 160, length: 120, color: '#a0522d' },
]);
await design('testkonijn', 'maker', 'Testkonijn', ['Dier'], [
    { type: 'Sphere', name: 'Hoofd', x: 0, y: 0, width: 90, height: 110, length: 90, color: '#eeeeee' },
]);

// Een complete beer met alle vormtypen, om de editor en de patroonpagina te laten zien.
// Posities en maten in wereld-eenheden / opslag-eenheden, zoals de editor ze bewaart.
const brown = '#b07a4f';
// Volledige vorm met de standaardwaarden die de editor ook gebruikt.
const full = (shape) => ({ zoom: 1, rotation_x: 0, rotation_y: 0, rotation_z: 0, z: 0, ...shape });

// Alle onderdelen worden met de echte aansluit-functie van de editor geplaatst
// (src/geometry/attach.ts, zelfde als de knop Aansluiten), zodat ze precies op elkaar
// aansluiten — daarom draait dit script via tsx. De x/y/z hieronder is alleen de richting
// van waaruit het onderdeel tegen z'n doel geschoven wordt.
const body = full({ id: 'lijf', type: 'Sphere', name: 'Lijf', x: 0, y: 0, width: 150, height: 170, length: 140, color: brown,
    // Rode sjaal om de hals (kleurwissel bovenaan het lijf).
    stripes: [{ from: 0.1, to: 0.2, color: '#c0392b' }] });
const attached = (shape, targets) => attachToNearest(full(shape), targets).shape;
const head = attached({ id: 'hoofd', type: 'Sphere', name: 'Hoofd', x: 0, y: 2.6, width: 130, height: 120, length: 125, color: brown }, [body]);
const demoShapes = [
    body,
    head,
    attached({ id: 'snuit', type: 'Sphere', name: 'Snuit', x: 0, y: 2.3, z: 1.05, width: 55, height: 45, length: 45, color: '#e8cfa9' }, [head]),
    attached({ id: 'oorL', type: 'Cone', name: 'Linkeroor', x: -0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: 25, color: brown }, [head]),
    attached({ id: 'oorR', type: 'Cone', name: 'Rechteroor', x: 0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: -25, color: brown }, [head]),
    // Lichte pootjes: het kapje van de arm in een andere kleur.
    attached({ id: 'armL', type: 'Dome', name: 'Linkerarm', x: -1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: 60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] }, [body]),
    attached({ id: 'armR', type: 'Dome', name: 'Rechterarm', x: 1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: -60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] }, [body]),
    attached({ id: 'pootL', type: 'Cylinder', name: 'Linkerpoot', x: -0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' }, [body]),
    attached({ id: 'pootR', type: 'Cylinder', name: 'Rechterpoot', x: 0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' }, [body]),
    // Veiligheidsoogjes van 10 mm, boven de snuit.
    attached({ id: 'oogL', type: 'Eye', name: 'Linkeroog', x: -0.28, y: 2.85, z: 1.2, width: 18.9, height: 18.9, length: 18.9, color: '#111111' }, [head]),
    attached({ id: 'oogR', type: 'Eye', name: 'Rechteroog', x: 0.28, y: 2.85, z: 1.2, width: 18.9, height: 18.9, length: 18.9, color: '#111111' }, [head]),
    // Buiklapje (plat rondje) en een mutsje (halve bol) met een gekleurde rand.
    attached({ id: 'buik', type: 'Disc', name: 'Buiklapje', x: 0, y: -0.2, z: 1.8, width: 90, height: 11, length: 90, color: '#e8cfa9' }, [body]),
    attached({ id: 'muts', type: 'Dome', name: 'Mutsje', x: 0, y: 4, width: 95, height: 50, length: 95, color: '#2e86c1', stripes: [{ from: 0.75, to: 1, color: '#ffffff' }] }, [head]),
];
await design('demobeer', 'tester', 'Demobeer', ['Dier', 'Beer', 'Demo'], demoShapes.map(({ id, ...shape }) => shape));

// Genoeg extra ontwerpen om "Meer laden" op Home te zien (24 per keer).
const animals = ['Kat', 'Hond', 'Uil', 'Vos', 'Egel', 'Panda', 'Koala', 'Pinguïn', 'Schildpad', 'Walvis'];
for (let i = 0; i < 30; i++) {
    const name = `${animals[i % animals.length]} ${Math.floor(i / animals.length) + 1}`;
    await design(`extra-${i}`, 'maker', name, i % 2 ? ['Dier', 'Klein'] : ['dier'], [
        { type: 'Sphere', name: 'Lijf', x: 0, y: 0, width: 80 + i, height: 80, length: 80, color: '#dddddd' },
    ]);
}

console.log('Emulator gevuld: @tester (Testbeer), @maker (Testkonijn + 30 extra ontwerpen).');
process.exit();
