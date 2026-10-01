import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase-config.js';

// Herkomstketen voor een kopie van `source`: de bron zelf vooraan, gevolgd door de
// keten waar de bron zelf weer van afstamt.
export function buildCopiedFrom(source: Amigurumi): AmigurumiSource[] {
    return [
        { id: source.id, name: source.name, user_id: source.user_id },
        ...(source.copiedFrom ?? []),
    ];
}

// Slaat `newAmigurumi` op als kopie van `source`, inclusief eigen kopieën van alle
// vormen en van het garen. Het garen moet echt gedupliceerd worden: YarnSettings schrijft
// naar het yarn-document van het patroon, dus een gedeeld yarn_id zou het origineel
// laten meeveranderen. Alles gaat in één batch, zodat er nooit een halve kopie ontstaat.
export async function saveAmigurumiCopy(
    source: Amigurumi,
    newAmigurumi: Amigurumi,
): Promise<{ amigurumi: Amigurumi; shapes: Shape[]; yarn: (Yarn & { id: string }) | null }> {
    const [shapesSnapshot, yarnSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', source.id))),
        source.yarn_id ? getDoc(doc(db, 'yarn', source.yarn_id)) : Promise.resolve(null),
    ]);

    const batch = writeBatch(db);

    let yarn: (Yarn & { id: string }) | null = null;
    if (yarnSnapshot?.exists()) {
        const yarnId = uuidv4();
        const yarnData = yarnSnapshot.data() as Yarn;
        batch.set(doc(db, 'yarn', yarnId), yarnData);
        yarn = { ...yarnData, id: yarnId };
    }

    const amigurumi: Amigurumi = { ...newAmigurumi, yarn_id: yarn?.id ?? null };
    batch.set(doc(db, 'amigurumi', amigurumi.id), amigurumi);

    const shapes: Shape[] = shapesSnapshot.docs.map((shapeDoc) => {
        const shapeId = uuidv4();
        const shapeData = { ...shapeDoc.data(), amigurumi_id: amigurumi.id };
        batch.set(doc(db, 'shapes', shapeId), shapeData);
        return { id: shapeId, ...shapeData } as Shape;
    });

    await batch.commit();
    return { amigurumi, shapes, yarn };
}
