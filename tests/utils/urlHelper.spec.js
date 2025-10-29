import { expect, test } from "vitest";
import { getLawUrlByProvider } from "../../src/utils/urlHelper";

test.each([
	{
		gesetz: `stgb`,
		norm: `242`,
		provider: `dejure`,
		expected: `https://www.dejure.org/gesetze/stgb/242.html`,
	},
	{
		gesetz: `GG`,
		norm: `1`,
		provider: `buzer`,
		expected: `https://www.buzer.de/1_GG.htm`,
	},
	{
		gesetz: `BGB`,
		norm: `2`,
		provider: `lexmea`,
		expected: `https://lexmea.de/gesetz/bgb/2`,
	},
	{
		gesetz: `sog lsa`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
	},
	{
		gesetz: `AVBFernwärmeV`,
		norm: `1`,
		provider: `rewis`,
		expected: `https://rewis.io/gesetze/avbfernwarmev/p/1%2Davbfernwarmev`,
	},
	{
		gesetz: `aabg`,
		norm: `1`,
		provider: `rewis`,
		expected: `https://rewis.io/gesetze/aabg/p/aabg%2D1`,
	},
])(
	"getLawUrlByProvider: should returns $expected given $provider, $gesetz, $norm",
	(testData) => {
		const result = getLawUrlByProvider(
			testData.gesetz,
			testData.norm,
			testData.provider
		);
		expect(result).toBe(testData.expected);
	}
);

// Additional tests for landesrecht.online URL patterns based on problem statement
test.each([
	{
		gesetz: `POG RP`,
		norm: `7`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/RP/POG/7`,
		description: "POG RP removes Bundesland suffix in path"
	},
	{
		gesetz: `pog rp`,
		norm: `7`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/RP/POG/7`,
		description: "pog rp resolves to canonical casing without suffix"
	},
	{
		gesetz: `ThürBO`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/TH/ThürBO/1`,
		description: "ThürBO keeps canonical casing"
	},
	{
		gesetz: `thürbo`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/TH/ThürBO/1`,
		description: "thürbo lower-case input maps to canonical ThürBO"
	},
	{
		gesetz: `AbgG BW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BW/AbgG/1`,
		description: "AbgG BW removes Bundesland suffix"
	},
	{
		gesetz: `BW AGBMG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/BW/AGBMG/1`,
		description: "BW AGBMG removes leading Bundesland prefix"
	},
	{
		gesetz: `PolG NRW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "PolG NRW removes suffix for final path"
	},
	{
		gesetz: `NRW PolG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "NRW PolG reordered input resolves without suffix"
	},
	{
		gesetz: `polg nrw`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "polg nrw lower-case maps to canonical PolG without suffix"
	},
	{
		gesetz: `PolG NW`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/NW/PolG/1`,
		description: "PolG NW canonical abbreviation maps to PolG without suffix"
	},
	{
		gesetz: `SOG LSA`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/ST/SOG/1`,
		description: "SOG LSA removes suffix for Sachsen-Anhalt"
	},
	{
		gesetz: `AbgG MV`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/MV/AbgG/1`,
		description: "AbgG MV removes suffix for Meck-Pomm"
	},
	{
		gesetz: `M-V AbgG`,
		norm: `1`,
		provider: `landesrecht.online`,
		expected: `https://landesrecht.online/MV/AbgG/1`,
		description: "M-V AbgG variant converts to canonical AbgG without prefix"
	},
])(
	"getLawUrlByProvider landesrecht.online: $description",
	(testData) => {
		const result = getLawUrlByProvider(
			testData.gesetz,
			testData.norm,
			testData.provider
		);
		expect(result).toBe(testData.expected);
	}
);
