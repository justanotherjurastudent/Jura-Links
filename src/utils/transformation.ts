import { DejureUrl } from "../types/url";
import { LawProviderOptions } from "../types/providerOption";
import { caseRegex, journalRegex, lawChainRegex, lawRegex, btDrucksacheRegex, brDrucksacheRegex } from "./regex";
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
			url: 'https://jura-recherche.de/ajax/go',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
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
		console.error('Detaillierter Fehler:', error);
		return null;
	}
}

function findAndLinkLawReferences(
	fileContent: string,
	lawProviderOptions: LawProviderOptions = {
		firstOption: "dejure",
		secondOption: "justiz nrw landesgesetze",
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

		// Process first norm
		const firstNormGroup = groups.normgr_first.trim();
		const firstNorm = groups.norm_first;
		const firstNormLink = getHyperlinkForLawIfExists(
			firstNormGroup,
			gesetz,
			firstNorm,
			lawProviderOptions
		);
		lawMatch = lawMatch.replace(firstNormGroup, firstNormLink);

		// Process last norm if exists
		if (groups.norm_last && groups.normgr_last) {
			const lastNormGroup = groups.normgr_last.trim();
			const lastNorm = groups.norm_last.trim();
			const lastNormLink = getHyperlinkForLawIfExists(
				lastNormGroup,
				gesetz,
				lastNorm,
				lawProviderOptions
			);
			lawMatch = replaceLast(lastNormGroup, lastNormLink, lawMatch);
		}

		// Process chain of laws
		if (groups.p1 !== "§") {
			lawMatch = lawMatch.replace(
				lawChainRegex,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(chainMatch: string, ...chainArgs: (string | any)[]) => {
					const chainGroups = chainArgs[chainArgs.length - 1];
					const norm = chainGroups.norm.trim();
					const normGroup = chainGroups.normgr.trim();
					const normLink = getHyperlinkForLawIfExists(
						normGroup,
						gesetz,
						norm,
						lawProviderOptions
					);
					return chainMatch.replace(normGroup, normLink);
				}
			);
		}

		return match.replace(groups.p2, lawMatch);
	});
}

function getHyperlinkForLawIfExists(
	normGroup: string,
	gesetz: string,
	norm: string,
	lawProviderOptions: LawProviderOptions
): string {
	const lawUrl = getLawUrlByProviderOptions(gesetz, norm, lawProviderOptions);
	linkCount++;
	return lawUrl ? `[${normGroup}](${lawUrl})` : normGroup;
}

function replaceLast(
	oldString: string,
	newString: string,
	string: string
): string {
	const lastIndex = string.lastIndexOf(oldString);

	if (lastIndex === -1) {
		return string;
	}

	const beginString = string.substring(0, lastIndex);
	const endString = string.substring(lastIndex + oldString.length);

	return beginString + newString + endString;
}

async function findAndLinkJournalReferences(fileContent: string): Promise<string> {
    const matches = fileContent.match(journalRegex) || [];
    
    let updatedContent = fileContent;

    for (const match of matches) {
        const juraRechercheUrl = await getJuraRechercheUrl(match);
        
        if (juraRechercheUrl) {
            updatedContent = updatedContent.replace(match, `[${match}](${juraRechercheUrl})`);
			linkCount++;
        } else {
            const encodedMatch = encodeURIComponent(match);
            updatedContent = updatedContent.replace(match, `[${match}](${DejureUrl.JOURNAL}${encodedMatch})`);
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
        const Match = match.replace(/(?:BT-Drs\.|BT-Drucks\.|Bundestagsdrucksache|Bundestag\s+Drucksache)/g, 'BT-Drs.').replace(/\s+/g, '_');
        updatedContent = updatedContent.replace(match, `[${match}](${DejureUrl.BTDRUCKSACHE}${Match})`);
		linkCount++;
    }
    
    for (const match of brDrucksacheMatches) {
        const Match = match.replace(/(?:BR-Drs\.|BR-Drucks\.|Bundesratsdrucksache|Bundesrat\s+Drucksache)/g, 'BT-Drs.').replace(/\s+/g, '_');
        updatedContent = updatedContent.replace(match, `[${match}](${DejureUrl.BRDRUCKSACHE}${Match})`);
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