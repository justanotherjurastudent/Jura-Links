// Erzeugt src/static/dejureGesetze.ts aus dem aktuellen Gesetzesverzeichnis von dejure.org.
//
// Aufruf: node src/static/updateDejureGesetze.mjs
// Danach neue Kürzel mit lawsabkuerzung.py in lawsAbbrs.ts übernehmen, damit lawRegex sie erkennt.

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const URL = "https://dejure.org/gesetze/";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "dejureGesetze.ts");

const HEADERS = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
};

// Nicht-ASCII-Zeichen als \uXXXX schreiben
function quote(value) {
	return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function parseExistingEntries(filePath) {
	try {
		const content = readFileSync(filePath, "utf8");
		const entries = new Map();
		const regex = /(?:^|\n)\t(?:"([^"]+)"|([A-Za-z0-9_.-]+))\s*:\s*\{\s*title\s*:\s*("(?:\\[\s\S]|[^"\\])*")/g;
		let m;
		while ((m = regex.exec(content)) !== null) {
			const key = m[1] || m[2];
			const titleJson = m[3];
			try {
				entries.set(key, JSON.parse(titleJson));
			} catch {
				entries.set(key, titleJson.slice(1, -1));
			}
		}
		return entries;
	} catch (e) {
		console.warn(`Konnte bestehende ${filePath} nicht lesen: ${e.message}`);
		return new Map();
	}
}

async function fetchDejureHtml() {
	try {
		const res = await fetch(URL, { headers: HEADERS });
		if (!res.ok) {
			console.warn(`dejure.org lieferte HTTP ${res.status}. Bestehender Datenbestand bleibt erhalten.`);
			return null;
		}
		const buf = await res.arrayBuffer();
		const decoder = new TextDecoder("iso-8859-1");
		return decoder.decode(buf);
	} catch (e) {
		console.warn(`Netzwerkfehler beim Abruf von dejure.org: ${e.message}. Bestehender Datenbestand bleibt erhalten.`);
		return null;
	}
}

function parseDejureHtml(html) {
	const slugToAbbr = new Map();
	// Abkürzungen aus den Listen-Elementen: e.g. <a href="/gesetze/BGB ">BGB</a>
	const liRegex = /<li[^>]*>\s*<a\s+[^>]*href="\/gesetze\/([^/?#"'\s]+)\s*\/?[^"']*"[^>]*>([\s\S]*?)<\/a>/gi;
	let match;
	while ((match = liRegex.exec(html)) !== null) {
		const slug = match[1].trim();
		const abbr = match[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
		if (slug && abbr && slug !== "gesetze" && slug !== "suche") {
			slugToAbbr.set(slug, abbr);
		}
	}

	const laws = new Map();
	// Vollständige Gesetzesbezeichnungen aus div.abstand: e.g. <div class="abstand"><a href="/gesetze/BGB ">Bürgerliches Gesetzbuch </a></div>
	const divRegex = /<div\s+class="abstand"[^>]*>\s*<a\s+[^>]*href="\/gesetze\/([^/?#"'\s]+)\s*\/?[^"']*"[^>]*>([\s\S]*?)<\/a>/gi;
	while ((match = divRegex.exec(html)) !== null) {
		const slug = match[1].trim();
		const title = match[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
		if (slug && title && slug !== "gesetze" && slug !== "suche") {
			const abbr = slugToAbbr.get(slug) || slug;
			laws.set(abbr, title);
		}
	}

	return laws;
}

function render(entries) {
	// Sortiere alphabetisch nach Schlüssel
	const sortedKeys = Array.from(entries.keys()).sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));

	const lines = sortedKeys.map((key) => {
		const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
		const title = entries.get(key);
		return `\t${renderedKey}: {\n\t\ttitle: ${quote(title)},\n\t},`;
	});

	return `// Automatisch erzeugt mit \`node src/static/updateDejureGesetze.mjs\`. Bitte nicht von Hand bearbeiten.

export const dejureGesetze = {
${lines.join("\n")}
};

export const dejureGesetzeLowerCased = Object.keys(dejureGesetze).map((key) =>
\tkey.toLowerCase()
);
`;
}

async function main() {
	console.log("Lese bestehende Dejure-Gesetze ein...");
	const existingEntries = parseExistingEntries(OUTPUT_FILE);
	console.log(`Bestehend: ${existingEntries.size} Gesetze.`);

	console.log("Rufe dejure.org/gesetze/ ab...");
	const html = await fetchDejureHtml();
	if (!html) {
		console.log("Abruf abgebrochen oder fehlgeschlagen. Datei wird nicht überschrieben.");
		return;
	}

	const liveLaws = parseDejureHtml(html);
	console.log(`Gefunden auf dejure.org: ${liveLaws.size} Gesetze.`);

	let newCount = 0;
	for (const [abbr, title] of liveLaws.entries()) {
		if (!existingEntries.has(abbr)) {
			newCount++;
			existingEntries.set(abbr, title);
		} else if (title && title.length > (existingEntries.get(abbr) || "").length) {
			existingEntries.set(abbr, title);
		}
	}

	console.log(`Neu hinzugekommen: ${newCount} Gesetze. Gesamtbestand jetzt: ${existingEntries.size}.`);

	const output = render(existingEntries);
	writeFileSync(OUTPUT_FILE, output, "utf8");
	console.log(`Erfolgreich geschrieben nach ${OUTPUT_FILE}`);
}

main();
