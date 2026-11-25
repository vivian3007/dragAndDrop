import { memo } from "react";
import { Slider } from "@mui/material";
import { MAX_PETALS, MIN_PETALS, petalCount } from "../shapes/motifs";
import { useT } from "../i18n/LanguageProvider";

// Hoeveel blaadjes (bloem) of punten (ster), zie shapes/motifs.ts.
const PetalsEditor = ({ shape, onChange }: { shape: Shape; onChange: (changes: Partial<Shape>) => void }) => {
    const t = useT();
    const petals = petalCount(shape);
    return (
        <div className="stripe-editor">
            <span className="stripe-range-label">{t(`petals.count.${shape.type}`, { count: petals })}</span>
            <Slider
                size="small"
                min={MIN_PETALS}
                max={MAX_PETALS}
                step={1}
                marks
                value={petals}
                onChange={(_, value) => onChange({ petals: value as number })}
                aria-label={t(`petals.title.${shape.type}`)}
                sx={{ color: "var(--color-primary)" }}
            />
        </div>
    );
};

export default memo(PetalsEditor);
