// Test van firestore.rules tegen de emulator: logt in als verschillende gebruikers (met de
// gewone client-SDK, net als de app) en controleert wat wel en niet mag.
//   npm run emulators          (in een ander venster)
//   node scripts/emulator-tests/firestore-rules.test.mjs
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
    collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, initializeFirestore, setDoc, setLogLevel, updateDoc, writeBatch,
} from 'firebase/firestore';

// Geweigerde schrijfacties zijn hier juist de bedoeling; die hoeft de SDK niet te loggen.
setLogLevel('silent');
import { admin, AUTH_HOST, check, FIRESTORE_HOST, PROJECT, resetEmulator, summary } from './helpers.mjs';

// Een client zoals de app hem gebruikt, optioneel ingelogd.
async function client(email) {
    const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-key' }, `client-${email ?? 'anon'}-${Math.random()}`);
    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
    const db = initializeFirestore(app, {});
    const [host, port] = FIRESTORE_HOST.split(':');
    connectFirestoreEmulator(db, host, Number(port));
    if (email) await signInWithEmailAndPassword(auth, email, 'wachtwoord123');
    return { app, db };
}

const allowed = (promise) => promise;
const denied = async (promise) => {
    await assert.rejects(promise, (error) => error.code === 'permission-denied');
};

// --- Testdata (via admin, dus buiten de regels om) -----------------------------------------
const { auth: adminAuth, db: adminDb } = admin();
await resetEmulator();
await adminAuth.createUser({ uid: 'alice', email: 'alice@test.nl', password: 'wachtwoord123' });
await adminAuth.createUser({ uid: 'bob', email: 'bob@test.nl', password: 'wachtwoord123' });
const seed = {
    'amigurumi/a1': { name: 'Beer van Alice', user_id: 'alice', favorite: false },
    'amigurumi/b1': { name: 'Konijn van Bob', user_id: 'bob', favorite: false },
    'shapes/s1': { amigurumi_id: 'a1', type: 'Sphere', x: 0 },
    'makes/mb': { amigurumi_id: 'a1', amigurumi_name: 'Beer', user_id: 'bob', imageUrl: 'x' },
    'yarn/ya': { name: 'Katoen', user_id: 'alice' },
    'yarn/yold': { name: 'Oud garen' },
    'users/alice': { username: 'alice' },
    'usernames/alice': { uid: 'alice' },
};
for (const [path, data] of Object.entries(seed)) await adminDb.doc(path).set(data);

const anon = await client(null);
const bob = await client('bob@test.nl');
const alice = await client('alice@test.nl');

console.log('Niet ingelogd');
await check('mag één gebruikersnaam opzoeken (beschikbaarheid bij registreren)', () => allowed(getDoc(doc(anon.db, 'usernames/alice'))));
await check('mag geen ontwerpen lezen', () => denied(getDoc(doc(anon.db, 'amigurumi/a1'))));
await check('mag geen gebruikers lezen', () => denied(getDoc(doc(anon.db, 'users/alice'))));

console.log('\nOntwerpen (als Bob)');
await check('mag andermans ontwerp lezen', () => allowed(getDoc(doc(bob.db, 'amigurumi/a1'))));
await check('mag andermans ontwerp niet hernoemen', () => denied(updateDoc(doc(bob.db, 'amigurumi/a1'), { name: 'Gekaapt' })));
await check('mag andermans ontwerp niet overnemen', () => denied(updateDoc(doc(bob.db, 'amigurumi/a1'), { user_id: 'bob' })));
await check('mag het oude gedeelde favoriet-veld bij andermans ontwerp niet omzetten', () => denied(updateDoc(doc(bob.db, 'amigurumi/a1'), { favorite: true })));
await check('mag andermans ontwerp niet verwijderen', () => denied(deleteDoc(doc(bob.db, 'amigurumi/a1'))));
await check('mag eigen ontwerp wijzigen', () => allowed(updateDoc(doc(bob.db, 'amigurumi/b1'), { name: 'Konijn 2' })));
await check('mag geen ontwerp op andermans naam aanmaken', () => denied(setDoc(doc(bob.db, 'amigurumi/nep'), { name: 'Nep', user_id: 'alice' })));
await check('mag eigen ontwerp aanmaken', () => allowed(setDoc(doc(bob.db, 'amigurumi/b2'), { name: 'Nieuw', user_id: 'bob' })));

console.log('\nFavorieten');
await check('Bob mag andermans ontwerp als eigen favoriet markeren', () => allowed(setDoc(doc(bob.db, 'users/bob/favorites/a1'), { createdAt: new Date() })));
await check('Bob mag zijn eigen favorieten lezen', () => allowed(getDocs(collection(bob.db, 'users/bob/favorites'))));
await check('Alice mag Bobs favorieten niet lezen', () => denied(getDocs(collection(alice.db, 'users/bob/favorites'))));
await check('Alice mag geen favoriet voor Bob zetten', () => denied(setDoc(doc(alice.db, 'users/bob/favorites/b1'), { createdAt: new Date() })));
await check('Alice mag Bobs favoriet niet weghalen', () => denied(deleteDoc(doc(alice.db, 'users/bob/favorites/a1'))));
await check('favoriet met extra velden: geweigerd', () => denied(setDoc(doc(bob.db, 'users/bob/favorites/b1'), { createdAt: new Date(), stiekem: true })));
await check('Bob mag zijn favoriet weer weghalen', () => allowed(deleteDoc(doc(bob.db, 'users/bob/favorites/a1'))));

console.log('\nVormen (als Bob)');
await check('mag geen vorm aan andermans ontwerp toevoegen', () => denied(setDoc(doc(bob.db, 'shapes/s2'), { amigurumi_id: 'a1', type: 'Sphere' })));
await check('mag andermans vorm niet wijzigen', () => denied(updateDoc(doc(bob.db, 'shapes/s1'), { x: 5 })));
await check('mag vorm aan eigen ontwerp toevoegen', () => allowed(setDoc(doc(bob.db, 'shapes/s3'), { amigurumi_id: 'b1', type: 'Sphere' })));
await check('kopiëren: ontwerp + vormen + garen in één batch', () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'amigurumi/kopie'), { name: 'Kopie', user_id: 'bob', copiedFromId: 'a1' });
    batch.set(doc(bob.db, 'shapes/kopie-s1'), { amigurumi_id: 'kopie', type: 'Sphere' });
    batch.set(doc(bob.db, 'yarn/kopie-y'), { name: 'Katoen', user_id: 'bob' });
    return allowed(batch.commit());
});

console.log('\nGaren (als Bob)');
await check('mag andermans garen niet wijzigen', () => denied(updateDoc(doc(bob.db, 'yarn/ya'), { name: 'X', user_id: 'bob' })));
await check('mag garen zonder eigenaar eenmalig claimen', () => allowed(setDoc(doc(bob.db, 'yarn/yold'), { name: 'Oud garen', user_id: 'bob' }, { merge: true })));
await check('…en daarna kan Alice het niet meer overnemen', () => denied(setDoc(doc(alice.db, 'yarn/yold'), { user_id: 'alice' }, { merge: true })));

console.log('\nFoto\'s van gemaakte amigurumi');
await check('Alice mag Bobs foto niet verwijderen', () => denied(deleteDoc(doc(alice.db, 'makes/mb'))));
await check('Alice mag geen foto op Bobs naam plaatsen', () => denied(setDoc(doc(alice.db, 'makes/nep'), { amigurumi_id: 'a1', amigurumi_name: 'Beer', user_id: 'bob', imageUrl: 'x' })));
await check('Bob mag zijn eigen foto verwijderen', () => allowed(deleteDoc(doc(bob.db, 'makes/mb'))));

console.log('\nGebruikersnamen');
await check('gebruikersdocument zonder reservering: geweigerd', () => denied(setDoc(doc(bob.db, 'users/bob'), { username: 'bob' })));
await check('e-mailadres in gebruikersdocument: geweigerd', () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'usernames/bob'), { uid: 'bob' });
    batch.set(doc(bob.db, 'users/bob'), { username: 'bob', email: 'bob@test.nl' });
    return denied(batch.commit());
});
await check('ongeldige naam (hoofdletters): geweigerd', () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'usernames/Bob'), { uid: 'bob' });
    batch.set(doc(bob.db, 'users/bob'), { username: 'Bob' });
    return denied(batch.commit());
});
await check('al bezette naam: geweigerd', () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'usernames/alice'), { uid: 'bob' });
    batch.set(doc(bob.db, 'users/bob'), { username: 'alice' });
    return denied(batch.commit());
});
await check('vrije naam reserveren', () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'usernames/bob'), { uid: 'bob' });
    batch.set(doc(bob.db, 'users/bob'), { username: 'bob' }, { merge: true });
    return allowed(batch.commit());
});
await check('naam wijzigen geeft de oude vrij', async () => {
    const batch = writeBatch(bob.db);
    batch.set(doc(bob.db, 'usernames/bobby'), { uid: 'bob' });
    batch.set(doc(bob.db, 'users/bob'), { username: 'bobby' }, { merge: true });
    batch.delete(doc(bob.db, 'usernames/bob'));
    await batch.commit();
    assert.equal((await getDoc(doc(anon.db, 'usernames/bob'))).exists(), false);
});
await check('andermans naam vrijgeven: geweigerd', () => denied(deleteDoc(doc(bob.db, 'usernames/alice'))));
await check('lijst van alle gebruikersnamen opvragen: geweigerd', () => denied(getDocs(collection(bob.db, 'usernames'))));
await check('andermans gebruikersdocument wijzigen: geweigerd', () => denied(setDoc(doc(bob.db, 'users/alice'), { username: 'bobby' })));

console.log('\nOverig');
await check('onbekende collectie: geweigerd', () => denied(setDoc(doc(bob.db, 'geheim/x'), { a: 1 })));

await Promise.all([anon, bob, alice].map(({ app }) => deleteApp(app)));
summary();
process.exit();
