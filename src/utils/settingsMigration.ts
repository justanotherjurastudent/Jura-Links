import { LawProviderOption, LawProviderOptions } from "../types/providerOption";

const LEGACY_PROVIDERS = ["buzer", "landesrecht.online"];
const FALLBACK_PROVIDERS: LawProviderOption[] = ["dejure", "lexmea", "rewis", "gesetze.co", "jurafuchs"];

// Entfernt veraltete Anbieter (Buzer, Landesrecht.online im Bundesrecht) aus gespeicherten Einstellungen.
// Ohne veraltete Einträge bleibt die Auswahl unverändert, damit bewusst leere Stufen erhalten bleiben.
export function migrateFederalOptions(options: LawProviderOptions): LawProviderOptions {
	const raw = [
		options.firstOption,
		options.secondOption,
		options.thirdOption,
		options.forthOption,
		options.fifthOption,
		options.sixthOption,
		options.seventhOption,
	];
	if (!raw.some((opt) => opt && LEGACY_PROVIDERS.includes(opt))) {
		return options;
	}

	const kept = raw.filter((opt): opt is LawProviderOption => Boolean(opt) && !LEGACY_PROVIDERS.includes(opt as string));
	const unique = Array.from(new Set([...kept, ...FALLBACK_PROVIDERS]));
	return {
		firstOption: unique[0] ?? "dejure",
		secondOption: unique[1] ?? null,
		thirdOption: unique[2] ?? null,
		forthOption: unique[3] ?? null,
		fifthOption: unique[4] ?? null,
	};
}
