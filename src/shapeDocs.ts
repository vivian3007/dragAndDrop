import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase-config.js";

// Schrijft een vorm volledig naar Firestore (aanmaken of overschrijven). Gebruikt voor
// vormen die niet via de gewone debounced update lopen: een gespiegelde kopie, of een
// vorm die door "ongedaan maken" weer terugkomt. De vorm moet weten bij welk ontwerp hij hoort.
export async function saveShapeDoc(shape: Shape & { amigurumi_id: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, mesh, ...data } = shape;
    const shapeData: Record<string, unknown> = { ...data };
    Object.keys(shapeData).forEach((key) => {
        if (shapeData[key] === undefined) delete shapeData[key];
    });
    await setDoc(doc(db, "shapes", id), shapeData);
}
