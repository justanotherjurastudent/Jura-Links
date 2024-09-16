import { buzerGesetzeLowerCased } from "../static/buzerGesetze";
import { dejureGesetzeLowerCased } from "../static/dejureGesetze";
import { lexmeaGesetzeLowerCased } from "../static/lexmeaGesetze";
import { lexsoftGesetzeLowerCased } from "../static/lexsoftGesetze";
import { rewisGesetzeLowerCased } from "../static/rewisGesetze";
import { LawProviderOption, LawProviderOptions } from "../types/providerOption";
import { DejureUrl, LawProviderUrl } from "../types/url";

function getDejureUrl(gesetz: string, norm: string): string {
	const lawUrl = DejureUrl.LAW;
	gesetz = gesetz.toLowerCase();
	if (dejureGesetzeLowerCased.indexOf(gesetz) !== -1) {
		return `${lawUrl}${gesetz}/${norm}.html`;
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

function getLexsoftUrl(gesetz: string, norm: string): string {
	const lawUrl = LawProviderUrl.LEXSOFT;
	gesetz = gesetz.toLowerCase();

	for (const [_, law] of Object.entries(lexsoftGesetzeLowerCased)) {
		if (law[gesetz] && law[gesetz]["norms"][norm]) {
			return `${lawUrl}${law[gesetz]["norms"][norm]}`;
		}
	}
	return "";
}

function getRewisUrl(gesetz: string, norm: string): string {
	const lawUrl = LawProviderUrl.REWIS;
	gesetz = gesetz.toLowerCase();

	const foundGesetz = rewisGesetzeLowerCased[gesetz];
	if (!foundGesetz) {
		return "";
	}

	if (foundGesetz.lawNormOrder) {
		return `${lawUrl}${foundGesetz.url}/p/${foundGesetz.url}-${norm}`.replace(
			"-",
			"%2D"
		);
	}

	return `${lawUrl}${foundGesetz.url}/p/${norm}-${foundGesetz.url}`.replace(
		"-",
		"%2D"
	);
}

function getLawUrlByProvider(
	gesetz: string,
	norm: string,
	lawProvider: LawProviderOption
): string {
	if (lawProvider === "dejure") {
		return getDejureUrl(gesetz, norm) || "";
	}
	if (lawProvider === "buzer") {
		return getBuzerUrl(gesetz, norm) || "";
	}
	if (lawProvider === "lexmea") {
		return getLexmeaUrl(gesetz, norm) || "";
	}
	if (lawProvider === "lexsoft") {
		return getLexsoftUrl(gesetz, norm) || "";
	}
	if (lawProvider === "rewis") {
		return getRewisUrl(gesetz, norm) || "";
	}
	return "";
}

function getLawUrlByProviderOptions(
	gesetz: string,
	norm: string,
	lawProviders: LawProviderOptions
): string {
	let lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.firstOption);
	if (lawUrl) {
		return lawUrl;
	}

	if (lawProviders.secondOption) {
		lawUrl = getLawUrlByProvider(gesetz, norm, lawProviders.secondOption);
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
