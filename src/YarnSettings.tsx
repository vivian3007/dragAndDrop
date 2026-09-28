import {forwardRef, memo, useEffect, useImperativeHandle, useState} from "react";
import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {v4 as uuidv4} from "uuid";
import {toast} from "react-toastify";
import { useT } from "./i18n/LanguageProvider";

export type YarnSettingsHandle = {
    save: () => void;
};

const YarnSettings = forwardRef<YarnSettingsHandle, {onUpdateYarnInfo: any,  yarnInfo: {id: number, name: string, weight: string, mPerSkein: number, hooksize: number, material: string, color: string}, onDirtyChange?: (dirty: boolean) => void}>(
    function YarnSettings({onUpdateYarnInfo, yarnInfo, onDirtyChange}, ref) {
    const [name, setName] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [mPerSkein, setMPerSkein] = useState<number | null>(null);
    const [material, setMaterial] = useState<string | null>(null);
    const [hooksize, setHooksize] = useState<number | null>(null);
    const [color, setColor] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const storedAmigurumi = localStorage.getItem("amigurumi");
    const t = useT();

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

            setDirty(false);
            toast.success(t("yarnSettings.saved"));
            console.log("Yarn data saved successfully:", yarnData);
        } catch (error) {
            console.error("Fout bij opslaan yarn:", error);
            toast.error(t("yarnSettings.saveError", { message: (error as Error).message }));
        }
    };

    useImperativeHandle(ref, () => ({
        save: saveToFirestore
    }));

    useEffect(() => {
        if(yarnInfo) {
            setName(yarnInfo.name);
            setWeight(yarnInfo.weight);
            setMPerSkein(yarnInfo.mPerSkein);
            setHooksize(yarnInfo.hooksize);
            setMaterial(yarnInfo.material);
            setColor(yarnInfo.color);
            setDirty(false);
        }
    }, [yarnInfo]);

    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);

    return (
        <form>
            <div className="shape-settings-group">
                <h3 className="shape-settings-title">{t("shapeSettings.general")}</h3>
                <div className="input-text">
                    <label htmlFor="yarn-name">{t("yarn.name")}: </label>
                    <input
                        type="text"
                        id="yarn-name"
                        value={name ?? ""}
                        onChange={(e) => {
                            setName(e.target.value)
                            setDirty(true)
                        }}
                        required={true}
                        placeholder={t("yarnSettings.namePlaceholder")}
                    />
                </div>
                <div className="input-text">
                    <label htmlFor="yarn-material">{t("yarn.material")}: </label>
                    <input
                        type="text"
                        id="yarn-material"
                        value={material ?? ""}
                        onChange={(e) => {
                            setMaterial(e.target.value)
                            setDirty(true)
                        }}
                        required={true}
                        placeholder={t("yarnSettings.materialPlaceholder")}
                    />
                </div>
                <div className="input-text">
                    <label htmlFor="yarn-color">{t("yarn.color")}: </label>
                    <input
                        type="text"
                        id="yarn-color"
                        value={color ?? ""}
                        onChange={(e) => {
                            setColor(e.target.value)
                            setDirty(true)
                        }}
                        required={true}
                        placeholder={t("yarnSettings.colorPlaceholder")}
                    />
                </div>
            </div>
            <div className="shape-settings-group">
                <h3 className="shape-settings-title">{t("yarnSettings.specifications")}</h3>
                <div className="input-text">
                    <label htmlFor="yarn-weight">{t("yarn.weight")}: </label>
                    <select
                        id="yarn-weight"
                        value={weight ?? ""}
                        onChange={(e) => {
                            setWeight(e.target.value)
                            setDirty(true)
                        }}
                        required={true}
                    >
                        <option value="">
                            {t("yarn.weight")}
                        </option>
                        {yarnWeights.map((yarnWeight) => (
                            <option key={yarnWeight.value} value={yarnWeight.value}>
                                {t(`yarnWeight.${yarnWeight.value}`)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="input-text">
                    <label htmlFor="yarn-mPerSkein">{t("yarn.mPerSkein")}: </label>
                    <input
                        type="number"
                        id="yarn-mPerSkein"
                        value={mPerSkein ?? ""}
                        onChange={(e) => {
                            setMPerSkein(Number(e.target.value))
                            setDirty(true)
                        }}
                        required={true}
                        placeholder="50"
                        min={0}
                        step={1}
                    />
                </div>
                <div className="input-text">
                    <label htmlFor="yarn-hooksize">{t("yarnSettings.hooksizeMm")}: </label>
                    <input
                        type="number"
                        id="yarn-hooksize"
                        value={hooksize ?? ""}
                        onChange={(e) => {
                            setHooksize(Number(e.target.value))
                            setDirty(true)
                        }}
                        required={true}
                        placeholder="4"
                        min={0}
                        step={0.1}
                    />
                </div>
            </div>
        </form>
    )
});

export default memo(YarnSettings);
