// Gemeinsame Hilfen für die Scraper von Gesetze.co und Jurafuchs.
//
// Landesgesetze werden pro Gesetz nur einmal unter dem Schlüssel "<Basiskürzel> <ISO-Code>"
// gespeichert (z.B. "SOG ST"). Alternative Schreibweisen (LSA, SA, NRW, Bln, ...) werden erst
// beim Nachschlagen in src/utils/urlHelper.ts auf den ISO-Code abgebildet.

export const STATE_VARIANTS = {
	BW: ["BW", "BadW", "Bawü", "Bawue", "Ba-Wü"],
	BY: ["BY", "Bay"],
	BE: ["BE", "Bln"],
	BB: ["BB", "Bbg"],
	HB: ["HB", "Brem"],
	HH: ["HH", "HA", "Hmb"],
	HE: ["HE", "Hes"],
	MV: ["MV", "M-V"],
	NI: ["NI", "Nds"],
	NW: ["NW", "NRW"],
	RP: ["RP", "RLP", "Rh.-Pf."],
	SL: ["SL", "Saar"],
	SN: ["SN", "Sächs"],
	ST: ["ST", "LSA", "SA"],
	SH: ["SH", "Schl.-H."],
	TH: ["TH", "Thür"],
};

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Entfernt ein Länderkürzel am Ende ("SOG LSA" -> "SOG") bzw. vor einer Jahreszahl
// ("AbgG MV 2007" -> "AbgG 2007") und liefert das Basiskürzel.
export function extractBase(abbr, jurisdiction) {
	const variants = STATE_VARIANTS[jurisdiction] || [];
	for (const v of variants) {
		const re = new RegExp(`\\s+${escapeRegex(v)}$`, "i");
		if (re.test(abbr)) return abbr.replace(re, "").trim();
	}
	for (const v of variants) {
		const re = new RegExp(`\\s+${escapeRegex(v)}\\s+(\\d{4})$`, "i");
		if (re.test(abbr)) return abbr.replace(re, " $1").trim();
	}
	return abbr;
}

// Schlüssel eines Landesgesetzes: Basiskürzel + kanonischer ISO-Code
export function stateKey(abbr, jurisdiction) {
	return `${extractBase(abbr, jurisdiction)} ${jurisdiction}`;
}

// Nicht-ASCII-Zeichen als \uXXXX schreiben (wie im bestehenden Datenbestand)
export function quote(value) {
	return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function isUsableKey(key) {
	return key.length > 0 && !/[[\](){}|*+?^$\\]/.test(key);
}

