import { expect, test } from "vitest";
import { migrateFederalOptions } from "../../src/utils/settingsMigration";

test("migrateFederalOptions: bewusst leere Stufen bleiben erhalten", () => {
	const options = {
		firstOption: "rewis",
		secondOption: "dejure",
		thirdOption: null,
		forthOption: null,
		fifthOption: null,
	};
	expect(migrateFederalOptions(options)).toBe(options);
});

test("migrateFederalOptions: entfernt Buzer und landesrecht.online, behaelt Reihenfolge", () => {
	const result = migrateFederalOptions({
		firstOption: "buzer",
		secondOption: "rewis",
		thirdOption: "landesrecht.online",
		forthOption: "dejure",
		fifthOption: null,
	});
	expect(result).toEqual({
		firstOption: "rewis",
		secondOption: "dejure",
		thirdOption: "lexmea",
		forthOption: "gesetze.co",
		fifthOption: "jurafuchs",
	});
});

