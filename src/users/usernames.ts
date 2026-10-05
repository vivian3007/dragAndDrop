import { useEffect, useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase-config.js';

// Gebruikersnamen zijn uniek. Firestore kent geen unique-constraint, dus elke naam heeft een
// eigen document `usernames/{naam}` met daarin de uid van de eigenaar. Een document-id kan
// maar één keer bestaan en firestore.rules staat alleen aanmaken toe (geen overschrijven),
// dus ook als twee mensen tegelijk dezelfde naam kiezen, krijgt er maar één hem. Het
// gebruikersdocument `users/{uid}` bevat de naam ook, zodat we van e-mailadres (zoals
// ontwerpen hun eigenaar opslaan) naar gebruikersnaam kunnen.

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
        { email: user.email, username, ...(isNewUserDoc ? { createdAt: serverTimestamp() } : {}) },
        { merge: true },
    );
    if (previous && previous !== username) {
        batch.delete(doc(db, 'usernames', previous));
    }
    await batch.commit();
    // Ook als displayName in Firebase Auth, zodat bv. de initiaal in de navigatiebalk klopt.
    await updateProfile(user, { displayName: username });
    if (user.email) forgetEmail(user.email);
}

export async function fetchOwnUsername(uid: string): Promise<string | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return (snap.exists() && snap.data().username) || null;
}

export type PublicUser = { username: string | null };

// Ontwerpen, foto's en herkomst slaan hun eigenaar op als e-mailadres. Om dat nergens te
// tonen, zoeken we de gebruikersnaam erbij. Gecachet per e-mailadres voor deze sessie.
const byEmail = new Map<string, Promise<PublicUser>>();

export function lookupUserByEmail(email: string): Promise<PublicUser> {
    let cached = byEmail.get(email);
    if (!cached) {
        cached = getDocs(query(collection(db, 'users'), where('email', '==', email), limit(1)))
            .then((snap) => ({ username: (snap.docs[0]?.data().username as string | undefined) ?? null }))
            .catch((error) => {
                console.error('Fout bij opzoeken van gebruiker:', error);
                byEmail.delete(email);
                return { username: null };
            });
        byEmail.set(email, cached);
    }
    return cached;
}

function forgetEmail(email: string) {
    byEmail.delete(email);
}

// Van gebruikersnaam (uit de profiel-URL) terug naar het e-mailadres waarmee de ontwerpen
// van die gebruiker zijn opgeslagen.
export async function lookupUserByUsername(username: string): Promise<{ uid: string; email: string; username: string } | null> {
    const reservation = await getDoc(doc(db, 'usernames', username));
    if (!reservation.exists()) return null;
    const uid = reservation.data().uid as string;
    const userDoc = await getDoc(doc(db, 'users', uid));
    const email = userDoc.exists() ? (userDoc.data().email as string | undefined) : undefined;
    return email ? { uid, email, username } : null;
}

// Hook: gebruikersnaam bij een e-mailadres. `undefined` zolang het laadt.
export function useUsernameForEmail(email: string | null | undefined): string | null | undefined {
    const [username, setUsername] = useState<string | null | undefined>(undefined);
    useEffect(() => {
        if (!email) {
            setUsername(null);
            return;
        }
        let cancelled = false;
        setUsername(undefined);
        lookupUserByEmail(email).then((user) => {
            if (!cancelled) setUsername(user.username);
        });
        return () => {
            cancelled = true;
        };
    }, [email]);
    return username;
}
