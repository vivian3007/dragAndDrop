import { memo } from "react";
import { Button, Slider } from "@mui/material";
import { MAX_OPENING, MIN_OPENING, sphereOpening } from "../geometry/sphereOpening";
import { shapeDimensionCm } from "../geometry/units";
import { useT } from "../i18n/LanguageProvider";

// Opening van een open bol (zie geometry/sphereOpening.ts): hoe breed, en of hij boven of onder zit.
// Boven/onder draait de bol om; met Aansluiten draait een open bol z'n opening vanzelf naar de
// vorm waar hij aan vastzit (bv. een snuit tegen het hoofd).
const SphereOpeningEditor = ({ shape, onChange }: { shape: Shape; onChange: (changes: Partial<Shape>) => void }) => {
    const t = useT();
    const opening = sphereOpening(shape);
    const sizes = [shapeDimensionCm(shape, "width"), shapeDimensionCm(shape, "height"), shapeDimensionCm(shape, "length")].sort((a, b) => a - b);
    const openingCm = Math.round(opening * ((sizes[0] + sizes[1]) / 2) * 2) / 2;
    const upsideDown = Math.abs(Math.abs(shape.rotation_x ?? 0) - 180) < 1 && !(shape.rotation_z ?? 0);

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t("opening.hint")}</p>
            <span className="stripe-range-label">{t("opening.size", { cm: openingCm })}</span>
            <Slider
                size="small"
                min={MIN_OPENING * 100}
                max={MAX_OPENING * 100}
                step={5}
                value={Math.round(opening * 100)}
                onChange={(_, value) => onChange({ opening: (value as number) / 100 })}
                aria-label={t("opening.title")}
                sx={{ color: "var(--color-primary)" }}
            />
            <div className="opening-buttons">
                    <Button
                        size="small"
                        variant={upsideDown ? "contained" : "outlined"}
                        onClick={() => onChange({ rotation_x: 180, rotation_y: 0, rotation_z: 0 })}
                    >
                        {t("opening.top")}
                    </Button>
                    <Button
                        size="small"
                        variant={!upsideDown && !(shape.rotation_x ?? 0) && !(shape.rotation_z ?? 0) ? "contained" : "outlined"}
                        onClick={() => onChange({ rotation_x: 0, rotation_y: 0, rotation_z: 0 })}
                    >
                        {t("opening.bottom")}
                    </Button>
            </div>
        </div>
    );
};

export default memo(SphereOpeningEditor);
