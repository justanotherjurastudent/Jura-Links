import { DejureUrl } from "../types/url";
import { LawProviderOptions } from "../types/providerOption";
import { caseRegex, journalRegex, lawChainRegex, lawRegex } from "./regex";
import { getLawUrlByProviderOptions } from "./urlHelper";

function findAndLinkLawReferences(
	fileContent: string,
	lawProviderOptions: LawProviderOptions = {
		firstOption: "dejure",
		secondOption: "lexsoft",
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

function findAndLinkCaseReferences(fileContent: string): string {
	return fileContent.replace(caseRegex, (match) => {
		const encodedMatch = encodeURIComponent(match);
		return `[${match}](${DejureUrl.CASE}${encodedMatch})`;
	});
}

function findAndLinkJournalReferences(fileContent: string): string {
	return fileContent.replace(journalRegex, (match) => {
		const encodedMatch = encodeURIComponent(match);
		return `[${match}](${DejureUrl.JOURNAL}${encodedMatch})`;
	});
}

function getHyperlinkForLawIfExists(
	normGroup: string,
	gesetz: string,
	norm: string,
	lawProviderOptions: LawProviderOptions
): string {
	const lawUrl = getLawUrlByProviderOptions(gesetz, norm, lawProviderOptions);
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

export {
	findAndLinkLawReferences,
	findAndLinkCaseReferences,
	findAndLinkJournalReferences,
};