"use server";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TokenizeInput {
    text: string;
    lang: string;
}

export interface TokenizeResult {
    text: string;
    tokens: string[];
}

const getTokenizationGuide = (targetLang: string) => {
    if (targetLang === 'ja') {
        return `
## Japanese Tokenization Rules:
- Particles (は/が/を/に/へ/で/と/も/から/まで/より/や/の/ね/よ/か) MUST be separate tokens
- です/ます MUST be kept as single tokens
- WH words (何/誰/どこ/いつ/なぜ/どう/どれ/どんな/どの/いくら) MUST be separate tokens
- Punctuation (。、！？) MUST be separate tokens
- Tense markers like た must be exposed as separate tokens
Example: 私/は/東京/に/行き/ます/。`;
    } else if (targetLang === 'ko') {
        return `
## Korean Tokenization Rules:
- Particles (조사: 은/는/이/가/을/를/에/에서/로/와/과/도/부터/까지) MUST be separate from nouns
- Verb endings (요/습니다/ㅂ니다/았/었/겠) should expose function
- Negation (안/못) MUST be separate tokens
- WH words (뭐/누구/어디/언제/왜/어떻게/어느/얼마) MUST be separate tokens
- Punctuation (. , ? !) MUST be separate tokens
Example: 저/는/학교/에/가/요/.`;
    } else if (targetLang === 'zh') {
        return `
## Chinese Tokenization Rules:
- Function words MUST be separate tokens: 不/没 (negation), 吗/呢/吧 (question particles), 了/过/着 (aspect)
- Prepositions (在/到/从/给/对/跟/和) MUST be separate tokens
- WH words (什么/谁/哪/哪里/怎么/多少/几/什么时候) MUST be separate tokens
- Structural particles (的/得/地) MUST be separate tokens
- Content words should be 1-2 character units typically
- Punctuation (。，？！) MUST be separate tokens
Example: 我/不/知道/。`;
    } else {
        return `
## Tokenization Rules for ${targetLang}:
- Split by word boundaries (spaces)
- Punctuation MUST be separate tokens
- Keep compound words together if they form a meaning unit
Example: I / like / coffee / .`;
    }
};

export async function tokenizePhrases(
    phrases: TokenizeInput[]
): Promise<TokenizeResult[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return phrases.map(p => ({ text: p.text, tokens: [] }));
    }

    if (phrases.length === 0) {
        return [];
    }

    // Group by language for efficient processing
    const byLang: Record<string, TokenizeInput[]> = {};
    for (const phrase of phrases) {
        if (!byLang[phrase.lang]) {
            byLang[phrase.lang] = [];
        }
        byLang[phrase.lang].push(phrase);
    }

    const results: TokenizeResult[] = [];

    for (const [lang, langPhrases] of Object.entries(byLang)) {
        // Process in batches of 10
        for (let i = 0; i < langPhrases.length; i += 10) {
            const batch = langPhrases.slice(i, i + 10);
            const batchResults = await tokenizeBatch(batch, lang);
            results.push(...batchResults);
        }
    }

    return results;
}

async function tokenizeBatch(
    phrases: TokenizeInput[],
    lang: string
): Promise<TokenizeResult[]> {
    const textsJson = JSON.stringify(phrases.map(p => p.text));

    const prompt = `
You are a tokenization expert. Tokenize the following phrases in ${lang}.

${getTokenizationGuide(lang)}

## CRITICAL Requirements:
1. tokens.join("") MUST exactly equal the original text (perfect reconstruction)
2. No empty tokens allowed
3. Punctuation must be separate tokens
4. Function words (particles, markers) must be separate tokens
5. Spaces should be preserved as tokens where they appear

Input texts (JSON array):
${textsJson}

Return ONLY a raw JSON array (no markdown) with objects in the same order:
[
  { "text": "original text", "tokens": ["token1", "token2", ...] },
  ...
]
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return phrases.map(p => ({ text: p.text, tokens: [] }));
        }

        const jsonStr = content.replace(/^```json/, "").replace(/```$/, "").trim();
        const data = JSON.parse(jsonStr);

        if (!Array.isArray(data)) {
            return phrases.map(p => ({ text: p.text, tokens: [] }));
        }

        return data.map((item: any) => ({
            text: item.text,
            tokens: item.tokens || []
        }));
    } catch (error) {
        console.error("Tokenization error:", error);
        return phrases.map(p => ({ text: p.text, tokens: [] }));
    }
}

export async function tokenizeSinglePhrase(
    text: string,
    lang: string
): Promise<string[]> {
    const results = await tokenizePhrases([{ text, lang }]);
    return results[0]?.tokens || [];
}
