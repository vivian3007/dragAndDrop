// Gedeelde hulpjes voor de emulator-tests. Draaien alleen tegen de lokale Firebase-emulator
// (project "demo-stitchify": een demo-project kan nooit met de echte servers praten).
import { initializeApp as initAdmin, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export const PROJECT = 'demo-stitchify';
export const FIRESTORE_HOST = '127.0.0.1:8085';
export const AUTH_HOST = '127.0.0.1:9199';

process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;

export function admin() {
    if (!getApps().length) initAdmin({ projectId: PROJECT });
    return { auth: getAdminAuth(), db: getAdminFirestore() };
}

// Maakt de emulator leeg (alle documenten en accounts).
export async function resetEmulator() {
    const firestore = await fetch(`http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
    const auth = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
    if (!firestore.ok || !auth.ok) throw new Error('Emulator leegmaken mislukt — draait de emulator wel?');
}

let passed = 0;
let failed = 0;

export async function check(label, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${label}`);
    } catch (error) {
        failed++;
        console.log(`  ✗ ${label}\n      ${error.message}`);
    }
}

export function summary() {
    console.log(`\n${passed} geslaagd, ${failed} mislukt`);
    if (failed) process.exitCode = 1;
}
