/**
 * Wiktionary Etymology Data Stocker
 *
 * Fetches etymology wikitext from Wiktionary for common words and stores
 * them in the etymology_wikitext_stock table for faster lookups.
 *
 * Usage:
 *   node scripts/stock-wikitext.mjs --lang en          # Stock English words
 *   node scripts/stock-wikitext.mjs --lang en,fr,de    # Multiple languages
 *   node scripts/stock-wikitext.mjs --lang all          # All tier 1+2 languages
 *   node scripts/stock-wikitext.mjs --lang en --limit 50  # Limit per language
 *   node scripts/stock-wikitext.mjs --lang en --dry-run    # Preview only
 *   node scripts/stock-wikitext.mjs --lang en --skip-existing  # Skip already stocked
 *
 * Requires:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------
function loadEnv() {
    const envPath = resolve(__dirname, "../.env.local");
    if (!existsSync(envPath)) {
        console.error("Missing .env.local");
        process.exit(1);
    }
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        process.env[key] = val;
    }
}

loadEnv();

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const WIKTIONARY_LANG_HEADERS = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian",
};

// Wiktionary categories per language — ordered by priority (etymology-rich first)
const WIKTIONARY_CATEGORIES = {
    en: [
        "English_terms_inherited_from_Old_English",       // 6.4k — core Germanic vocabulary
        "English_terms_derived_from_Old_Norse",            // 1.7k — Viking loanwords
        "English_terms_derived_from_Proto-Germanic",       // 4.2k — deep roots
        "English_terms_inherited_from_Middle_English",     // 17k  — historical English
        "English_terms_derived_from_French",               // 12k  — Norman influence
        "English_terms_derived_from_Latin",                // 26k  — academic/scientific
        "English_terms_derived_from_Ancient_Greek",        // 13k  — scientific/philosophical
        "English_lemmas",                                  // 852k — fallback
    ],
    fr: [
        "French_terms_inherited_from_Latin",               // 2.1k
        "French_terms_derived_from_Latin",                 // 10k
        "French_lemmas",                                   // 97k
    ],
    de: [
        "German_terms_inherited_from_Middle_High_German",
        "German_terms_derived_from_Latin",
        "German_lemmas",                                   // 102k
    ],
    es: [
        "Spanish_terms_inherited_from_Latin",              // 2.6k
        "Spanish_terms_derived_from_Latin",
        "Spanish_lemmas",
    ],
    ja: [
        "Japanese_terms_derived_from_Chinese",             // 639
        "Japanese_terms_written_in_kanji",
        "Japanese_lemmas",
    ],
    zh: [
        "Chinese_terms_with_historical_senses",
        "Chinese_lemmas",
    ],
    ko: [
        "Korean_terms_derived_from_Chinese",               // 76
        "Korean_lemmas",
    ],
    ru: [
        "Russian_terms_inherited_from_Proto-Slavic",       // 3.4k
        "Russian_terms_derived_from_French",
        "Russian_lemmas",
    ],
};

const ALL_LANGS = Object.keys(WIKTIONARY_CATEGORIES);

// Rate limiting: Wiktionary asks for max ~200 req/min
const DELAY_MS = 350; // ~170 req/min, safe margin
const BATCH_SIZE = 50; // Titles per batch API call (max 50 for parse)
const USER_AGENT = "PolyLang/1.0 (language-learning-app; etymology-stocker)";

// ---------------------------------------------------------------------------
// ARGS
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
    return null;
}
function hasFlag(name) {
    return args.includes(`--${name}`);
}

const langArg = getArg("lang") || "en";
const limitPerLang = parseInt(getArg("limit") || "500", 10);
const dryRun = hasFlag("dry-run");
const skipExisting = hasFlag("skip-existing");

const targetLangs = langArg === "all"
    ? ALL_LANGS
    : langArg.split(",").map(l => l.trim()).filter(l => ALL_LANGS.includes(l));

if (targetLangs.length === 0) {
    console.error(`Invalid --lang: "${langArg}". Available: ${ALL_LANGS.join(", ")}, all`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// SUPABASE
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

// ---------------------------------------------------------------------------
// WIKTIONARY API
// ---------------------------------------------------------------------------

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (e) {
            if (attempt < retries) {
                const wait = attempt * 2000;
                console.error(`  Fetch error (attempt ${attempt}/${retries}): ${e.message}, retrying in ${wait}ms...`);
                await sleep(wait);
            } else {
                throw e;
            }
        }
    }
}

/**
 * Get word list from Wiktionary categories using categorymembers API.
 * Iterates through priority-ordered categories (frequent words first).
 * Returns up to `limit` unique words.
 */
async function fetchCategoryMembers(lang, limit) {
    const categories = WIKTIONARY_CATEGORIES[lang];
    if (!categories) return [];

    const seen = new Set();
    const words = [];

    for (const category of categories) {
        if (words.length >= limit) break;

        let cmcontinue = undefined;
        let categoryCount = 0;

        while (words.length < limit) {
            const batchLimit = Math.min(500, limit - words.length);
            let url = `https://en.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmlimit=${batchLimit}&cmnamespace=0&cmtype=page&format=json&origin=*`;
            if (cmcontinue) {
                url += `&cmcontinue=${encodeURIComponent(cmcontinue)}`;
            }

            try {
                const res = await fetchWithRetry(url);
                const data = await res.json();
                const members = data?.query?.categorymembers || [];
                for (const m of members) {
                    const title = m.title;
                    if (!title || title.includes(":") || seen.has(title)) continue;
                    if (/^[^a-zA-Z\u00C0-\u024F\u0400-\u04FF\u3000-\u9FFF\uAC00-\uD7AF]/.test(title)) continue;
                    seen.add(title);
                    words.push(title);
                    categoryCount++;
                }

                cmcontinue = data?.continue?.cmcontinue;
                if (!cmcontinue) break;
            } catch (e) {
                console.error(`  Category fetch failed for ${category}: ${e.message}, moving to next category`);
                break;
            }

            await sleep(DELAY_MS);
        }

        if (categoryCount > 0) {
            console.log(`  Category:${category} → ${categoryCount} words`);
        }
    }

    return words.slice(0, limit);
}

/**
 * Extract etymology section from full page wikitext for a given language.
 */
function extractEtymology(fullWikitext, targetLang) {
    if (!fullWikitext) return null;

    if (targetLang === "en") {
        const match = fullWikitext.match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
        return match ? match[1].trim() : null;
    }

    const langHeader = WIKTIONARY_LANG_HEADERS[targetLang];
    if (!langHeader) return null;

    const langSectionRegex = new RegExp(
        `==\\s*${langHeader}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s*[A-Z]|$)`
    );
    const langSection = fullWikitext.match(langSectionRegex);
    if (!langSection) return null;

    const etymMatch = langSection[1].match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
    return etymMatch ? etymMatch[1].trim() : null;
}

/**
 * Batch-fetch wikitext for up to 50 pages in a single API call.
 * Uses action=query&prop=revisions to get full page content.
 * Returns Map<title, etymologyText>.
 */
async function fetchEtymologyBatch(words, targetLang) {
    const results = new Map();
    if (words.length === 0) return results;

    const titles = words.join("|");
    const url = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=revisions&rvprop=content&rvslots=main&format=json&origin=*`;

    const res = await fetchWithRetry(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};

    // Build normalized title map (Wiktionary may normalize titles)
    const normalized = new Map();
    for (const n of data?.query?.normalized || []) {
        normalized.set(n.to, n.from);
    }

    for (const page of Object.values(pages)) {
        if (page.missing !== undefined) continue;
        const title = normalized.get(page.title) || page.title;
        const content = page.revisions?.[0]?.slots?.main?.["*"];
        if (!content) continue;

        const etymology = extractEtymology(content, targetLang);
        if (etymology && etymology.length >= 5) {
            results.set(title, etymology);
        }
    }

    return results;
}

/**
 * Check which words are already stocked in the DB.
 */
async function getExistingWords(words, targetLang) {
    const existing = new Set();
    // Query in batches of 200
    for (let i = 0; i < words.length; i += 200) {
        const batch = words.slice(i, i + 200);
        const { data } = await supabase
            .from("etymology_wikitext_stock")
            .select("word")
            .eq("target_language", targetLang)
            .in("word", batch);
        if (data) {
            for (const row of data) existing.add(row.word);
        }
    }
    return existing;
}

/**
 * Also check which words already have full etymology entries (already processed).
 */
async function getProcessedWords(words, targetLang) {
    const processed = new Set();
    for (let i = 0; i < words.length; i += 200) {
        const batch = words.slice(i, i + 200);
        const { data } = await supabase
            .from("etymology_entries")
            .select("word")
            .eq("target_language", targetLang)
            .in("word", batch);
        if (data) {
            for (const row of data) processed.add(row.word);
        }
    }
    return processed;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function processLanguage(lang) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Language: ${WIKTIONARY_LANG_HEADERS[lang]} (${lang})`);
    console.log(`${"=".repeat(60)}`);

    // 1. Get word list from Wiktionary category
    console.log(`Fetching up to ${limitPerLang} words from Category:${WIKTIONARY_CATEGORIES[lang]}...`);
    const allWords = await fetchCategoryMembers(lang, limitPerLang);
    console.log(`  Got ${allWords.length} words from category`);

    if (allWords.length === 0) return { stocked: 0, skipped: 0, noData: 0 };

    // 2. Filter out existing stock and processed entries
    let words = allWords;
    if (skipExisting) {
        const [existing, processed] = await Promise.all([
            getExistingWords(allWords, lang),
            getProcessedWords(allWords, lang),
        ]);
        words = allWords.filter(w => !existing.has(w) && !processed.has(w));
        const skippedCount = allWords.length - words.length;
        if (skippedCount > 0) {
            console.log(`  Skipping ${skippedCount} already stocked/processed words`);
        }
    }

    if (dryRun) {
        console.log(`  [DRY RUN] Would process ${words.length} words:`);
        console.log(`  ${words.slice(0, 20).join(", ")}${words.length > 20 ? "..." : ""}`);
        return { stocked: 0, skipped: 0, noData: 0 };
    }

    // 3. Batch-fetch and store etymology wikitext (50 words per API call)
    let stocked = 0;
    let skipped = 0;
    let noData = 0;

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(words.length / BATCH_SIZE);

        try {
            const results = await fetchEtymologyBatch(batch, lang);

            const upsertRows = [];
            for (const word of batch) {
                const wikitext = results.get(word);
                if (wikitext) {
                    upsertRows.push({ word, target_language: lang, raw_wikitext: wikitext });
                    stocked++;
                } else {
                    noData++;
                }
            }

            // Upsert this batch to DB
            if (upsertRows.length > 0) {
                const { error } = await supabase
                    .from("etymology_wikitext_stock")
                    .upsert(upsertRows, { onConflict: "word,target_language" });
                if (error) console.error("  DB upsert error:", error.message);
            }

            console.log(`  Batch ${batchNum}/${totalBatches}: ${results.size}/${batch.length} have etymology (${batch[0]}..${batch[batch.length - 1]})`);

        } catch (e) {
            console.error(`  Batch ${batchNum} error: ${e.message}`);
            skipped += batch.length;
        }

        await sleep(DELAY_MS);
    }

    return { stocked, skipped, noData };
}

async function main() {
    console.log("Wiktionary Etymology Data Stocker");
    console.log(`Languages: ${targetLangs.join(", ")}`);
    console.log(`Limit per language: ${limitPerLang}`);
    if (dryRun) console.log("MODE: DRY RUN");
    if (skipExisting) console.log("Skipping existing entries");

    const totals = { stocked: 0, skipped: 0, noData: 0 };

    for (const lang of targetLangs) {
        const result = await processLanguage(lang);
        totals.stocked += result.stocked;
        totals.skipped += result.skipped;
        totals.noData += result.noData;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("Done!");
    console.log(`  Stocked: ${totals.stocked}`);
    console.log(`  No etymology data: ${totals.noData}`);
    console.log(`  Errors: ${totals.skipped}`);

    // Show current stock count
    const { count } = await supabase
        .from("etymology_wikitext_stock")
        .select("*", { count: "exact", head: true });
    console.log(`  Total in stock table: ${count || 0}`);
}

main().catch(e => {
    console.error("Fatal error:", e);
    process.exit(1);
});
