import {useEffect, useState} from "react";
import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {Button} from "@mui/material";
import {v4 as uuidv4} from "uuid";
import {toast} from "react-toastify";

export default function YarnSettings({onUpdateYarnInfo, yarnInfo} : {onUpdateYarnInfo: any,  yarnInfo: {id: number, name: string, weight: string, mPerSkein: number, hooksize: number, material: string, color: string}}) {
    const [name, setName] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [mPerSkein, setMPerSkein] = useState<number | null>(null);
    const [material, setMaterial] = useState<string | null>(null);
    const [hooksize, setHooksize] = useState<number | null>(null);
    const [color, setColor] = useState<string | null>(null);
    const storedAmigurumi = localStorage.getItem("amigurumi");

    const yarnWeights = [
        { value: "Lace" },
        { value: "Super Fine" },
        { value: "Fine" },
        { value: "Light" },
        { value: "Medium" },
        { value: "Bulky" },
        { value: "Super Bulky" },
        { value: "Jumbo" },
    ];


    const saveToFirestore = async () => {
        try {
            // Prepare yarn data for Firestore
            const yarnData = {
                name: name ?? null,
                weight: weight ?? null,
                mPerSkein: mPerSkein ?? 0,
                hooksize: hooksize ?? 0,
                material: material ?? null,
                color: color ?? null,
            };

            const docId = yarnInfo.id ? yarnInfo.id.toString() : uuidv4();
            const yarnRef = doc(db, "yarn", docId);
            await setDoc(yarnRef, yarnData, { merge: true });

            const amigurumiRef = doc(db, "amigurumi", storedAmigurumi);
            await setDoc(amigurumiRef, { yarn_id: docId }, { merge: true });

            onUpdateYarnInfo({
                id: yarnInfo.id,
                name: name ?? yarnInfo.name,
                weight: weight ?? yarnInfo.weight,
                mPerSkein: mPerSkein ?? yarnInfo.mPerSkein,
                hooksize: hooksize ?? yarnInfo.hooksize,
                material: material ?? yarnInfo.material,
                color: color ?? yarnInfo.color,
            });

            toast.success("Yarn opgeslagen en gekoppeld aan amigurumi!");
            console.log("Yarn data saved successfully:", yarnData);
        } catch (error) {
            console.error("Fout bij opslaan yarn:", error);
            toast.error("Fout bij opslaan: " + (error as Error).message);
        }
    };

    const handleUpdate = (updates: Partial<any>) => {
        if(yarnInfo) {
            onUpdateYarnInfo({
                id: yarnInfo.id,
                ...yarnInfo,
                ...updates
            });
        }
    };

    useEffect(() => {
        if(yarnInfo) {
            setName(yarnInfo.name);
            setWeight(yarnInfo.weight);
            setMPerSkein(yarnInfo.mPerSkein);
            setHooksize(yarnInfo.hooksize);
            setMaterial(yarnInfo.material);
            setColor(yarnInfo.color);
        }
    }, [yarnInfo]);

    console.log(yarnInfo)

    // const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newName = e.target.value;
    //     setName(newName);
    //     handleUpdate({name: newName});
    // };
    //
    // const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newWeight = e.target.value;
    //     setWeight(newWeight);
    //     handleUpdate({weight: newWeight});
    // };
    //
    // const handleMPerSkeinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newMPerSkein = Number(e.target.value);
    //     setMPerSkein(newMPerSkein);
    //     handleUpdate({mPerSkein: newMPerSkein});
    // };
    //
    // const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newMaterial = e.target.value;
    //     setMaterial(newMaterial);
    //     handleUpdate({material: newMaterial});
    // };
    //
    // const handleHooksizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newHooksize = Number(e.target.value);
    //     setHooksize(newHooksize);
    //     handleUpdate({hooksize: newHooksize});
    // };
    //
    // const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const newColor = e.target.value;
    //     setColor(newColor);
    //     handleUpdate({color: newColor});
    // };

    return (
        <div className="yarn-settings-group">
            <form className="yarn-settings-group">
                <h1>Yarn settings</h1>
                <div className="input-text">
                    <label>Name: </label>
                    <input
                        type="text"
                        id="part"
                        value={name ?? ""}
                        onChange={(e) => {
                            setName(e.target.value)
                        }}
                        required={true}
                        placeholder="Name of the yarn"
                    />
                </div>
                <div className="input-text">
                    <label>Yarn weight: </label>
                    <select
                        id="part"
                        value={weight ?? null}
                        onChange={(e) => {setWeight(e.target.value)}}
                        required={true}
                    >
                        <option value={null}>
                            Select yarn weight
                        </option>
                        {yarnWeights.map((yarnWeight) => (
                            <option key={yarnWeight.value} value={yarnWeight.value}>
                                {yarnWeight.value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="input-text">
                    <label>Meters per skein: </label>
                    <input
                        type="number"
                        id="part"
                        value={mPerSkein ?? ""}
                        onChange={(e) => {
                            setMPerSkein(Number(e.target.value))
                        }}
                        required={true}
                        placeholder="Meters per skein"
                        min={0}
                        step={1}
                    />
                </div>
                <div className="input-text">
                    <label>Hooksize: </label>
                    <input
                        type="number"
                        id="part"
                        value={hooksize ?? ""}
                        onChange={(e) => {
                            setHooksize(Number(e.target.value))
                        }}
                        required={true}
                        placeholder="Hooksize"
                        min={0}
                        step={0.1}
                    />
                </div>
                <div className="input-text">
                    <label>Material: </label>
                    <input
                        type="text"
                        id="part"
                        value={material ?? ""}
                        onChange={(e) => {
                            setMaterial(e.target.value)
                        }}
                        required={true}
                        placeholder="Material of the yarn"
                    />
                </div>
                <div className="input-text">
                    <label>Color: </label>
                    <input
                        type="text"
                        id="part"
                        value={color ?? ""}
                        onChange={(e) => {
                            setColor(e.target.value)
                        }}
                        required={true}
                        placeholder="Color of the yarn"
                    />
                </div>
            </form>
            <Button variant="contained" color="inherit"
                    sx={{width: 1, backgroundColor: "#F2F3AE", marginBottom: "10px"}}
                    onClick={saveToFirestore}>Save</Button>
        </div>
    )
}