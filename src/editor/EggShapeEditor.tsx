import { memo } from "react";
import { Button, Slider } from "@mui/material";
import { eggTaper, MAX_TAPER } from "../geometry/eggShape";
import { useT } from "../i18n/LanguageProvider";

// Ei of peer (zie geometry/eggShape.ts): hoe sterk de bol aan één kant smaller toeloopt, en (bij
// een dichte bol) of die smalle kant boven of onder zit. Smal boven draait de bol om, net als
// "Opening boven" bij de open bol; bij een open bol zit de smalle kant altijd bij de opening.
const EggShapeEditor = ({ shape, onChange }: { shape: Shape; onChange: (changes: Partial<Shape>) => void }) => {
    const t = useT();
    const taper = eggTaper(shape);
    const label = taper === 0 ? "egg.ball" : taper < 0.4 ? "egg.egg" : "egg.pear";
    const upsideDown = Math.abs(Math.abs(shape.rotation_x ?? 0) - 180) < 1 && !(shape.rotation_z ?? 0);
    const upright = !(shape.rotation_x ?? 0) && !(shape.rotation_z ?? 0);

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t(shape.type === "OpenSphere" ? "egg.hintOpen" : "egg.hint")}</p>
            <span className="stripe-range-label">{t(label)}</span>
            <Slider
                size="small"
                min={0}
                max={MAX_TAPER * 100}
                step={5}
                value={Math.round(taper * 100)}
                onChange={(_, value) => onChange({ taper: (value as number) / 100 })}
                aria-label={t("egg.title")}
                sx={{ color: "var(--color-primary)" }}
            />
            {shape.type === "Sphere" && taper > 0 && (
                <div className="opening-buttons">
                    <Button
                        size="small"
                        variant={upsideDown ? "contained" : "outlined"}
                        onClick={() => onChange({ rotation_x: 180, rotation_y: 0, rotation_z: 0 })}
                    >
                        {t("egg.narrowTop")}
                    </Button>
                    <Button
                        size="small"
                        variant={upright ? "contained" : "outlined"}
                        onClick={() => onChange({ rotation_x: 0, rotation_y: 0, rotation_z: 0 })}
                    >
                        {t("egg.narrowBottom")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default memo(EggShapeEditor);
