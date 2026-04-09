import { readFile, writeFile, mkdir } from "fs/promises";
import subsetFont from "subset-font";

// Only the archaic Hangul Jamo characters that standard web fonts (including Google Fonts' Noto Sans KR) lack.
// Modern jamo (ㄱ-ㅎ, ㅏ-ㅣ) are already in standard fonts — we only need the obsolete/archaic ones.
const ARCHAIC_CHARS = [
    // Archaic Choseong (initial consonants) — obsolete consonants used in Middle Korean
    "\u1140", // ᅀ Pansios (반시옷)
    "\u1141", "\u1142", "\u1143", "\u1144", "\u1145", "\u1146", "\u1147",
    "\u1148", "\u1149", "\u114A", "\u114B", "\u114C", // ᅌ Yesieung
    "\u114D", "\u114E", "\u114F",
    "\u1150", "\u1151", "\u1152", "\u1153", "\u1154", "\u1155", "\u1156", "\u1157", "\u1158",
    "\u1159", // ᅙ Yeorinhieuh (여린히읗)

    // Archaic Jungseong (medial vowels)
    "\u119E", // ᆞ Araea (아래아) — the most common archaic character
    "\u119F", "\u11A0",
    "\u11A1", // ᆡ Araea-I
    "\u11A2", // ᆢ Ssangaraea (쌍아래아)
    "\u11A3", "\u11A4", "\u11A5", "\u11A6", "\u11A7",

    // Archaic Jongseong (final consonants)
    "\u11C3", "\u11C4", "\u11C5", "\u11C6", "\u11C7", "\u11C8", "\u11C9",
    "\u11CA", "\u11CB", "\u11CC", "\u11CD", "\u11CE", "\u11CF",
    "\u11D0", "\u11D1", "\u11D2", "\u11D3", "\u11D4", "\u11D5", "\u11D6", "\u11D7",
    "\u11D8", "\u11D9", "\u11DA", "\u11DB", "\u11DC", "\u11DD", "\u11DE", "\u11DF",
    "\u11E0", "\u11E1", "\u11E2", "\u11E3", "\u11E4", "\u11E5", "\u11E6", "\u11E7",
    "\u11E8", "\u11E9", "\u11EA", "\u11EB", // ᇫ Pansios final
    "\u11EC", "\u11ED", "\u11EE", "\u11EF",
    "\u11F0", // ᇰ Yesieung final
    "\u11F1", "\u11F2", "\u11F3", "\u11F4", "\u11F5", "\u11F6", "\u11F7",
    "\u11F8", "\u11F9",

    // Hangul Jamo Extended-A (archaic choseong)
    "\uA960", "\uA961", "\uA962", "\uA963", "\uA964", "\uA965", "\uA966", "\uA967",
    "\uA968", "\uA969", "\uA96A", "\uA96B", "\uA96C", "\uA96D", "\uA96E", "\uA96F",
    "\uA970", "\uA971", "\uA972", "\uA973", "\uA974", "\uA975", "\uA976", "\uA977",
    "\uA978", "\uA979", "\uA97A", "\uA97B", "\uA97C",

    // Hangul Jamo Extended-B (archaic jungseong + jongseong)
    "\uD7B0", "\uD7B1", "\uD7B2", "\uD7B3", "\uD7B4", "\uD7B5", "\uD7B6", "\uD7B7",
    "\uD7B8", "\uD7B9", "\uD7BA", "\uD7BB", "\uD7BC", "\uD7BD", "\uD7BE", "\uD7BF",
    "\uD7C0", "\uD7C1", "\uD7C2", "\uD7C3", "\uD7C4", "\uD7C5", "\uD7C6",
    "\uD7CB", "\uD7CC", "\uD7CD", "\uD7CE", "\uD7CF",
    "\uD7D0", "\uD7D1", "\uD7D2", "\uD7D3", "\uD7D4", "\uD7D5", "\uD7D6", "\uD7D7",
    "\uD7D8", "\uD7D9", "\uD7DA", "\uD7DB", "\uD7DC", "\uD7DD", "\uD7DE", "\uD7DF",
    "\uD7E0", "\uD7E1", "\uD7E2", "\uD7E3", "\uD7E4", "\uD7E5", "\uD7E6", "\uD7E7",
    "\uD7E8", "\uD7E9", "\uD7EA", "\uD7EB", "\uD7EC", "\uD7ED", "\uD7EE", "\uD7EF",
    "\uD7F0", "\uD7F1", "\uD7F2", "\uD7F3", "\uD7F4", "\uD7F5", "\uD7F6", "\uD7F7",
    "\uD7F8", "\uD7F9", "\uD7FA", "\uD7FB",
];

const text = ARCHAIC_CHARS.join("");

const fontBuffer = await readFile("NotoSansCJKkr-Regular.otf");
const subset = await subsetFont(fontBuffer, text, { targetFormat: "woff2" });

await mkdir("public/fonts", { recursive: true });
await writeFile("public/fonts/noto-cjk-kr-archaic.woff2", subset);

console.log(`Created subset: ${subset.byteLength} bytes (${(subset.byteLength / 1024).toFixed(1)} KB)`);
console.log(`Archaic characters: ${ARCHAIC_CHARS.length} code points`);
