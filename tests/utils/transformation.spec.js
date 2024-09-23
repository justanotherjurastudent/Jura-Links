import { expect, test } from "vitest";
import {
	findAndLinkLawReferences,
	findAndLinkCaseReferences,
	findAndLinkJournalReferences,
} from "../../src/utils/transformation";

test.each([
	{
		input: `§ 177 II Nr. 2 StGB `,
		expected: `§ [177 II Nr. 2](https://www.dejure.org/gesetze/stgb/177.html) StGB `,
	},
	{
		input: `§ 1 AGBGB`,
		expected: `§ [1](https://www.dejure.org/gesetze/agbgb/1.html) AGBGB`,
	},
	{
		input: `§ 1 AGBG`,
		expected: `§ [1](https://www.dejure.org/gesetze/agbg/1.html) AGBG`,
	},
	{
		input: `§ 1 AGBGB Schl.-H. SH`,
		expected: `§ [1](https://www.lexsoft.de/cgi-bin/lexsoft/justizportal_nrw.cgi?xid=174169,2) AGBGB Schl.-H. SH`,
	},
	{
		input: `§ 1 AGVwGO BE`,
		expected: `§ [1](https://www.lexsoft.de/cgi-bin/lexsoft/justizportal_nrw.cgi?xid=145243,2) AGVwGO BE`,
	},
	{
		input: `§ 1 AO`,
		expected: `§ [1](https://www.dejure.org/gesetze/ao/1.html) AO`,
	},
	{
		input: `§ 1 AO-GS NW`,
		expected: `§ [1](https://www.lexsoft.de/cgi-bin/lexsoft/justizportal_nrw.cgi?xid=552119,2) AO-GS NW`,
	},
	{
		input: `§ 1 BBesGÜB 2018/19/20`,
		expected: `§ 1 BBesGÜB 2018/19/20`,
	},
	{
		input: `§ 1 BGBAG HH`,
		expected: `§ [1](https://www.lexsoft.de/cgi-bin/lexsoft/justizportal_nrw.cgi?xid=145866,2) BGBAG HH`,
	},
	{
		input: `meow meow `,
		expected: `meow meow `,
	},
	{
		input: `§ 1 KAGB `,
		expected: `§ [1](https://www.dejure.org/gesetze/kagb/1.html) KAGB `,
	},
	{
		input: `§ 1 KAG `,
		expected: `§ [1](https://www.dejure.org/gesetze/kag/1.html) KAG `,
	},
	{
		input: `§ 1 VVG-InfoV `,
		expected: `§ [1](https://www.dejure.org/gesetze/vvg-infov/1.html) VVG-InfoV `,
	},
	{
		input: `§ 1 VVG `,
		expected: `§ [1](https://www.dejure.org/gesetze/vvg/1.html) VVG `,
	},
	{
		input: `§ 1 VVG a.F. `,
		expected: `§ [1](https://www.dejure.org/gesetze/vvg/1.html) VVG a.F. `,
	},
	{
		input: `§ 177 II Nr. 2, 5 StGB`,
		expected: `§ [177 II Nr. 2](https://www.dejure.org/gesetze/stgb/177.html), [5](https://www.dejure.org/gesetze/stgb/5.html) StGB`,
	},
	{
		input: `§§ 58 Abs. 3, 6 Nr. 2, 7 LFGB`,
		expected: `§§ [58 Abs. 3](https://www.dejure.org/gesetze/lfgb/58.html), [6 Nr. 2](https://www.dejure.org/gesetze/lfgb/6.html), [7](https://www.dejure.org/gesetze/lfgb/7.html) LFGB`,
	},
	{
		input: `§ 62 Abs. 1 Nr. 1 LFGB`,
		expected: `§ [62 Abs. 1 Nr. 1](https://www.dejure.org/gesetze/lfgb/62.html) LFGB`,
	},
	{
		input: `Art. 1 EuGVÜ`,
		expected: `Art. [1](https://www.dejure.org/gesetze/eugvü/1.html) EuGVÜ`,
	},
	{
		input: `§ 24 BGB
	Hallo`,
		expected: `§ [24](https://www.dejure.org/gesetze/bgb/24.html) BGB
	Hallo`,
	},
	{
		input: `Art. 80 Abs. 1 Satz 2 GG`,
		expected: `Art. [80 Abs. 1 Satz 2](https://www.dejure.org/gesetze/gg/80.html) GG`,
	},
	{
		input: `Art. 80 Abs. 1 Satz 2, 3 GG`,
		expected: `Art. [80 Abs. 1 Satz 2](https://www.dejure.org/gesetze/gg/80.html), [3](https://www.dejure.org/gesetze/gg/3.html) GG`,
	},
	{
		input: `Art. 1 II lit. a Rom-I-VO`,
		expected: `Art. [1 II lit. a](https://www.dejure.org/gesetze/rom-i-vo/1.html) Rom-I-VO`,
	},
	{
		input: `Art. 1 II lit. a-c Brüssel-Ia-VO`,
		expected: `Art. [1 II lit. a-c](https://www.dejure.org/gesetze/eugvvo/1.html) Brüssel-Ia-VO`,
	},
	{
		input: `§§ 823 Abs. 1, 249 Abs. 2, 250 Abs. 3 BGB`,
		expected: `§§ [823 Abs. 1](https://www.dejure.org/gesetze/bgb/823.html), [249 Abs. 2](https://www.dejure.org/gesetze/bgb/249.html), [250 Abs. 3](https://www.dejure.org/gesetze/bgb/250.html) BGB`,
	},
	{
		input: `§§ 823 Abs. 1, 249 Abs. 2, 250 Abs. 3, 260 Abs. 3 BGB`,
		expected: `§§ [823 Abs. 1](https://www.dejure.org/gesetze/bgb/823.html), [249 Abs. 2](https://www.dejure.org/gesetze/bgb/249.html), [250 Abs. 3](https://www.dejure.org/gesetze/bgb/250.html), [260 Abs. 3](https://www.dejure.org/gesetze/bgb/260.html) BGB`,
	},
	{
		input: `§§ 22 I Nr. 2, 24a II, 26 I BGB`,
		expected: `§§ [22 I Nr. 2](https://www.dejure.org/gesetze/bgb/22.html), [24a II](https://www.dejure.org/gesetze/bgb/24a.html), [26 I](https://www.dejure.org/gesetze/bgb/26.html) BGB`,
	},
	{
		input: `§§ 27 f. BGB`,
		expected: `§§ [27 f.](https://www.dejure.org/gesetze/bgb/27.html) BGB`,
	},
	{
		input: `§§ 27 ff. BGB`,
		expected: `§§ [27 ff.](https://www.dejure.org/gesetze/bgb/27.html) BGB`,
	},
	{
		input: `§§ 242 I, II StGB`,
		expected: `§§ [242 I, II](https://www.dejure.org/gesetze/stgb/242.html) StGB`,
	},
	{
		input: `§§ 242, 243 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html), [243](https://www.dejure.org/gesetze/bgb/243.html) BGB`,
	},
	{
		input: `§§ 242, 243 SGB I`,
		expected: `§§ [242](https://www.dejure.org/gesetze/sgb i/242.html), [243](https://www.dejure.org/gesetze/sgb i/243.html) SGB I`,
	},
	{
		input: `§ 1 SG`,
		expected: `§ [1](https://www.buzer.de/gesetz/2246/a31636.htm) SG`,
	},
	{
		input: `§§ 242, 243 JVollzGB I`,
		expected: `§§ [242](https://www.dejure.org/gesetze/jvollzgb i/242.html), [243](https://www.dejure.org/gesetze/jvollzgb i/243.html) JVollzGB I`,
	},
	{ input: `§§ 242, 243 SGB`, expected: `§§ 242, 243 SGB` },
	{
		input: `§§ 242 und 244 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html) und [244](https://www.dejure.org/gesetze/bgb/244.html) BGB`,
	},
	{
		input: `§§ 242, 243 und 234 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html), [243](https://www.dejure.org/gesetze/bgb/243.html) und [234](https://www.dejure.org/gesetze/bgb/234.html) BGB`,
	},
	{
		input: `§§ 242 - 244 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html) - [244](https://www.dejure.org/gesetze/bgb/244.html) BGB`,
	},
	{
		input: `§§ 242 - 244 und 255 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html) - [244](https://www.dejure.org/gesetze/bgb/244.html) und [255](https://www.dejure.org/gesetze/bgb/255.html) BGB`,
	},
	{
		input: `§§ 242, 243, 245 BGB`,
		expected: `§§ [242](https://www.dejure.org/gesetze/bgb/242.html), [243](https://www.dejure.org/gesetze/bgb/243.html), [245](https://www.dejure.org/gesetze/bgb/245.html) BGB`,
	},
	{
		input: `§§ 823 II, 249 I BGB`,
		expected: `§§ [823 II](https://www.dejure.org/gesetze/bgb/823.html), [249 I](https://www.dejure.org/gesetze/bgb/249.html) BGB`,
	},
	{
		input: `§§ 823 Abs. 1, 249 Abs. 2, 250 Abs. 3 BGB`,
		expected: `§§ [823 Abs. 1](https://www.dejure.org/gesetze/bgb/823.html), [249 Abs. 2](https://www.dejure.org/gesetze/bgb/249.html), [250 Abs. 3](https://www.dejure.org/gesetze/bgb/250.html) BGB`,
	},
	{
		input: `§§ 23 I, II Nr. 1, 3, 24 II Nr. 3 BGB`,
		expected: `§§ [23 I, II Nr. 1](https://www.dejure.org/gesetze/bgb/23.html), [3](https://www.dejure.org/gesetze/bgb/3.html), [24 II Nr. 3](https://www.dejure.org/gesetze/bgb/24.html) BGB`,
	},
	{
		input: `§§ 242 I, II, 243 I 2 Nr. 1, 22, 23 StGB I`,
		expected: `§§ [242 I, II](https://www.dejure.org/gesetze/stgb/242.html), [243 I 2 Nr. 1](https://www.dejure.org/gesetze/stgb/243.html), [22](https://www.dejure.org/gesetze/stgb/22.html), [23](https://www.dejure.org/gesetze/stgb/23.html) StGB I`,
	},
	{
		input: `§§ 242 Abs.1 S. 3 Nr. 4, 243 Abs. 2 S. 2 Nr. 1, 22, 23 StGB`,
		expected: `§§ [242 Abs.1 S. 3 Nr. 4](https://www.dejure.org/gesetze/stgb/242.html), [243 Abs. 2 S. 2 Nr. 1](https://www.dejure.org/gesetze/stgb/243.html), [22](https://www.dejure.org/gesetze/stgb/22.html), [23](https://www.dejure.org/gesetze/stgb/23.html) StGB`,
	},
	{
		input: `§§ 23 I, II Nr. 1 lit. a, 24 II Nr. 3, 25 II BGB`,
		expected: `§§ [23 I, II Nr. 1 lit. a](https://www.dejure.org/gesetze/bgb/23.html), [24 II Nr. 3](https://www.dejure.org/gesetze/bgb/24.html), [25 II](https://www.dejure.org/gesetze/bgb/25.html) BGB`,
	},
	{
		input: `§§ 23 I Nr. 1, 24 BGB`,
		expected: `§§ [23 I Nr. 1](https://www.dejure.org/gesetze/bgb/23.html), [24](https://www.dejure.org/gesetze/bgb/24.html) BGB`,
	},
	{
		input: `§§ 23 I, 24 II, 25 II BGB`,
		expected: `§§ [23 I](https://www.dejure.org/gesetze/bgb/23.html), [24 II](https://www.dejure.org/gesetze/bgb/24.html), [25 II](https://www.dejure.org/gesetze/bgb/25.html) BGB`,
	},
	{
		input: `Art. 22 I Nr. 2, 24a I, 26 I lit. b Rom-I-VO`,
		expected: `Art. [22 I Nr. 2](https://www.dejure.org/gesetze/rom-i-vo/22.html), [24a I](https://www.dejure.org/gesetze/rom-i-vo/24a.html), [26 I lit. b](https://www.dejure.org/gesetze/rom-i-vo/26.html) Rom-I-VO`,
	},
	{
		input: `§§ 242 I, II, 243 I 2 Nr. 1, 22, 23 StGB`,
		expected: `§§ [242 I, II](https://www.dejure.org/gesetze/stgb/242.html), [243 I 2 Nr. 1](https://www.dejure.org/gesetze/stgb/243.html), [22](https://www.dejure.org/gesetze/stgb/22.html), [23](https://www.dejure.org/gesetze/stgb/23.html) StGB`,
	},
	{
		input: `§§ 242 I, 243 I 2 Nr. 1, 22 I Alt. 1, 23 I StGB`,
		expected: `§§ [242 I](https://www.dejure.org/gesetze/stgb/242.html), [243 I 2 Nr. 1](https://www.dejure.org/gesetze/stgb/243.html), [22 I Alt. 1](https://www.dejure.org/gesetze/stgb/22.html), [23 I](https://www.dejure.org/gesetze/stgb/23.html) StGB`,
	},
	{
		input: `§§ 242 I, 243 I, 22 I 1, 25 I 1 Var. 1, 23 I lit. a StGB`,
		expected: `§§ [242 I](https://www.dejure.org/gesetze/stgb/242.html), [243 I](https://www.dejure.org/gesetze/stgb/243.html), [22 I 1](https://www.dejure.org/gesetze/stgb/22.html), [25 I 1 Var. 1](https://www.dejure.org/gesetze/stgb/25.html), [23 I lit. a](https://www.dejure.org/gesetze/stgb/23.html) StGB`,
	},
	{
		input: `Art. 23 I, II Nr. 1, 3, 24 II Nr. 3, 25 II BGB`,
		expected: `Art. [23 I, II Nr. 1](https://www.dejure.org/gesetze/bgb/23.html), [3](https://www.dejure.org/gesetze/bgb/3.html), [24 II Nr. 3](https://www.dejure.org/gesetze/bgb/24.html), [25 II](https://www.dejure.org/gesetze/bgb/25.html) BGB`,
	},
	{
		input: `Artikel 22 I Nr. 2, 24a II, 26 I BGB`,
		expected: `Artikel [22 I Nr. 2](https://www.dejure.org/gesetze/bgb/22.html), [24a II](https://www.dejure.org/gesetze/bgb/24a.html), [26 I](https://www.dejure.org/gesetze/bgb/26.html) BGB`,
	},
	{
		input: `§ 823 Abs. 1 - 3 BGB`,
		expected: `§ [823 Abs. 1 - 3](https://www.dejure.org/gesetze/bgb/823.html) BGB`,
	}
])(
	"findAndLinkLawReferences: should transform $input to $expected",
	(testData) => {
		let result = findAndLinkLawReferences(testData.input, {
			firstOption: "dejure",
			secondOption: "lexsoft",
			thirdOption: "lexmea",
			forthOption: "buzer",
			fifthOption: "rewis",
		});
		// Run the transformation twice to ensure that the transformation is idempotent
		result = findAndLinkLawReferences(testData.input);
		expect(result).toBe(testData.expected);
	}
);

test.each([
    {
        input: `meow meow`,
        expected: `meow meow`,
    },
    {
        input: `17 O 11/23 `,
        expected: `[17 O 11/23](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=17%20O%2011%2F23) `,
    },
    {
        input: `2 BvR 829/24`,
        expected: `[2 BvR 829/24](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=2%20BvR%20829%2F24)`,
    },
    {
        input: `VIII ZR 184/23`,
        expected: `[VIII ZR 184/23](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=VIII%20ZR%20184%2F23)`,
    },
    {
        input: `C-184/22`,
        expected: `[C-184/22](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=C-184%2F22)`,
    },
    {
        input: `B 1 KR 28/23 R`,
        expected: `[B 1 KR 28/23 R](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=B%201%20KR%2028%2F23%20R)`,
    },
    {
        input: `2 StR 26/12`,
        expected: `[2 StR 26/12](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=2%20StR%2026%2F12)`,
    },
    {
        input: `11 Ks 542 Js 24817/09`,
        expected: `[11 Ks 542 Js 24817/09](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=11%20Ks%20542%20Js%2024817%2F09)`,
    },
    {
        input: `57292/16`,
        expected: `[57292/16](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=57292%2F16)`,
    },
    {
        input: `5a F 686/10`,
        expected: `[5a F 686/10](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=5a%20F%20686%2F10)`,
    },
])(
    "findAndLinkCaseReferences: should transform $input to $expected",
    (testData) => {
        let result = findAndLinkCaseReferences(testData.input);
        // Run the transformation twice to ensure that the transformation is idempotent
        result = findAndLinkCaseReferences(result);
        expect(result).toBe(testData.expected);
    }
);

test.each([
    {
        input: `meow meow`,
        expected: `meow meow`,
    },
    {
        input: `afp 2019, 555 `,
        expected: `[afp 2019, 555](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=afp%202019%2C%20555) `,
    },
    {
        input: `NVwZ 2022, 1561`,
        expected: `[NVwZ 2022, 1561](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=NVwZ%202022%2C%201561)`,
    },
    {
        input: `NJW 2024, 2604`,
        expected: `[NJW 2024, 2604](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=NJW%202024%2C%202604)`,
    },
    {
        input: `BVerwGE 175, 227`,
        expected: `[BVerwGE 175, 227](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BVerwGE%20175%2C%20227)`,
    },
    {
        input: `BGHZ 137, 205`,
        expected: `[BGHZ 137, 205](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BGHZ%20137%2C%20205)`,
    },
    {
        input: `BGHSt 40, 299`,
        expected: `[BGHSt 40, 299](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BGHSt%2040%2C%20299)`,
    },
    {
        input: `BFHE 251, 40`,
        expected: `[BFHE 251, 40](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BFHE%20251%2C%2040)`,
    },
    {
        input: `BAGE 135, 80`,
        expected: `[BAGE 135, 80](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BAGE%20135%2C%2080)`,
    },
    {
        input: `BVerfGE 126, 286`,
        expected: `[BVerfGE 126, 286](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BVerfGE%20126%2C%20286)`,
    },
    {
        input: `BSGE 123, 157`,
        expected: `[BSGE 123, 157](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=BSGE%20123%2C%20157)`,
    },
    {
        input: `Slg. 2003, I-10239`,
        expected: `[Slg. 2003, I-10239](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=Slg.%202003%2C%20I-10239)`,
    },
    {
        input: `Slg. 1999, II-3357`,
        expected: `[Slg. 1999, II-3357](https://www.dejure.org/dienste/vernetzung/rechtsprechung?Text=Slg.%201999%2C%20II-3357)`,
    },
])
(
    "findAndLinkJournalReferences: should transform $input to $expected",
    (testData) => {
        let result = findAndLinkJournalReferences(testData.input);
        // Run the transformation twice to ensure that the transformation is idempotent
        result = findAndLinkJournalReferences(result);
        expect(result).toBe(testData.expected);
    }
);
