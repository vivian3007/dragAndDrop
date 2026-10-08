import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// `npm run dev:emulators`: de app praat dan met de lokale Firebase-emulator (`npm run
// emulators`) i.p.v. de echte database, zodat je vrij kunt testen. Testdata erin zetten:
// `npx tsx scripts/emulator-seed.mjs`.
const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

const firebaseConfig = {
    apiKey: "AIzaSyADgzyh7Q-3C6Z6uHHK46SC6kHmel_RLqE",
    authDomain: "stitchify-854f7.firebaseapp.com",
    projectId: "stitchify-854f7",
    storageBucket: "stitchify-854f7.firebasestorage.app",
    messagingSenderId: "805254862523",
    appId: "1:805254862523:web:42597a63ae8a14d947bb9e",
    measurementId: "G-TMJT1FWZNH"
};

// "demo-" project: de emulator draait in single-project-modus op dit id (zie package.json),
// en een demo-project kan nooit per ongeluk de echte servers bereiken.
const app = initializeApp(useEmulators ? { apiKey: "demo-key", projectId: "demo-stitchify" } : firebaseConfig);

const auth = getAuth(app);

// Lokale cache in IndexedDB: listeners (useCollection, onSnapshot) geven eerst meteen wat er
// al in de cache staat en werken daarna bij vanaf de server. Een eerder bezochte pagina staat
// er zo direct, ook na herladen. Gedeeld tussen tabbladen. Bij uitloggen wordt hij gewist
// (zie logOut in src/auth/AuthProvider.tsx).
// Met de emulator geen blijvende cache: die zou emulator-data en echte data door elkaar halen.
const db = initializeFirestore(app, {
    localCache: useEmulators ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
    connectFirestoreEmulator(db, "127.0.0.1", 8085);
    connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
}

export { app, db, auth };