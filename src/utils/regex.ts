import { allLawAbbreviations } from "../static/lawsAbbrs";

// Sortiere nach Länge absteigend, damit längere Matches zuerst geprüft werden
// z.B. "EuGVÜ" vor "EU", "BauO" vor "Bau", etc.
const lawList = [...allLawAbbreviations]
	.sort((a, b) => b.length - a.length)
	.join("|");

const Verbinder = "(?:\\s*(und|u\\.|iVm|i\\.V\\.m\\.|i\\. V\\. m\\.)\\s*";
const VerbinderKomma =
	"(?:\\s*(,|und|u\\.|iVm|i\\.V\\.m\\.|i\\. V\\. m\\.)\\s*";
const VerbinderGesetz = "(?:\\s*(,|-|bis|sowie)\\s*";

// Bundesland-Suffixe für Landesgesetze (kanonische und alternative Varianten)
// Diese werden nach dem Gesetzesnamen optional erfasst
const bundeslandSuffixes = [
	// Kanonische Abkürzungen
	"BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
	// Alternative/geläufige Varianten
	"NRW", "Bln", "M-V", "LSA", "Schl\\.-H\\.", "Bay", "Hes", "Nds", "RLP"
].join("|");

function getSingleLawRegexString(suffix: string): string {
	return `(?<normgr${suffix}>(?<norm${suffix}>\\d+(?:\\w\\b)?)\\s*(?:(Abs\\.|Absatz)\\s*(?<absatz${suffix}>\\d+${Verbinder}\\d+)*)|(?<absatzrom${suffix}>[IVXLCDM]+${VerbinderKomma}[IVXLCDM]+)*))?\\s*(?:(S\\.|Satz)?\\s*(?<satz${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Hs\\.|Halbsatz)\\s*(?<halbsatz${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Alt\\.|Alternative)\\s*(?<alternative${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Var\\.|Variante)\\s*(?<variante${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Nr\\.|Nummer)\\s*(?<nr${suffix}>\\d+(?:\\w\\b)?${Verbinder}\\d+(?:\\w\\b)?)*))?\\s*(?:(lit\\.|Buchstabe)\\s*(?<lit${suffix}>[a-z]${Verbinder}[a-z])*))?\\s*(?:(Alt\\.|Alternative)\\s*(?<alternative2${suffix}>\\d+${Verbinder}\\d+)?))?.{0,10}?)`;
}

// Erweiterte lawRegex: Erfasst Gesetzesnamen + optional Bundesland-Suffix
// z.B. "§ 1 BauO Bln", "§ 1 POG RP", "§ 1 PAG BY", "§ 1 KV M-V"
// Hinweis: Statt \b am Ende verwenden wir einen Lookahead, da \b
// mit Unicode-Zeichen (Umlauten wie Ü) nicht korrekt funktioniert
export const lawRegex = new RegExp(
	`(?![^[]*])` +
	`(?<p1>§+|Art\\.|Artikel)\\s*(?<p2>${getSingleLawRegexString(
		"_first"
	)}${VerbinderGesetz}${getSingleLawRegexString(
		"_last"
	)})*)(?<gesetz>(?:${lawList})(?:\\s+(?:${bundeslandSuffixes}))?)(?=\\s|$|[^\\w\\u00C0-\\u024F])`,
	"gmi"
);

export const lawChainRegex = new RegExp(
	`${VerbinderGesetz})${getSingleLawRegexString("")}`,
	"gm"
);

export const caseRegex =
	/(?:[A-Za-z]-\d+\/\d{2}|[A-Za-z]\s*\d+\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[A-Z]-\d+\/\d{2}|\d+[A-Za-z]?\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[IVXLCDM]+\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[A-Za-z]?\d{1,7}\/\d{2})\b(?!.*?\])/g;

export const journalRegex =
	/(?<journal>[A-Za-z][A-Za-z-]*|Slg\.)\s(?:(?<year>\d{4})(?:,\s(?<volume1>[IVXLCDM]{1,5})-(?<page1>[1-9]\d+)|,\s(?<page2>[1-9]\d+))|(?<volume2>[1-9]\d+),\s(?<page3>[1-9]\d+))\b(?!.*?\])/gm;

export const btDrucksacheRegex =
/(?<drucksache>BT-Drs\.|BT-Drucks\.|Bundestagsdrucksache|Bundestag\s+Drucksache)\s*(?<number>\d{1,2}\/\d{1,6})\b(?!.*?\])/gm;

export const brDrucksacheRegex =
/(?<drucksache>BR-Drs\.|BR-Drucks\.|Bundesratsdrucksache|Bundesrat\s+Drucksache)\s*(?<number>\d{1,2}\/\d{1,6})\b(?!.*?\])/gm;
