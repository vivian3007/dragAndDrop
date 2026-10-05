// Verwijzing naar een ontwerp waarvan gekopieerd is. Naam en eigenaar worden op het
// moment van kopiëren vastgelegd, zodat de herkomst leesbaar blijft ook als het
// origineel later hernoemd of verwijderd wordt.
interface AmigurumiSource {
    id: string;
    name: string;
    // Firebase-uid van de eigenaar van de bron (null als die niet meer te herleiden was).
    user_id: string | null;
}

interface Amigurumi {
    id: string;
    name: string;
    height: number | null;
    tags: string[];
    yarn_id: string | null;
    // Hoe vaak het ontwerp favoriet is (zie FavoritesProvider). Ontbreekt = 0.
    favoriteCount?: number;
    // Firebase-uid van de eigenaar. (Vroeger het e-mailadres; zie scripts/migrate-user-ids.mjs.)
    user_id: string;
    createdAt?: any;
    notes?: string | null;
    imageUrl?: string | null;
    // Herkomstketen, dichtstbijzijnde bron eerst: [direct origineel, origineel daarvan, ...].
    copiedFrom?: AmigurumiSource[] | null;
    // Id van de directe bron, los opgeslagen zodat Firestore kan tellen hoe vaak een
    // ontwerp gekopieerd is (op een veld binnen een array van objecten kan dat niet).
    copiedFromId?: string | null;
}
