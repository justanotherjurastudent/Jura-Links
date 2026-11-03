// Erzeugt src/static/rewisGesetze.ts aus den öffentlichen Daten von Rewis.io.
//
// Aufruf: node src/static/updateRewisGesetze.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const BASE_URL = "https://rewis.io";
const USER_AGENT = "Jura-Links (https://github.com/justanotherjurastudent/Jura-Links)";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "rewisGesetze.ts");

// Nicht-ASCII-Zeichen als \uXXXX schreiben (wie im bestehenden Datenbestand)
function quote(value) {
	return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

async function fetchHtml(url) {
	const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
	if (!res.ok) {
		throw new Error(`${url}: HTTP ${res.status}`);
	}
	return res.text();
}

function extractCardsFromHtml(html) {
	const blocks = html.split(/<div class="col-[^"]*"/);
	const laws = [];
	for (const block of blocks) {
		const linkMatch = block.match(/href="\/gesetze\/([a-z0-9\-]+)\/"[^>]*title="([^"]*)"/);
		const h3Match = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
		if (linkMatch && h3Match) {
			const slug = linkMatch[1];
			const title = linkMatch[2].trim().replace(/\s+/g, " ");
			const abbr = h3Match[1].trim();
			if (slug && abbr && slug !== "gesetze") {
				laws.push({ abbr, slug, title });
			}
		}
	}
	return laws;
}

// Ermittelt, ob Paragrafen-URLs dem Schema /p/<slug>-<norm> (true) oder /p/<norm>-<slug> (false) folgen
async function detectLawNormOrder(slug) {
	try {
		const html = await fetchHtml(`${BASE_URL}/gesetze/${slug}/`);
		const pMatch = html.match(new RegExp(`/gesetze/${slug}/p/([^/"']+)`));
		if (pMatch) {
			const normSegment = pMatch[1];
			return normSegment.startsWith(`${slug}-`);
		}
	} catch (e) {
		console.warn(`TOC-Abruf für ${slug} fehlgeschlagen: ${e.message}`);
	}
	return true;
}

async function getAvailableStateUrls() {
	try {
		const html = await fetchHtml(`${BASE_URL}/landesrecht/`);
		const matches = [...html.matchAll(/href="(\/landesrecht\/[a-z0-9\-]+\/gesetze\/)"/g)];
		return [...new Set(matches.map((m) => `${BASE_URL}${m[1]}`))];
	} catch {
		return [`${BASE_URL}/landesrecht/bayern/gesetze/`];
	}
}

function render(entries) {
	const lines = entries.map(({ abbr, slug, title, lawNormOrder }) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(abbr) ? abbr : quote(abbr);
		return `\t${renderedKey}: {\n\t\turl: ${quote(slug)},\n\t\ttitle: ${quote(title)},\n\t\tlawNormOrder: ${lawNormOrder},\n\t},`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateRewisGesetze.mjs\`. Bitte nicht von Hand bearbeiten.

interface RewisGesetze {
\t[key: string]: {
\t\turl: string;
\t\ttitle: string;
\t\tlawNormOrder: boolean;
\t};
}

export const rewisGesetze: RewisGesetze = {
${lines.join("\n")}
};

export const rewisGesetzeLowerCased: RewisGesetze = Object.fromEntries(
\tObject.entries(rewisGesetze).map(([k, v]) => [k.toLowerCase(), v])
);
`;
}

async function main() {
	console.log("Lade Bundesrecht von Rewis.io...");
	const bundHtml = await fetchHtml(`${BASE_URL}/gesetze/`);
	const bundLaws = extractCardsFromHtml(bundHtml);
	console.log(`Gefunden: ${bundLaws.length} Bundesgesetze.`);

	console.log("Suche Landesrecht-Seiten...");
	const stateUrls = await getAvailableStateUrls();
	const stateLaws = [];
	for (const stateUrl of stateUrls) {
		try {
			console.log(`Lade Landesrecht: ${stateUrl}`);
			const stateHtml = await fetchHtml(stateUrl);
			const laws = extractCardsFromHtml(stateHtml);
			stateLaws.push(...laws);
		} catch (e) {
			console.warn(`Fehler beim Laden von ${stateUrl}:`, e.message);
		}
	}
	console.log(`Gefunden: ${stateLaws.length} Landesgesetze.`);

	// Bestehende lawNormOrder-Werte einlesen, um unnötige Anfragen zu vermeiden
	const existingOrderMap = new Map();
	try {
		const currentFile = readFileSync(OUTPUT_FILE, "utf8");
		const orderMatches = currentFile.matchAll(/url:\s*"([^"]+)",[\s\S]*?lawNormOrder:\s*(true|false)/g);
		for (const m of orderMatches) {
			existingOrderMap.set(m[1], m[2] === "true");
		}
		console.log(`${existingOrderMap.size} bestehende lawNormOrder-Werte geladen.`);
	} catch {
		// Datei existiert noch nicht
	}

	const allLaws = [...bundLaws, ...stateLaws];
	const lawMap = new Map();
	for (const law of allLaws) {
		if (!lawMap.has(law.abbr)) {
			lawMap.set(law.abbr, law);
		}
	}

	const newLaws = [];
	for (const law of lawMap.values()) {
		if (existingOrderMap.has(law.slug)) {
			law.lawNormOrder = existingOrderMap.get(law.slug);
		} else {
			newLaws.push(law);
		}
	}

	if (newLaws.length > 0) {
		console.log(`Ermittle lawNormOrder für ${newLaws.length} neue Gesetze...`);
		for (let i = 0; i < newLaws.length; i += 5) {
			await Promise.all(
				newLaws.slice(i, i + 5).map(async (law) => {
					law.lawNormOrder = await detectLawNormOrder(law.slug);
					console.log(`  ${law.abbr} (${law.slug}): lawNormOrder = ${law.lawNormOrder}`);
				})
			);
		}
	}

	const sortedEntries = [...lawMap.values()].sort((a, b) => a.abbr.localeCompare(b.abbr, "de"));
	writeFileSync(OUTPUT_FILE, render(sortedEntries));

	console.log(`Erfolgreich ${sortedEntries.length} Gesetze nach ${OUTPUT_FILE} geschrieben.`);
}

await main();

