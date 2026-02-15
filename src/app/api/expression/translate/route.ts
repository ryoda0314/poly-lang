import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeCredit } from '@/lib/limits';
import { logTokenUsage } from '@/lib/token-usage';
import OpenAI from 'openai';

const openai = new OpenAI();

const languageNames: Record<string, string> = {
    en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
    fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
};

function buildExpressionPrompt(learningLanguage: string, nativeLanguage: string): string {
    const learningLangName = languageNames[learningLanguage] || learningLanguage;
    const nativeLangName = languageNames[nativeLanguage] || nativeLanguage;

    return `You are a language learning assistant helping users express themselves in ${learningLangName}.

The user will provide a phrase or expression in ${nativeLangName}. Your task is to:
1. Determine if the input is a partial phrase/pattern (like "〜っぽい", "〜みたいな", "kind of〜", "〜ish") or a complete sentence
2. Provide 3-4 translation suggestions with different formality levels
3. Explain key grammar points or vocabulary
4. Give an overall explanation of usage

Response format (valid JSON):
{
    "isPartialPhrase": true | false,
    "suggestions": [
        {
            "text": "translation in ${learningLangName}",
            "formality": "casual" | "standard" | "formal" | "polite",
            "nuance": "brief description of when to use this version (in ${nativeLangName})"
        }
    ],
    "keyPoints": [
        "Key grammar or vocabulary point 1 (in ${nativeLangName})",
        "Key point 2 (in ${nativeLangName})"
    ],
    "explanation": "Overall explanation of how to use these expressions naturally (in ${nativeLangName})"
}

Guidelines:
- Set isPartialPhrase to true if the input is:
  - A grammar pattern (e.g., "〜っぽい", "〜みたいな", "〜かもしれない")
  - A suffix or prefix pattern (e.g., "〜ish", "kind of〜", "〜적인")
  - An incomplete phrase that needs context to form a full sentence
- Set isPartialPhrase to false if the input is a complete thought/sentence
- Provide at least 3 suggestions with varying formality (casual, standard, formal/polite)
- keyPoints should highlight important grammar patterns, word choices, or cultural notes
- Keep explanations concise but informative
- All explanations and nuances should be in ${nativeLangName} for easy understanding`;
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const limitCheck = await checkAndConsumeCredit(user.id, 'expression', supabase);
        if (!limitCheck.allowed) {
            return new Response(JSON.stringify({ error: limitCheck.error || 'Insufficient credits' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { nativeText, learningLanguage, nativeLanguage } = await req.json();

        if (!nativeText || typeof nativeText !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid input text' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (nativeText.length > 500) {
            return new Response(JSON.stringify({ error: 'Text too long (max 500 characters)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate language codes
        const { LANGUAGES } = await import('@/lib/data');
        const VALID_LANGUAGES = LANGUAGES.map(l => l.code);
        const safeLearningLang = VALID_LANGUAGES.includes(learningLanguage) ? learningLanguage : 'en';
        const safeNativeLang = VALID_LANGUAGES.includes(nativeLanguage) ? nativeLanguage : 'en';

        const systemPrompt = buildExpressionPrompt(safeLearningLang, safeNativeLang);

        const completion = await openai.chat.completions.create({
            model: 'gpt-5.2',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: nativeText }
            ],
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'expression_translate',
                'gpt-5.2',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            ).catch(console.error);
        }

        // Parse and return structured response
        let parsed;
        try {
            parsed = JSON.parse(responseContent);
        } catch {
            parsed = {
                suggestions: [],
                keyPoints: [],
                explanation: 'Failed to parse response'
            };
        }

        return new Response(JSON.stringify(parsed), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: unknown) {
        console.error('Expression Translate API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
