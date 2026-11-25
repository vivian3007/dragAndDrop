import { useMemo } from "react";
import { useIntl } from "react-intl";
import { PatternTerms } from "../patterns/patternTerms";

// Bouwt de haaktermen voor de patroongenerators uit de huidige taal. Het object verandert
// alleen bij een taalwissel, zodat het veilig in een useEffect-dependency kan.
export function usePatternTerms(): PatternTerms {
    const intl = useIntl();
    return useMemo(
        () => ({
            row: (row) => intl.formatMessage({ id: "pattern.row" }, { row: String(row) }),
            sc: (count) => intl.formatMessage({ id: "pattern.stitch.sc" }, { count }),
            inc: (count) => intl.formatMessage({ id: "pattern.stitch.inc" }, { count }),
            dec: (count) => intl.formatMessage({ id: "pattern.stitch.dec" }, { count }),
            scBackLoop: (count) => intl.formatMessage({ id: "pattern.stitch.scBackLoop" }, { count }),
            ovalStart: (chains, middle) => intl.formatMessage({ id: "pattern.ovalStart" }, { chains, middle }),
            tubeStart: (chains) => intl.formatMessage({ id: "pattern.tubeStart" }, { chains }),
            flatRow: (row) => intl.formatMessage({ id: "pattern.flatRow" }, { row: String(row) }),
            rowsStart: (chains, stitches) => intl.formatMessage({ id: "pattern.rowsStart" }, { chains, stitches }),
            magicRing: (stitches) => intl.formatMessage({ id: "pattern.magicRingStart" }, { stitches: intl.formatMessage({ id: "pattern.stitch.sc" }, { count: stitches }) }),
            ch: (count) => intl.formatMessage({ id: "pattern.stitch.ch" }, { count }),
            slst: (count) => intl.formatMessage({ id: "pattern.stitch.slst" }, { count }),
            hdc: (count) => intl.formatMessage({ id: "pattern.stitch.hdc" }, { count }),
            dc: (count) => intl.formatMessage({ id: "pattern.stitch.dc" }, { count }),
            tr: (count) => intl.formatMessage({ id: "pattern.stitch.tr" }, { count }),
            phrase: (id, values) => intl.formatMessage({ id: `pattern.phrase.${id}` }, values),
        }),
        [intl]
    );
}
