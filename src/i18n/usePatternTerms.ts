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
        }),
        [intl]
    );
}
