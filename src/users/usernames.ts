import { useEffect, useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase-config.js';

// Gebruikersnamen zijn uniek. Firestore kent geen unique-constraint, dus elke naam heeft een
// eigen document `usernames/{naam}` met daarin de uid van de eigenaar. Een document-id kan
// maar één keer bestaan en firestore.rules staat alleen aanmaken toe (geen overschrijven),
// dus ook als twee mensen tegelijk dezelfde naam kiezen, krijgt er maar één hem. Het
// gebruikersdocument `users/{uid}` bevat de naam ook, zodat we van uid (zoals ontwerpen hun
// eigenaar opslaan) naar gebruikersnaam kunnen. E-mailadressen staan bewust nergens in de
// database: die blijven in Firebase Auth, waar alleen de gebruiker zelf ze ziet.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
// Kleine letters, cijfers, punt en underscore; begint en eindigt met een letter of cijfer.
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/;

export function normalizeUsername(input: string): string {
    return input.trim().toLowerCase();
}

// Vertaalsleutel van wat er mis is, of null als de naam geldig is.
export function usernameError(username: string): string | null {
    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return 'username.error.length';
    if (!USERNAME_PATTERN.test(username)) return 'username.error.characters';
    return null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'usernames', username));
    return !snap.exists();
}

// Legt een gebruikersnaam vast voor `user` (en geeft een eventuele vorige naam vrij), in één
// batch: lukt het reserveren niet omdat iemand anders hem net nam, dan verandert er niets.
export async function claimUsername(user: User, username: string, previous?: string | null): Promise<void> {
    // createdAt alleen voor een nieuw gebruikersdocument; oudere accounts hebben er al een.
    const isNewUserDoc = !(await getDoc(doc(db, 'users', user.uid))).exists();
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', username), { uid: user.uid });
    batch.set(
        doc(db, 'users', user.uid),
        { username, ...(isNewUserDoc ? { createdAt: serverTimestamp() } : {}) },
        { merge: true },
    );
    if (previous && previous !== username) {
        batch.delete(doc(db, 'usernames', previous));
    }
    await batch.commit();
    // Ook als displayName in Firebase Auth, zodat bv. de initiaal in de navigatiebalk klopt.
    await updateProfile(user, { displayName: username });
    byUid.delete(user.uid);
    uidByUsername.delete(username);
    if (previous) uidByUsername.delete(previous);
}

export async function fetchOwnUsername(uid: string): Promise<string | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return (snap.exists() && snap.data().username) || null;
}

// Ontwerpen, foto's en herkomst slaan hun eigenaar op als Firebase-uid. De gebruikersnaam
// staat in `users/{uid}`. Gecachet per uid voor deze sessie.
const byUid = new Map<string, Promise<string | null>>();

export function lookupUsernameByUid(uid: string): Promise<string | null> {
    let cached = byUid.get(uid);
    if (!cached) {
        cached = getDoc(doc(db, 'users', uid))
            .then((snap) => ((snap.exists() && (snap.data().username as string | undefined)) || null))
            .catch((error) => {
                console.error('Fout bij opzoeken van gebruiker:', error);
                byUid.delete(uid);
                return null;
            });
        byUid.set(uid, cached);
    }
    return cached;
}

// Van gebruikersnaam (uit de profiel-URL) naar het uid van die gebruiker. Ook gecachet voor
// deze sessie, zodat terugkeren naar een profiel niet eerst weer op de server wacht.
const uidByUsername = new Map<string, Promise<string | null>>();

export function lookupUidByUsername(username: string): Promise<string | null> {
    let cached = uidByUsername.get(username);
    if (!cached) {
        cached = getDoc(doc(db, 'usernames', username))
            .then((reservation) => (reservation.exists() ? (reservation.data().uid as string) : null));
        // Fouten en "bestaat niet" niet onthouden: die naam kan zo alsnog geregistreerd worden.
        cached.then((uid) => uid || uidByUsername.delete(username), () => uidByUsername.delete(username));
        uidByUsername.set(username, cached);
    }
    return cached;
}

// Hook: gebruikersnaam bij een uid. `undefined` zolang het laadt, `null` als er geen is.
// Waarden met een "@" zijn nog niet gemigreerde e-mailadressen (zie
// scripts/migrate-user-ids.mjs): die zoeken we niet op en tonen we ook nooit.
export function useUsernameForUid(uid: string | null | undefined): string | null | undefined {
    const [username, setUsername] = useState<string | null | undefined>(undefined);
    useEffect(() => {
        if (!uid || uid.includes('@')) {
            setUsername(null);
            return;
        }
        let cancelled = false;
        setUsername(undefined);
        lookupUsernameByUid(uid).then((name) => {
            if (!cancelled) setUsername(name);
        });
        return () => {
            cancelled = true;
        };
    }, [uid]);
    return username;
}
