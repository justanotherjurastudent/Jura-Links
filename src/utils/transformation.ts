import { DejureUrl } from "../types/url";
import { LawProviderOptions } from "../types/providerOption";
import {
	caseRegex,
	journalRegex,
	lawChainRegex,
	lawRegex,
	btDrucksacheRegex,
	brDrucksacheRegex,
} from "./regex";
import { getLawUrlByProviderOptions } from "./urlHelper";
import { requestUrl, RequestUrlResponse } from "obsidian";

let linkCount = 0;

// Neue Interface-Definition für die Jura-Recherche-Antwort
interface JuraRechercheResponse {
	redirect?: string;
	infoContent?: string;
}

async function getJuraRechercheUrl(citation: string): Promise<string | null> {
	try {
		const response: RequestUrlResponse = await requestUrl({
			url: "https://jura-recherche.de/ajax/go",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `q=${encodeURIComponent(citation)}&uni=`,
		});

		if (response.status !== 200) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: JuraRechercheResponse = response.json;

		if (data.redirect) {
			return data.redirect;
		} else {
			return null;
		}
	} catch (error) {
		console.error("Detaillierter Fehler:", error);
		return null;
	}
}

function findAndLinkLawReferences(
	fileContent: string,
	lawProviderOptions: LawProviderOptions = {
		firstOption: "dejure",
		secondOption: "landesrecht.online",
		thirdOption: "lexmea",
		forthOption: "buzer",
		fifthOption: "rewis",
	}
): string {
	if (!lawRegex.test(fileContent)) {
		return fileContent;
	}

	return fileContent.replace(lawRegex, (match, ...args) => {
		const groups = args[args.length - 1];
		let gesetz = groups.gesetz.trim().toLowerCase();
		gesetz = gesetz === "brüssel-ia-vo" ? "eugvvo" : gesetz;
		let lawMatch = groups.p2;

		// Extrahiere die RegEx-Gruppen für den ersten Normverweis
		const firstNormGroup = groups.normgr_first.trim();
		const firstNorm = groups.norm_first;

		// Weitergabe der Detailgruppen an getHyperlinkForLawIfExists
		const firstNormGroups = {
			absatz: groups.absatz_first,
			absatzrom: groups.absatzrom_first,
			satz: groups.satz_first,
			nr: groups.nr_first,
		};

		const firstNormLink = getHyperlinkForLawIfExists(
			firstNormGroup,
			gesetz,
			firstNorm,
			lawProviderOptions,
			firstNormGroups
		);

		// Füge den Link für die erste Norm hinzu
		let updatedLawMatch = firstNormLink;

		// Process chain of laws
		const chainMatches = [...lawMatch.matchAll(lawChainRegex)]; 
		chainMatches.forEach((chainMatch) => {
		const chainGroups = chainMatch.groups;
		if (chainGroups) {
			const norm = chainGroups.norm.trim();
			const normGroup = chainGroups.normgr.trim();
			
			// NEU: Extrahiere Absatz, Satz und Nummer auch für Kettenglieder
			const additionalInfo = {
			absatz: chainGroups.absatz,
			absatzrom: chainGroups.absatzrom,
			satz: chainGroups.satz,
			nr: chainGroups.nr
			};
			
			const normLink = getHyperlinkForLawIfExists(
			normGroup,
			gesetz,
			norm,
			lawProviderOptions,
			additionalInfo  // Übergabe der Details
			);
			
			// Ersetze den gesamten chainMatch wie bisher
			if (!chainMatch[0].includes("](") && !chainMatch[0].includes(")")) {
			updatedLawMatch += ", " + normLink; 
			} else {
			updatedLawMatch += ", " + chainMatch[0]; 
			}
		}
		});


		return match.replace(groups.p2, updatedLawMatch + " ");
	});
}

function getHyperlinkForLawIfExists(
	normGroup: string,
	gesetz: string,
	norm: string,
	lawProviderOptions: LawProviderOptions,
	groups?: any
): string {
	// Extrahiere relevante Informationen aus den Gruppen
	let additionalInfo = null;

	if (groups) {
		// Prüfen, ob einzelne (nicht-Liste) Werte vorhanden sind
		const absatz =
			groups.absatz &&
			!groups.absatz.includes("und") &&
			!groups.absatz.includes(",")
				? groups.absatz
				: null;
		const absatzrom =
			groups.absatzrom &&
			!groups.absatzrom.includes("und") &&
			!groups.absatzrom.includes(",")
				? groups.absatzrom
				: null;
		const satz =
			groups.satz &&
			!groups.satz.includes("und") &&
			!groups.satz.includes(",")
				? groups.satz
				: null;
		const nr =
			groups.nr && !groups.nr.includes("und") && !groups.nr.includes(",")
				? groups.nr
				: null;

		if (absatz || absatzrom || satz || nr) {
			additionalInfo = { absatz, absatzrom, satz, nr };
		}
	}

	const lawUrl = getLawUrlByProviderOptions(
		gesetz,
		norm,
		lawProviderOptions,
		additionalInfo
	);
	linkCount++;
	return lawUrl ? `[${normGroup}](${lawUrl})` : normGroup;
}

async function findAndLinkJournalReferences(
	fileContent: string
): Promise<string> {
	const matches = fileContent.match(journalRegex) || [];

	let updatedContent = fileContent;

	for (const match of matches) {
		const juraRechercheUrl = await getJuraRechercheUrl(match);

		if (juraRechercheUrl) {
			updatedContent = updatedContent.replace(
				match,
				`[${match}](${juraRechercheUrl})`
			);
			linkCount++;
		} else {
			const encodedMatch = encodeURIComponent(match);
			updatedContent = updatedContent.replace(
				match,
				`[${match}](${DejureUrl.JOURNAL}${encodedMatch})`
			);
			linkCount++;
		}
	}

	return updatedContent;
}

//Transformation for BT-Drucksache und BR-Drucksache
function findAndLinkDrucksacheReferences(fileContent: string): string {
	let updatedContent = fileContent;
	const btDrucksacheMatches = fileContent.match(btDrucksacheRegex) || [];
	const brDrucksacheMatches = fileContent.match(brDrucksacheRegex) || [];

	for (const match of btDrucksacheMatches) {
		const Match = match
			.replace(
				/(?:BT-Drs\.|BT-Drucks\.|Bundestagsdrucksache|Bundestag\s+Drucksache)/g,
				"BT-Drs."
			)
			.replace(/\s+/g, "_");
		updatedContent = updatedContent.replace(
			match,
			`[${match}](${DejureUrl.BTDRUCKSACHE}${Match})`
		);
		linkCount++;
	}

	for (const match of brDrucksacheMatches) {
		const Match = match
			.replace(
				/(?:BR-Drs\.|BR-Drucks\.|Bundesratsdrucksache|Bundesrat\s+Drucksache)/g,
				"BT-Drs."
			)
			.replace(/\s+/g, "_");
		updatedContent = updatedContent.replace(
			match,
			`[${match}](${DejureUrl.BRDRUCKSACHE}${Match})`
		);
		linkCount++;
	}

	return updatedContent;
}

function findAndLinkCaseReferences(fileContent: string): string {
	return fileContent.replace(caseRegex, (match) => {
		const encodedMatch = encodeURIComponent(match);
		linkCount++;
		return `[${match}](${DejureUrl.CASE}${encodedMatch})`;
	});
}

function resetLinkCount() {
	linkCount = 0;
}

function getLinkCount() {
	return linkCount;
}

export {
	findAndLinkLawReferences,
	findAndLinkCaseReferences,
	findAndLinkJournalReferences,
	findAndLinkDrucksacheReferences,
	resetLinkCount,
	getLinkCount,
};
