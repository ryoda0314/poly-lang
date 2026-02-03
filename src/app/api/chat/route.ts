import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeCredit } from '@/lib/limits';
import { logTokenUsage } from '@/lib/token-usage';
import OpenAI from 'openai';
import { buildSystemPrompt, ChatSettings } from '@/store/chat-store';

const openai = new OpenAI();

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

        const limitCheck = await checkAndConsumeCredit(user.id, 'explanation', supabase);
        if (!limitCheck.allowed) {
            return new Response(JSON.stringify({ error: limitCheck.error || 'Insufficient credits' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { messages, settings, learningLanguage, nativeLanguage, compactedContext } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid messages' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build system prompt from settings
        const chatSettings: ChatSettings = settings || {
            partner: { gender: 'unspecified', relationship: 'friend', ageGroup: 'same', personality: 'friendly' },
            situationId: 'daily',
            customSituation: ''
        };

        const systemPrompt = buildSystemPrompt(chatSettings, learningLanguage, nativeLanguage);

        // Prepare messages for API
        const MAX_MESSAGES = 20;
        let apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt }
        ];

        // If we have compacted context, add it as context
        if (compactedContext) {
            apiMessages.push({
                role: 'system',
                content: `Previous conversation summary: ${compactedContext}`
            });
        }

        // Add recent messages
        const recentMessages = messages.slice(-MAX_MESSAGES);
        apiMessages = apiMessages.concat(
            recentMessages.map((m: ChatMessage) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
        );

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: apiMessages,
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'chat',
                'gpt-4o',
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

        const { messages, nativeLanguage } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: 'Invalid messages' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const languageNames: Record<string, string> = {
            en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
            fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
        };
        const langName = languageNames[nativeLanguage] || 'English';

        // Create summary of conversation
        const conversationText = messages
            .map((m: ChatMessage) => `${m.role}: ${m.content}`)
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
