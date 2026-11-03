// Erzeugt src/static/gesetzeCoGesetze.ts aus den Daten von Gesetze.co.
//
// Aufruf: node src/static/updateGesetzeCo.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { stateKey, quote, isUsableKey } from "./stateVariants.mjs";

const BASE_URL = "https://gesetze.co";
const USER_AGENT = "Jura-Links (https://github.com/justanotherjurastudent/Jura-Links)";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "gesetzeCoGesetze.ts");

const JURISDICTIONS = [
	{ code: "DE", name: "Bund" },
	{ code: "EU", name: "Europa" },
	{ code: "BW", name: "Baden-Württemberg" },
	{ code: "BY", name: "Bayern" },
	{ code: "BE", name: "Berlin" },
	{ code: "BB", name: "Brandenburg" },
	{ code: "HB", name: "Bremen" },
	{ code: "HH", name: "Hamburg" },
	{ code: "HE", name: "Hessen" },
	{ code: "MV", name: "Mecklenburg-Vorpommern" },
	{ code: "NI", name: "Niedersachsen" },
	{ code: "NW", name: "Nordrhein-Westfalen" },
	{ code: "RP", name: "Rheinland-Pfalz" },
	{ code: "SL", name: "Saarland" },
	{ code: "SN", name: "Sachsen" },
	{ code: "ST", name: "Sachsen-Anhalt" },
	{ code: "SH", name: "Schleswig-Holstein" },
	{ code: "TH", name: "Thüringen" },
];

function cleanText(t) {
	return t
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.trim();
}

function render(entries) {
	const lines = entries.map(({ key, title, slug, jurisdiction }) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
		return `\t${renderedKey}: {\n\t\ttitle: ${quote(title)},\n\t\tslug: ${quote(slug)},\n\t\tjurisdiction: ${quote(jurisdiction)}\n\t},`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateGesetzeCo.mjs\`. Bitte nicht von Hand bearbeiten.

export interface GesetzeCoGesetz {
\ttitle: string;
\tslug: string;
\tjurisdiction: string;
}

export const gesetzeCoGesetze: Record<string, GesetzeCoGesetz> = {
${lines.join("\n")}
};

export const gesetzeCoGesetzeLowerCased: Record<string, GesetzeCoGesetz> = Object.fromEntries(
\tObject.entries(gesetzeCoGesetze).map(([k, v]) => [k.toLowerCase(), v])
);
`;
}

async function main() {
	console.log("Scrape Gesetze von Gesetze.co...");
	const allLaws = [];

	for (const j of JURISDICTIONS) {
		const url = `${BASE_URL}/alle/${j.code}`;
		const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
		if (!res.ok) {
			console.warn(`Fehler beim Abruf von ${url}: HTTP ${res.status}`);
			continue;
		}
		const html = await res.text();

		const regex = new RegExp(`<a[^>]+href=["'](/${j.code}/([^"'/]+))["'][^>]*>([\\s\\S]*?)</a>`, "g");
		let m;
		const entries = new Map();
		while ((m = regex.exec(html)) !== null) {
			const rawSlug = m[2];
			const text = cleanText(m[3]);
			if (!entries.has(rawSlug)) {
				entries.set(rawSlug, {
					slug: decodeURIComponent(rawSlug),
					jurisdiction: j.code,
					abbr: text,
					title: "",
				});
			} else {
				const existing = entries.get(rawSlug);
				if (!existing.title) existing.title = text;
			}
		}

		console.log(`${j.code} (${j.name}): ${entries.size} Gesetze`);
		for (const law of entries.values()) {
			allLaws.push(law);
		}
	}

	console.log(`Gesamtanzahl Gesetze: ${allLaws.length}`);

	const generated = new Map();

	function addEntry(key, law) {
		if (!key || !isUsableKey(key)) return;
		const lower = key.toLowerCase();
		if (!generated.has(lower)) {
			generated.set(lower, {
				key,
				title: law.title,
				slug: law.slug,
				jurisdiction: law.jurisdiction,
			});
		}
	}

	// 1. Priorität: Bund (DE) und Europa (EU)
	for (const law of allLaws) {
		if (law.jurisdiction === "DE" || law.jurisdiction === "EU") {
			addEntry(law.abbr, law);
		}
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

await main();
