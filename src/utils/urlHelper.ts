import { buzerGesetzeLowerCased } from "../static/buzerGesetze";
import { dejureGesetzeLowerCased } from "../static/dejureGesetze";
import { lexmeaGesetzeLowerCased } from "../static/lexmeaGesetze";
import {
	Landesgesetze_mit_Namen,
	Landesgesetze_mit_NamenLowerCased,
} from "../static/Landesgesetze_mit_Namen";
import { rewisGesetzeLowerCased } from "../static/rewisGesetze";
import { gesetzeCoGesetzeLowerCased } from "../static/gesetzeCoGesetze";
import { jurafuchsGesetzeLowerCased } from "../static/jurafuchsGesetze";
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
	BW: ["badw", "bawü", "bawue", "ba-wü"],
	// Berlin
	BE: ["bln", "be"],
	// Sachsen-Anhalt
	ST: ["lsa", "sa", "st"],
	// Mecklenburg-Vorpommern
	MV: ["m-v", "mv"],
	// Rheinland-Pfalz
	RP: ["rlp", "rp", "rh.-pf."],
	// Saarland
	SL: ["saar", "sl"],
	// Thüringen
	TH: ["thür", "th"],
	// Bremen
	HB: ["brem", "hb"],
	// Hamburg
	HH: ["hmb", "ha", "hh"],
	// Bayern
	BY: ["bay", "by"],
	// Hessen
	HE: ["hes", "he"],
	// Schleswig-Holstein
	SH: ["schl.-h.", "sh"],
	// Niedersachsen
	NI: ["nds", "ni"],
	// Brandenburg
	BB: ["bbg", "bb"],
	// Sachsen
	SN: ["sächs", "sn"],
};

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
		const currentChar = roman[i];
		const nextChar = i + 1 < roman.length ? roman[i + 1] : undefined;
		const current = currentChar ? romanValues[currentChar] ?? 0 : 0;
		const next = nextChar ? romanValues[nextChar] ?? 0 : 0;

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

function getLexmeaUrl(gesetz: string, norm: string): string {
	const lawUrl = LawProviderUrl.LEXMEA;
	const lawEntry = lexmeaGesetzeLowerCased[gesetz.toLowerCase()];

	if (!lawEntry) {
		return "";
	}

	// LexMea verwendet eigene Slugs (z.B. "sgb-v" für "SGB V") und je nach Gesetz
	// ein Präfix für die Norm (z.B. "art-1" im GG oder "article-1" im CISG)
	return `${lawUrl}${lawEntry.slug}/${lawEntry.prefix ?? ""}${norm}`;
}

function getLandesrechtOnlineUrl(
	gesetz: string,
	norm: string
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

	const ambiguousUrl = getAmbiguousLandesrechtUrl(gesetz, norm);
	if (ambiguousUrl) {
		return ambiguousUrl;
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

			// Fall 1: Führendes Kürzel -> verschiebe ans Ende und teste + ersetze ggf. kanonisch <-> Varianten
			if (first && allKnown.has(first)) {
				const base = tokens.slice(1);
				const canonicalEntry = Object.entries(bundeslandVariantTokens).find(
					([abbr, variants]) => abbr.toLowerCase() === first || variants.some(v => v.toLowerCase() === first)
				);
				const allTokenVariants = canonicalEntry
					? [canonicalEntry[0].toLowerCase(), ...canonicalEntry[1].map(v => v.toLowerCase())]
					: [first];
				const candidates = allTokenVariants.map(x => [...base, x].join(" "));
				if (testKeys(candidates)) {
					break;
				}
			}
			// Fall 2: Endendes Kürzel -> verschiebe an den Anfang und teste (symmetrisch, inklusive Varianten)
			if (last && allKnown.has(last)) {
				const base = tokens.slice(0, -1);
				const baseKey = base.join(" ").trim();
				if (baseKey && lawExists(baseKey)) {
					foundBundesland = bundesland;
					foundGesetzKey = baseKey;
					break;
				}
				const canonicalEntry = Object.entries(bundeslandVariantTokens).find(
					([abbr, variants]) => abbr.toLowerCase() === last || variants.some(v => v.toLowerCase() === last)
				);
				const allTokenVariants = canonicalEntry
					? [canonicalEntry[0].toLowerCase(), ...canonicalEntry[1].map(v => v.toLowerCase())]
					: [last];
				const startCandidates = allTokenVariants.map(x => [x, ...base].join(" "));
				if (testKeys(startCandidates)) {
					break;
				}

				// Zusätzlich: Prüfe kanonische und alternative Varianten am Ende (z.B. Eingabe "abgg saar" -> Dataset "abgg sl")
				const endCandidates = allTokenVariants.map(v => [...base, v].join(" "));
				if (testKeys(endCandidates)) {
					break;
				}
			}

			// Spezialfall: Führende Variante (z.B. "m-v abgg") -> Rekonstruiere "abgg mv"
			if (!foundBundesland && !foundGesetzKey && tokens.length > 1) {
				const firstLower = tokens[0]?.toLowerCase() ?? "";
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
		url = `${lawUrl}${foundGesetz.url}/p/${foundGesetz.url}%2D${norm}`;
	} else {
		url = `${lawUrl}${foundGesetz.url}/p/${norm}%2D${foundGesetz.url.replace(
			/-europaische-union|-bayern/,
			""
		)}`;
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

// Kleingeschriebenes Länder-Token (kanonisch oder Variante) -> kleingeschriebener ISO-Code
const stateTokenToCode: Map<string, string> = new Map(
	Object.entries(bundeslandVariantTokens).flatMap(([code, variants]) =>
		[code, ...variants].map((token): [string, string] => [token.toLowerCase(), code.toLowerCase()])
	)
);
const stateCodes = new Set(stateTokenToCode.values());

// Basiskürzel von Landesgesetzen, die in mehreren Bundesländern vorkommen (z.B. "pog", "pag", "sog").
// Schlüssel: kleingeschriebenes Basiskürzel, Wert: Schreibweise für die URL (z.B. "POG").
// Wird beim ersten Zugriff aus dem Landesrecht.online-Datensatz aufgebaut.
let ambiguousLandesrechtBases: Map<string, string> | null = null;

function getAmbiguousLandesrechtBases(): Map<string, string> {
	if (ambiguousLandesrechtBases) {
		return ambiguousLandesrechtBases;
	}

	const statesByBase = new Map<string, { display: string; states: Set<string> }>();
	for (const [bundesland, laws] of Object.entries(Landesgesetze_mit_Namen)) {
		const ownCode = Object.keys(bundeslandAbbreviations).find(
			(abbr) => bundeslandAbbreviations[abbr] === bundesland
		)?.toLowerCase();

		for (const key of Object.keys(laws)) {
			// Länder-Token des eigenen Bundeslands vorne oder hinten entfernen ("POG NRW" -> "POG", "BW AGBMG" -> "AGBMG")
			let tokens = key.trim().split(/\s+/);
			if (tokens.length > 1) {
				if (stateTokenToCode.get((tokens[tokens.length - 1] ?? "").toLowerCase()) === ownCode) {
					tokens = tokens.slice(0, -1);
				} else if (stateTokenToCode.get((tokens[0] ?? "").toLowerCase()) === ownCode) {
					tokens = tokens.slice(1);
				}
			}
			const base = tokens.join(" ");
			const lower = base.toLowerCase();
			const entry = statesByBase.get(lower) ?? { display: base, states: new Set<string>() };
			entry.states.add(bundesland);
			statesByBase.set(lower, entry);
		}
	}

	ambiguousLandesrechtBases = new Map();
	for (const [lower, { display, states }] of statesByBase) {
		// Kürzel, die auch ein Bundes-/EU-Gesetz bezeichnen, bleiben beim normalen Lookup (z.B. "AGG")
		const isFederal =
			dejureGesetzeLowerCased.includes(lower) ||
			jurafuchsGesetzeLowerCased[lower]?.jurisdiction === "DE" ||
			jurafuchsGesetzeLowerCased[lower]?.jurisdiction === "EU";
		if (states.size > 1 && !isFederal && !/[\s/?#]/.test(display)) {
			ambiguousLandesrechtBases.set(lower, display);
		}
	}
	return ambiguousLandesrechtBases;
}

// Landesrecht.online zeigt für ein Kürzel, das in mehreren Bundesländern existiert, eine Auswahlseite
// ("Ein Gesetz mit der Abkürzung POG existiert in diesen 5 Bundesländern") und gibt die Norm an die Links weiter.
// Bei Kürzeln ohne Landesangabe führt der Link deshalb immer dorthin, unabhängig von den Anbieter-Einstellungen.
function getAmbiguousLandesrechtUrl(gesetz: string, norm: string): string {
	if (typeof gesetz !== "string" || typeof norm !== "string" || norm.trim().length === 0) {
		return "";
	}
	const display = getAmbiguousLandesrechtBases().get(gesetz.trim().toLowerCase());
	if (!display) {
		return "";
	}
	return `https://landesrecht.online/${encodeURIComponent(display)}/${norm.trim()}`;
}

// Basiskürzel von Landesgesetzen, die nur in genau einem Bundesland vorkommen (z.B. "asog" -> "asog be").
// Wird pro Datensatz einmal aufgebaut.
const uniqueBaseIndexCache = new WeakMap<object, Record<string, unknown>>();

function getUniqueBaseIndex<T>(dataset: Record<string, T>): Record<string, T> {
	const cached = uniqueBaseIndexCache.get(dataset);
	if (cached) {
		return cached as Record<string, T>;
	}
	const counts = new Map<string, number>();
	for (const key of Object.keys(dataset)) {
		const tokens = key.split(/\s+/);
		if (tokens.length > 1 && stateCodes.has(tokens[tokens.length - 1] ?? "")) {
			const base = tokens.slice(0, -1).join(" ");
			counts.set(base, (counts.get(base) ?? 0) + 1);
		}
	}
	const index: Record<string, T> = {};
	for (const [key, value] of Object.entries(dataset)) {
		const tokens = key.split(/\s+/);
		const base = tokens.slice(0, -1).join(" ");
		if (tokens.length > 1 && counts.get(base) === 1 && stateCodes.has(tokens[tokens.length - 1] ?? "")) {
			index[base] = value;
		}
	}
	uniqueBaseIndexCache.set(dataset, index);
	return index;
}

// Sucht ein Gesetz in einem kleingeschriebenen Datensatz. Landesgesetze sind dort nur unter
// "<basiskürzel> <iso-code>" abgelegt (z.B. "sog st"). Das Länder-Token der Eingabe (st, sa, lsa, ...)
// wird über bundeslandVariantTokens auf den ISO-Code abgebildet, egal ob es vorne oder hinten steht
// (auch vor einer Jahreszahl, z.B. "abgg mv 2007").
function findStateAwareEntry<T>(dataset: Record<string, T>, normalizedKey: string): T | undefined {
	const direct = dataset[normalizedKey];
	if (direct) {
		return direct;
	}

	const tokens = normalizedKey.split(/\s+/);
	if (tokens.length > 1) {
		let code: string | undefined;
		let base: string[] = [];
		const last = tokens[tokens.length - 1] ?? "";
		const first = tokens[0] ?? "";
		const beforeLast = tokens[tokens.length - 2] ?? "";

		if (stateTokenToCode.has(last)) {
			code = stateTokenToCode.get(last);
			base = tokens.slice(0, -1);
		} else if (/^\d{4}$/.test(last) && stateTokenToCode.has(beforeLast)) {
			code = stateTokenToCode.get(beforeLast);
			base = [...tokens.slice(0, -2), last];
		} else if (stateTokenToCode.has(first)) {
			code = stateTokenToCode.get(first);
			base = tokens.slice(1);
		}

		if (code) {
			const baseKey = base.join(" ");
			// Landesgesetz, sonst Gesetz ohne Länderbezug (z.B. "bgb be" -> "bgb")
			const found = dataset[`${baseKey} ${code}`] ?? dataset[baseKey];
			if (found) {
				return found;
			}
		}
	}

	return getUniqueBaseIndex(dataset)[normalizedKey];
}

function getGesetzeCoUrl(
	gesetz: string,
	norm: string,
	additionalInfo?: AdditionalInfo
): string {
	if (
		typeof gesetz !== "string" ||
		typeof norm !== "string" ||
		gesetz.trim().length === 0 ||
		norm.trim().length === 0
	) {
		return "";
	}

	const lawUrl = LawProviderUrl.GESETZE_CO;
	const normalizedKey = gesetz.trim().toLowerCase();
	const foundGesetz = findStateAwareEntry(gesetzeCoGesetzeLowerCased, normalizedKey);

	if (!foundGesetz) {
		return "";
	}

	// Gesetze.co verlinkt das Grundgesetz standardmäßig unter /DE/GG/Art_<norm>
	let normSegment = norm;
	if (foundGesetz.slug === "GG" && !norm.startsWith("Art_")) {
		normSegment = `Art_${norm}`;
	}

	return `${lawUrl}${foundGesetz.jurisdiction}/${foundGesetz.slug}/${normSegment}`;
}

function getJurafuchsUrl(gesetz: string, norm: string): string {
	if (
		typeof gesetz !== "string" ||
		typeof norm !== "string" ||
		gesetz.trim().length === 0 ||
		norm.trim().length === 0
	) {
		return "";
	}

	const foundGesetz = findStateAwareEntry(jurafuchsGesetzeLowerCased, gesetz.trim().toLowerCase());
	if (!foundGesetz) {
		return "";
	}

	// Jurafuchs leitet `/gesetz/<slug>/<norm>` auf die Seite mit dem Normtitel im Slug weiter
	return `${LawProviderUrl.JURAFUCHS}${foundGesetz.slug}/${norm}`;
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
		return getLexmeaUrl(gesetz, norm) || "";
	}

	if (lawProvider === "landesrecht.online") {
		return getLandesrechtOnlineUrl(gesetz, norm) || "";
	}

	if (lawProvider === "rewis") {
		return getRewisUrl(gesetz, norm, additionalInfo) || "";
	}

	if (lawProvider === "gesetze.co") {
		return getGesetzeCoUrl(gesetz, norm, additionalInfo) || "";
	}

	if (lawProvider === "jurafuchs") {
		return getJurafuchsUrl(gesetz, norm) || "";
	}

	return "";
}

function getLawUrlByProviderOptions(
	gesetz: string,
	norm: string,
	lawProviders: LawProviderOptions,
	additionalInfo?: AdditionalInfo
): string {
	// Mehrdeutiges Landeskürzel ohne Bundesland (z.B. "POG"): Auswahlseite von Landesrecht.online
	const ambiguousUrl = getAmbiguousLandesrechtUrl(gesetz, norm);
	if (ambiguousUrl) {
		return ambiguousUrl;
	}

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

	if (lawProviders.sixthOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.sixthOption, additionalInfo);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.seventhOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.seventhOption, additionalInfo);
		if (lawUrl) {
			return lawUrl;
		}
	}

	return "";
}

export { getLawUrlByProvider, getLawUrlByProviderOptions };
