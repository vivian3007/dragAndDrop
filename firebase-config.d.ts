// Types voor firebase-config.js (plain JS), zodat TypeScript de imports kent.
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export const app: FirebaseApp;
export const db: Firestore;
export const auth: Auth;
