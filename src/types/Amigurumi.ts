// Verwijzing naar een ontwerp waarvan gekopieerd is. Naam en eigenaar worden op het
// moment van kopiëren vastgelegd, zodat de herkomst leesbaar blijft ook als het
// origineel later hernoemd of verwijderd wordt.
interface AmigurumiSource {
    id: string;
    name: string;
    user_id: string;
}

interface Amigurumi {
    id: string;
    name: string;
    height: number;
    tags: string[];
    favorite: boolean;
    yarn_id: string;
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
