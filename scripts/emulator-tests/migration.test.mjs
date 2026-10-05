// Test van scripts/migrate-user-ids.mjs tegen de emulator: zet data in de oude vorm (e-mail
// als eigenaar) klaar, draait de migratie en controleert het resultaat.
//   npm run emulators          (in een ander venster)
//   node scripts/emulator-tests/migration.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { admin, check, resetEmulator, summary } from './helpers.mjs';

const MIGRATION = fileURLToPath(new URL('../migrate-user-ids.mjs', import.meta.url));
const runMigration = (...args) => execFileSync(process.execPath, [MIGRATION, ...args], { env: process.env, encoding: 'utf8' });

const { auth, db } = admin();

await resetEmulator();
await auth.createUser({ uid: 'uid-alice', email: 'alice@test.nl' });
await auth.createUser({ uid: 'uid-bob', email: 'Bob@Test.nl' }); // hoofdletters: moet hoofdletterongevoelig matchen

const seed = {
    'amigurumi/a1': { name: 'Beer', user_id: 'alice@test.nl', favorite: false },
    'amigurumi/a2': {
        name: 'Kopie van Beer',
        user_id: 'bob@test.nl',
        copiedFromId: 'a1',
        copiedFrom: [
            { id: 'a1', name: 'Beer', user_id: 'alice@test.nl' },
            { id: 'a0', name: 'Oerbeer', user_id: 'weg@test.nl' },
        ],
    },
    'amigurumi/a3': { name: 'Wees', user_id: 'weg@test.nl' },
    'amigurumi/a4': { name: 'Al gemigreerd', user_id: 'uid-alice' },
    'amigurumi/a5': { name: 'Zonder eigenaar' },
    'makes/m1': { amigurumi_id: 'a1', amigurumi_name: 'Beer', user_id: 'bob@test.nl', imageUrl: 'x' },
    'yarn/y1': { name: 'Katoen', user_id: 'alice@test.nl' },
    'yarn/y2': { name: 'Oud garen' },
    'users/uid-alice': { email: 'alice@test.nl', username: 'alice' },
    'users/uid-bob': { email: 'bob@test.nl' },
};
for (const [path, data] of Object.entries(seed)) await db.doc(path).set(data);

const get = async (path) => (await db.doc(path).get()).data();

console.log('Migratie — droge run');
const dryOutput = runMigration();
await check('droge run meldt wat er zou veranderen', () => assert.match(dryOutput, /documenten om bij te werken:\s+7/));
await check('droge run schrijft niets', async () => assert.equal((await get('amigurumi/a1')).user_id, 'alice@test.nl'));
await check('droge run noemt het onbekende e-mailadres', () => assert.match(dryOutput, /weg@test\.nl/));

console.log('\nMigratie — uitvoeren');
runMigration('--apply');
await check('eigenaar ontwerp → uid', async () => assert.equal((await get('amigurumi/a1')).user_id, 'uid-alice'));
await check('e-mail met andere hoofdletters → uid', async () => assert.equal((await get('amigurumi/a2')).user_id, 'uid-bob'));
await check('herkomstketen → uid, onbekend → null, rest ongemoeid', async () => {
    const { copiedFrom } = await get('amigurumi/a2');
    assert.deepEqual(copiedFrom, [
        { id: 'a1', name: 'Beer', user_id: 'uid-alice' },
        { id: 'a0', name: 'Oerbeer', user_id: null },
    ]);
});
await check('ontwerp van verwijderd account → null', async () => assert.equal((await get('amigurumi/a3')).user_id, null));
await check('al gemigreerd blijft gelijk', async () => assert.equal((await get('amigurumi/a4')).user_id, 'uid-alice'));
await check('ontwerp zonder eigenaar blijft zonder', async () => assert.equal((await get('amigurumi/a5')).user_id, undefined));
await check('foto → uid', async () => assert.equal((await get('makes/m1')).user_id, 'uid-bob'));
await check('garen → uid, garen zonder eigenaar ongemoeid', async () => {
    assert.equal((await get('yarn/y1')).user_id, 'uid-alice');
    assert.equal((await get('yarn/y2')).user_id, undefined);
});
await check('e-mail uit gebruikersdocumenten, rest blijft', async () => {
    assert.deepEqual(await get('users/uid-alice'), { username: 'alice' });
    assert.deepEqual(await get('users/uid-bob'), {});
});
await check('nergens meer een e-mailadres in de database', async () => {
    for (const name of ['amigurumi', 'makes', 'yarn', 'users']) {
        const snap = await db.collection(name).get();
        snap.docs.forEach((d) => assert.ok(!JSON.stringify(d.data()).includes('@'), `${name}/${d.id} bevat nog een @`));
    }
});

console.log('\nMigratie — nogmaals draaien');
const secondRun = runMigration('--apply');
await check('tweede keer: niets meer te doen', () => assert.match(secondRun, /documenten om bij te werken:\s+0/));

summary();
