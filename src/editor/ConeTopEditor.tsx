import { memo } from "react";
import { Slider } from "@mui/material";
import { coneTop, MAX_CONE_TOP } from "../geometry/coneShape";
import { shapeDimensionCm } from "../geometry/units";
import { useT } from "../i18n/LanguageProvider";

// Bovenkant van een kegel (zie geometry/coneShape.ts): een punt, of taps toelopend met een
// platte bovenkant van een bepaalde breedte.
const ConeTopEditor = ({ shape, onChange }: { shape: Shape; onChange: (changes: Partial<Shape>) => void }) => {
    const t = useT();
    const top = coneTop(shape);
    const bottomCm = (shapeDimensionCm(shape, "width") + shapeDimensionCm(shape, "length")) / 2;
    const topCm = Math.round(top * bottomCm * 2) / 2;

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t("coneTop.hint")}</p>
            <span className="stripe-range-label">{top > 0 ? t("coneTop.size", { cm: topCm }) : t("coneTop.point")}</span>
            <Slider
                size="small"
                min={0}
                max={MAX_CONE_TOP * 100}
                step={5}
                value={Math.round(top * 100)}
                onChange={(_, value) => onChange({ topWidth: (value as number) / 100 })}
                aria-label={t("coneTop.title")}
                sx={{ color: "var(--color-primary)" }}
            />
        </div>
    );
};

export default memo(ConeTopEditor);
