// Een foto van een afgewerkte knuffel die iemand naar een patroon gehaakt heeft.
interface Make {
    id: string;
    amigurumi_id: string;
    // Naam van het patroon op het moment van uploaden, zodat het profiel van de maker
    // kan tonen wat er gemaakt is zonder elk patroon apart op te halen.
    amigurumi_name: string;
    user_id: string;
    imageUrl: string;
    note?: string | null;
    createdAt?: any;
}
