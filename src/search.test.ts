import { describe, expect, it } from "vitest";
import { buildSearchTerms, matchesSearch, normalizeTag, searchFields, serverSearchTerm } from "./searchTerms.js";
import { filterAndSortAmigurumis } from "./filterAmigurumis";

describe("searchTerms (zoeken op Home)", () => {
    it("elk begin van elk woord, in kleine letters en zonder accenten", () => {
        expect(buildSearchTerms("Café Beer")).toEqual(["c", "ca", "caf", "cafe", "b", "be", "bee", "beer"]);
    });

    it("tags tellen mee; '#' en hoofdletters doen er niet toe", () => {
        expect(normalizeTag("#Animal")).toBe("animal");
        expect(searchFields("Snake", ["#Venomous", "venomous"]).tagsLower).toEqual(["venomous"]);
    });

    it("de server zoekt op het langste woord, de app controleert de rest", () => {
        expect(serverSearchTerm("de grote beer")).toBe("grote");
        expect(serverSearchTerm("   ")).toBeNull();
        expect(matchesSearch("Grote bruine beer", [], "beer bru")).toBe(true);
        expect(matchesSearch("Grote bruine beer", [], "beer wit")).toBe(false);
    });
});

const design = (id: string, name: string, tags: string[], extra: Partial<Amigurumi> = {}): Amigurumi => ({
    id, name, tags, height: null, yarn_id: null, user_id: "u", ...extra,
});

describe("filterAndSortAmigurumis (zoeken op de eigen pagina's)", () => {
    const designs = [
        design("1", "Snake", ["Animal"], { favoriteCount: 2 }),
        design("2", "Bruine beer", ["Animal", "Groot"], { favoriteCount: 5 }),
        design("3", "Appel", ["Fruit"]),
    ];

    it("vangt kleine typfouten op", () => {
        expect(filterAndSortAmigurumis(designs, "snaek", [], "newest").map((d) => d.name)).toEqual(["Snake"]);
    });

    it("zoekt ook in tags", () => {
        expect(filterAndSortAmigurumis(designs, "fruit", [], "newest").map((d) => d.name)).toEqual(["Appel"]);
    });

    it("filtert op tags", () => {
        expect(filterAndSortAmigurumis(designs, "", ["Groot"], "newest").map((d) => d.name)).toEqual(["Bruine beer"]);
    });

    it("sorteert op populariteit en op naam", () => {
        expect(filterAndSortAmigurumis(designs, "", [], "popular").map((d) => d.id)).toEqual(["2", "1", "3"]);
        expect(filterAndSortAmigurumis(designs, "", [], "name").map((d) => d.name)).toEqual(["Appel", "Bruine beer", "Snake"]);
    });

    it("'favorieten eerst' gebruikt jouw persoonlijke favorieten", () => {
        expect(filterAndSortAmigurumis(designs, "", [], "favorite", new Set(["3"]))[0].id).toBe("3");
    });
});
