import { buzerGesetzeLowerCased } from "../static/buzerGesetze";
import { dejureGesetzeLowerCased } from "../static/dejureGesetze";
import { lexmeaGesetzeLowerCased } from "../static/lexmeaGesetze";
import {
	Landesgesetze_mit_Namen,
	Landesgesetze_mit_NamenLowerCased,
} from "../static/Landesgesetze_mit_Namen";
import { rewisGesetzeLowerCased } from "../static/rewisGesetze";
import { LawProviderOption, LawProviderOptions } from "../types/providerOption";
import { DejureUrl, LawProviderUrl } from "../types/url";

// Zusätzliche Informationsstruktur für Norm-Verlinkung (statt any für Sicherheit/Lesbarkeit)
interface AdditionalInfo {
	absatz?: string;      // z.B. "1" oder "2"
	absatzrom?: string;   // römische Ziffer, die konvertiert wird (z.B. "II")
	satz?: string;        // Satznummer
	nr?: string;          // Nummer
	isArticle?: boolean;  // true wenn es sich um einen Artikel (Art.) handelt, false für Paragraph (§)
	[key: string]: unknown; // flexible Erweiterbarkeit, ohne vollständige Typisierung zu verlieren
}

// Mapping von Bundesland-Abkürzungen zu vollständigen Namen für landesrecht.online URLs
const bundeslandAbbreviations: { [key: string]: string } = {
	"BW": "Baden-Württemberg",
	"BY": "Bayern", 
	"BE": "Berlin",
	"BB": "Brandenburg",
	"HB": "Bremen",
	"HH": "Hamburg",
	"HE": "Hessen",
	"MV": "Mecklenburg-Vorpommern",
	"NI": "Niedersachsen",
	"NW": "Nordrhein-Westfalen",
	"RP": "Rheinland-Pfalz",
	"SL": "Saarland",
	"SN": "Sachsen",
	"ST": "Sachsen-Anhalt",
	"SH": "Schleswig-Holstein",
	"TH": "Thüringen"
};

// Zusätzliche geläufige (inoffizielle) Kürzel-/Varianten, die entfernt werden sollen,
// wenn das kanonische Bundeslandkürzel bereits als eigenes URL-Segment verwendet wird.
// Alle Werte sind lowercased für einfacheren Vergleich.
const bundeslandVariantTokens: { [canonicalAbbr: string]: string[] } = {
	// Nordrhein-Westfalen
	NW: ["nrw", "nw"],
	// Baden-Württemberg (gelegentlich ohne Bindestrich oder vereinfacht)
	BW: ["badw", "bawü", "bawue"],
	// Berlin
	BE: ["bln", "be"],
	// Sachsen-Anhalt
	ST: ["lsa", "sa"],
	// Mecklenburg-Vorpommern
	MV: ["m-v"],
	// Rheinland-Pfalz
	RP: ["rlp", "rp"],
	// Saarland
	SL: ["sl"],
	// Thüringen
	TH: ["th"],
	//Bremen
	HB: ["hb"],
	// Hamburg
	HH: ["hh"],
	//Bayern
	BY: ["bay", "by"],
	//Hessen
	HE: ["hes"],
	//Schleswig-Holstein
	SH: ["sh", "schl.-h."],
	//Niedersachsen
	NI: ["nds", "ni"],
	//Brandenburg
	BB: ["bb"],
	//Sachsen
	SN: ["sn"],
};

// Liste der Gesetze, die Artikel (Art.) statt Paragraphen (§) verwenden
// Dies umfasst insbesondere: Grundgesetz, EU-Vorschriften, internationale Verträge, Verfassungen
// Hinweis: Diese Liste enthält Gesetze, die prinzipiell Artikel verwenden. Nicht alle sind in LexMea verfügbar.
// Die isArticle-Flag aus der Transformation überschreibt diese Liste wenn explizit Art. erkannt wird.
const lawsUsingArticles = new Set([
	"gg",           // Grundgesetz (in LexMea verfügbar)
	"wrv",          // Weimarer Reichsverfassung (in LexMea verfügbar)
	"dsgvo",        // Datenschutz-Grundverordnung (nicht in LexMea, aber würde Art. verwenden)
	"euv",          // Vertrag über die Europäische Union (nicht in LexMea, aber würde Art. verwenden)
	"aeuv",         // Vertrag über die Arbeitsweise der EU (nicht in LexMea, aber würde Art. verwenden)
	"grch",         // Grundrechtecharta der Europäischen Union
	"dma",          // Digital Markets Act
	"dsa",          // Digital Services Act
	"dga",          // Digital Governance Act
	"rom-i-vo",    // Rom-I-Verordnung
	"rom-ii-vo",   // Rom-II-Verordnung
]);

const normalizeBundeslandToken = (token: string): string =>
	token
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z]/gi, "")
		.toLowerCase();

const bundeslandTokensNormalized: Set<string> = new Set([
	...Object.keys(bundeslandAbbreviations).map((abbr) => normalizeBundeslandToken(abbr)),
	...Object.values(bundeslandVariantTokens)
		.flat()
		.map((variant) => normalizeBundeslandToken(variant)),
].filter((value) => value.length > 0));

const stripBundeslandTokensFromLawName = (lawName: string): string => {
	const tokens = lawName.split(/\s+/).filter((token) => token.length > 0);
	const filteredTokens = tokens.filter((token) => {
		const normalized = normalizeBundeslandToken(token);
		return normalized.length === 0 || !bundeslandTokensNormalized.has(normalized);
	});

	const sanitized = filteredTokens.join(" ").trim();
	return sanitized.length > 0 ? sanitized : lawName.trim();
};

// In einer neuen Datei utils.ts oder direkt in urlHelper.ts
function romanToArabic(roman: string): number {
	const romanValues: { [key: string]: number } = {
		I: 1,
		V: 5,
		X: 10,
		L: 50,
		C: 100,
		D: 500,
		M: 1000,
	};

	let result = 0;

	for (let i = 0; i < roman.length; i++) {
		const current = romanValues[roman[i]];
		const next = i + 1 < roman.length ? romanValues[roman[i + 1]] : 0;

		if (current >= next) {
			result += current;
		} else {
			result -= current;
		}
	}

	return result;
}

function getDejureUrl(
	gesetz: string,
	norm: string,
	additionalInfo?: AdditionalInfo
): string {
	const lawUrl = DejureUrl.LAW;
	gesetz = gesetz.toLowerCase();

	// Entferne historische Fassungskennzeichnung " a.F." aus dem URL-Slug
	gesetz = gesetz.replace(/\s+a\.f\.$/i, "");

	if (dejureGesetzeLowerCased.indexOf(gesetz) !== -1) {
		let url = `${lawUrl}${gesetz}/${norm}.html`;

		// Anker hinzufügen, wenn zusätzliche Informationen vorhanden sind
		if (additionalInfo) {
			const anchors = [];

			// Absatz verarbeiten (normal oder römisch)
			if (additionalInfo.absatz) {
				anchors.push(`Abs${additionalInfo.absatz}`);
			} else if (additionalInfo.absatzrom) {
				try {
					const arabicNumber = romanToArabic(
						additionalInfo.absatzrom
					);
					anchors.push(`Abs${arabicNumber}`);
				} catch (e) {
					console.error(
						"Fehler bei der Umwandlung der römischen Zahl:",
						e
					);
				}
			}

			// Satz verarbeiten
			if (additionalInfo.satz) {
				anchors.push(`S${additionalInfo.satz}`);
			}

			// Nummer verarbeiten
			if (additionalInfo.nr) {
				anchors.push(`Nr${additionalInfo.nr}`);
			}

			// Anker an URL anhängen, wenn vorhanden
			if (anchors.length > 0) {
				url += "#" + anchors.join(":");
			}
		}

		return url;
	}

	return "";
}

function getBuzerUrl(gesetz: string, norm: string): string {
	const lawUrl = LawProviderUrl.BUZER;
	gesetz = gesetz.toLowerCase();

	const lawEntry = buzerGesetzeLowerCased[gesetz];
	const normPath = lawEntry?.norms?.[norm];
	if (normPath) {
		return `${lawUrl}${normPath}`;
	}
	return "";
}

function getLexmeaUrl(gesetz: string, norm: string, additionalInfo?: AdditionalInfo): string {
	const lawUrl = LawProviderUrl.LEXMEA;
	gesetz = gesetz.toLowerCase();

	if (lexmeaGesetzeLowerCased.indexOf(gesetz) !== -1) {
		// Prüfe, ob das Gesetz Artikel verwendet oder ob explizit isArticle=true übergeben wurde
		const usesArticles = lawsUsingArticles.has(gesetz) || additionalInfo?.isArticle === true;
		
		// Für Gesetze mit Artikeln, füge "art-" vor der Normnummer hinzu
		const normPath = usesArticles ? `art-${norm}` : norm;
		
		return `${lawUrl}${gesetz}/${normPath}`;
	}
	return "";
}

function getLandesrechtOnlineUrl(
	gesetz: string,
	norm: string,
	additionalInfo?: AdditionalInfo
): string {
	// Basic input validation to avoid constructing malformed URLs.
	if (
		typeof gesetz !== "string" ||
		typeof norm !== "string" ||
		gesetz.trim().length === 0 ||
		norm.trim().length === 0
	) {
		return "";
	}

	const baseUrl = "https://landesrecht.online/";
	const originalGesetz = gesetz;
	gesetz = gesetz.toLowerCase();

	// Suche das Gesetz in allen Bundesländern (inkl. Rekonstruktion bei führender/verschobener Abkürzung)
	let foundBundesland: string | null = null;
	let foundGesetzKey: string | null = null;

	for (const [bundesland, laws] of Object.entries(Landesgesetze_mit_NamenLowerCased)) {
		const lawExists = (lawKey: string): boolean => {
			const normalizedKey = lawKey.trim().toLowerCase();
			if (!normalizedKey) {
				return false;
			}
			return Boolean(laws[normalizedKey]);
		};

		if (lawExists(gesetz)) {
			foundBundesland = bundesland;
			foundGesetzKey = gesetz;
			break;
		}

		// Wenn kein direkter Treffer: Prüfe Rekonstruktionsvarianten
		// Beispiel: Eingabe "nrw polg" -> Dataset-Schlüssel "polg nrw"
		const tokens = gesetz.split(/\s+/);
		if (tokens.length > 1) {
			const first = tokens[0];
			const last = tokens[tokens.length - 1];
			// Liste aller bekannten Abkürzungen + Varianten
			const allCanonical = Object.keys(bundeslandAbbreviations).map(a => a.toLowerCase());
			const allVariants = Object.values(bundeslandVariantTokens).flat().map(v => v.toLowerCase());
			const allKnown = new Set([...allCanonical, ...allVariants]);

			// Helper zum Testen einer Liste möglicher Schlüsselvarianten
			const testKeys = (candidates: string[]) => {
				for (const candidate of candidates) {
					if (lawExists(candidate)) {
						foundBundesland = bundesland;
						foundGesetzKey = candidate;
						return true;
					}
				}
				return false;
			};

			// Fall 1: Führendes Kürzel -> verschiebe ans Ende und teste + ersetze ggf. kanonisch -> Varianten
			if (allKnown.has(first)) {
				const base = tokens.slice(1);
				// Wenn first kanonisch ist und Varianten existieren -> alle Varianten testen
				const canonicalEntry = Object.entries(bundeslandVariantTokens).find(([abbr]) => abbr.toLowerCase() === first);
				const variantList = canonicalEntry ? canonicalEntry[1] : [];
				const candidates = [first, ...variantList].map(x => [...base, x].join(" "));
				if (testKeys(candidates)) {
					break;
				}
			}
			// Fall 2: Endendes Kürzel -> verschiebe an den Anfang und teste (symmetrisch, inklusive Varianten)
			if (allKnown.has(last)) {
				const base = tokens.slice(0, -1);
				const baseKey = base.join(" ").trim();
				if (baseKey && lawExists(baseKey)) {
					foundBundesland = bundesland;
					foundGesetzKey = baseKey;
					break;
				}
				const canonicalEntry = Object.entries(bundeslandVariantTokens).find(([abbr]) => abbr.toLowerCase() === last);
				const variantList = canonicalEntry ? canonicalEntry[1] : [];
				const candidates = [last, ...variantList].map(x => [x, ...base].join(" "));
				if (testKeys(candidates)) {
					break;
				}

				// Zusätzlich: Prüfe Variante am Ende (z.B. Eingabe "polg nw" -> Dataset "polg nrw")
				if (variantList.length) {
					const endCandidates = variantList.map(v => [...base, v].join(" "));
					if (testKeys(endCandidates)) {
						break;
					}
				}
			}

			// Spezialfall: Führende Variante (z.B. "m-v abgg") -> Rekonstruiere "abgg mv"
			if (!foundBundesland && !foundGesetzKey && tokens.length > 1) {
				const firstLower = tokens[0].toLowerCase();
				for (const [canonical, variants] of Object.entries(bundeslandVariantTokens)) {
					if (variants.includes(firstLower)) {
						const reconstructed = [...tokens.slice(1), canonical.toLowerCase()].join(" ");
						if (lawExists(reconstructed)) {
							foundBundesland = bundesland;
							foundGesetzKey = reconstructed;
							break;
						}
						// auch Variante ans Ende setzen ("abgg m-v")
						const reconstructedVariant = [...tokens.slice(1), firstLower].join(" ");
						if (lawExists(reconstructedVariant)) {
							foundBundesland = bundesland;
							foundGesetzKey = reconstructedVariant;
							break;
						}
					}
				}
				if (foundBundesland && foundGesetzKey) {
					break;
				}
			}
		}
	}

	if (!foundBundesland || !foundGesetzKey) {
		return "";
	}

	const normalizedGesetzKey = foundGesetzKey.trim();
	const originalLawNameTrimmed = originalGesetz.trim();

	// Ermittele den kanonischen Gesetzesnamen (inkl. möglichem Bundesland-Suffix) aus dem Datensatz
	let canonicalLawName: string | null = null;
	const canonicalLawEntries = Landesgesetze_mit_Namen[foundBundesland];
	if (canonicalLawEntries) {
		const datasetKey = Object.keys(canonicalLawEntries).find(
			key => key.toLowerCase() === normalizedGesetzKey
		);
		if (datasetKey) {
			canonicalLawName = datasetKey;
		}
	}

	// Finde die Bundesland-Abkürzung
	const bundeslandAbbr = Object.keys(bundeslandAbbreviations).find(
		abbr => bundeslandAbbreviations[abbr] === foundBundesland
	);

	// Wähle den zu verwendenden Gesetzesnamen für den URL-Pfad
	let finalLawName = canonicalLawName ?? (originalLawNameTrimmed.length > 0 ? originalLawNameTrimmed : normalizedGesetzKey);

	if (!canonicalLawName && bundeslandAbbr) {
		// Kein kanonischer Eintrag gefunden -> entferne nur bekannte Varianten aus der Eingabe
		const variantList = bundeslandVariantTokens[bundeslandAbbr] || [];
		const removableTokens = new Set(
			[bundeslandAbbr.toLowerCase(), ...variantList.map(v => v.toLowerCase())]
		);
		const cleaned = originalLawNameTrimmed
			.split(/\s+/)
			.filter(token => !removableTokens.has(token.toLowerCase()))
			.join(" ")
			.trim();
		if (cleaned.length > 0) {
			finalLawName = cleaned;
		}
	}

	let sanitizedFinalLawName = stripBundeslandTokensFromLawName(finalLawName).trim();
	if (sanitizedFinalLawName.length === 0) {
		sanitizedFinalLawName = stripBundeslandTokensFromLawName(originalLawNameTrimmed).trim();
	}
	if (sanitizedFinalLawName.length === 0) {
		sanitizedFinalLawName = stripBundeslandTokensFromLawName(normalizedGesetzKey).trim();
	}
	finalLawName = sanitizedFinalLawName.length > 0 ? sanitizedFinalLawName : normalizedGesetzKey.trim();

	// Bestimme die URL-Struktur basierend auf verfügbaren Informationen
	if (bundeslandAbbr) {
		return `${baseUrl}${bundeslandAbbr}/${finalLawName}/${norm}`;
	}

	return `${baseUrl}${finalLawName}/${norm}`;
}

function getRewisUrl(
	gesetz: string,
	norm: string,
	additionalInfo?: AdditionalInfo
): string {
	const lawUrl = LawProviderUrl.REWIS;
	gesetz = gesetz.toLowerCase();
	const foundGesetz = rewisGesetzeLowerCased[gesetz];

	if (!foundGesetz) {
		return "";
	}

	let url = "";
	if (foundGesetz.lawNormOrder) {
		url =
			`${lawUrl}${foundGesetz.url}/p/${foundGesetz.url}-${norm}`.replace(
				"-",
				"%2D"
			);
	} else {
		url = `${lawUrl}${foundGesetz.url}/p/${norm}-${foundGesetz.url.replace(
			"-europaische-union",
			""
		)}`.replace("-", "%2D");
	}

	// Fragment-Identifier #abs_ nur anhängen wenn zusätzliche Informationen vorhanden sind
	if (additionalInfo) {
		// Absatz hinzufügen (normal oder römisch)
		if (additionalInfo.absatz) {
			url += "#abs_" + additionalInfo.absatz;
		} else if (additionalInfo.absatzrom) {
			try {
				const arabicNumber = romanToArabic(additionalInfo.absatzrom);
				url += "#abs_" + arabicNumber;
			} catch (e) {
				console.error(
					"Fehler bei der Umwandlung der römischen Zahl:",
					e
				);
			}
		}
	}

	return url;
}

function getLawUrlByProvider(
	gesetz: string,
	norm: string,
	lawProvider: LawProviderOption,
	additionalInfo?: AdditionalInfo
): string {
	if (lawProvider === "dejure") {
		return getDejureUrl(gesetz, norm, additionalInfo) || "";
	}

	if (lawProvider === "buzer") {
		return getBuzerUrl(gesetz, norm) || "";
	}

	if (lawProvider === "lexmea") {
		return getLexmeaUrl(gesetz, norm, additionalInfo) || "";
	}

	if (lawProvider === "landesrecht.online") {
		return (
			getLandesrechtOnlineUrl(gesetz, norm, additionalInfo) || ""
		);
	}

	if (lawProvider === "rewis") {
		return getRewisUrl(gesetz, norm, additionalInfo) || "";
	}

	return "";
}

function getLawUrlByProviderOptions(
	gesetz: string,
	norm: string,
	lawProviders: LawProviderOptions,
	additionalInfo?: AdditionalInfo
): string {
	let lawUrl = getLawUrlByProvider(
		gesetz,
		norm,
		lawProviders.firstOption,
		additionalInfo
	);
	if (lawUrl) {
		return lawUrl;
	}

	if (lawProviders.secondOption) {
		lawUrl = getLawUrlByProvider(
			gesetz,
			norm,
			lawProviders.secondOption,
			additionalInfo
		);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.thirdOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.thirdOption, additionalInfo);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.forthOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.forthOption, additionalInfo);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.fifthOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.fifthOption, additionalInfo);
		if (lawUrl) {
			return lawUrl;
		}
	}

	return "";
}

export { getLawUrlByProvider, getLawUrlByProviderOptions };
