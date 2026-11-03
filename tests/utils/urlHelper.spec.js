import { expect, test } from "vitest";
import { getLawUrlByProvider } from "../../src/utils/urlHelper";

test.each([
	{
		gesetz: `stgb`,
		norm: `242`,
		provider: `dejure`,
		expected: `https://www.dejure.org/gesetze/stgb/242.html`,
	},
	{
		gesetz: `GG`,
		norm: `1`,
		provider: `buzer`,
		expected: `https://www.buzer.de/1_GG.htm`,
	},
	{
		gesetz: `BGB`,
		norm: `2`,
		provider: `lexmea`,
		expected: `https://lexmea.de/gesetz/bgb/2`,
	},
	{
		gesetz: `sog lsa`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
	},
	{
		gesetz: `AVBFernwärmeV`,
		norm: `1`,
		provider: `rewis`,
		expected: `https://rewis.io/gesetze/avbfernwarmev/p/1%2Davbfernwarmev`,
	},
	{
		gesetz: `aabg`,
		norm: `1`,
		provider: `rewis`,
		expected: `https://rewis.io/gesetze/aabg/p/aabg%2D1`,
	},
	{
		gesetz: `GG`,
		norm: `1`,
		provider: `lexmea`,
		expected: `https://lexmea.de/gesetz/gg/art-1`,
	},
	{
		gesetz: `gg`,
		norm: `20`,
		provider: `lexmea`,
		expected: `https://lexmea.de/gesetz/gg/art-20`,
	},
	{
		gesetz: `bgb`,
		norm: `433`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/DE/BGB/433`,
	},
	{
		gesetz: `BGB`,
		norm: `312g`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/DE/BGB/312g`,
	},
	{
		gesetz: `GG`,
		norm: `1`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/DE/GG/Art_1`,
	},
	{
		gesetz: `gg`,
		norm: `20a`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/DE/GG/Art_20a`,
	},
	{
		gesetz: `DSGVO`,
		norm: `6`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/EU/DSGVO/6`,
	},
	{
		gesetz: `AEUV`,
		norm: `101`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/EU/AEUV/101`,
	},
	{
		gesetz: `AGBauGB BW`,
		norm: `1`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/BW/AGBauGB/1`,
	},
	{
		gesetz: `PolG NRW`,
		norm: `1`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/NW/PolG_NRW/1`,
	},
	{
		gesetz: `1. BImSchV`,
		norm: `1`,
		provider: `gesetze.co`,
		expected: `https://gesetze.co/DE/1._BImSchV/1`,
	},
])(
	"getLawUrlByProvider: should returns $expected given $provider, $gesetz, $norm",
	(testData) => {
		const result = getLawUrlByProvider(
			testData.gesetz,
			testData.norm,
			testData.provider
		);
		expect(result).toBe(testData.expected);
	}
);

// LexMea verwendet eigene Slugs und je nach Gesetz ein Präfix für die Norm
test.each([
	{
		gesetz: `SGB V`,
		norm: `5`,
		expected: `https://lexmea.de/gesetz/sgb-v/5`,
		description: "SGB V uses the slug sgb-v",
	},
	{
		gesetz: `1. BImSchV`,
		norm: `1`,
		expected: `https://lexmea.de/gesetz/1-bimschv/1`,
		description: "1. BImSchV uses the slug 1-bimschv",
	},
	{
		gesetz: `BAföG`,
		norm: `7`,
		expected: `https://lexmea.de/gesetz/bafoeg/7`,
		description: "umlauts are transliterated in the slug",
	},
	{
		gesetz: `DSGVO`,
		norm: `6`,
		expected: `https://lexmea.de/gesetz/dsgvo/art-6`,
		description: "DSGVO uses articles",
	},
	{
		gesetz: `BayBO`,
		norm: `2`,
		expected: `https://lexmea.de/gesetz/baybo/art-2`,
		description: "BayBO uses articles",
	},
	{
		gesetz: `GO BY`,
		norm: `29`,
		expected: `https://lexmea.de/gesetz/baygo/art-29`,
		description: "GO BY resolves to the Bavarian Gemeindeordnung",
	},
	{
		gesetz: `BauO NRW`,
		norm: `50`,
		expected: `https://lexmea.de/gesetz/bauo-2018-nrw/50`,
		description: "BauO NRW resolves to BauO 2018 NRW",
	},
	{
		gesetz: `CISG`,
		norm: `25`,
		expected: `https://lexmea.de/gesetz/cisg/article-25`,
		description: "CISG uses the article- prefix",
	},
	{
		gesetz: `UmwStG`,
		norm: `1`,
		expected: ``,
		description: "ambiguous abbreviation (UmwStG 1995 / 2006) creates no link",
	},
	{
		gesetz: `XYZG`,
		norm: `1`,
		expected: ``,
		description: "unknown abbreviation creates no link",
	},
])(
	"getLawUrlByProvider lexmea: $description",
	(testData) => {
		const result = getLawUrlByProvider(testData.gesetz, testData.norm, "lexmea");
		expect(result).toBe(testData.expected);
	}
);

// Additional tests for landesrecht.online URL patterns based on problem statement
test.each([
	{
		gesetz: `POG RP`,
		norm: `7`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/RP/POG/7`,
		description: "POG RP removes Bundesland suffix in path"
	},
	{
		gesetz: `pog rp`,
		norm: `7`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/RP/POG/7`,
		description: "pog rp resolves to canonical casing without suffix"
	},
	{
		gesetz: `ThürBO`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/TH/ThürBO/1`,
		description: "ThürBO keeps canonical casing"
	},
	{
		gesetz: `thürbo`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/TH/ThürBO/1`,
		description: "thürbo lower-case input maps to canonical ThürBO"
	},
	{
		gesetz: `AbgG BW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BW/AbgG/1`,
		description: "AbgG BW removes Bundesland suffix"
	},
	{
		gesetz: `BW AGBMG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BW/AGBMG/1`,
		description: "BW AGBMG removes leading Bundesland prefix"
	},
	{
		gesetz: `PolG NRW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "PolG NRW removes suffix for final path"
	},
	{
		gesetz: `NRW PolG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "NRW PolG reordered input resolves without suffix"
	},
	{
		gesetz: `polg nrw`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "polg nrw lower-case maps to canonical PolG without suffix"
	},
	{
		gesetz: `PolG NW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "PolG NW canonical abbreviation maps to PolG without suffix"
	},
	{
		gesetz: `SOG LSA`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
		description: "SOG LSA removes suffix for Sachsen-Anhalt"
	},
	{
		gesetz: `SOG ST`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
		description: "SOG ST ISO-Code maps to same URL as SOG LSA for Sachsen-Anhalt"
	},
	{
		gesetz: `sog st`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
		description: "sog st lowercase ISO-Code maps to same URL as SOG LSA"
	},
	{
		gesetz: `AbgG MV`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/MV/AbgG/1`,
		description: "AbgG MV removes suffix for Meck-Pomm"
	},
	{
		gesetz: `M-V AbgG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/MV/AbgG/1`,
		description: "M-V AbgG variant converts to canonical AbgG without prefix"
	},
	// Problemfälle aus dem Issue
	{
		gesetz: `BauO Bln`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BE/BauO/1`,
		description: "BauO Bln should resolve to Berlin Bauordnung"
	},
	{
		gesetz: `bauo bln`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BE/BauO/1`,
		description: "bauo bln lowercase should resolve to Berlin Bauordnung"
	},
	{
		gesetz: `KV M-V`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/MV/KV/1`,
		description: "KV M-V should resolve to Meck-Pomm Kommunalverfassung"
	},
	{
		gesetz: `POG RP`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/RP/POG/1`,
		description: "POG RP should resolve to Rheinland-Pfalz Polizeiordnungsbehördengesetz"
	},
	{
		gesetz: `PAG BY`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BY/PAG/1`,
		description: "PAG BY should resolve to Bayern Polizeiaufgabengesetz"
	},
	{
		gesetz: `BbgKVerf`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BB/BbgKVerf/1`,
		description: "BbgKVerf should resolve to Brandenburg"
	},
	{
		gesetz: `BremGebBeitrG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/HB/BremGebBeitrG/1`,
		description: "BremGebBeitrG should resolve to Bremen"
	},
	{
		gesetz: `HmbDG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/HH/HmbDG/1`,
		description: "HmbDG should resolve to Hamburg"
	},
	{
		gesetz: `HessAbgG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/HE/HessAbgG/1`,
		description: "HessAbgG should resolve to Hessen"
	},
	{
		gesetz: `GGO NI`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NI/GGO/1`,
		description: "GGO NI should resolve to Niedersachsen"
	},
	{
		gesetz: `AbgG SL`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/SL/AbgG/1`,
		description: "AbgG SL should resolve to Saarland"
	},
	{
		gesetz: `GO SN`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/SN/GO/1`,
		description: "GO SN should resolve to Sachsen"
	},
	{
		gesetz: `BauVorlVO SH`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/SH/BauVorlVO/1`,
		description: "BauVorlVO SH should resolve to Schleswig-Holstein"
	},
])(
	"getLawUrlByProvider landesrecht.online: $description",
	(testData) => {
		const result = getLawUrlByProvider(
			testData.gesetz,
			testData.norm,
			testData.provider
		);
		expect(result).toBe(testData.expected);
	}
);

// Tests für Rewis.io mit exotischeren Gesetzen (Römische Zahlen, Artikel, EU-Recht, Bindestriche, Landesrecht)
test.each([
	{
		gesetz: `II. BV`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/ii-bv/p/1%2Dii-bv`,
		description: "Zweite Berechnungsverordnung (II. BV) mit römischer Zahl",
	},
	{
		gesetz: `ii. bv`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/ii-bv/p/1%2Dii-bv`,
		description: "ii. bv Kleinbuchstaben-Normalisierung",
	},
	{
		gesetz: `SGB V`,
		norm: `5`,
		expected: `https://rewis.io/gesetze/sgb-5/p/sgb-5%2D5`,
		description: "SGB V mit römischer Ziffer im Gesetzestitel",
	},
	{
		gesetz: `SGB XII`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/sgb-12/p/sgb-12%2D1`,
		description: "SGB XII mit langer römischer Ziffer",
	},
	{
		gesetz: `GG`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/gg/p/gg%2D1`,
		description: "Grundgesetz (Gesetz mit Artikeln)",
	},
	{
		gesetz: `GG`,
		norm: `1`,
		additionalInfo: { absatzrom: "I" },
		expected: `https://rewis.io/gesetze/gg/p/gg%2D1#abs_1`,
		description: "Grundgesetz mit römischem Absatz I in zusätzliche Info",
	},
	{
		gesetz: `DSGVO`,
		norm: `6`,
		expected: `https://rewis.io/gesetze/dsgvo-europaische-union/p/6%2Ddsgvo`,
		description: "DSGVO (europäische Verordnung mit -europaische-union Slug)",
	},
	{
		gesetz: `DSGVO`,
		norm: `6`,
		additionalInfo: { absatz: "1" },
		expected: `https://rewis.io/gesetze/dsgvo-europaische-union/p/6%2Ddsgvo#abs_1`,
		description: "DSGVO mit Absatz 1 Fragment",
	},
	{
		gesetz: `EUV`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/euv-europaische-union/p/1%2Deuv`,
		description: "EUV (europäischer Vertrag)",
	},
	{
		gesetz: `AEUV`,
		norm: `101`,
		expected: `https://rewis.io/gesetze/aeuv-europaische-union/p/101%2Daeuv`,
		description: "AEUV (europäischer Vertrag mit dreistelliger Norm)",
	},
	{
		gesetz: `EG-FGV`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/eg-fgv/p/1%2Deg-fgv`,
		description: "EG-FGV (Gesetz mit Bindestrich im Namen)",
	},
	{
		gesetz: `AltTZG 1996`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/alttzg-1996/p/alttzg-1996%2D1`,
		description: "AltTZG 1996 mit Jahreszahl und Bindestrich im Slug",
	},
	{
		gesetz: `KCanG`,
		norm: `2`,
		expected: `https://rewis.io/gesetze/kcang/p/2%2Dkcang`,
		description: "KCanG (Konsumcannabisgesetz)",
	},
	{
		gesetz: `BayBO`,
		norm: `77`,
		expected: `https://rewis.io/gesetze/baybo-bayern/p/77%2Dbaybo`,
		description: "BayBO (Bayerische Bauordnung mit Landesrechts-Suffix)",
	},
	{
		gesetz: `PAG`,
		norm: `100`,
		expected: `https://rewis.io/gesetze/pag-bayern/p/100%2Dpag`,
		description: "PAG (Bayerisches Polizeiaufgabengesetz)",
	},
	{
		gesetz: `BayVwVfG`,
		norm: `1`,
		expected: `https://rewis.io/gesetze/bayvwvfg-bayern/p/1%2Dbayvwvfg`,
		description: "BayVwVfG (Bayerisches Verwaltungsverfahrensgesetz)",
	},
])(
	"getLawUrlByProvider rewis: $description",
	(testData) => {
		const result = getLawUrlByProvider(
			testData.gesetz,
			testData.norm,
			"rewis",
			testData.additionalInfo
		);
		expect(result).toBe(testData.expected);
	}
);

// Tests für Gesetze.co für alle 16 Bundesländer inkl. Varianten
test.each([
	{
		gesetz: `AGBauGB BW`,
		norm: `1`,
		expected: `https://gesetze.co/BW/AGBauGB/1`,
		description: "Baden-Württemberg (BW)",
	},
	{
		gesetz: `BayAbfG BY`,
		norm: `1`,
		expected: `https://gesetze.co/BY/BayAbfG/1`,
		description: "Bayern (BY)",
	},
	{
		gesetz: `ASOG Bln`,
		norm: `1`,
		expected: `https://gesetze.co/BE/ASOG_Bln/1`,
		description: "Berlin (BE) with variant Bln",
	},
	{
		gesetz: `ASOG BE`,
		norm: `1`,
		expected: `https://gesetze.co/BE/ASOG_Bln/1`,
		description: "Berlin (BE) with canonical BE",
	},
	{
		gesetz: `BbgBO BB`,
		norm: `1`,
		expected: `https://gesetze.co/BB/BbgBO/1`,
		description: "Brandenburg (BB)",
	},
	{
		gesetz: `AGBGB HB`,
		norm: `1`,
		expected: `https://gesetze.co/HB/AGBGB/1`,
		description: "Bremen (HB)",
	},
	{
		gesetz: `BezVG HH`,
		norm: `1`,
		expected: `https://gesetze.co/HH/BezVG/1`,
		description: "Hamburg (HH)",
	},
	{
		gesetz: `GemHVO HE`,
		norm: `1`,
		expected: `https://gesetze.co/HE/GemHVO/1`,
		description: "Hessen (HE)",
	},
	{
		gesetz: `AbfWG M-V`,
		norm: `1`,
		expected: `https://gesetze.co/MV/AbfWG_M-V/1`,
		description: "Mecklenburg-Vorpommern (MV) with variant M-V",
	},
	{
		gesetz: `AbfWG MV`,
		norm: `1`,
		expected: `https://gesetze.co/MV/AbfWG_M-V/1`,
		description: "Mecklenburg-Vorpommern (MV) with canonical MV",
	},
	{
		gesetz: `NAbfG NI`,
		norm: `1`,
		expected: `https://gesetze.co/NI/NAbfG/1`,
		description: "Niedersachsen (NI)",
	},
	{
		gesetz: `BauO NRW`,
		norm: `1`,
		expected: `https://gesetze.co/NW/BauO_NRW/1`,
		description: "Nordrhein-Westfalen (NW) with variant NRW",
	},
	{
		gesetz: `BauO NW`,
		norm: `1`,
		expected: `https://gesetze.co/NW/BauO_NRW/1`,
		description: "Nordrhein-Westfalen (NW) with canonical NW",
	},
	{
		gesetz: `AGBGB RP`,
		norm: `1`,
		expected: `https://gesetze.co/RP/AGBGB/1`,
		description: "Rheinland-Pfalz (RP)",
	},
	{
		gesetz: `AbgG SL`,
		norm: `1`,
		expected: `https://gesetze.co/SL/AbgG_SL/1`,
		description: "Saarland (SL)",
	},
	{
		gesetz: `AGImSchG SN`,
		norm: `1`,
		expected: `https://gesetze.co/SN/AGImSchG/1`,
		description: "Sachsen (SN)",
	},
	{
		gesetz: `AbfG LSA`,
		norm: `1`,
		expected: `https://gesetze.co/ST/AbfG_LSA/1`,
		description: "Sachsen-Anhalt (ST) with variant LSA",
	},
	{
		gesetz: `AbfG ST`,
		norm: `1`,
		expected: `https://gesetze.co/ST/AbfG_LSA/1`,
		description: "Sachsen-Anhalt (ST) with canonical ST",
	},
	{
		gesetz: `SOG LSA`,
		norm: `1`,
		expected: `https://gesetze.co/ST/SOG_LSA/1`,
		description: "Sachsen-Anhalt SOG with variant LSA",
	},
	{
		gesetz: `SOG ST`,
		norm: `1`,
		expected: `https://gesetze.co/ST/SOG_LSA/1`,
		description: "Sachsen-Anhalt SOG with canonical ISO-Code ST",
	},
	{
		gesetz: `sog st`,
		norm: `1`,
		expected: `https://gesetze.co/ST/SOG_LSA/1`,
		description: "sog st lowercase ISO-Code on Gesetze.co",
	},
	{
		gesetz: `AGBGB Schl.-H.`,
		norm: `1`,
		expected: `https://gesetze.co/SH/AGBGB_Schl.-H./1`,
		description: "Schleswig-Holstein (SH) with variant Schl.-H.",
	},
	{
		gesetz: `AGBGB SH`,
		norm: `1`,
		expected: `https://gesetze.co/SH/AGBGB_Schl.-H./1`,
		description: "Schleswig-Holstein (SH) with canonical SH",
	},
	{
		gesetz: `OBG TH`,
		norm: `1`,
		expected: `https://gesetze.co/TH/OBG/1`,
		description: "Thüringen (TH)",
	},
])(
	"getLawUrlByProvider gesetze.co all 16 Bundesländer: $description",
	(testData) => {
		const result = getLawUrlByProvider(testData.gesetz, testData.norm, "gesetze.co");
		expect(result).toBe(testData.expected);
	}
);
