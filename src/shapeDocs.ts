import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase-config.js";

// Schrijft een vorm volledig naar Firestore (aanmaken of overschrijven). Gebruikt voor
// vormen die niet via de gewone debounced update lopen: een gespiegelde kopie, of een
// vorm die door "ongedaan maken" weer terugkomt.
export async function saveShapeDoc(shape: Shape & { id: string; amigurumi_id?: string }) {
    const { id, mesh, ...data } = shape;
    const shapeData: Record<string, unknown> = {
        ...data,
        amigurumi_id: shape.amigurumi_id ?? localStorage.getItem("amigurumi"),
    };
    Object.keys(shapeData).forEach((key) => {
        if (shapeData[key] === undefined) delete shapeData[key];
    });
    await setDoc(doc(db, "shapes", id), shapeData);
}
