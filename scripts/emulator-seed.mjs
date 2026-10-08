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
        name, tags, height: 12, yarn_id: yarnId, user_id: ownerUid, notes: null, imageUrl: null, createdAt: new Date(),
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

console.log('Emulator gevuld: @tester (Testbeer) en @maker (Testkonijn).');
process.exit();
