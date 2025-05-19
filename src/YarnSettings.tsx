import {useEffect, useState} from "react";
import {Button} from "@mui/material";

export default function YarnSettings({onUpdateYarnInfo, yarnInfo} : {onUpdateYarnInfo: any,  yarnInfo: {id: number, name: string, weight: number, mPerSkein: number, hooksize: number, material: string, color: string}}) {
    const [name, setName] = useState<string | null>(null);
    const [weight, setWeight] = useState<number | null>(null);
    const [mPerSkein, setMPerSkein] = useState<number | null>(null);
    const [material, setMaterial] = useState<string | null>(null);
    const [hooksize, setHooksize] = useState<number | null>(null);
    const [color, setColor] = useState<string | null>(null);

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
        setName(yarnInfo.name);
        setWeight(yarnInfo.weight);
        setMPerSkein(yarnInfo.mPerSkein);
        setHooksize(yarnInfo.hooksize);
        setMaterial(yarnInfo.material);
        setColor( yarnInfo.color);
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        handleUpdate({name: newName});
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWeight = e.target.value;
        setWeight(newWeight);
        handleUpdate({weight: newWeight});
    };

    const handleMPerSkeinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMPerSkein = e.target.value;
        setMPerSkein(newMPerSkein);
        handleUpdate({mPerSkein: newMPerSkein});
    };

    const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaterial = e.target.value;
        setMaterial(newMaterial);
        handleUpdate({material: newMaterial});
    };

    const handleHooksizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHooksize = e.target.value;
        setHooksize(newHooksize);
        handleUpdate({hooksize: newHooksize});
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColor(newColor);
        handleUpdate({color: newColor});
    };

    console.log(name);

    return (
        <div>
            <form>
                <h1>Yarn settings</h1>
                <div className="input-text">
                    <label>Name: </label>
                    <input
                        type="text"
                        id="part"
                        value={name ?? ""}
                        onChange={handleNameChange}
                        required={true}
                        placeholder="Name of the yarn"
                    />
                </div>
                <div className="input-text">
                    <label>Yarn weight: </label>
                    <input
                        type="number"
                        id="part"
                        value={weight ?? ""}
                        onChange={handleWeightChange}
                        required={true}
                        placeholder="Yarn weight"
                        min={0}
                        step={1}
                    />
                </div>
                <div className="input-text">
                    <label>Meters per skein: </label>
                    <input
                        type="number"
                        id="part"
                        value={mPerSkein ?? ""}
                        onChange={handleMPerSkeinChange}
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
                        onChange={handleHooksizeChange}
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
                        onChange={handleMaterialChange}
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
                        onChange={handleColorChange}
                        required={true}
                        placeholder="Color of the yarn"
                    />
                </div>
            </form>
        </div>
    )
}