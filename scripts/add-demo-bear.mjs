#!/usr/bin/env node
// Zet de Demobeer (scripts/demoBear.mjs) in de echte database, bij één gebruiker.
//
// Het ontwerp krijgt een vast id per gebruiker (demobeer-<uid>). Bestaat het al, dan worden
// de vormen vervangen door de huidige versie van de beer; naam, tags, foto, favorieten en
// aanmaakdatum blijven dan staan. Nogmaals draaien is dus veilig en werkt de beer bij.
//
// Gebruik (zelfde sleutel als bij scripts/migrate-user-ids.mjs):
//   1. Droge run (schrijft niets, laat zien wat er zou gebeuren):
//        $env:GOOGLE_APPLICATION_CREDENTIALS="pad\naar\sleutel.json"; npx tsx scripts/add-demo-bear.mjs --email jij@voorbeeld.nl
//      (of --username naam, of --uid abc123)
//   2. Echt uitvoeren:
//        ... npx tsx scripts/add-demo-bear.mjs --email jij@voorbeeld.nl --apply

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { searchFields } from '../src/searchTerms.js';
import { demoBear, demoShapes } from './demoBear.mjs';

const APPLY = process.argv.includes('--apply');
const arg = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
};

function projectId() {
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
    try {
        return JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url))).projects.default;
    } catch {
        return undefined;
    }
}

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Zet eerst GOOGLE_APPLICATION_CREDENTIALS naar je service-account-sleutel (zie bovenin dit script).');
    process.exit(1);
}

initializeApp(usingEmulator ? { projectId: projectId() } : { credential: applicationDefault(), projectId: projectId() });
console.log(`Project: ${projectId()}${usingEmulator ? ' (emulator)' : ''}${APPLY ? '' : ' — droge run'}`);
const db = getFirestore();

// Eigenaar opzoeken.
let uid = arg('uid');
if (arg('email')) uid = (await getAuth().getUserByEmail(arg('email'))).uid;
if (arg('username')) {
    const snap = await db.doc(`usernames/${arg('username')}`).get();
    if (!snap.exists) throw new Error(`Gebruikersnaam @${arg('username')} bestaat niet.`);
    uid = snap.data().uid;
}
if (!uid) {
    console.error('Geef de eigenaar op met --email, --username of --uid.');
    process.exit(1);
}
const username = (await db.doc(`users/${uid}`).get()).data()?.username;
console.log(`Eigenaar: ${username ? `@${username}` : '(geen gebruikersdocument)'} (${uid})`);

const id = `demobeer-${uid}`;
const designRef = db.doc(`amigurumi/${id}`);
const existing = await designRef.get();
const oldShapes = await db.collection('shapes').where('amigurumi_id', '==', id).get();

console.log(existing.exists
    ? `Ontwerp ${id} bestaat al: ${oldShapes.size} oude vormen worden vervangen door ${demoShapes.length} nieuwe.`
    : `Nieuw ontwerp ${id} met ${demoShapes.length} vormen.`);

if (!APPLY) {
    console.log('Niets geschreven. Draai opnieuw met --apply om het echt te doen.');
    process.exit();
}

const batch = db.batch();
if (!existing.exists) {
    const yarnId = randomUUID();
    batch.set(db.doc(`yarn/${yarnId}`), {
        name: 'Katoen', weight: 'Medium', mPerSkein: 100, hooksize: 3.5, material: 'Katoen', color: '#c8a27c', user_id: uid,
    });
    batch.set(designRef, {
        id, name: demoBear.name, tags: demoBear.tags, height: 12, yarn_id: yarnId, user_id: uid, notes: null, imageUrl: null,
        createdAt: FieldValue.serverTimestamp(), favoriteCount: 0, ...searchFields(demoBear.name, demoBear.tags),
    });
}
const newShapeIds = new Set(demoShapes.map((shape) => `${id}-${shape.id}`));
for (const doc of oldShapes.docs) if (!newShapeIds.has(doc.id)) batch.delete(doc.ref);
for (const { id: shapeId, ...shape } of demoShapes) {
    batch.set(db.doc(`shapes/${id}-${shapeId}`), { amigurumi_id: id, zIndex: 10, ...shape });
}
await batch.commit();
console.log(`Klaar: ${demoBear.name} staat bij ${username ? `@${username}` : uid}.`);
process.exit();
