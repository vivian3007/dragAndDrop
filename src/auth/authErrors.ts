// Gedeelde regels en foutvertaling voor inloggen, registreren en de accountpagina.

// Firebase eist minimaal 6 tekens; wij vragen er 8 (aanbeveling voor wachtwoorden zonder
// verdere complexiteitseisen). Firebase's eigen policy blijft daarnaast gelden.
export const MIN_PASSWORD_LENGTH = 8;

type AuthContext = 'login' | 'register' | 'reset' | 'account';

// Zet een Firebase-foutcode (of een eigen `local/...`-code) om naar een vertaalsleutel.
// Bij inloggen geven "onbekend e-mailadres" en "fout wachtwoord" bewust dezelfde melding,
// zodat niet af te leiden is welke e-mailadressen een account hebben.
// Firebase-fouten (FirebaseError) hebben een `code` zoals "auth/wrong-password"; andere
// fouten niet. Veilig uit te lezen uit een onbekende `catch`-waarde.
export function errorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
        return error.code;
    }
    return undefined;
}

export function authErrorKey(code: string | undefined, context: AuthContext): string {
    switch (code) {
        case 'local/username-invalid':
            return 'username.error.invalid';
        case 'local/username-taken':
            return 'username.error.taken';
        case 'local/password-too-short':
        case 'auth/weak-password':
            return 'login.error.passwordTooShort';
        case 'local/password-mismatch':
            return 'login.error.passwordMismatch';
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return context === 'account' ? 'account.error.wrongPassword' : 'login.error.invalidCredentials';
        case 'auth/invalid-email':
        case 'auth/missing-email':
            return 'login.error.invalidEmail';
        case 'auth/email-already-in-use':
            return 'login.error.emailInUse';
        case 'auth/user-disabled':
            return 'login.error.userDisabled';
        case 'auth/too-many-requests':
            return 'login.error.tooManyRequests';
        case 'auth/network-request-failed':
            return 'login.error.network';
        case 'auth/requires-recent-login':
            return 'account.error.recentLogin';
        default:
            return context === 'register' ? 'login.error.registerGeneric' : 'login.error.generic';
    }
}
