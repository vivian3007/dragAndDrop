import { memo, useMemo } from "react";
import { Button, IconButton, Slider } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { stripeFromRows, stripeRows, type Stripe } from "../patterns/colorChanges";
import { generatePattern } from "../patterns/generators";
import { ROW_HEIGHTS, yarnWeightKey } from "../patterns/estimateYarn";
import { useT } from "../i18n/LanguageProvider";
import { sphereOpening } from "../geometry/sphereOpening";

// Kleurwissels van een vorm: banen in een andere kleur, elk met een kleur en een reeks rondes
// ("ronde 4 t/m 6"), zoals in het patroon. Opgeslagen als fractie van de haakvolgorde (zie
// patterns/colorChanges.ts), zodat een baan op dezelfde plek blijft als de vorm groter wordt;
// het aantal rondes komt uit hetzelfde patroon als op de patroonpagina. Wat ronde 1 is
// verschilt per vorm (bij een bol de top, bij een cilinder de bodem); dat staat erbij.
const StripeEditor = ({ shape, yarnWeight, onChange }: { shape: Shape; yarnWeight: string | null | undefined; onChange: (stripes: Stripe[]) => void }) => {
    const t = useT();
    const stripes = shape.stripes ?? [];
    const totalRows = useMemo(() => {
        const weight = yarnWeightKey(yarnWeight);
        return generatePattern(shape, weight, ROW_HEIGHTS, [])?.rows ?? 1;
    }, [shape, yarnWeight]);

    const update = (index: number, stripe: Stripe) =>
        onChange(stripes.map((current, i) => (i === index ? stripe : current)));

    const addStripe = () => {
        const middle = Math.max(1, Math.round(totalRows / 2));
        onChange([...stripes, stripeFromRows(middle, middle, totalRows, "#ffffff")]);
    };

    return (
        <div className="stripe-editor">
            <p className="stripe-editor-hint">{t(`stripes.direction.${sphereOpening(shape) > 0 ? "SphereOpen" : shape.type}`, { rows: totalRows })}</p>
            {stripes.map((stripe, index) => {
                const { from, to } = stripeRows(stripe, totalRows);
                return (
                    <div key={index} className="stripe-row">
                        <input
                            type="color"
                            className="stripe-color"
                            value={stripe.color}
                            onChange={(event) => update(index, { ...stripe, color: event.target.value })}
                            aria-label={t("stripes.color")}
                        />
                        <div className="stripe-range">
                            <span className="stripe-range-label">
                                {from === to ? t("stripes.row", { row: from }) : t("stripes.rows", { from, to })}
                            </span>
                            <Slider
                                size="small"
                                min={1}
                                max={totalRows}
                                step={1}
                                value={[from, to]}
                                onChange={(_, value) => {
                                    const [newFrom, newTo] = value as number[];
                                    update(index, stripeFromRows(newFrom, newTo, totalRows, stripe.color));
                                }}
                                valueLabelDisplay="auto"
                                disableSwap
                                getAriaLabel={(thumb) => t(thumb === 0 ? "stripes.from" : "stripes.to")}
                                sx={{ color: "var(--color-primary)", mx: 1 }}
                            />
                        </div>
                        <IconButton size="small" onClick={() => onChange(stripes.filter((_, i) => i !== index))} aria-label={t("stripes.remove")}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </div>
                );
            })}
            <Button
                size="small"
                startIcon={<Add />}
                onClick={addStripe}
                sx={{ color: "var(--color-primary)", flexDirection: "row" }}
            >
                {t("stripes.add")}
            </Button>
        </div>
    );
};

export default memo(StripeEditor);
