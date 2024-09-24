import { AllLawAbbrs } from "../static/lawsAbbrs";

const lawList = AllLawAbbrs.join("|");

const Verbinder = "(?:\\s*(-|und|u\\.|iVm|i\\.V\\.m\\.|i\\. V\\. m\\.)\\s*";
const VerbinderKomma = "(?:\\s*(,|-|und|u\\.|iVm|i\\.V\\.m\\.|i\\. V\\. m\\.)\\s*";

function getSingleLawRegexString(suffix: string): string {
    return `(?<normgr${suffix}>(?<norm${suffix}>\\d+(?:\\w\\b)?)\\s*(?:(Abs\\.|Absatz)\\s*(?<absatz${suffix}>\\d+${Verbinder}\\d+)*)|(?<absatzrom${suffix}>[IVXLCDM]+${VerbinderKomma}[IVXLCDM]+)*))?\\s*(?:(S\\.|Satz)?\\s*(?<satz${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Hs\\.|Halbsatz)\\s*(?<halbsatz{suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Alt\\.|Alternative)\\s*(?<alternative${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Var\\.|Variante)\\s*(?<variante${suffix}>\\d+${Verbinder}\\d+)*))?\\s*(?:(Nr\\.|Nummer)\\s*(?<nr${suffix}>\\d+(?:\\w\\b)?${Verbinder}\\d+(?:\\w\\b)?)*))?\\s*(?:(lit\\.|Buchstabe)\\s*(?<lit${suffix}>[a-z]${Verbinder}[a-z])*))?\\s*(?:(Alt\\.|Alternative)\\s*(?<alternative2${suffix}>\\d+${Verbinder}\\d+)?))?.{0,10}?)`;
}

export const lawRegex = new RegExp(
    `(?<!\[[^\]]{0,1})(?<p1>§+|Art\\.|Artikel)\\s*(?<p2>${getSingleLawRegexString(
        "_first"
    )}${VerbinderKomma}${getSingleLawRegexString(
        "_last"
    )})*)(?<gesetz>\\b${lawList}\\b)(?!.*?\\])`,
    "gm"
);

export const lawChainRegex = new RegExp(
    `${VerbinderKomma})${getSingleLawRegexString("")}`,
    "gm"
);

export const caseRegex = /(?<!\[[^\]]{0,1})\b(?:[A-Za-z]-\d+\/\d{2}|[A-Za-z]\s*\d+\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[A-Z]-\d+\/\d{2}|\d+[A-Za-z]?\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[IVXLCDM]+\s*[A-Za-z]{1,3}\s*\d+\s*[A-Za-z]{0,3}\s*\d+\/\d{2}(?:\s*[A-Za-z])?|[A-Za-z]?\d{1,7}\/\d{2})\b(?!.*?\])/g;

export const journalRegex = /(?<!\[[^\]]{0,1})\b(?<journal>[A-Za-z][A-Za-z-]*|Slg.)\s*(?:(?<year>\d{4})(?:,\s*(?<volume1>[IVXLCDM]{1,5})-(?<page1>\d+)|,\s*(?<page2>\d+))|(?<volume2>\d+),\s*(?<page3>\d+))\b(?!.*?\])/gm;
