import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyADgzyh7Q-3C6Z6uHHK46SC6kHmel_RLqE",
    authDomain: "stitchify-854f7.firebaseapp.com",
    projectId: "stitchify-854f7",
    storageBucket: "stitchify-854f7.firebasestorage.app",
    messagingSenderId: "805254862523",
    appId: "1:805254862523:web:42597a63ae8a14d947bb9e",
    measurementId: "G-TMJT1FWZNH"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, db, auth };