"use server";

import OpenAI from "openai";
import { LANGUAGES } from "@/lib/data";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExampleResult {
    id: string;
    text: string;
    tokens: string[];
    translation: string;
    translation_ko?: string;
    gender_variants?: {
        male: { targetText: string };
        female: { targetText: string };
    };
}

export async function getRelatedPhrases(
    lang: string,
    token: string,
    gender: "male" | "female",
    nativeLangCode: string = 'ja' // Default to JA if not provided to avoid break
): Promise<ExampleResult[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set.");
        return [];
    }

    const nativeLangName = LANGUAGES.find(l => l.code === nativeLangCode)?.name || "Japanese";

    // Language-specific tokenization instructions
    const getTokenizationGuide = (targetLang: string) => {
        if (targetLang === 'ja') {
            return `
## Japanese Tokenization Rules:
- Particles (は/が/を/に/へ/で/と/も/から/まで/より/や/の/ね/よ/か) MUST be separate tokens (FUNC)
- です/ます MUST be kept as single tokens (never split で/す)
- WH words (何/誰/どこ/いつ/なぜ/どう/どれ/どんな/どの/いくら) MUST be separate tokens
- Punctuation (。、！？) MUST be separate tokens
- Tense markers like た must be exposed as separate tokens (e.g., 行き/まし/た or 行き/ました)
Example: 私/は/東京/に/行き/ます/。`;
        } else if (targetLang === 'ko') {
            return `
## Korean Tokenization Rules:
- Particles (조사: 은/는/이/가/을/를/에/에서/로/와/과/도/부터/까지) MUST be separate from nouns
- Verb endings (요/습니다/ㅂ니다/았/었/겠) should expose function (split verb stem from ending)
- Negation (안/못) MUST be separate tokens
- WH words (뭐/누구/어디/언제/왜/어떻게/어느/얼마) MUST be separate tokens
- Punctuation (. , ? !) MUST be separate tokens
- Spaces in Korean text should be preserved as separate tokens if they appear
Example: 저/는/학교/에/가/요/.`;
        } else if (targetLang === 'zh') {
            return `
## Chinese Tokenization Rules:
- Function words MUST be separate tokens: 不/没 (negation), 吗/呢/吧 (question particles), 了/过/着 (aspect)
- Prepositions (在/到/从/给/对/跟/和) MUST be separate tokens
- WH words (什么/谁/哪/哪里/怎么/多少/几/什么时候) MUST be separate tokens
- Structural particles (的/得/地) MUST be separate tokens
- Content words should be 1-2 character units typically (洗手间, 喜欢, 觉得)
- Punctuation (。，？！) MUST be separate tokens
Example: 我/不/知道/。 or 你/喜欢/咖啡/吗/？`;
        } else {
            // Default for European languages
            return `
## Tokenization Rules for ${targetLang}:
- Split by word boundaries (spaces)
- Punctuation MUST be separate tokens
- Keep compound words together if they form a meaning unit
Example: I / like / coffee / .`;
        }
    };

    try {
        const prompt = `
You are a language tutor generating example sentences with proper tokenization.

Target Language: ${lang}
Word/Phrase to include: "${token}"
Speaker Gender: ${gender}
Learner's Native Language: ${nativeLangName}

${getTokenizationGuide(lang)}

## Universal Token Roles (for reference):
- CONTENT: Content words (nouns, verb stems, adjectives, adverbs)
- FUNC: Function words (particles, polite markers, question markers)
- AUX: Aspect/tense/modality markers
- WH: Question words
- DISCOURSE: Conjunctions/discourse markers
- PUNCT: Punctuation

## CRITICAL Requirements:
1. Generate 5 natural, short sentences using the word/phrase
2. "text" field: The CLEAN sentence with NO SLASHES. Just the natural sentence.
3. "tokens" field: Array of strings. tokens.join("") MUST exactly equal "text" (perfect reconstruction)
4. No empty tokens allowed
5. Punctuation must be separate tokens
6. Function words (particles, markers) must be separate tokens
7. Speaker is ${gender} - use correct gender agreement for first-person sentences

IMPORTANT: Do NOT put slashes in the "text" field. The slashes are only shown in the tokenization guide as examples.

Return ONLY a raw JSON array (no markdown) of objects.

For Korean example - CORRECT format:
[
  {
    "text": "나는 이 음악이 좋아.",
    "tokens": ["나", "는", " ", "이", " ", "음악", "이", " ", "좋아", "."],
    "translation": "私はこの音楽が好きです。"
  }
]

WRONG format (do NOT do this):
[
  {
    "text": "나는/이 음악이/좋아.",
    "tokens": ["나는", "/", "이 음악이", "/", "좋아", "."],
    ...
  }
]
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return [];

        // Simple cleanup if md blocks are present
        const jsonStr = content.replace(/^```json/, "").replace(/```$/, "");

        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) return [];

        return data.map((item: any, i: number) => ({
            id: `gen-${Date.now()}-${i}`,
            text: item.text,
            tokens: item.tokens || [],
            translation: item.translation,
            translation_ko: item.translation_ko,
        }));
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return [];
    }
}
