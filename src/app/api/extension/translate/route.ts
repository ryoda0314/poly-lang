import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { LANGUAGES } from "@/lib/data";
import { Database } from "@/types/supabase";
import { logTokenUsage } from "@/lib/token-usage";
import { checkAndConsumeCredit } from "@/lib/limits";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function createClientWithToken(accessToken: string) {
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get() { return undefined; },
                set() {},
                remove() {},
            },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        const accessToken = authHeader.replace("Bearer ", "");
        const supabase = createClientWithToken(accessToken);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "認証に失敗しました" },
                { status: 401 }
            );
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("native_language, learning_language")
            .eq("id", user.id)
            .single();

        // Credit check
        const limitCheck = await checkAndConsumeCredit(user.id, 'extension', supabase);
        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: limitCheck.error || "Insufficient credits" },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: "テキストが必要です" },
                { status: 400 }
            );
        }

        const nativeLang = profile?.native_language || "ja";
        const learningLang = profile?.learning_language || "en";

        const nativeLangName = LANGUAGES.find(l => l.code === nativeLang)?.name || nativeLang;
        const learningLangName = LANGUAGES.find(l => l.code === learningLang)?.name || learningLang;

        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                {
                    role: "system",
                    content: `You are a language learning assistant. The user is learning ${learningLangName} and their native language is ${nativeLangName}.

Given a phrase in ${learningLangName}, provide a translation/meaning in ${nativeLangName}.

Rules:
- Provide ONLY the translation, no explanations or extra text
- If the text contains idioms, translate the meaning naturally
- Keep the translation concise but accurate
- If the text is already in ${nativeLangName}, provide a brief explanation of what it means`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3,
            max_completion_tokens: 500,
        });

        const translation = completion.choices[0]?.message?.content?.trim() || "";

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'extension_translate',
                'gpt-5.2',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            ).catch(console.error);
        }

        return NextResponse.json({ translation });

    } catch (error: any) {
        console.error("Translation error:", error);
        console.error("Error details:", error?.message, error?.status, error?.code);
        return NextResponse.json(
            { error: `翻訳に失敗しました: ${error?.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
