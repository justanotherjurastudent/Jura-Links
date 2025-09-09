/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ItemView,
	WorkspaceLeaf,
	DropdownComponent,
	ButtonComponent,
	Setting,
	Notice,
} from "obsidian";
import { landesrechtOnlineLandesgesetze } from "../static/LandesrechtOnlineLandesgesetze";
import { dejureGesetze } from "../static/dejureGesetze";
import { rewisGesetze } from "../static/rewisGesetze";
import { buzerGesetze } from "../static/buzerGesetze";
import { lexmeaGesetze } from "../static/lexmeaGesetze";
import { LawProviderOption } from "../types/providerOption";
import LegalReferencePlugin from "../../main";

export const VIEW_TYPE_SEARCH_TAB = "search-tab";

export class SearchTab {
	constructor(private plugin: LegalReferencePlugin) {}

	async activateView() {
		this.plugin.activateSearchTab();
	}
}

export class SearchTabView extends ItemView {
	selectedState: string | null = null;
	selectedProvider: LawProviderOption | null = null;
	resultsContainer: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_SEARCH_TAB;
	}

	getDisplayText() {
		return "Gesetzes-Suche";
	}

	getIcon() {
		return "scale";
	}

	async onOpen() {
		this.resetView();
	}

	async onClose() {
		// Cleanup code here
	}

	resetView(): void {
		const containerEl = this.containerEl.children[1];
		containerEl.empty();

		const searchTabContainer = containerEl.createEl("div", {
			cls: "search-tab-container",
		});
		const controlsContainer = searchTabContainer.createEl("div", {
			cls: "search-tab-controls",
		});
		this.resultsContainer = searchTabContainer.createEl("div", {
			cls: "law-results",
		});

		new Setting(controlsContainer).setName("Jura-Links").setHeading();

		// Suchfeld
		new Setting(controlsContainer)
			.setName("Gesetzessuche")
			.setDesc(
				"Suchen Sie nach der Gesetzesabkürzung oder den Gesetzestitel."
			)
			.addText((text) => {
				text.inputEl.addClass("setting-item");
				text.onChange((value) => {
					// Suche soll erst nach 0,5 Sekunde nach letzter Eingabe starten
					setTimeout(() => {
						this.searchLaw(value);
					}, 500);
				});
			});

		// Filter 1: Bundesländer Dropdown
		const bundeslandDropdown = new DropdownComponent(controlsContainer);
		this.createBundeslandFilter(bundeslandDropdown);

		// Filter 2: Gesetzesanbieter Dropdown
		const gesetzesAnbieterDropdown = new DropdownComponent(
			controlsContainer
		);
		this.createAnbieterFilter(gesetzesAnbieterDropdown);

		// Container für den Reset-Button
		const resetButtonContainer = controlsContainer.createEl("div");

		const resetButton = new ButtonComponent(resetButtonContainer);
		resetButton.setButtonText("↻ Zurücksetzen").onClick(() => {
			this.resetView();
		});

		// Wenn der erste Filter aktiviert wird, den zweiten deaktivieren
		bundeslandDropdown.onChange((value) => {
			gesetzesAnbieterDropdown.setDisabled(true);
			this.selectedState = value;
			this.selectedProvider = null;
			this.filterByBundesland(value);
		});

		// Wenn der zweite Filter aktiviert wird, den ersten deaktivieren
		gesetzesAnbieterDropdown.onChange((value) => {
			bundeslandDropdown.setDisabled(true);
			this.selectedProvider = value as LawProviderOption;
			this.selectedState = null;
			this.filterByAnbieter(value);
		});
	}

	searchLaw(query: string): void {
		this.clearResults();
		if (!this.resultsContainer) return;

		const allLaws: Array<{
			law: string;
			provider: string;
			state?: string;
		}> = [
			...this.extractDejureLaws().map((law) => ({
				law,
				provider: "Dejure",
			})),
			...this.extractRewisLaws().map((law) => ({
				law,
				provider: "Rewis",
			})),
			...this.extractBuzerLaws().map((law) => ({
				law,
				provider: "Buzer",
			})),
			...this.extractLexmeaLaws().map((law) => ({
				law,
				provider: "Lexmea",
			})),
			...this.extractLandesrechtOnlineLaws().map((law) => ({
				law: law.law,
				provider: "Landesrecht.online",
				state: law.state,
			})),
		];

		const filteredLaws = allLaws.filter((item) =>
			item.law.toLowerCase().includes(query.toLowerCase())
		);

		if (filteredLaws.length > 0) {
			const groupedByProvider = filteredLaws.reduce((acc, item) => {
				if (!acc[item.provider]) {
					acc[item.provider] = {};
				}
				if (item.provider === "Landesrecht.online") {
					if (item.state && !acc[item.provider][item.state]) {
						acc[item.provider][item.state] = [];
					}
					if (item.state) {
						acc[item.provider][item.state].push(item.law);
					}
				} else {
					if (!acc[item.provider]["laws"]) {
						acc[item.provider]["laws"] = [];
					}
					acc[item.provider]["laws"].push(item.law);
				}
				return acc;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			}, {} as Record<string, any>);

			Object.entries(groupedByProvider).forEach(([provider, data]) => {
				if (this.resultsContainer) {
					this.resultsContainer.createEl("div", {
						text: provider,
						cls: "header",
					});

					if (provider === "Landesrecht.online") {
						Object.entries(data).forEach(([state, laws]) => {
							if (this.resultsContainer) {
								this.resultsContainer.createEl("div", {
									text: state,
									cls: "subheader",
								});
								this.createLawTable(
									laws as string[],
									this.resultsContainer
								);
							}
						});
					} else {
						if (this.resultsContainer) {
							this.createLawTable(
								data.laws,
								this.resultsContainer
							);
						}
					}
				}
			});
		} else {
			if (this.resultsContainer) {
				this.resultsContainer.createEl("div", {
					text: "Keine Gesetze gefunden.",
				});
			}
		}

		if (this.resultsContainer) {
			this.resultsContainer.createEl("div", { cls: "bottom-spacer" });
		}
	}

	extractLandesrechtOnlineLaws(): { law: string; state: string }[] {
		const laws: { law: string; state: string }[] = [];
		Object.entries(landesrechtOnlineLandesgesetze).forEach(([state, gesetze]) => {
			Object.entries(gesetze).forEach(([key, value]) => {
				laws.push({
					law: `${key}: ${value.title}`,
					state: state,
				});
			});
		});
		return laws;
	}

	createBundeslandFilter(dropdown: DropdownComponent): void {
		dropdown.addOption("", "Wählen Sie ein Bundesland");
		Object.keys(landesrechtOnlineLandesgesetze).forEach((state) => {
			dropdown.addOption(state, state);
		});
	}

	filterByBundesland(bundesland: string): void {
		this.clearResults();
		const resultContainer = this.containerEl.querySelector(".law-results");
		if (!resultContainer) return;
	
		const scrollContainer = resultContainer.createEl("div", {
			cls: "scroll-container",
		});
	
		const gesetze = landesrechtOnlineLandesgesetze[bundesland];
		if (gesetze) {
			const table = scrollContainer.createEl("table", {
				cls: "gesetz-table",
			});
			// Sortiere die Ergebnisse alphabetisch anhand des Schlüssels (Abkürzung)
			const sortedGesetze = Object.entries(gesetze).sort(([keyA], [keyB]) =>
				keyA.localeCompare(keyB)
			);
			sortedGesetze.forEach(([key, value]) => {
				const row = table.createEl("tr");
	
				// Abkürzung Zelle
				const abbrCell = row.createEl("td", { cls: "key-cell" });
				abbrCell.createEl("span", { text: key });
	
				// Clipboard Button
				const copyButton = abbrCell.createEl("button", {
					cls: "copy-button",
				});
				const clipboardIcon = copyButton.createEl("span", {
					cls: "icon lucide-icon lucide-clipboard-copy",
				});
				copyButton.onclick = () => {
					navigator.clipboard
						.writeText(key)
						.then(() => {
							new Notice(`Abkürzung ${key} wurde kopiert!`);
						})
						.catch(() => {
							new Notice("Fehler beim Kopieren der Abkürzung.");
						});
				};
	
				// Titel Zelle
				row.createEl("td", { text: value.title, cls: "value-cell" });
			});
		}
	}

	createAnbieterFilter(dropdown: DropdownComponent): void {
		dropdown.addOption("", "Wählen Sie einen Anbieter");
		["Dejure", "Landesrecht.online", "LexMea", "Buzer", "Rewis"].forEach(
			(provider) => {
				dropdown.addOption(provider, provider);
			}
		);
	}

	filterByAnbieter(anbieter: string): void {
		this.clearResults();
		const resultContainer = this.containerEl.querySelector(".law-results");
		if (!resultContainer) return;

		const scrollContainer = resultContainer.createEl("div", {
			cls: "scroll-container",
		});

		if (anbieter === "Landesrecht.online") {
			Object.entries(landesrechtOnlineLandesgesetze).forEach(([bundesland, gesetze]) => {
				scrollContainer.createEl("div", {
					text: bundesland,
					cls: "header",
				});

				const laws = Object.entries(gesetze)
					.sort(([keyA, valueA], [keyB, valueB]) =>
						keyA.localeCompare(keyB)
					)
					.map(([key, value]) => `${key}: ${value.title}`);

				this.createLawTable(laws, scrollContainer);
			});
		} else {
			let laws: string[] = [];
			switch (anbieter) {
				case "Dejure":
					laws = this.extractDejureLaws();
					break;
				case "LexMea":
					laws = this.extractLexmeaLaws();
					break;
				case "Buzer":
					laws = this.extractBuzerLaws();
					laws.sort((a, b) => {
						const isANumber = /^\d/.test(a);
						const isBNumber = /^\d/.test(b);
						if (isANumber && !isBNumber) return 1;
						if (!isANumber && isBNumber) return -1;
						return a.localeCompare(b);
					});
					break;
				case "Rewis":
					laws = this.extractRewisLaws();
					break;
			}

			this.createLawTable(laws, scrollContainer);
		}
		scrollContainer.createEl("div", { cls: "bottom-spacer" });
	}

	createLawTable(laws: string[], container: HTMLElement): void {
		const table = container.createEl("table", { cls: "gesetz-table" });
		laws.forEach((law) => {
			const [abbr, ...titleParts] = law.split(": ");
			const title = titleParts.join(": ");

			const row = table.createEl("tr");

			// Abkürzung Zelle
			const abbrCell = row.createEl("td", { cls: "key-cell" });
			abbrCell.createEl("span", { text: abbr });

			// Clipboard Button
			const copyButton = abbrCell.createEl("button", {
				cls: "copy-button",
			});

			// Lucide Icon Container
			const clipboardIcon = copyButton.createEl("span", {
				cls: "icon lucide-icon lucide-clipboard-copy",
			});

			// Beim Klick den Text in die Zwischenablage kopieren
			copyButton.onclick = () => {
				navigator.clipboard
					.writeText(abbr)
					.then(() => {
						new Notice(`Abkürzung ${abbr} wurde kopiert!`);
					})
					.catch(() => {
						new Notice("Fehler beim Kopieren der Abkürzung.");
					});
			};

			// Titel Zelle
			row.createEl("td", { text: title, cls: "value-cell" });
		});
	}

	extractDejureLaws(): string[] {
		return Object.entries(dejureGesetze).map(
			([key, value]) => `${key}: ${value.title}`
		);
	}

	extractRewisLaws(): string[] {
		return Object.entries(rewisGesetze).map(
			([key, value]) => `${key}: ${value.title}`
		);
	}

	extractBuzerLaws(): string[] {
		return Object.entries(buzerGesetze).map(
			([key, value]) => `${key}: ${value.title}`
		);
	}

	extractLexmeaLaws(): string[] {
		return Object.entries(lexmeaGesetze).map(
			([key, value]) => `${key}: ${value.title}`
		);
	}

	clearResults(): void {
		if (this.resultsContainer) {
			this.resultsContainer.empty();
		}
	}
}
