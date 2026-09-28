/// <reference types="vite/client" />
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { IntlProvider, useIntl } from "react-intl";

// Elk JSON-bestand in ./locales is automatisch een beschikbare taal: `de.json` wordt "de",
// `pt-BR.json` wordt "pt-BR". Een taal toevoegen is dus alleen een nieuw bestand, zonder
// codewijziging. Sleutels die in een taal ontbreken vallen terug op het Engels (en.json).
const localeModules = import.meta.glob<Record<string, string>>("./locales/*.json", {
    eager: true,
    import: "default",
});

const MESSAGES: Record<string, Record<string, string>> = Object.fromEntries(
    Object.entries(localeModules).map(([path, messages]) => [path.match(/([\w-]+)\.json$/)![1], messages])
);

const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "locale";

export const AVAILABLE_LOCALES = Object.keys(MESSAGES).sort();

// Volgorde: eerder gekozen taal → taal van de browser (ook "nl-BE" → "nl") → Engels.
// localStorage kan ontbreken of gooien (privévenster, geblokkeerde site-data).
function pickInitialLocale(): string {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && MESSAGES[stored]) {
            return stored;
        }
    } catch {
        // Geen opslag: val door naar de browsertaal.
    }

    const browserLocales = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const browserLocale of browserLocales) {
        if (MESSAGES[browserLocale]) {
            return browserLocale;
        }
        const baseLanguage = browserLocale.split("-")[0];
        if (MESSAGES[baseLanguage]) {
            return baseLanguage;
        }
    }

    return DEFAULT_LOCALE;
}

type LanguageContextValue = {
    locale: string;
    setLocale: (locale: string) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState(pickInitialLocale);

    const setLocale = useCallback((nextLocale: string) => {
        if (!MESSAGES[nextLocale]) {
            return;
        }
        setLocaleState(nextLocale);
        try {
            localStorage.setItem(STORAGE_KEY, nextLocale);
        } catch {
            // Geen opslag: de keuze geldt dan alleen voor deze sessie.
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const messages = useMemo(
        () => ({ ...MESSAGES[DEFAULT_LOCALE], ...MESSAGES[locale] }),
        [locale]
    );

    const contextValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

    return (
        <LanguageContext.Provider value={contextValue}>
            <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                {children}
            </IntlProvider>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

// Korte vorm van intl.formatMessage voor gewone teksten: t("nav.home") of
// t("patterns.deleteConfirm", { name }). Voor teksten met opmaak (<b>…</b>) gebruik je
// <FormattedMessage> met rich-text values.
export function useT() {
    const intl = useIntl();
    return useCallback(
        (id: string, values?: Record<string, string | number>) => intl.formatMessage({ id }, values),
        [intl]
    );
}
