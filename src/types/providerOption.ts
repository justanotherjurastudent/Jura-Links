type LawProviderOption =
	| "dejure"
	| "buzer"
	| "lexmea"
	| "landesrecht.online"
	| "rewis"
	| "gesetze.co";

type LawProviderOptions = {
	firstOption: LawProviderOption;
	secondOption: LawProviderOption | null;
	thirdOption: LawProviderOption | null;
	forthOption: LawProviderOption | null;
	fifthOption: LawProviderOption | null;
	sixthOption: LawProviderOption | null;
};

export type { LawProviderOption, LawProviderOptions };
