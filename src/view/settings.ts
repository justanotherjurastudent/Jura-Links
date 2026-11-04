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
