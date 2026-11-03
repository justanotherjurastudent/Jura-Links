// Erzeugt src/static/gesetzeIoGesetze.ts aus der öffentlichen API von gesetze.io (LEX superior GmbH).
//
// Aufruf: node src/static/updateGesetzeIo.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API_URL = "https://gesetze.io/api/gesetze/listen/categorylaws";
const USER_AGENT = "Jura-Links (https://github.com/justanotherjurastudent/Jura-Links)";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "gesetzeIoGesetze.ts");

// Bundesland-Kürzel zu gängigen Großbuchstaben-Kürzeln für Aliase
const JURISDICTION_SUFFIX = {
	bw: "BW",
	by: "BY",
	be: "BE",
	bb: "BB",
	hb: "HB",
	hh: "HH",
	he: "HE",
	mv: "MV",
	ni: "NI",
	nw: "NW",
	rp: "RP",
	sl: "SL",
	sn: "SN",
	st: "ST",
	sh: "SH",
	th: "TH",
};

// Nicht-ASCII-Zeichen als \uXXXX schreiben (wie im bestehenden Datenbestand)
function quote(value) {
	return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function isUsableKey(key) {
	return key.length > 0 && !/[[\](){}|*+?^$\\]/.test(key);
}

function render(entries) {
	const lines = entries.map(({ key, title, slug, jurisdiction, lastUpdated }) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
		const lastUpdatedField = lastUpdated ? `,\n\t\tlastUpdated: ${quote(lastUpdated)}` : "";
		return `\t${renderedKey}: {\n\t\ttitle: ${quote(title)},\n\t\tslug: ${quote(slug)},\n\t\tjurisdiction: ${quote(jurisdiction)}${lastUpdatedField}\n\t},`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateGesetzeIo.mjs\`. Bitte nicht von Hand bearbeiten.

export interface GesetzeIoGesetz {
\ttitle: string;
\tslug: string;
\tjurisdiction: string;
\tlastUpdated?: string;
}

export const gesetzeIoGesetze: Record<string, GesetzeIoGesetz> = {
${lines.join("\n")}
};

export const gesetzeIoGesetzeLowerCased: Record<string, GesetzeIoGesetz> = Object.fromEntries(
\tObject.entries(gesetzeIoGesetze).map(([k, v]) => [k.toLowerCase(), v])
);
`;
}

async function main() {
	console.log(`Lade Gesetzesliste von ${API_URL}...`);
	const res = await fetch(API_URL, { headers: { "User-Agent": USER_AGENT } });
	if (!res.ok) {
		throw new Error(`${API_URL}: HTTP ${res.status}`);
	}

	const data = await res.json();
	const laws = data.list ?? [];
	console.log(`Empfangen: ${laws.length} Gesetze von gesetze.io.`);

	// Gruppiere Gesetze nach Abkürzung
	const byAbbr = new Map();
	for (const item of laws) {
		const abbr = (item.e || "").trim();
		if (!abbr || !isUsableKey(abbr)) {
			continue;
		}
		const list = byAbbr.get(abbr) ?? [];
		list.push(item);
		byAbbr.set(abbr, list);
	}

	const entries = [];

	for (const [abbr, items] of byAbbr) {
		if (items.length === 1) {
			const item = items[0];
			entries.push({
				key: abbr,
				title: (item.a || "").trim(),
				slug: item.d,
				jurisdiction: item.c,
				lastUpdated: item.l,
			});
			// Für Landesgesetze auch Variante mit Bundesland anhängen, z.B. "PAG BY"
			const stateSuffix = JURISDICTION_SUFFIX[item.c];
			if (stateSuffix && !abbr.endsWith(` ${stateSuffix}`)) {
				entries.push({
					key: `${abbr} ${stateSuffix}`,
					title: (item.a || "").trim(),
					slug: item.d,
					jurisdiction: item.c,
					lastUpdated: item.l,
				});
			}
		} else {
			// Mehrere Gesetze mit derselben Abkürzung:
			// Wenn ein Bundesgesetz dabei ist, erhält es die Basis-Abkürzung
			const bundLaw = items.find((i) => i.c === "bund");
			if (bundLaw) {
				entries.push({
					key: abbr,
					title: (bundLaw.a || "").trim(),
					slug: bundLaw.d,
					jurisdiction: bundLaw.c,
					lastUpdated: bundLaw.l,
				});
			}

			// Jedes Landesgesetz erhält zudem die Abkürzung mit Suffix (z.B. "AGVwGO BW")
			for (const item of items) {
				const stateSuffix = JURISDICTION_SUFFIX[item.c] || item.c.toUpperCase();
				entries.push({
					key: `${abbr} ${stateSuffix}`,
					title: (item.a || "").trim(),
					slug: item.d,
					jurisdiction: item.c,
					lastUpdated: item.l,
				});
			}
		}
	}

	entries.sort((a, b) => a.key.localeCompare(b.key, "de"));
	writeFileSync(OUTPUT_FILE, render(entries));

	console.log(`Erfolgreich ${entries.length} Einträge nach ${OUTPUT_FILE} geschrieben.`);
}

await main();
