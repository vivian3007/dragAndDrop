// Een foto van een afgewerkte amigurumi die iemand naar een patroon gehaakt heeft.
interface Make {
    id: string;
    amigurumi_id: string;
    // Naam van het patroon op het moment van uploaden, zodat het profiel van de maker
    // kan tonen wat er gemaakt is zonder elk patroon apart op te halen.
    amigurumi_name: string;
    // Firebase-uid van wie de foto plaatste.
    user_id: string;
    imageUrl: string;
    note?: string | null;
    // Firestore-tijdstempel; bij het aanmaken nog een serverTimestamp()-placeholder.
    createdAt?: import('firebase/firestore').Timestamp | import('firebase/firestore').FieldValue | Date | null;
}
