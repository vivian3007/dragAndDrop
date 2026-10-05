// Garen bij een ontwerp (collectie `yarn`). Velden zijn `null` zolang er nog geen garen
// gekozen is: de app begint met een leeg garen en vult het pas na het laden aan.
interface Yarn {
    id?: string;
    // Firebase-uid van wie het garen opsloeg (oudere documenten hebben er nog geen).
    user_id?: string | null;
    name: string | null;
    weight: string | null;
    mPerSkein: number | null;
    hooksize: number | null;
    material: string | null;
    color: string | null;
}
