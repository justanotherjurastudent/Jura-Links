import { App, PluginSettingTab, Setting } from "obsidian";
import LegalReferencePlugin from "../../main";
import {
	LawProviderOption,
	LawProviderOptions,
	StateLawProviderOption,
	StateLawProviderOptions,
} from "../types/providerOption";

export interface LawProviderSettings {
	stateLawProviderOptions: StateLawProviderOptions;
	lawProviderOptions: LawProviderOptions;
	executeOnFileOpen: boolean;
}

export const DEFAULT_STATE_LAW_PROVIDER_OPTIONS: StateLawProviderOptions = {
	firstOption: "landesrecht.online",
	secondOption: "jurafuchs",
	thirdOption: "gesetze.co",
};

export const DEFAULT_SETTINGS: LawProviderSettings = {
	stateLawProviderOptions: DEFAULT_STATE_LAW_PROVIDER_OPTIONS,
	lawProviderOptions: {
		firstOption: "dejure",
		secondOption: "lexmea",
		thirdOption: "buzer",
		forthOption: "rewis",
		fifthOption: "gesetze.co",
		sixthOption: "jurafuchs",
		seventhOption: null,
	},
	executeOnFileOpen: true,
};

interface DropdownItem {
	setting: Setting;
	errorSpan: HTMLSpanElement;
	dropdown: HTMLSelectElement;
}

export class LawProviderSettingTab extends PluginSettingTab {
	plugin: LegalReferencePlugin;
	private stateDropdowns: DropdownItem[];
	private generalDropdowns: DropdownItem[];

	constructor(app: App, plugin: LegalReferencePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.stateDropdowns = [];
		this.generalDropdowns = [];
	}

	// --- Deklarative Settings-API (Obsidian 1.13.0+) ---
	// Ermöglicht die Suche nach Einstellungen in Obsidian.
	// Für minAppVersion < 1.13.0 bleibt display() als Fallback aktiv (Dual-Support).

	// Liest verschachtelte Settings über Punkt-Notation (z. B. "lawProviderOptions.firstOption")
	getControlValue(key: string): unknown {
		const parts = key.split(".");
		let cursor: unknown = this.plugin.settings;
		for (const part of parts) {
			if (cursor === null || typeof cursor !== "object") return undefined;
			// Schutz vor Prototype-Pollution: gefährliche Schlüssel überspringen
			if (part === "__proto__" || part === "constructor" || part === "prototype") {
				return undefined;
			}
			const record = cursor as Record<string, unknown>;
			if (!Object.prototype.hasOwnProperty.call(record, part)) {
				return undefined;
			}
			cursor = record[part];
		}
		return cursor;
	}

	// Schreibt verschachtelte Settings über Punkt-Notation und speichert sie
	async setControlValue(key: string, value: unknown): Promise<void> {
		const parts = key.split(".");
		const last = parts.pop();
		if (!last) return;
		// Schutz vor Prototype-Pollution: gefährliche Schlüssel ablehnen
		if (last === "__proto__" || last === "constructor" || last === "prototype") {
			return;
		}
		const target = this.getNestedParent(parts);
		if (target) {
			target[last] = value;
			await this.plugin.saveSettings();
		}
	}

	// Navigiert zu einem verschachtelten Objekt über Punkt-Notation.
	// Erstellt fehlende Zwischenobjekte mit null-Prototyp (verhindert Prototype-Pollution).
	private getNestedParent(parts: string[]): Record<string, unknown> | null {
		let cursor: Record<string, unknown> = this.plugin.settings as unknown as Record<string, unknown>;
		for (const part of parts) {
			if (part === "__proto__" || part === "constructor" || part === "prototype") {
				return null;
			}
			const record = cursor;
			if (!Object.prototype.hasOwnProperty.call(record, part)) {
				// Fehlendes Zwischenobjekt mit null-Prototyp anlegen (verhindert Prototype-Pollution)
				record[part] = Object.create(null);
			}
			cursor = record[part] as Record<string, unknown>;
		}
		return cursor;
	}

	getSettingDefinitions() {
		const stateOptions: Record<string, string> = {
			"landesrecht.online": "Landesrecht.online",
			"jurafuchs": "Jurafuchs",
			"gesetze.co": "Gesetze.co",
		};

		const generalOptions: Record<string, string> = {
			"dejure": "Dejure",
			"lexmea": "LexMea",
			"buzer": "Buzer",
			"rewis": "Rewis",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
		};

		return [
			{
				name: "Bei jedem Öffnen der Datei ausführen",
				desc: "Aktivieren Sie diese Option, um das Plugin bei jedem Öffnen der Notiz auszuführen.",
				control: {
					type: "toggle",
					key: "executeOnFileOpen",
				},
			},
			{
				name: "1. Wahl (Landesrecht)",
				desc: "Erster Anbieter, der bei Landesgesetzen durchsucht werden soll.",
				control: {
					type: "dropdown",
					key: "stateLawProviderOptions.firstOption",
					options: stateOptions,
				},
			},
			{
				name: "2. Wahl (Landesrecht)",
				desc: "Falls das Landesgesetz beim ersten Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "stateLawProviderOptions.secondOption",
					options: stateOptions,
				},
			},
			{
				name: "3. Wahl (Landesrecht)",
				desc: "Falls das Landesgesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "stateLawProviderOptions.thirdOption",
					options: stateOptions,
				},
			},
			{
				name: "1. Wahl (Bundes- und EU-Recht)",
				desc: "Erster Anbieter, der bei Bundes- und EU-Gesetzen durchsucht werden soll.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.firstOption",
					options: generalOptions,
				},
			},
			{
				name: "2. Wahl (Bundes- und EU-Recht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.secondOption",
					options: generalOptions,
				},
			},
			{
				name: "3. Wahl (Bundes- und EU-Recht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.thirdOption",
					options: generalOptions,
				},
			},
			{
				name: "4. Wahl (Bundes- und EU-Recht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.forthOption",
					options: generalOptions,
				},
			},
			{
				name: "5. Wahl (Bundes- und EU-Recht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.fifthOption",
					options: generalOptions,
				},
			},
			{
				name: "6. Wahl (Bundes- und EU-Recht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.sixthOption",
					options: generalOptions,
				},
			},
		];
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Bei jedem Öffnen der Datei ausführen")
			.setDesc("Aktivieren Sie diese Option, um das Plugin bei jedem Öffnen der Notiz auszuführen.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.executeOnFileOpen);
				toggle.onChange(async (value) => {
					this.plugin.settings.executeOnFileOpen = value;
					await this.plugin.saveSettings();
				});
			});

		// --- Landesgesetze ---
		new Setting(containerEl).setName("Landesgesetze").setHeading();
		containerEl.createEl("p", {
			text: "Wählen Sie die Reihenfolge der Anbieter für Landesgesetze (z. B. BauO NRW, PolG BW, PAG Bay). Für Landesrecht stehen Landesrecht.online, Jurafuchs und Gesetze.co zur Verfügung. Landesgesetze werden vorrangig bei diesen Anbietern gesucht.",
		});

		const stateProviders: StateLawProviderOption[] = [
			"landesrecht.online",
			"jurafuchs",
			"gesetze.co",
		];

		const stateProviderDisplayNames: Record<StateLawProviderOption, string> = {
			"landesrecht.online": "Landesrecht.online",
			"jurafuchs": "Jurafuchs",
			"gesetze.co": "Gesetze.co",
		};

		const createStateDropdown = (
			name: string,
			desc: string,
			settingKey: keyof StateLawProviderOptions
		): DropdownItem => {
			const setting = new Setting(containerEl)
				.setName(name)
				.setDesc(desc);

			const errorSpan = setting.settingEl.createSpan({
				cls: "law-provider-error",
			});

			let dropdown: HTMLSelectElement;
			setting.addDropdown((d) => {
				dropdown = d.selectEl;
				stateProviders.forEach((provider) => {
					d.addOption(provider, stateProviderDisplayNames[provider]);
				});
				d.setValue(
					this.plugin.settings.stateLawProviderOptions?.[settingKey] ?? ""
				);
				d.onChange(async (value: string) => {
					this.plugin.settings.stateLawProviderOptions[settingKey] =
						value as StateLawProviderOption;
					await this.plugin.saveSettings();
					this.checkStateDuplicates();
				});
			});

			return { setting, errorSpan, dropdown: dropdown! };
		};

		this.stateDropdowns = [
			createStateDropdown(
				"1. Wahl (Landesrecht)",
				"Erster Anbieter, der bei Landesgesetzen durchsucht werden soll.",
				"firstOption"
			),
			createStateDropdown(
				"2. Wahl (Landesrecht)",
				"Falls das Landesgesetz beim ersten Anbieter nicht verfügbar ist.",
				"secondOption"
			),
			createStateDropdown(
				"3. Wahl (Landesrecht)",
				"Falls das Landesgesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"thirdOption"
			),
		];

		// --- Bundes- und EU-Gesetze ---
		new Setting(containerEl).setName("Bundes- und EU-Gesetze").setHeading();
		containerEl.createEl("p", {
			text: "Wählen Sie die Reihenfolge der Anbieter für Bundes- und EU-Gesetze (z. B. BGB, StGB, GG, DSGVO), falls kein Landesgesetz vorliegt oder dieses bei den Landesrechtsanbietern nicht gefunden wurde.",
		});

		const generalProviders: LawProviderOption[] = [
			"dejure",
			"lexmea",
			"buzer",
			"rewis",
			"gesetze.co",
			"jurafuchs",
		];

		const generalProviderDisplayNames: Record<LawProviderOption, string> = {
			"dejure": "Dejure",
			"landesrecht.online": "Landesrecht.online",
			"lexmea": "LexMea",
			"buzer": "Buzer",
			"rewis": "Rewis",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
		};

		const createGeneralDropdown = (
			name: string,
			desc: string,
			settingKey: keyof LawProviderOptions
		): DropdownItem => {
			const setting = new Setting(containerEl)
				.setName(name)
				.setDesc(desc);

			const errorSpan = setting.settingEl.createSpan({
				cls: "law-provider-error",
			});

			let dropdown: HTMLSelectElement;
			setting.addDropdown((d) => {
				dropdown = d.selectEl;
				generalProviders.forEach((provider) => {
					d.addOption(provider, generalProviderDisplayNames[provider]);
				});
				d.setValue(
					this.plugin.settings.lawProviderOptions?.[settingKey] ?? ""
				);
				d.onChange(async (value: string) => {
					this.plugin.settings.lawProviderOptions[settingKey] =
						value as LawProviderOption;
					await this.plugin.saveSettings();
					this.checkGeneralDuplicates();
				});
			});

			return { setting, errorSpan, dropdown: dropdown! };
		};

		this.generalDropdowns = [
			createGeneralDropdown(
				"1. Wahl (Bundes- und EU-Recht)",
				"Erster Anbieter, der bei Bundes- und EU-Gesetzen durchsucht werden soll.",
				"firstOption"
			),
			createGeneralDropdown(
				"2. Wahl (Bundes- und EU-Recht)",
				"Falls das Gesetz beim ersten Anbieter nicht verfügbar ist.",
				"secondOption"
			),
			createGeneralDropdown(
				"3. Wahl (Bundes- und EU-Recht)",
				"Falls das Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"thirdOption"
			),
			createGeneralDropdown(
				"4. Wahl (Bundes- und EU-Recht)",
				"Falls das Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"forthOption"
			),
			createGeneralDropdown(
				"5. Wahl (Bundes- und EU-Recht)",
				"Falls das Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"fifthOption"
			),
			createGeneralDropdown(
				"6. Wahl (Bundes- und EU-Recht)",
				"Falls das Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"sixthOption"
			),
		];

		this.checkStateDuplicates();
		this.checkGeneralDuplicates();
	}

	private checkGroupDuplicates(items: DropdownItem[]): void {
		const selectedValues = items
			.map((d) => d.dropdown?.value)
			.filter((value): value is string => Boolean(value));

		items.forEach((item, index) => {
			if (!item.dropdown) return;
			const currentValue = selectedValues[index];
			const isDuplicate =
				currentValue !== undefined &&
				selectedValues.indexOf(currentValue) !== index;

			if (isDuplicate) {
				item.errorSpan.classList.add("visible");
				item.errorSpan.textContent = "Dieser Anbieter wurde bereits ausgewählt.";
			} else {
				item.errorSpan.classList.remove("visible");
				item.errorSpan.textContent = "";
			}
		});
	}

	private checkStateDuplicates(): void {
		this.checkGroupDuplicates(this.stateDropdowns);
	}

	private checkGeneralDuplicates(): void {
		this.checkGroupDuplicates(this.generalDropdowns);
	}
}
