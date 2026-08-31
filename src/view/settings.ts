import { App, PluginSettingTab, Setting } from "obsidian";
import LegalReferencePlugin from "../../main";
import { LawProviderOption, LawProviderOptions } from "../types/providerOption";

export interface LawProviderSettings {
	lawProviderOptions: LawProviderOptions;
	executeOnFileOpen: boolean;
}

export const DEFAULT_SETTINGS: LawProviderSettings = {
	lawProviderOptions: {
		firstOption: "landesrecht.online",
		secondOption: "dejure",
		thirdOption: "lexmea",
		forthOption: "buzer",
		fifthOption: "rewis",
	},
	executeOnFileOpen: true,
};

export class LawProviderSettingTab extends PluginSettingTab {
	plugin: LegalReferencePlugin;
	private dropdowns: {
		setting: Setting;
		errorSpan: HTMLSpanElement;
		dropdown: HTMLSelectElement;
	}[];

	constructor(app: App, plugin: LegalReferencePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.dropdowns = [];
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
		const providerOptions: Record<string, string> = {
			"dejure": "Dejure",
			"landesrecht.online": "Landesrecht.online",
			"lexmea": "LexMea",
			"buzer": "Buzer",
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
				name: "1. Wahl",
				desc: "Landesrecht.online ist standardmäßig als erste Option festgelegt.",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.firstOption",
					options: { "landesrecht.online": "Landesrecht.online" },
					disabled: true,
				},
			},
			{
				name: "2. Wahl",
				desc: "Falls Gesetz bei Justiz NRW Landesgesetze nicht verfügbar ist, soll geschaut werden in:",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.secondOption",
					options: providerOptions,
				},
			},
			{
				name: "3. Wahl",
				desc: "Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.thirdOption",
					options: providerOptions,
				},
			},
			{
				name: "4. Wahl",
				desc: "Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.forthOption",
					options: providerOptions,
				},
			},
			{
				name: "5. Wahl",
				desc: "Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				control: {
					type: "dropdown",
					key: "lawProviderOptions.fifthOption",
					options: providerOptions,
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
        .addToggle(toggle => {
            toggle.setValue(this.plugin.settings.executeOnFileOpen);
            toggle.onChange(async (value) => {
                this.plugin.settings.executeOnFileOpen = value;
                await this.plugin.saveSettings();
            });
        });

		containerEl.createEl("p", {
			text: "Justiz NRW Landesgesetze wurde standardmäßig als erster Anbieter ausgewählt, um die spezielleren Landesgesetze zuerst zu suchen. Die weiteren Anbieter werden in der Reihenfolge ihrer Auswahl durchsucht, falls das Gesetz bei Justiz NRW Landesgesetze nicht gefunden wurde. Die übrigen Anbieter enthalten Bundes- und EU-Gesetze.",
		});

		const providers: LawProviderOption[] = [
			"dejure",
			"lexmea",
			"buzer",
			"rewis",
		];

		const providerDisplayNames: Record<LawProviderOption, string> = {
			"dejure": "Dejure",
			"landesrecht.online": "Landesrecht.online",
			"lexmea": "LexMea",
			"buzer": "Buzer",
			"rewis": "Rewis",
		};

		new Setting(containerEl)
			.setName("1. Wahl")
			.setDesc("Landesrecht.online ist standardmäßig als erste Option festgelegt.")
			.addDropdown((dropdown) => {
				dropdown.addOption("landesrecht.online", "Landesrecht.online");
				dropdown.setValue(
					this.plugin.settings.lawProviderOptions.firstOption
				);
				dropdown.setDisabled(true);
				dropdown.onChange(async (value) => {
					this.plugin.settings.lawProviderOptions.firstOption =
						value as LawProviderOption;
					await this.plugin.saveSettings();
				});
			});

		const createDropdown = (
			name: string,
			desc: string,
			settingKey: keyof LawProviderSettings["lawProviderOptions"]
		) => {
			const setting = new Setting(containerEl)
				.setName(name)
				.setDesc(desc);

			const errorSpan = setting.settingEl.createSpan({
				cls: "law-provider-error",
			});

			let dropdown: HTMLSelectElement;
			setting.addDropdown((d) => {
				dropdown = d.selectEl;
				providers.forEach((provider) => {
					d.addOption(provider, providerDisplayNames[provider]);
				});
				d.setValue(
					this.plugin.settings.lawProviderOptions[settingKey] ?? ""
				);
				d.onChange(async (value: string) => {
					const lawProviderOption = value as LawProviderOption;
					this.plugin.settings.lawProviderOptions[settingKey] =
						lawProviderOption;
					await this.plugin.saveSettings();
					this.checkForDuplicates();
				});
			});

			// Dropdown wird im addDropdown-Callback garantiert gesetzt
			return { setting, errorSpan, dropdown: dropdown! };
		};

		// Erstelle Dropdowns für die verbleibenden Optionen
		this.dropdowns = [
			createDropdown(
				"2. Wahl",
				"Falls Gesetz bei Justiz NRW Landesgesetze nicht verfügbar ist, soll geschaut werden in:",
				"secondOption"
			),
			createDropdown(
				"3. Wahl",
				"Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				"thirdOption"
			),
			createDropdown(
				"4. Wahl",
				"Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				"forthOption"
			),
			createDropdown(
				"5. Wahl",
				"Falls Gesetz beim vorherigen Anbieter nicht verfügbar ist, soll geschaut werden in:",
				"fifthOption"
			),
		];

		this.checkForDuplicates();
	}

	private checkForDuplicates(): void {
		const selectedValues = this.dropdowns
			.map((d) => d.dropdown?.value)
			.filter((value): value is string => value !== undefined);
		selectedValues.unshift("landesrecht.online"); // Add the fixed first option
	
		this.dropdowns.forEach((dropdown, index) => {
			if (!dropdown.dropdown) return; // Skip if dropdown is not initialized
	
			const currentValue = selectedValues[index + 1]; // +1 because of the fixed first option
			const isDuplicate =
				currentValue !== undefined &&
				selectedValues.indexOf(currentValue) !== index + 1;
	
			if (isDuplicate) {
				dropdown.errorSpan.classList.add("visible");
				dropdown.errorSpan.textContent = "Dieser Anbieter wurde bereits ausgewählt.";
			} else {
				dropdown.errorSpan.classList.remove("visible");
				dropdown.errorSpan.textContent = "";
			}
		});
	}
}
