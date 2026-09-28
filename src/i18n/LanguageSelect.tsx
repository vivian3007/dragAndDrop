import { useMemo } from "react";
import { MenuItem, Select } from "@mui/material";
import { AVAILABLE_LOCALES, useLanguage, useT } from "./LanguageProvider";

// Toont elke taal in haar eigen taal ("Nederlands", "Deutsch", "Français"), zodat iemand
// die de huidige taal niet leest zijn eigen taal toch terugvindt.
function nativeLanguageName(locale: string) {
    try {
        const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
        return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    } catch {
        return locale;
    }
}

const LanguageSelect = ({ variant = "light" }: { variant?: "light" | "dark" }) => {
    const { locale, setLocale } = useLanguage();
    const t = useT();

    const options = useMemo(
        () => AVAILABLE_LOCALES.map((code) => ({ code, label: nativeLanguageName(code) })),
        []
    );

    const color = variant === "light" ? "var(--color-bg)" : "var(--color-text)";

    return (
        <Select
            size="small"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            inputProps={{ "aria-label": t("language.label") }}
            sx={{
                color,
                minWidth: 130,
                ".MuiOutlinedInput-notchedOutline": { borderColor: color, opacity: 0.6 },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: color, opacity: 1 },
                ".MuiSvgIcon-root": { color },
            }}
        >
            {options.map((option) => (
                <MenuItem key={option.code} value={option.code} lang={option.code}>
                    {option.label}
                </MenuItem>
            ))}
        </Select>
    );
};

export default LanguageSelect;
