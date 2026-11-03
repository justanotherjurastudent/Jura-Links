type StateLawProviderOption =
	| "landesrecht.online"
	| "jurafuchs"
	| "gesetze.co";

type StateLawProviderOptions = {
	firstOption: StateLawProviderOption;
	secondOption: StateLawProviderOption | null;
	thirdOption: StateLawProviderOption | null;
};

type LawProviderOption =
	| "dejure"
	| "buzer"
	| "lexmea"
	| "landesrecht.online"
	| "rewis"
	| "gesetze.co"
	| "jurafuchs";

type LawProviderOptions = {
	firstOption: LawProviderOption;
	secondOption: LawProviderOption | null;
	thirdOption: LawProviderOption | null;
	forthOption: LawProviderOption | null;
	fifthOption: LawProviderOption | null;
	sixthOption: LawProviderOption | null;
	seventhOption: LawProviderOption | null;
};

export type {
	StateLawProviderOption,
	StateLawProviderOptions,
	LawProviderOption,
	LawProviderOptions,
};
