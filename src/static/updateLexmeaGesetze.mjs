// Erzeugt src/static/lexmeaGesetze.ts aus den öffentlichen Daten von LexMea.
//
// Aufruf: node src/static/updateLexmeaGesetze.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.
//
// Quellen:
// - https://api.lexmea.de/api/legalText (Kürzel, Titel und URL-Slug je Gesetz)
// - https://lexmea.de/storage/public/sitemap.xml (welche Gesetze es gibt und wie die Normen
//   im URL-Pfad heißen, z.B. "433" im BGB, "art-1" im GG oder "article-1" im CISG)
//
// Neben dem LexMea-Kürzel werden gängige Schreibweisen als zusätzliche Schlüssel aufgenommen,
// damit die Verlinkung sie erkennt (z.B. "BauO NRW" für "BauO 2018 NRW", "GO BY" für "[Bay]GO").
// Mehrdeutige Schreibweisen (z.B. "UmwStG" für "UmwStG 1995" und "UmwStG 2006") werden ausgelassen.

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API_URL = "https://api.lexmea.de/api/legalText";
const SITEMAP_URL = "https://lexmea.de/storage/public/sitemap.xml";
const USER_AGENT = "Jura-Links (https://github.com/justanotherjurastudent/Jura-Links)";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "lexmeaGesetze.ts");

// Zusätzliche Schreibweisen, die sich nicht aus dem LexMea-Kürzel ableiten lassen
const EXTRA_ALIASES = {
	"bayerische-verfassung": ["BV", "BayVerf"],
	"rom-i-vo": ["Rom-I-VO", "Rom I"],
	"rom-ii-vo": ["Rom-II-VO", "Rom II"],
	"bruessel-iib": ["Brüssel IIb-VO"],
	"verf-nrw": ["LV NRW"],
	// Das TTDSG heißt seit Mai 2024 TDDDG
	tdddg: ["TTDSG"],
	// Amtliche Abkürzung der Gebäudegrundbuchverfügung, bei LexMea "GebGrdV"
	ggv: ["GGV"],
};

// Priorität: kleinere Zahl gewinnt bei gleichen Schlüsseln
const PRIORITY_NAME = 0;
const PRIORITY_ALIAS = 1;
const PRIORITY_NAME_NOT_IN_FORCE = 2;
const PRIORITY_ALIAS_NOT_IN_FORCE = 3;

// Die API liefert den Zusatz je nach Sprache deutsch oder englisch
const NOT_IN_FORCE = /\s*\((?:not in force|außer Kraft)\)$/i;
const YEAR = /\s+(?:19|20)\d{2}\b/;

async function get(url, type) {
	const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
	if (!response.ok) {
		throw new Error(`${url}: HTTP ${response.status}`);
	}
	return type === "json" ? response.json() : response.text();
}

function locs(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

// Ermittelt, wie die Normen eines Gesetzes im URL-Pfad heißen ("", "art-" oder "article-").
// Liefert null, wenn keine Norm mit arabischer Nummer existiert (z.B. "article-v" im NYC),
// da lawRegex nur arabische Normnummern erkennt und sonst Links ins Leere entstünden.
function normPrefix(urls) {
	const counts = { "": 0, "art-": 0, "article-": 0 };
	for (const url of urls) {
		const segment = url.split("/").pop();
		const match = /^(art-|article-)?\d/.exec(segment);
		if (match) {
			counts[match[1] ?? ""]++;
		}
	}
	const [prefix, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
	return count > 0 ? prefix : null;
}

// Schlüssel dürfen keine Regex-Sonderzeichen enthalten, da lawsAbbrs.ts unmaskiert in lawRegex landet
function isUsableKey(key) {
	return key.length > 0 && !/[[\](){}|*+?^$\\]/.test(key);
}

function aliasesFor(law, name) {
	const aliases = new Set();
	const tier = law.legal_text_tier?.name;

	// "[Bay]GO" -> "BayGO", "GO BY", "GO Bay"
	const bavarian = /^\[Bay\](.+)$/.exec(name);
	if (bavarian) {
		aliases.add(`Bay${bavarian[1]}`);
		aliases.add(`${bavarian[1]} BY`);
		aliases.add(`${bavarian[1]} Bay`);
	} else if (tier === "BAYERN" && !name.startsWith("Bay")) {
		aliases.add(`${name} BY`);
		aliases.add(`${name} Bay`);
	}

	// "Brüssel Ia-VO / EuGVVO" -> beide Teile
	for (const part of name.split(" / ")) {
		aliases.add(part);
	}

	// "BauO 2018 NRW" -> "BauO NRW", "BSIG 2025" -> "BSIG"
	for (const alias of [...aliases]) {
		if (YEAR.test(alias)) {
			aliases.add(alias.replace(YEAR, ""));
		}
	}

	// "PolG NRW" -> "PolG NW"
	for (const alias of [...aliases]) {
		if (alias.endsWith(" NRW")) {
			aliases.add(alias.replace(/ NRW$/, " NW"));
		}
	}

	for (const alias of EXTRA_ALIASES[law.slug] ?? []) {
		aliases.add(alias);
	}

	aliases.delete(name);
	return aliases;
}

async function main() {
	const [laws, sitemapIndex] = await Promise.all([get(API_URL, "json"), get(SITEMAP_URL, "text")]);

	const sitemapBySlug = new Map(
		locs(sitemapIndex)
			.map((url) => [/\/legal-texts\/(.+)\.xml$/.exec(url)?.[1], url])
			.filter(([slug]) => slug)
	);

	// Die API liefert manche Gesetze mehrfach
	const lawsBySlug = new Map();
	for (const law of laws) {
		if (law.active && sitemapBySlug.has(law.slug) && !lawsBySlug.has(law.slug)) {
			lawsBySlug.set(law.slug, law);
		}
	}

	const prefixBySlug = new Map();
	const slugs = [...lawsBySlug.keys()];
	for (let i = 0; i < slugs.length; i += 8) {
		await Promise.all(
			slugs.slice(i, i + 8).map(async (slug) => {
				const prefix = normPrefix(locs(await get(sitemapBySlug.get(slug), "text")));
				if (prefix === null) {
					lawsBySlug.delete(slug);
				} else {
					prefixBySlug.set(slug, prefix);
				}
			})
		);
	}

	// Kandidaten je Schlüssel (kleingeschrieben) sammeln
	const candidates = new Map();
	const addCandidate = (key, law, priority) => {
		if (!isUsableKey(key)) {
			return;
		}
		const lowerKey = key.toLowerCase();
		const list = candidates.get(lowerKey) ?? [];
		list.push({ key, slug: law.slug, priority });
		candidates.set(lowerKey, list);
	};

	for (const law of lawsBySlug.values()) {
		const notInForce = NOT_IN_FORCE.test(law.name);
		const name = law.name.replace(NOT_IN_FORCE, "").trim();
		addCandidate(name, law, notInForce ? PRIORITY_NAME_NOT_IN_FORCE : PRIORITY_NAME);
		for (const alias of aliasesFor(law, name)) {
			addCandidate(alias, law, notInForce ? PRIORITY_ALIAS_NOT_IN_FORCE : PRIORITY_ALIAS);
		}
	}

	const entries = [];
	const skipped = [];
	for (const [lowerKey, list] of candidates) {
		const best = Math.min(...list.map((candidate) => candidate.priority));
		const winners = list.filter((candidate) => candidate.priority === best);
		const winnerSlugs = new Set(winners.map((candidate) => candidate.slug));
		if (winnerSlugs.size > 1) {
			skipped.push(`${lowerKey} (${[...winnerSlugs].join(", ")})`);
			continue;
		}
		const law = lawsBySlug.get(winners[0].slug);
		entries.push({
			key: winners[0].key,
			title: (law.short_name || law.full_name || law.name).replace(NOT_IN_FORCE, " (außer Kraft)").trim(),
			slug: law.slug,
			prefix: prefixBySlug.get(law.slug),
		});
	}

	entries.sort((a, b) => a.key.localeCompare(b.key, "de"));
	writeFileSync(OUTPUT_FILE, render(entries));

	console.log(`${lawsBySlug.size} Gesetze, ${entries.length} Schlüssel nach ${OUTPUT_FILE}`);
	if (skipped.length) {
		console.log(`Mehrdeutig und ausgelassen: ${skipped.join("; ")}`);
	}
}

// Nicht-ASCII-Zeichen wie in den übrigen Datendateien als \uXXXX schreiben
function quote(value) {
	return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function render(entries) {
	const lines = entries.map(({ key, title, slug, prefix }) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
		const renderedPrefix = prefix ? `, prefix: ${quote(prefix)}` : "";
		return `\t${renderedKey}: { title: ${quote(title)}, slug: ${quote(slug)}${renderedPrefix} },`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateLexmeaGesetze.mjs\`. Bitte nicht von Hand bearbeiten.

export interface LexmeaGesetz {
	title: string;
	// URL-Slug des Gesetzes bei LexMea, z.B. "sgb-v" für "SGB V"
	slug: string;
	// Präfix der Norm im URL-Pfad, z.B. "art-" für das GG oder "article-" für das CISG
	prefix?: string;
}

export const lexmeaGesetze: Record<string, LexmeaGesetz> = {
${lines.join("\n")}
};

export const lexmeaGesetzeLowerCased: Record<string, LexmeaGesetz> = Object.fromEntries(
	Object.entries(lexmeaGesetze).map(([key, value]) => [key.toLowerCase(), value])
);
`;
}

await main();
