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
	LawProviderSettingTab,
} from "./src/view/settings";
import { LawProviderOptions } from "./src/types/providerOption";
import {
	SearchTab,
	SearchTabView,
	VIEW_TYPE_SEARCH_TAB,
} from "./src/view/searchTab";

export default class LegalReferencePlugin extends Plugin {
	settings!: LawProviderSettings;
	searchTab!: SearchTab;
	searchLeaf: WorkspaceLeaf | null = null;
	searchTabOpen = false;

	async onload() {
		await this.loadSettings();

		if (this.settings.lawProviderOptions.firstOption !== "justiz nrw landesgesetze") {
			this.settings.lawProviderOptions.firstOption = "justiz nrw landesgesetze";
			await this.saveSettings();
		}

		this.searchTab = new SearchTab(this);
		this.addSettingTab(new LawProviderSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_SEARCH_TAB,
			(leaf) => new SearchTabView(leaf)
		);

		this.addRibbonIcon("scale", "Gesetzessuche", () => {
			this.activateSearchTab();
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
				editor.setValue(await newContent);
			},
		});
	}

    onUserEnable() {
        this.initSearchTab();
    }

	onunload() {
		console.log("unloading plugin");
		if (this.searchLeaf) {
            this.searchLeaf.detach();
        }
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
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
				this.app.workspace.revealLeaf(this.searchLeaf);
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
			this.app.workspace.revealLeaf(this.searchLeaf);
		} else {
			await this.initSearchTab();
		}
	}

	private updateSearchTabStatus() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SEARCH_TAB);
		if (leaves.length > 0) {
			this.searchLeaf = leaves[0];
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
			this.settings.lawProviderOptions as LawProviderOptions
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
