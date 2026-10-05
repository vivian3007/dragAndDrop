#!/usr/bin/env node
// Eenmalige migratie: eigenaren van e-mailadres naar Firebase-uid.
//
// Waarom: ontwerpen, foto's en garen sloegen hun eigenaar op als e-mailadres, en ook het
// gebruikersdocument bevatte het e-mailadres. Die documenten zijn voor alle ingelogde
// gebruikers leesbaar (nodig voor Home en profielen), dus iedereen met een account kon de
// e-mailadressen van alle gebruikers uitlezen. Na deze migratie staat er alleen nog een uid
// in; het e-mailadres blijft in Firebase Auth, waar alleen de gebruiker zelf het ziet.
//
// Wat het doet:
//   amigurumi.user_id            e-mail → uid
//   amigurumi.copiedFrom[].user_id  e-mail → uid
//   makes.user_id                e-mail → uid
//   yarn.user_id                 e-mail → uid
//   users.email                  verwijderd
// E-mailadressen zonder bijbehorend account (verwijderde gebruikers) worden null: dan
// toont de app "Onbekend" in plaats van het e-mailadres. Waarden die al een uid zijn
// (geen "@") worden overgeslagen, dus nogmaals draaien is veilig.
//
// Gebruik:
//   1. Firebase-console → Projectinstellingen → Serviceaccounts → "Nieuwe privésleutel
//      genereren". Bewaar het bestand BUITEN deze repo, of in de map die .gitignore negeert.
//      Deze sleutel geeft volledige toegang tot het project: nooit committen of delen.
//   2. Droge run (schrijft niets, laat zien wat er zou veranderen):
//        GOOGLE_APPLICATION_CREDENTIALS=pad/naar/sleutel.json node scripts/migrate-user-ids.mjs
//      PowerShell:
//        $env:GOOGLE_APPLICATION_CREDENTIALS="pad\naar\sleutel.json"; node scripts/migrate-user-ids.mjs
//   3. Echt uitvoeren (maakt eerst een back-up in backups/):
//        ... node scripts/migrate-user-ids.mjs --apply
//   4. Daarna de nieuwe firestore.rules deployen en de nieuwe app-versie live zetten.
//      Pas na de migratie, want de nieuwe regels en app verwachten uids.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');

function projectId() {
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
    try {
        return JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url))).projects.default;
    } catch {
        return undefined;
    }
}

// Tegen de lokale emulator (FIRESTORE_EMULATOR_HOST gezet) is geen sleutel nodig; zo is het
// script te testen zonder het echte project aan te raken.
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Zet eerst GOOGLE_APPLICATION_CREDENTIALS naar je service-account-sleutel (zie bovenin dit script).');
    process.exit(1);
}

initializeApp(usingEmulator ? { projectId: projectId() } : { credential: applicationDefault(), projectId: projectId() });
console.log(`Project: ${projectId()}${usingEmulator ? ' (emulator)' : ''}`);
const auth = getAuth();
const db = getFirestore();

const isEmail = (value) => typeof value === 'string' && value.includes('@');

// --- 1. Alle accounts: e-mail → uid -------------------------------------------------------
async function loadEmailToUid() {
    const map = new Map();
    let pageToken;
    do {
        const page = await auth.listUsers(1000, pageToken);
        page.users.forEach((user) => {
            if (user.email) map.set(user.email.toLowerCase(), user.uid);
        });
        pageToken = page.pageToken;
    } while (pageToken);
    return map;
}

// --- 2. Back-up -------------------------------------------------------------------------
function toJson(value) {
    if (value instanceof Timestamp) return { __timestamp: value.toDate().toISOString() };
    if (Array.isArray(value)) return value.map(toJson);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, toJson(v)]));
    }
    return value;
}

function writeBackup(snapshots) {
    mkdirSync(new URL('../backups/', import.meta.url), { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new URL(`../backups/firestore-before-uid-migration-${stamp}.json`, import.meta.url);
    const data = Object.fromEntries(
        Object.entries(snapshots).map(([name, snap]) => [
            name,
            Object.fromEntries(snap.docs.map((d) => [d.id, toJson(d.data())])),
        ]),
    );
    writeFileSync(file, JSON.stringify(data, null, 2));
    return file.pathname;
}

// --- 3. Wijzigingen bepalen ----------------------------------------------------------------
async function main() {
    console.log(APPLY ? 'MODUS: uitvoeren (--apply)\n' : 'MODUS: droge run — er wordt niets geschreven\n');

    const emailToUid = await loadEmailToUid();
    console.log(`Accounts in Firebase Auth: ${emailToUid.size}`);

    const snapshots = {};
    for (const name of ['amigurumi', 'makes', 'yarn', 'users']) {
        snapshots[name] = await db.collection(name).get();
        console.log(`Documenten in ${name}: ${snapshots[name].size}`);
    }

    const unknownEmails = new Set();
    const resolve = (email) => {
        const uid = emailToUid.get(email.toLowerCase());
        if (!uid) unknownEmails.add(email);
        return uid ?? null;
    };

    const updates = []; // [ref, data, beschrijving]
    const stats = { converted: 0, nulled: 0, alreadyUid: 0, emailFieldsRemoved: 0 };

    const convertField = (value, label, collect) => {
        if (!isEmail(value)) {
            if (value) stats.alreadyUid++;
            return;
        }
        const uid = resolve(value);
        uid ? stats.converted++ : stats.nulled++;
        collect(uid, label);
    };

    snapshots.amigurumi.docs.forEach((d) => {
        const data = d.data();
        const change = {};
        convertField(data.user_id, 'user_id', (uid) => (change.user_id = uid));
        if (Array.isArray(data.copiedFrom) && data.copiedFrom.some((source) => isEmail(source?.user_id))) {
            change.copiedFrom = data.copiedFrom.map((source) => {
                if (!isEmail(source?.user_id)) return source;
                const uid = resolve(source.user_id);
                uid ? stats.converted++ : stats.nulled++;
                return { ...source, user_id: uid };
            });
        }
        if (Object.keys(change).length) updates.push([d.ref, change, `amigurumi/${d.id} (${data.name ?? '?'})`]);
    });

    for (const name of ['makes', 'yarn']) {
        snapshots[name].docs.forEach((d) => {
            const change = {};
            convertField(d.data().user_id, 'user_id', (uid) => (change.user_id = uid));
            if (Object.keys(change).length) updates.push([d.ref, change, `${name}/${d.id}`]);
        });
    }

    snapshots.users.docs.forEach((d) => {
        if ('email' in d.data()) {
            stats.emailFieldsRemoved++;
            updates.push([d.ref, { email: FieldValue.delete() }, `users/${d.id} (e-mailveld weg)`]);
        }
    });

    // --- 4. Rapport ---------------------------------------------------------------------
    console.log('\nResultaat:');
    console.log(`  e-mail → uid omgezet:            ${stats.converted}`);
    console.log(`  e-mail zonder account → null:    ${stats.nulled}`);
    console.log(`  al een uid (overgeslagen):       ${stats.alreadyUid}`);
    console.log(`  e-mailvelden uit users verwijderd: ${stats.emailFieldsRemoved}`);
    console.log(`  documenten om bij te werken:     ${updates.length}`);
    if (unknownEmails.size) {
        console.log(`\nE-mailadressen zonder account (worden null, de app toont dan "Onbekend"):`);
        unknownEmails.forEach((email) => console.log(`  - ${email}`));
    }

    if (!APPLY) {
        console.log('\nDroge run: niets geschreven. Voorbeeld van de eerste wijzigingen:');
        updates.slice(0, 15).forEach(([, change, label]) => {
            const shown = Object.fromEntries(
                Object.entries(change).map(([k, v]) => [k, v instanceof FieldValue ? '<verwijderen>' : v]),
            );
            console.log(`  ${label}: ${JSON.stringify(shown)}`);
        });
        console.log('\nKlopt dit? Draai dan opnieuw met --apply.');
        return;
    }

    if (!updates.length) {
        console.log('\nNiets te doen.');
        return;
    }

    const backupPath = writeBackup(snapshots);
    console.log(`\nBack-up geschreven: ${backupPath}`);

    const writer = db.bulkWriter();
    let failed = 0;
    writer.onWriteError((error) => {
        failed++;
        console.error(`  Mislukt: ${error.documentRef.path}: ${error.message}`);
        return false;
    });
    updates.forEach(([ref, change]) => writer.update(ref, change));
    await writer.close();

    console.log(`\nKlaar: ${updates.length - failed} documenten bijgewerkt, ${failed} mislukt.`);
    if (failed) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
