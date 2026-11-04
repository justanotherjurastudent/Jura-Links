import { App, PluginSettingTab, Setting } from "obsidian";
import LegalReferencePlugin from "../../main";
import {
	EuLawProviderOption,
	EuLawProviderOptions,
	LawProviderOption,
	LawProviderOptions,
	StateLawProviderOption,
	StateLawProviderOptions,
} from "../types/providerOption";

export interface LawProviderSettings {
	stateLawProviderOptions: StateLawProviderOptions;
	lawProviderOptions: LawProviderOptions;
	syncEuWithFederal: boolean;
	euLawProviderOptions: EuLawProviderOptions;
	executeOnFileOpen: boolean;
}

export const DEFAULT_STATE_LAW_PROVIDER_OPTIONS: StateLawProviderOptions = {
	firstOption: "landesrecht.online",
	secondOption: "jurafuchs",
	thirdOption: "gesetze.co",
};

export const DEFAULT_EU_LAW_PROVIDER_OPTIONS: EuLawProviderOptions = {
	firstOption: "dejure",
	secondOption: "gesetze.co",
	thirdOption: "jurafuchs",
	forthOption: "lexmea",
	fifthOption: "rewis",
};

export const DEFAULT_SETTINGS: LawProviderSettings = {
	stateLawProviderOptions: DEFAULT_STATE_LAW_PROVIDER_OPTIONS,
	lawProviderOptions: {
		firstOption: "dejure",
		secondOption: "lexmea",
		thirdOption: "rewis",
		forthOption: "gesetze.co",
		fifthOption: "jurafuchs",
	},
	syncEuWithFederal: true,
	euLawProviderOptions: DEFAULT_EU_LAW_PROVIDER_OPTIONS,
	executeOnFileOpen: true,
};

interface DropdownItem {
	setting: Setting;
	errorSpan: HTMLSpanElement;
	dropdown: HTMLSelectElement;
}

export class LawProviderSettingTab extends PluginSettingTab {
	plugin: LegalReferencePlugin;
	private activeTab: "federal" | "state" | "eu";
	private stateDropdowns: DropdownItem[];
	private generalDropdowns: DropdownItem[];
	private euDropdowns: DropdownItem[];

	constructor(app: App, plugin: LegalReferencePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.activeTab = "federal";
		this.stateDropdowns = [];
		this.generalDropdowns = [];
		this.euDropdowns = [];
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
			"rewis": "Rewis",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
		};

		const euOptions: Record<string, string> = {
			"dejure": "Dejure",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
			"lexmea": "LexMea",
			"rewis": "Rewis",
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
				name: "1. Wahl (Bundesrecht)",
				desc: "Erster Anbieter, der bei Bundesgesetzen durchsucht werden soll.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.firstOption",
					options: generalOptions,
				},
			},
			{
				name: "2. Wahl (Bundesrecht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.secondOption",
					options: generalOptions,
				},
			},
			{
				name: "3. Wahl (Bundesrecht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.thirdOption",
					options: generalOptions,
				},
			},
			{
				name: "4. Wahl (Bundesrecht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.forthOption",
					options: generalOptions,
				},
			},
			{
				name: "5. Wahl (Bundesrecht)",
				desc: "Falls das Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.fifthOption",
					options: generalOptions,
				},
			},
			{
				name: "EU-Recht mit Bundesrecht synchronisieren",
				desc: "Verwendet für europäische Gesetze dieselbe Anbieter-Reihenfolge wie für Bundesrecht.",
				control: {
					type: "toggle",
					key: "syncEuWithFederal",
				},
			},
			{
				name: "1. Wahl (EU-Recht)",
				desc: "Erster Anbieter, der bei europäischen Gesetzen durchsucht werden soll.",
				control: {
					type: "dropdown",
					key: "euLawProviderOptions.firstOption",
					options: euOptions,
				},
			},
			{
				name: "2. Wahl (EU-Recht)",
				desc: "Falls das EU-Gesetz beim vorherigen Anbieter nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "euLawProviderOptions.secondOption",
					options: euOptions,
				},
			},
			{
				name: "3. Wahl (EU-Recht)",
				desc: "Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "euLawProviderOptions.thirdOption",
					options: euOptions,
				},
			},
			{
				name: "4. Wahl (EU-Recht)",
				desc: "Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "euLawProviderOptions.forthOption",
					options: euOptions,
				},
			},
			{
				name: "5. Wahl (EU-Recht)",
				desc: "Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				control: {
					type: "dropdown",
					key: "euLawProviderOptions.fifthOption",
					options: euOptions,
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

		// --- Tab-Navigation für die drei Rechtsbereiche ---
		const tabNav = containerEl.createDiv({ cls: "law-provider-tabs" });
		const tabItems: { id: "federal" | "state" | "eu"; label: string }[] = [
			{ id: "federal", label: "Bundesrecht" },
			{ id: "state", label: "Landesrecht" },
			{ id: "eu", label: "Europarecht" },
		];

		tabItems.forEach(({ id, label }) => {
			const btn = tabNav.createEl("button", {
				text: label,
				cls: `law-provider-tab-btn ${this.activeTab === id ? "mod-cta is-active" : ""}`,
			});
			btn.addEventListener("click", () => {
				this.activeTab = id;
				this.display();
			});
		});

		const tabContent = containerEl.createDiv({ cls: "law-provider-tab-content" });

		if (this.activeTab === "federal") {
			this.renderFederalTab(tabContent);
		} else if (this.activeTab === "state") {
			this.renderStateTab(tabContent);
		} else {
			this.renderEuTab(tabContent);
		}
	}

	private renderFederalTab(container: HTMLElement): void {
		new Setting(container).setName("Bundesgesetze").setHeading();
		container.createEl("p", {
			text: "Wählen Sie die Reihenfolge der Anbieter für Bundesgesetze (z. B. BGB, StGB, GG).",
		});

		const generalProviders: LawProviderOption[] = [
			"dejure",
			"lexmea",
			"rewis",
			"gesetze.co",
			"jurafuchs",
		];

		const generalProviderDisplayNames: Record<LawProviderOption, string> = {
			"dejure": "Dejure",
			"landesrecht.online": "Landesrecht.online",
			"lexmea": "LexMea",
			"rewis": "Rewis",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
		};

		const createGeneralDropdown = (
			name: string,
			desc: string,
			settingKey: keyof LawProviderOptions
		): DropdownItem => {
			const setting = new Setting(container)
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
				"1. Wahl (Bundesrecht)",
				"Erster Anbieter, der bei Bundesgesetzen durchsucht werden soll.",
				"firstOption"
			),
			createGeneralDropdown(
				"2. Wahl (Bundesrecht)",
				"Falls das Bundesgesetz beim ersten Anbieter nicht verfügbar ist.",
				"secondOption"
			),
			createGeneralDropdown(
				"3. Wahl (Bundesrecht)",
				"Falls das Bundesgesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"thirdOption"
			),
			createGeneralDropdown(
				"4. Wahl (Bundesrecht)",
				"Falls das Bundesgesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"forthOption"
			),
			createGeneralDropdown(
				"5. Wahl (Bundesrecht)",
				"Falls das Bundesgesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"fifthOption"
			),
		];

		this.checkGeneralDuplicates();
	}

	private renderStateTab(container: HTMLElement): void {
		new Setting(container).setName("Landesgesetze").setHeading();
		container.createEl("p", {
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
			const setting = new Setting(container)
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

		this.checkStateDuplicates();
	}

	private renderEuTab(container: HTMLElement): void {
		new Setting(container).setName("Europäische Gesetze").setHeading();
		container.createEl("p", {
			text: "Wählen Sie die Reihenfolge der Anbieter für europäische Rechtsakte (z. B. DSGVO, AEUV, EUV, EuGVVO, Rom I/II).",
		});

		new Setting(container)
			.setName("Mit Bundesrecht synchronisieren")
			.setDesc("Verwendet für europäische Gesetze dieselbe Anbieter-Reihenfolge wie beim Bundesrecht.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.syncEuWithFederal);
				toggle.onChange(async (value) => {
					this.plugin.settings.syncEuWithFederal = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (this.plugin.settings.syncEuWithFederal) {
			this.euDropdowns = [];
			container.createDiv({
				cls: "law-provider-sync-notice",
				text: "Die Reihenfolge der Anbieter für europäisches Recht wird aktuell automatisch aus dem Bereich Bundesrecht übernommen.",
			});
			return;
		}

		const euProviders: EuLawProviderOption[] = [
			"dejure",
			"gesetze.co",
			"jurafuchs",
			"lexmea",
			"rewis",
		];

		const euProviderDisplayNames: Record<EuLawProviderOption, string> = {
			"dejure": "Dejure",
			"gesetze.co": "Gesetze.co",
			"jurafuchs": "Jurafuchs",
			"lexmea": "LexMea",
			"rewis": "Rewis",
		};

		const createEuDropdown = (
			name: string,
			desc: string,
			settingKey: keyof EuLawProviderOptions
		): DropdownItem => {
			const setting = new Setting(container)
				.setName(name)
				.setDesc(desc);

			const errorSpan = setting.settingEl.createSpan({
				cls: "law-provider-error",
			});

			let dropdown: HTMLSelectElement;
			setting.addDropdown((d) => {
				dropdown = d.selectEl;
				euProviders.forEach((provider) => {
					d.addOption(provider, euProviderDisplayNames[provider]);
				});
				d.setValue(
					this.plugin.settings.euLawProviderOptions?.[settingKey] ?? ""
				);
				d.onChange(async (value: string) => {
					this.plugin.settings.euLawProviderOptions[settingKey] =
						value as EuLawProviderOption;
					await this.plugin.saveSettings();
					this.checkEuDuplicates();
				});
			});

			return { setting, errorSpan, dropdown: dropdown! };
		};

		this.euDropdowns = [
			createEuDropdown(
				"1. Wahl (EU-Recht)",
				"Erster Anbieter, der bei europäischen Gesetzen durchsucht werden soll.",
				"firstOption"
			),
			createEuDropdown(
				"2. Wahl (EU-Recht)",
				"Falls das EU-Gesetz beim ersten Anbieter nicht verfügbar ist.",
				"secondOption"
			),
			createEuDropdown(
				"3. Wahl (EU-Recht)",
				"Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"thirdOption"
			),
			createEuDropdown(
				"4. Wahl (EU-Recht)",
				"Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"forthOption"
			),
			createEuDropdown(
				"5. Wahl (EU-Recht)",
				"Falls das EU-Gesetz bei den vorherigen Anbietern nicht verfügbar ist.",
				"fifthOption"
			),
		];

		this.checkEuDuplicates();
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

	private checkEuDuplicates(): void {
		this.checkGroupDuplicates(this.euDropdowns);
	}
}
