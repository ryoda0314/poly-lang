import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeCredit } from '@/lib/limits';
import { logTokenUsage } from '@/lib/token-usage';
import OpenAI from 'openai';

const openai = new OpenAI();

const languageNames: Record<string, string> = {
    en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
    fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
};

function buildExamplesPrompt(learningLanguage: string, nativeLanguage: string): string {
    const learningLangName = languageNames[learningLanguage] || learningLanguage;
    const nativeLangName = languageNames[nativeLanguage] || nativeLanguage;

    return `You are a language learning assistant. Generate example sentences using a given phrase or pattern in ${learningLangName}.

The user will provide a phrase/pattern in ${learningLangName}. Generate 4-5 natural example sentences that demonstrate how to use this phrase in real conversations.

Response format (valid JSON):
{
    "examples": [
        {
            "sentence": "Full example sentence in ${learningLangName}",
            "translation": "Translation of the sentence in ${nativeLangName}",
            "context": "Brief description of the situation/context (in ${nativeLangName})"
        }
    ]
}

Guidelines:
- Generate 4-5 diverse examples showing different use cases
- Examples should be practical, everyday sentences
- Vary the contexts (casual chat, work, asking for help, expressing opinions, etc.)
- Keep sentences natural and commonly used
- Translations should be natural in ${nativeLangName}, not literal`;
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

        const { phrase, learningLanguage, nativeLanguage } = await req.json();

        if (!phrase || typeof phrase !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid phrase' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (phrase.length > 200) {
            return new Response(JSON.stringify({ error: 'Phrase too long (max 200 characters)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate language codes
        const { LANGUAGES } = await import('@/lib/data');
        const VALID_LANGUAGES = LANGUAGES.map(l => l.code);
        const safeLearningLang = VALID_LANGUAGES.includes(learningLanguage) ? learningLanguage : 'en';
        const safeNativeLang = VALID_LANGUAGES.includes(nativeLanguage) ? nativeLanguage : 'en';

        const systemPrompt = buildExamplesPrompt(safeLearningLang, safeNativeLang);

        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: phrase }
            ],
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'expression_examples',
                'gpt-5-mini',
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
                examples: []
            };
        }

        return new Response(JSON.stringify(parsed), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: unknown) {
        console.error('Expression Examples API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
