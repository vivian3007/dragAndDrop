// Test van scripts/migrate-search-fields.mjs en van de zoektermen (src/searchTerms.js) tegen
// de emulator: zet ontwerpen in de oude vorm klaar, draait de migratie en controleert of de
// queries die Home gebruikt (src/useDesignSearch.ts) de juiste ontwerpen vinden.
//   npm run emulators          (in een ander venster)
//   node scripts/emulator-tests/search-fields.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { admin, check, resetEmulator, summary } from './helpers.mjs';
import { buildSearchTerms, matchesSearch, serverSearchTerm } from '../../src/searchTerms.js';

const MIGRATION = fileURLToPath(new URL('../migrate-search-fields.mjs', import.meta.url));
const runMigration = (...args) => execFileSync(process.execPath, [MIGRATION, ...args], { env: process.env, encoding: 'utf8' });

console.log('Zoektermen');
await check('elk begin van elk woord, kleine letters, zonder accenten', () => {
    assert.deepEqual(buildSearchTerms('Café Beer', []), ['c', 'ca', 'caf', 'cafe', 'b', 'be', 'bee', 'beer']);
});
await check('tags tellen mee, "#" en hoofdletters weg', () => {
    assert.ok(buildSearchTerms('Snake', ['#Venomous']).includes('venom'));
});
await check('server zoekt op het langste woord', () => assert.equal(serverSearchTerm('de grote beer'), 'grote'));
await check('alle woorden moeten passen (woordbegin)', () => {
    assert.equal(matchesSearch('Grote bruine beer', [], 'beer bru'), true);
    assert.equal(matchesSearch('Grote bruine beer', [], 'beer wit'), false);
});

const { db } = admin();
await resetEmulator();
const old = (name, tags, extra = {}) => ({ name, tags, user_id: 'u1', ...extra });
await db.doc('amigurumi/beer').set(old('Bruine Beer', ['Animal'], { createdAt: new Date('2024-01-01') }));
await db.doc('amigurumi/slang').set(old('Snake', ['animal', 'Venomous'], { createdAt: new Date('2024-02-01'), favoriteCount: 7 }));
await db.doc('amigurumi/zonder-datum').set(old('Café', ['Food']));
await db.doc('users/u2/favorites/slang').set({ createdAt: new Date() });
await db.doc('users/u3/favorites/slang').set({ createdAt: new Date() });

console.log('\nMigratie');
await check('droge run schrijft niets', async () => {
    const out = runMigration();
    assert.match(out, /3 van 3 ontwerpen bij te werken/);
    assert.equal((await db.doc('amigurumi/beer').get()).data().searchTerms, undefined);
});
await check('met --apply: velden ingevuld', async () => {
    runMigration('--apply');
    const beer = (await db.doc('amigurumi/beer').get()).data();
    assert.ok(beer.searchTerms.includes('brui'));
    assert.equal(beer.nameLower, 'bruine beer');
    assert.deepEqual(beer.tagsLower, ['animal']);
    assert.equal(beer.favoriteCount, 0);
});
await check('favoriteCount nageteld uit de echte favorieten (7 -> 2)', async () => {
    assert.equal((await db.doc('amigurumi/slang').get()).data().favoriteCount, 2);
});
await check('ontbrekende createdAt aangevuld', async () => {
    assert.ok((await db.doc('amigurumi/zonder-datum').get()).data().createdAt);
});
await check('tweede keer: niets meer te doen', () => assert.match(runMigration(), /0 van 3 ontwerpen bij te werken/));

console.log('\nQueries van Home');
const names = (snap) => snap.docs.map((d) => d.data().name);
await check('zoeken op woordbegin ("sna")', async () => {
    assert.deepEqual(names(await db.collection('amigurumi').where('searchTerms', 'array-contains', 'sna').get()), ['Snake']);
});
await check('zoeken zonder accent vindt "Café"', async () => {
    assert.deepEqual(names(await db.collection('amigurumi').where('searchTerms', 'array-contains', 'cafe').get()), ['Café']);
});
await check('tag "Animal" vindt ook "animal"', async () => {
    const snap = await db.collection('amigurumi').where('tagsLower', 'array-contains-any', ['animal']).orderBy('createdAt', 'desc').get();
    assert.deepEqual(names(snap), ['Snake', 'Bruine Beer']);
});
await check('sorteren op populariteit', async () => {
    assert.equal(names(await db.collection('amigurumi').orderBy('favoriteCount', 'desc').limit(1).get())[0], 'Snake');
});
await check('sorteren op naam (hoofdletterongevoelig)', async () => {
    assert.deepEqual(names(await db.collection('amigurumi').orderBy('nameLower').get()), ['Bruine Beer', 'Café', 'Snake']);
});

summary();
process.exit();
