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
	key: string;
	setting: Setting;
	errorSpan: HTMLSpanElement;
	dropdown: HTMLSelectElement;
}

export class LawProviderSettingTab extends PluginSettingTab {
	plugin: LegalReferencePlugin;
	private activeTab: "federal" | "state" | "eu";

	constructor(app: App, plugin: LegalReferencePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.activeTab = "federal";
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

		this.renderProviderDropdowns(
			container,
			this.plugin.settings.lawProviderOptions,
			{
				"dejure": "Dejure",
				"lexmea": "LexMea",
				"rewis": "Rewis",
				"gesetze.co": "Gesetze.co",
				"jurafuchs": "Jurafuchs",
			},
			"Bundesrecht",
			"Bundesgesetz"
		);
	}

	private renderStateTab(container: HTMLElement): void {
		new Setting(container).setName("Landesgesetze").setHeading();
		container.createEl("p", {
			text: "Wählen Sie die Reihenfolge der Anbieter für Landesgesetze (z. B. BauO NRW, PolG BW, PAG Bay). Für Landesrecht stehen Landesrecht.online, Jurafuchs und Gesetze.co zur Verfügung. Landesgesetze werden vorrangig bei diesen Anbietern gesucht.",
		});

		this.renderProviderDropdowns(
			container,
			this.plugin.settings.stateLawProviderOptions,
			{
				"landesrecht.online": "Landesrecht.online",
				"jurafuchs": "Jurafuchs",
				"gesetze.co": "Gesetze.co",
			},
			"Landesrecht",
			"Landesgesetz",
			3
		);
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
			container.createDiv({
				cls: "law-provider-sync-notice",
				text: "Die Reihenfolge der Anbieter für europäisches Recht wird aktuell automatisch aus dem Bereich Bundesrecht übernommen.",
			});
			return;
		}

		this.renderProviderDropdowns(
			container,
			this.plugin.settings.euLawProviderOptions,
			{
				"dejure": "Dejure",
				"gesetze.co": "Gesetze.co",
				"jurafuchs": "Jurafuchs",
				"lexmea": "LexMea",
				"rewis": "Rewis",
			},
			"EU-Recht",
			"EU-Gesetz"
		);
	}

	// Eine Dropdown-Zeile pro Stufe; alle Rechtsbereiche teilen sich diese Logik.
	private renderProviderDropdowns(
		container: HTMLElement,
		store: object,
		providers: Record<string, string>,
		area: string,
		noun: string,
		steps = 5
	): void {
		const keys = ["firstOption", "secondOption", "thirdOption", "forthOption", "fifthOption"];
		const record = store as Record<string, string | null>;
		const items: DropdownItem[] = [];

		for (let i = 0; i < steps; i++) {
			const key = keys[i] as string;
			const desc =
				i === 0
					? `Erster Anbieter, der bei ${noun}en durchsucht werden soll.`
					: i === 1
						? `Falls das ${noun} beim ersten Anbieter nicht verfügbar ist.`
						: `Falls das ${noun} bei den vorherigen Anbietern nicht verfügbar ist.`;
			const setting = new Setting(container).setName(`${i + 1}. Wahl (${area})`).setDesc(desc);
			const errorSpan = setting.settingEl.createSpan({ cls: "law-provider-error" });

			setting.addDropdown((d) => {
				d.addOption("", "Nicht belegt");
				for (const [id, label] of Object.entries(providers)) {
					d.addOption(id, label);
				}
				d.setValue(record[key] ?? "");
				d.onChange(async (value: string) => {
					await this.applyChoice(items, record, key, value);
				});
				items.push({ key, setting, errorSpan, dropdown: d.selectEl });
			});
		}
		this.markTakenOptions(items);
	}

	// Anbieter, die in einer anderen Stufe schon gewählt sind, werden grau dargestellt (bleiben aber wählbar).
	private markTakenOptions(items: DropdownItem[]): void {
		items.forEach((item) => {
			Array.from(item.dropdown.options).forEach((option) => {
				const taken =
					option.value !== "" &&
					items.some((other) => other !== item && other.dropdown.value === option.value);
				option.toggleClass("law-provider-option-taken", taken);
				// Die Farbe der Auswahlliste wird nicht überall übernommen, daher zusätzlich ein Textzusatz.
				option.dataset.label ??= option.text;
				option.text = taken ? `${option.dataset.label} (bereits belegt)` : option.dataset.label;
			});
		});
	}

	// Neue Wahl gewinnt: gleiche Anbieter in anderen Stufen werden geleert und markiert.
	private async applyChoice(
		items: DropdownItem[],
		store: object,
		key: string,
		value: string
	): Promise<void> {
		const rec = store as Record<string, string | null>;
		rec[key] = value || null;
		items.forEach((item) => {
			if (item.key === key) {
				this.setConflict(item, false);
			} else if (value && item.dropdown.value === value) {
				item.dropdown.value = "";
				rec[item.key] = null;
				this.setConflict(item, true);
			}
		});
		this.markTakenOptions(items);
		await this.plugin.saveSettings();
	}

	private setConflict(item: DropdownItem, on: boolean): void {
		item.setting.settingEl.toggleClass("law-provider-conflict", on);
		item.errorSpan.toggleClass("visible", on);
		item.errorSpan.textContent = on
			? "Hier war eine Doppelbelegung, dieses Feld ist nun wieder unbesetzt."
			: "";
	}
}
