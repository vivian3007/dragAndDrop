import { memo } from "react";
import { Button, IconButton, Slider } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import type { Stripe } from "../patterns/colorChanges";
import { useT } from "../i18n/LanguageProvider";

// Kleurwissels van een vorm: banen in een andere kleur, elk met een kleur en een bereik in de
// haakvolgorde (0% = ronde 1, 100% = laatste ronde; zie patterns/colorChanges.ts). Wat begin
// en eind zijn verschilt per vorm (bij een bol de top, bij een cilinder de bodem); dat staat
// erbij.
const StripeEditor = ({ shape, onChange }: { shape: Shape; onChange: (stripes: Stripe[]) => void }) => {
    const t = useT();
    const stripes = shape.stripes ?? [];

    const update = (index: number, change: Partial<Stripe>) =>
        onChange(stripes.map((stripe, i) => (i === index ? { ...stripe, ...change } : stripe)));

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t(`stripes.direction.${shape.type}`)}</p>
            {stripes.map((stripe, index) => (
                <div key={index} className="stripe-row">
                    <input
                        type="color"
                        className="stripe-color"
                        value={stripe.color}
                        onChange={(event) => update(index, { color: event.target.value })}
                        aria-label={t("stripes.color")}
                    />
                    <Slider
                        size="small"
                        value={[Math.round(stripe.from * 100), Math.round(stripe.to * 100)]}
                        onChange={(_, value) => {
                            const [from, to] = value as number[];
                            update(index, { from: from / 100, to: to / 100 });
                        }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                        disableSwap
                        getAriaLabel={(thumb) => t(thumb === 0 ? "stripes.from" : "stripes.to")}
                        sx={{ color: "var(--color-primary)", mx: 1 }}
                    />
                    <IconButton size="small" onClick={() => onChange(stripes.filter((_, i) => i !== index))} aria-label={t("stripes.remove")}>
                        <Delete fontSize="small" />
                    </IconButton>
                </div>
            ))}
            <Button
                size="small"
                startIcon={<Add />}
                onClick={() => onChange([...stripes, { from: 0.4, to: 0.6, color: "#ffffff" }])}
                sx={{ color: "var(--color-primary)", flexDirection: "row" }}
            >
                {t("stripes.add")}
            </Button>
        </div>
    );
};

export default memo(StripeEditor);
