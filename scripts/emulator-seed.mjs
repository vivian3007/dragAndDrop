// Zet testdata in de lokale Firebase-emulator, om de app met `npm run dev:emulators` uit te
// proberen zonder de echte database aan te raken. Maakt de emulator eerst leeg.
//   npm run emulators                      (in een ander venster)
//   node scripts/emulator-seed.mjs
//   npm run dev:emulators                  -> http://localhost:5174
//
// Testaccounts (alleen in de emulator, project "demo-stitchify"):
//   tester@test.nl / testwachtwoord123   (@tester, met het ontwerp "Testbeer")
//   maker@test.nl  / testwachtwoord123   (@maker, met het ontwerp "Testkonijn")
import { admin, resetEmulator } from './emulator-tests/helpers.mjs';
import { searchFields } from '../src/searchTerms.js';

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
await design('demobeer', 'tester', 'Demobeer', ['Dier', 'Beer', 'Demo'], [
    // Rode sjaal om de hals (kleurwissel bovenaan het lijf).
    { type: 'Sphere', name: 'Lijf', x: 0, y: 0, width: 150, height: 170, length: 140, color: brown, stripes: [{ from: 0.1, to: 0.2, color: '#c0392b' }] },
    { type: 'Sphere', name: 'Hoofd', x: 0, y: 2.6, width: 130, height: 120, length: 125, color: brown },
    { type: 'Sphere', name: 'Snuit', x: 0, y: 2.3, z: 1.05, width: 55, height: 45, length: 45, color: '#e8cfa9' },
    { type: 'Cone', name: 'Linkeroor', x: -0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: 25, color: brown },
    { type: 'Cone', name: 'Rechteroor', x: 0.85, y: 3.35, width: 90, height: 70, length: 60, rotation_z: -25, color: brown },
    // Lichte pootjes: het kapje van de arm in een andere kleur.
    { type: 'Arm', name: 'Linkerarm', x: -1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: 60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] },
    { type: 'Arm', name: 'Rechterarm', x: 1.1, y: 0.4, width: 55, height: 120, length: 55, rotation_z: -60, color: brown, stripes: [{ from: 0, to: 0.25, color: '#e8cfa9' }] },
    { type: 'Cylinder', name: 'Linkerpoot', x: -0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' },
    { type: 'Cylinder', name: 'Rechterpoot', x: 0.7, y: -2.1, width: 75, height: 70, length: 75, color: '#8a5a3a' },
]);

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
