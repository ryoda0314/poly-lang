import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeCredit } from '@/lib/limits';
import { logTokenUsage } from '@/lib/token-usage';
import OpenAI from 'openai';
import { buildSystemPrompt, ChatSettings } from '@/store/chat-store';

const openai = new OpenAI();

import { LANGUAGES } from '@/lib/data';
const VALID_LANGUAGES = LANGUAGES.map(l => l.code);

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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

        const limitCheck = await checkAndConsumeCredit(user.id, 'chat', supabase);
        if (!limitCheck.allowed) {
            return new Response(JSON.stringify({ error: limitCheck.error || 'Insufficient credits' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { messages, settings, learningLanguage, nativeLanguage, compactedContext, assistMode } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length > 100) {
            return new Response(JSON.stringify({ error: 'Invalid messages (max 100)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate individual message content size (max 10000 chars each)
        for (const m of messages) {
            if (typeof m.content === 'string' && m.content.length > 10000) {
                return new Response(JSON.stringify({ error: 'Message content too long (max 10000 chars)' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Validate language codes
        const safeLearningLang = VALID_LANGUAGES.includes(learningLanguage) ? learningLanguage : 'en';
        const safeNativeLang = VALID_LANGUAGES.includes(nativeLanguage) ? nativeLanguage : 'en';

        // Build system prompt from settings
        const chatSettings: ChatSettings = settings || {
            partner: { gender: 'unspecified', relationship: 'friend', ageGroup: 'same', personality: 'friendly' },
            situationId: 'daily',
            customSituation: ''
        };

        const systemPrompt = buildSystemPrompt(chatSettings, safeLearningLang, safeNativeLang, assistMode || false);

        // Prepare messages for API
        const MAX_MESSAGES = 20;
        let apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt }
        ];

        // Add compacted context as user/assistant pair (not system role) to prevent prompt injection
        if (compactedContext && typeof compactedContext === 'string') {
            const sanitized = compactedContext.slice(0, 2000);
            apiMessages.push({
                role: 'user',
                content: `[Previous conversation summary: ${sanitized}]`
            });
            apiMessages.push({
                role: 'assistant',
                content: 'Understood, I recall our previous conversation.'
            });
        }

        // Add recent messages (validate role to prevent system role injection)
        const recentMessages = messages.slice(-MAX_MESSAGES);
        apiMessages = apiMessages.concat(
            recentMessages.map((m: ChatMessage) => ({
                role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: typeof m.content === 'string' ? m.content.slice(0, 10000) : ''
            }))
        );

        const completion = await openai.chat.completions.create({
            model: 'gpt-5.2',
            messages: apiMessages,
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'chat',
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
            parsed = { reply: responseContent, correction: { hasError: false } };
        }

        return new Response(JSON.stringify(parsed), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: unknown) {
        console.error('Chat API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Simple translation endpoint
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const limitCheck = await checkAndConsumeCredit(user.id, 'chat', supabase);
        if (!limitCheck.allowed) {
            return new Response(JSON.stringify({ error: limitCheck.error || 'Insufficient credits' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { text, targetLanguage, sourceLanguage } = await req.json();

        if (!text || typeof text !== 'string' || text.length > 5000) {
            return new Response(JSON.stringify({ error: 'Invalid or too long text (max 5000 chars)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate language codes
        const safeTargetLang = VALID_LANGUAGES.includes(targetLanguage) ? targetLanguage : 'ja';
        const safeSourceLang = VALID_LANGUAGES.includes(sourceLanguage) ? sourceLanguage : 'en';

        const languageNames: Record<string, string> = {
            en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
            fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
        };
        const targetLangName = languageNames[safeTargetLang] || 'Japanese';
        const sourceLangName = languageNames[safeSourceLang] || 'English';

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Translate the following ${sourceLangName} text to ${targetLangName}. Provide only the translation, no explanations.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
        });

        const translation = completion.choices[0]?.message?.content?.trim() || '';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'chat_translate',
                'gpt-4o-mini',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            ).catch(console.error);
        }

        return new Response(JSON.stringify({ translation }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: unknown) {
        console.error('Translation API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Compact/summarize endpoint
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const limitCheck = await checkAndConsumeCredit(user.id, 'chat', supabase);
        if (!limitCheck.allowed) {
            return new Response(JSON.stringify({ error: limitCheck.error || 'Insufficient credits' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { messages, nativeLanguage } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
            return new Response(JSON.stringify({ error: 'Invalid messages (1-100 required)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate language code
        const safeNativeLang = VALID_LANGUAGES.includes(nativeLanguage) ? nativeLanguage : 'en';

        const languageNames: Record<string, string> = {
            en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
            fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
        };
        const langName = languageNames[safeNativeLang] || 'English';

        // Create summary of conversation (limit content size to prevent DoS)
        const conversationText = messages
            .slice(-50)
            .map((m: ChatMessage) => `${m.role}: ${typeof m.content === 'string' ? m.content.slice(0, 2000) : ''}`)
            .join('\n');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Summarize the following conversation in 2-3 sentences in ${langName}. Focus on the key topics discussed and any important context that should be remembered for continuing the conversation.`
                },
                {
                    role: 'user',
                    content: conversationText
                }
            ],
        });

        const summary = completion.choices[0]?.message?.content || '';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'chat_summarize',
                'gpt-4o-mini',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            ).catch(console.error);
        }

        return new Response(JSON.stringify({ summary }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: unknown) {
        console.error('Compact API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
