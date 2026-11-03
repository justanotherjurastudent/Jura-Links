// Erzeugt src/static/jurafuchsGesetze.ts aus den Daten von gesetze.jurafuchs.de.
//
// Aufruf: node src/static/updateJurafuchsGesetze.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { stateKey, quote, isUsableKey } from "./stateVariants.mjs";

const BASE_URL = "https://gesetze.jurafuchs.de";
const USER_AGENT = "Jura-Links (https://github.com/justanotherjurastudent/Jura-Links)";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "jurafuchsGesetze.ts");

// path = Listenseite auf Jurafuchs
const JURISDICTIONS = [
	{ code: "DE", name: "Bund", path: "bundesrecht" },
	{ code: "EU", name: "Europa", path: "europarecht" },
	{ code: "BW", name: "Baden-Württemberg", path: "landesrecht/baden-wuerttemberg" },
	{ code: "BY", name: "Bayern", path: "landesrecht/bayern" },
	{ code: "BE", name: "Berlin", path: "landesrecht/berlin" },
	{ code: "BB", name: "Brandenburg", path: "landesrecht/brandenburg" },
	{ code: "HB", name: "Bremen", path: "landesrecht/bremen" },
	{ code: "HH", name: "Hamburg", path: "landesrecht/hamburg" },
	{ code: "HE", name: "Hessen", path: "landesrecht/hessen" },
	{ code: "MV", name: "Mecklenburg-Vorpommern", path: "landesrecht/mecklenburg-vorpommern" },
	{ code: "NI", name: "Niedersachsen", path: "landesrecht/niedersachsen" },
	{ code: "NW", name: "Nordrhein-Westfalen", path: "landesrecht/nordrhein-westfalen" },
	{ code: "RP", name: "Rheinland-Pfalz", path: "landesrecht/rheinland-pfalz" },
	{ code: "SL", name: "Saarland", path: "landesrecht/saarland" },
	{ code: "SN", name: "Sachsen", path: "landesrecht/sachsen" },
	{ code: "ST", name: "Sachsen-Anhalt", path: "landesrecht/sachsen-anhalt" },
	{ code: "SH", name: "Schleswig-Holstein", path: "landesrecht/schleswig-holstein" },
	{ code: "TH", name: "Thüringen", path: "landesrecht/thueringen" },
];

const BUND_ALIASES = {
	EGBGB: "egbgb",
};

function cleanText(t) {
	return t
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#x27;|&#39;/g, "'")
		.trim();
}

function render(entries) {
	const lines = entries.map(({ key, title, slug, jurisdiction }) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
		return `\t${renderedKey}: {\n\t\ttitle: ${quote(title)},\n\t\tslug: ${quote(slug)},\n\t\tjurisdiction: ${quote(jurisdiction)}\n\t},`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateJurafuchsGesetze.mjs\`. Bitte nicht von Hand bearbeiten.

export interface JurafuchsGesetz {
\ttitle: string;
\tslug: string;
\tjurisdiction: string;
}

export const jurafuchsGesetze: Record<string, JurafuchsGesetz> = {
${lines.join("\n")}
};

export const jurafuchsGesetzeLowerCased: Record<string, JurafuchsGesetz> = Object.fromEntries(
\tObject.entries(jurafuchsGesetze).map(([k, v]) => [k.toLowerCase(), v])
);
`;
}

// Eine Karte auf den Listenseiten: <a href="/gesetz/<slug>"> <Kürzel> <Anzahl Normen> <Titel> ...
const CARD_REGEX = /<a\b[^>]*href="\/gesetz\/([^"\/?#]+)"[^>]*>([\s\S]*?)<\/a>/g;

export function parseCards(html) {
	const cards = new Map();
	let m;
	CARD_REGEX.lastIndex = 0;
	while ((m = CARD_REGEX.exec(html)) !== null) {
		const slug = decodeURIComponent(m[1]);
		const divs = [...m[2].matchAll(/<div[^>]*>([^<]*)<\/div>/g)].map((d) => cleanText(d[1])).filter(Boolean);
		const abbr = divs[0];
		if (!abbr || cards.has(slug)) continue;
		// divs[1] ist die Anzahl der Normen (nur Ziffern/Punkte), danach folgt der Titel
		const title = divs.slice(1).find((t) => !/^[\d.,]+$/.test(t) && !t.startsWith("Stand")) ?? "";
		cards.set(slug, { slug, abbr, title });
	}
	return [...cards.values()];
}

async function main() {
	console.log("Scrape Gesetze von Jurafuchs...");
	const allLaws = [];

	for (const j of JURISDICTIONS) {
		const url = `${BASE_URL}/${j.path}`;
		const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
		if (!res.ok) {
			console.warn(`Fehler beim Abruf von ${url}: HTTP ${res.status}`);
			continue;
		}
		const cards = parseCards(await res.text());
		console.log(`${j.code} (${j.name}): ${cards.length} Gesetze`);
		for (const card of cards) {
			allLaws.push({ ...card, jurisdiction: j.code });
		}
	}

	console.log(`Gesamtanzahl Gesetze: ${allLaws.length}`);

	const generated = new Map();

	function addEntry(key, law) {
		if (!key || !isUsableKey(key)) return;
		const lower = key.toLowerCase();
		if (!generated.has(lower)) {
			generated.set(lower, { key, title: law.title, slug: law.slug, jurisdiction: law.jurisdiction });
		}
	}

	// 1. Priorität: Bund (DE) und Europa (EU)
	for (const law of allLaws) {
		if (law.jurisdiction === "DE" || law.jurisdiction === "EU") {
			addEntry(law.abbr, law);
			// Jahreszahl im Kürzel optional machen (z.B. "AO 1977" -> "AO")
			addEntry(law.abbr.replace(/\s+\d{4}$/, ""), law);
		}
	}
	// Gängige Kürzel, die Jurafuchs abweichend benennt (z.B. "BGBEG" statt "EGBGB")
	for (const [alias, slug] of Object.entries(BUND_ALIASES)) {
		const law = allLaws.find((l) => l.jurisdiction === "DE" && l.slug === slug);
		if (law) addEntry(alias, law);
	}

	// Landesgesetze: ein Eintrag pro Gesetz unter "<Basiskürzel> <ISO-Code>" (z.B. "SOG ST").
	// Alternative Schreibweisen (LSA, NRW, Bln, ...) löst urlHelper.ts beim Nachschlagen auf.
	for (const law of allLaws) {
		if (law.jurisdiction === "DE" || law.jurisdiction === "EU") continue;
		addEntry(stateKey(law.abbr, law.jurisdiction), law);
	}

	const entries = Array.from(generated.values());
	entries.sort((a, b) => a.key.localeCompare(b.key, "de"));
	writeFileSync(OUTPUT_FILE, render(entries));
	console.log(`Erfolgreich ${entries.length} Einträge nach ${OUTPUT_FILE} geschrieben.`);
}

// Nur ausführen, wenn direkt aufgerufen (nicht beim Import)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
