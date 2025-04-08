import { buzerGesetzeLowerCased } from "../static/buzerGesetze";
import { dejureGesetzeLowerCased } from "../static/dejureGesetze";
import { lexmeaGesetzeLowerCased } from "../static/lexmeaGesetze";
import { justiz_NRW_LandesgesetzeLowerCased } from "../static/Justiz NRW Landesgesetze";
import { rewisGesetzeLowerCased } from "../static/rewisGesetze";
import { LawProviderOption, LawProviderOptions } from "../types/providerOption";
import { DejureUrl, LawProviderUrl } from "../types/url";

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
	additionalInfo?: any
): string {
	const lawUrl = DejureUrl.LAW;
	gesetz = gesetz.toLowerCase();

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

	if (
		buzerGesetzeLowerCased[gesetz] &&
		buzerGesetzeLowerCased[gesetz]["norms"][norm]
	) {
		return `${lawUrl}${buzerGesetzeLowerCased[gesetz]["norms"][norm]}`;
	}
	return "";
}

function getLexmeaUrl(gesetz: string, norm: string): string {
	const lawUrl = LawProviderUrl.LEXMEA;
	gesetz = gesetz.toLowerCase();

	if (lexmeaGesetzeLowerCased.indexOf(gesetz) !== -1) {
		return `${lawUrl}${gesetz}/${norm}`;
	}
	return "";
}

function getJustiz_NRW_Landesgesetze_Url(
	gesetz: string,
	norm: string,
	additionalInfo?: any
): string {
	const lawUrl = LawProviderUrl.JUSTIZ_NRW_LANDESGESETZE;
	gesetz = gesetz.toLowerCase();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const [_, law] of Object.entries(justiz_NRW_LandesgesetzeLowerCased)) {
		if (law[gesetz] && law[gesetz]["norms"][norm]) {
			let url = `${lawUrl}${law[gesetz]["norms"][norm]}`;

			// Fragment-Identifier #jurabsatz_ anhängen
			url += "#jurabsatz_";

			// Absatz hinzufügen (normal oder römisch)
			if (additionalInfo) {
				if (additionalInfo.absatz) {
					url += additionalInfo.absatz;
				} else if (additionalInfo.absatzrom) {
					try {
						const arabicNumber = romanToArabic(
							additionalInfo.absatzrom
						);
						url += arabicNumber;
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
	}

	return "";
}

function getRewisUrl(
	gesetz: string,
	norm: string,
	additionalInfo?: any
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

	// Fragment-Identifier #abs_ anhängen
	url += "#abs_";

	// Absatz hinzufügen (normal oder römisch)
	if (additionalInfo) {
		if (additionalInfo.absatz) {
			url += additionalInfo.absatz;
		} else if (additionalInfo.absatzrom) {
			try {
				const arabicNumber = romanToArabic(additionalInfo.absatzrom);
				url += arabicNumber;
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
	additionalInfo?: any
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

	if (lawProvider === "justiz nrw landesgesetze") {
		return (
			getJustiz_NRW_Landesgesetze_Url(gesetz, norm, additionalInfo) || ""
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
	additionalInfo?: any
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
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.thirdOption);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.forthOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.forthOption);
		if (lawUrl) {
			return lawUrl;
		}
	}

	if (lawProviders.fifthOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.fifthOption);
		if (lawUrl) {
			return lawUrl;
		}
	}

	return "";
}

export { getLawUrlByProvider, getLawUrlByProviderOptions };
