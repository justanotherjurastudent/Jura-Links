import { Editor, Plugin, WorkspaceLeaf, Notice } from "obsidian";
import {
	findAndLinkCaseReferences,
	findAndLinkJournalReferences,
	findAndLinkLawReferences,
	findAndLinkDrucksacheReferences,
	resetLinkCount,
	getLinkCount,
} from "./src/utils/transformation";
import {
	LawProviderSettings,
	DEFAULT_SETTINGS,
	DEFAULT_STATE_LAW_PROVIDER_OPTIONS,
	DEFAULT_EU_LAW_PROVIDER_OPTIONS,
	LawProviderSettingTab,
} from "./src/view/settings";
import {
	SearchTabView,
	VIEW_TYPE_SEARCH_TAB,
} from "./src/view/searchTab";

export default class LegalReferencePlugin extends Plugin {
	settings!: LawProviderSettings;
	searchLeaf: WorkspaceLeaf | null = null;
	searchTabOpen = false;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new LawProviderSettingTab(this.app, this));
		this.registerView(
			VIEW_TYPE_SEARCH_TAB,
			(leaf) => new SearchTabView(leaf)
		);

		this.addRibbonIcon("scale", "Gesetzessuche", async () => {
			await this.activateSearchTab();
		});

        this.app.workspace.on("active-leaf-change", () => {
            if (this.searchLeaf && this.searchLeaf.view instanceof SearchTabView) {
                this.searchTabOpen = true;
            } else {
                this.searchTabOpen = false;
            }
        });

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.updateSearchTabStatus();
			})
		);

		this.addCommand({
			id: "apply",
			name: "Verlinkung starten",
			editorCallback: async (editor: Editor) => {
				const content = editor.getDoc().getValue();
				const newContent = this.findAndLinkLegalReferences(content);
				const result = await newContent;
				if (result === content) return;
				// Cursor und Scrollposition erhalten (setValue springt sonst an den Anfang)
				const cursor = editor.getCursor();
				const scroll = editor.getScrollInfo();
				editor.setValue(result);
				editor.setCursor(cursor);
				editor.scrollTo(scroll.left, scroll.top);
			},
		});
	}

    onUserEnable() {
        // onUserEnable erwartet void; initSearchTab wird ohne await gestartet
        void this.initSearchTab();
    }

	onunload() {
		if (this.searchLeaf) {
            this.searchLeaf.detach();
        }
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<LawProviderSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...(data ?? {}),
			syncEuWithFederal:
				data?.syncEuWithFederal ?? DEFAULT_SETTINGS.syncEuWithFederal,
			stateLawProviderOptions: {
				...DEFAULT_STATE_LAW_PROVIDER_OPTIONS,
				...(data?.stateLawProviderOptions ?? {}),
			},
			euLawProviderOptions: {
				...DEFAULT_EU_LAW_PROVIDER_OPTIONS,
				...(data?.euLawProviderOptions ?? {}),
			},
			lawProviderOptions: {
				...DEFAULT_SETTINGS.lawProviderOptions,
				...(data?.lawProviderOptions ?? {}),
			},
		};

		// Migration: Buzer wurde entfernt und Landesrecht ausgelagert -> ungültige Optionen filtern
		const rawOptions = [
			this.settings.lawProviderOptions.firstOption,
			this.settings.lawProviderOptions.secondOption,
			this.settings.lawProviderOptions.thirdOption,
			this.settings.lawProviderOptions.forthOption,
			this.settings.lawProviderOptions.fifthOption,
			this.settings.lawProviderOptions.sixthOption,
			this.settings.lawProviderOptions.seventhOption,
		].filter(
			(opt) => Boolean(opt) && (opt as string) !== "buzer" && (opt as string) !== "landesrecht.online"
		);

		const fallbackDefaults = [
			"dejure",
			"lexmea",
			"rewis",
			"gesetze.co",
			"jurafuchs",
		] as const;
		const uniqueOptions = Array.from(new Set([...rawOptions, ...fallbackDefaults]));

		this.settings.lawProviderOptions = {
			firstOption: uniqueOptions[0] ?? "dejure",
			secondOption: uniqueOptions[1] ?? null,
			thirdOption: uniqueOptions[2] ?? null,
			forthOption: uniqueOptions[3] ?? null,
			fifthOption: uniqueOptions[4] ?? null,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async initSearchTab() {
		if (!this.searchLeaf || !this.searchTabOpen) {
			this.searchLeaf = this.app.workspace.getRightLeaf(false);
			await this.searchLeaf?.setViewState({
				type: VIEW_TYPE_SEARCH_TAB,
				active: true,
			});
			if (this.searchLeaf) {
				await this.app.workspace.revealLeaf(this.searchLeaf);
			}
			this.searchLeaf?.setEphemeralState({ 
				onDetach: () => {
					this.searchTabOpen = false;
					this.searchLeaf = null;
				}
			});
			this.searchTabOpen = true;
		}
	}

	async activateSearchTab() {
		if (this.searchTabOpen && this.searchLeaf) {
			await this.app.workspace.revealLeaf(this.searchLeaf);
		} else {
			await this.initSearchTab();
		}
	}

	private updateSearchTabStatus() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SEARCH_TAB);
		if (leaves.length > 0) {
			this.searchLeaf = leaves[0] ?? null;
			this.searchTabOpen = true;
		} else {
			this.searchLeaf = null;
			this.searchTabOpen = false;
		}
	}

	private async findAndLinkLegalReferences(fileContent: string): Promise<string> {
		resetLinkCount(); // Zähler zurücksetzen
	
		let processedContent = findAndLinkLawReferences(
			fileContent,
			this.settings.lawProviderOptions,
			this.settings.stateLawProviderOptions,
			this.settings.euLawProviderOptions,
			this.settings.syncEuWithFederal
		);
		processedContent = findAndLinkDrucksacheReferences(processedContent);
		processedContent = findAndLinkCaseReferences(processedContent);
	
		processedContent = await findAndLinkJournalReferences(processedContent);
	
		const linkCount = getLinkCount();
		if (linkCount === 0) {
			new Notice("In dieser Notiz wurde zur Verlinkung nichts weiter gefunden.");
		} else if (linkCount === 1) {
			new Notice("Es wurde ein Link hinzugefügt.");
		} else {
			new Notice(`Es wurden ${linkCount} Links hinzugefügt.`);
		}
		return processedContent;
	}
}
