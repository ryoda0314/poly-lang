import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { LANGUAGES } from "@/lib/data";
import { Database } from "@/types/supabase";
import { logTokenUsage } from "@/lib/token-usage";

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

        // Detect language and translate
        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                {
                    role: "system",
                    content: `You are a language detection and translation assistant.

The user is learning ${learningLangName} (code: ${learningLang}) and their native language is ${nativeLangName} (code: ${nativeLang}).

Given a text input, you must:
1. Detect which language the input is in
2. Determine if it's the user's native language or learning language
3. Provide a translation to the OTHER language

Respond in JSON format ONLY:
{
  "detected_language": "<language code>",
  "is_learning_language": true/false,
  "target_text": "<text in learning language>",
  "translation": "<text in native language>"
}

Rules:
- If input is in ${learningLangName}, set is_learning_language=true, target_text=input, translation=translated to ${nativeLangName}
- If input is in ${nativeLangName}, set is_learning_language=false, target_text=translated to ${learningLangName}, translation=input
- If input is in another language, translate to BOTH ${learningLangName} and ${nativeLangName}
- Keep translations natural and concise`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3,
            max_completion_tokens: 1000,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content?.trim() || "{}";
        const result = JSON.parse(content);

        // Log token usage
        if (completion.usage) {
            logTokenUsage(
                user.id,
                'extension_smart_save',
                'gpt-5.2',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            ).catch(console.error);
        }

        return NextResponse.json({
            detected_language: result.detected_language,
            is_learning_language: result.is_learning_language,
            target_text: result.target_text,
            translation: result.translation,
            learning_language: learningLang,
            native_language: nativeLang,
        });

    } catch (error) {
        console.error("Smart save error:", error);
        return NextResponse.json(
            { error: "処理に失敗しました" },
            { status: 500 }
        );
    }
}
