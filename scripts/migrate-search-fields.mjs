#!/usr/bin/env node
// Eenmalige migratie: velden voor zoeken, filteren en sorteren op de server (Home).
//
// Waarom: Home laadt niet meer alle ontwerpen om in de browser te filteren, maar laat
// Firestore zoeken, filteren, sorteren en per pagina laden (src/useDesignSearch.ts). Daar
// zijn velden voor nodig die oudere ontwerpen nog niet hebben, en Firestore laat documenten
// zonder het veld waarop gesorteerd wordt helemaal weg uit de resultaten.
//
// Wat het doet, per ontwerp:
//   searchTerms, nameLower, tagsLower   opnieuw berekend uit naam en tags (src/searchTerms.js)
//   favoriteCount                       nageteld uit alle users/*/favorites (ontbrak of liep scheef)
//   createdAt                           als die ontbreekt: het moment waarop Firestore het document
//                                       aanmaakte
// Velden die al kloppen worden niet aangeraakt, dus nogmaals draaien is veilig.
//
// Gebruik (zelfde sleutel als bij scripts/migrate-user-ids.mjs):
//   1. Droge run (schrijft niets, laat zien wat er zou veranderen):
//        GOOGLE_APPLICATION_CREDENTIALS=pad/naar/sleutel.json node scripts/migrate-search-fields.mjs
//      PowerShell:
//        $env:GOOGLE_APPLICATION_CREDENTIALS="pad\naar\sleutel.json"; node scripts/migrate-search-fields.mjs
//   2. Echt uitvoeren (maakt eerst een back-up in backups/):
//        ... node scripts/migrate-search-fields.mjs --apply
//   3. Daarna de indexen deployen (`npx firebase-tools deploy --only firestore`) en wachten
//      tot ze in de Firebase-console op "Ingeschakeld" staan, dan de nieuwe app live zetten.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { searchFields } from '../src/searchTerms.js';

const APPLY = process.argv.includes('--apply');

function projectId() {
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
    try {
        return JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url))).projects.default;
    } catch {
        return undefined;
    }
}

// Tegen de lokale emulator (FIRESTORE_EMULATOR_HOST gezet) is geen sleutel nodig.
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Zet eerst GOOGLE_APPLICATION_CREDENTIALS naar je service-account-sleutel (zie bovenin dit script).');
    process.exit(1);
}

initializeApp(usingEmulator ? { projectId: projectId() } : { credential: applicationDefault(), projectId: projectId() });
console.log(`Project: ${projectId()}${usingEmulator ? ' (emulator)' : ''}${APPLY ? '' : ' — droge run'}`);
const db = getFirestore();

const sameArray = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);

// Aantal favorieten per ontwerp, uit alle users/{uid}/favorites/{ontwerpId}.
const favoriteCounts = new Map();
for (const fav of (await db.collectionGroup('favorites').get()).docs) {
    favoriteCounts.set(fav.id, (favoriteCounts.get(fav.id) ?? 0) + 1);
}

const designs = await db.collection('amigurumi').get();
const changes = [];
for (const snap of designs.docs) {
    const data = snap.data();
    const fields = searchFields(data.name ?? '', data.tags ?? []);
    const update = {};
    if (!sameArray(data.searchTerms, fields.searchTerms)) update.searchTerms = fields.searchTerms;
    if (data.nameLower !== fields.nameLower) update.nameLower = fields.nameLower;
    if (!sameArray(data.tagsLower, fields.tagsLower)) update.tagsLower = fields.tagsLower;
    const count = favoriteCounts.get(snap.id) ?? 0;
    if (data.favoriteCount !== count) update.favoriteCount = count;
    if (!data.createdAt) update.createdAt = snap.createTime;
    if (Object.keys(update).length > 0) {
        changes.push({ id: snap.id, name: data.name, update, before: { favoriteCount: data.favoriteCount ?? null, createdAt: data.createdAt ?? null } });
    }
}

for (const { id, name, update } of changes) {
    const summary = Object.entries(update)
        .map(([key, value]) => (Array.isArray(value) ? `${key}: ${value.length} termen` : `${key}: ${value?.toDate ? value.toDate().toISOString() : value}`))
        .join(', ');
    console.log(`  ${id} (${name ?? '?'}): ${summary}`);
}
console.log(`${changes.length} van ${designs.size} ontwerpen bij te werken.`);

if (!APPLY) {
    console.log('Niets geschreven. Draai met --apply om het echt te doen.');
    process.exit();
}

if (changes.length > 0) {
    mkdirSync(new URL('../backups/', import.meta.url), { recursive: true });
    const backup = new URL(`../backups/search-fields-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, import.meta.url);
    writeFileSync(backup, JSON.stringify(changes.map(({ id, before }) => ({ id, before })), null, 2));
    console.log(`Back-up: ${backup.pathname}`);
}

// In batches van max. 500 schrijfacties (de Firestore-limiet).
for (let i = 0; i < changes.length; i += 500) {
    const batch = db.batch();
    changes.slice(i, i + 500).forEach(({ id, update }) => batch.update(db.doc(`amigurumi/${id}`), update));
    await batch.commit();
}
console.log('Klaar.');
process.exit();
