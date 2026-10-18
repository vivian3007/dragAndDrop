import { memo } from "react";
import { Button, Slider } from "@mui/material";
import { EMBROIDERY_DETAILS, embroideryDefaults, embroideryDetail } from "../patterns/embroidery";
import { pixelsPerCm, shapeDimensionCm } from "../geometry/units";
import { useT } from "../i18n/LanguageProvider";

// Borduursel (zie patterns/embroidery.ts): welk detail, en hoe breed en hoog. In millimeters
// precies, want een mondje is maar een paar centimeter; de gewone maatvakjes (hele cm) zijn
// daar te grof voor. Een ander detail kiezen zet maat en kleur terug op die van dat detail.
const EmbroideryEditor = ({ shape, onChange }: { shape: Shape; onChange: (changes: Partial<Shape>) => void }) => {
    const t = useT();
    const detail = embroideryDetail(shape);
    const toUnits = (cm: number) => (cm * pixelsPerCm(shape.type)) / (shape.zoom || 1);

    const sizeSlider = (axis: "width" | "length", min: number, max: number) => {
        const cm = shapeDimensionCm(shape, axis);
        return (
            <>
                <span className="stripe-range-label">{t(`embroidery.${axis}`, { cm: cm.toFixed(1) })}</span>
                <Slider
                    size="small"
                    min={min}
                    max={max}
                    step={0.1}
                    value={Math.round(cm * 10) / 10}
                    onChange={(_, value) => onChange({ [axis]: toUnits(value as number) })}
                    aria-label={t(`embroidery.${axis}`, { cm: cm.toFixed(1) })}
                    sx={{ color: "var(--color-primary)" }}
                />
            </>
        );
    };

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t("embroidery.hint")}</p>
            <div className="opening-buttons embroidery-buttons">
                {EMBROIDERY_DETAILS.map((option) => (
                    <Button
                        key={option}
                        size="small"
                        variant={option === detail ? "contained" : "outlined"}
                        onClick={() => option !== detail && onChange(embroideryDefaults(option))}
                    >
                        {t(`embroidery.detail.${option}`)}
                    </Button>
                ))}
            </div>
            {sizeSlider("width", 0.3, 5)}
            {sizeSlider("length", 0.2, 3)}
        </div>
    );
};

export default memo(EmbroideryEditor);
