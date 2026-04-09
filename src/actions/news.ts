"use server";

import { getOpenAI } from "@/lib/openai";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";
import { fetchNewsFeed, type RSSArticle } from "@/lib/news-fetcher";
import { extractArticleContent } from "@/lib/article-extractor";
import type {
    NewsArticleSummary,
    ProcessedArticle,
    VocabItem,
    GrammarPattern,
    NewsHistoryEntry,
    NewsDifficulty,
} from "@/types/news";

// ── Language Constants ──

const LANG_NAMES: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

// ── Public: Get News Feed ──

export async function getNewsFeed(
    languageCode: string
): Promise<{ articles: NewsArticleSummary[] }> {
    const rssArticles = await fetchNewsFeed(languageCode);

    const articles: NewsArticleSummary[] = rssArticles.map((item, i) => ({
        id: `rss-${i}`,
        title: item.title,
        source_url: item.link,
        image_url: null,
        published_at: item.pubDate,
        source_type: 'rss',
        description: item.description,
    }));

    return { articles };
}

// ── Main: Process Article ──

export async function processArticle(
    sourceUrl: string,
    difficulty: NewsDifficulty,
    learningLanguage: string,
    nativeLanguage: string,
    titleHint?: string,
    descriptionHint?: string,
): Promise<{ data?: ProcessedArticle; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "認証が必要です" };

    const adminClient = await createAdminClient();

    // 1. Check article cache
    let articleId: string | null = null;
    let originalTitle = '';
    let originalContent = '';
    let imageUrl: string | null = null;

    const { data: cachedArticle } = await (adminClient as any)
        .from('news_articles')
        .select('id, original_title, original_content, image_url')
        .eq('source_url', sourceUrl)
        .eq('language_code', learningLanguage)
        .single();

    if (cachedArticle) {
        articleId = cachedArticle.id;
        originalTitle = cachedArticle.original_title || '';
        originalContent = cachedArticle.original_content || '';
        imageUrl = cachedArticle.image_url;
    } else {
        // Fetch and cache article
        try {
            const extracted = await extractArticleContent(sourceUrl);
            originalTitle = extracted.title || titleHint || '';
            originalContent = extracted.content;
            imageUrl = extracted.imageUrl;
        } catch {
            // Extraction failed - use RSS title/description as fallback
            originalTitle = titleHint || sourceUrl;
            originalContent = '';
        }

        const { data: inserted } = await (adminClient as any)
            .from('news_articles')
            .upsert({
                source_url: sourceUrl,
                source_type: 'rss',
                original_title: originalTitle,
                original_content: originalContent,
                language_code: learningLanguage,
                image_url: imageUrl,
                published_at: new Date().toISOString(),
            }, { onConflict: 'source_url,language_code' })
            .select('id')
            .single();

        articleId = inserted?.id || null;
    }

    if (!articleId) return { error: "記事の保存に失敗しました" };

    // 2. Check simplification cache
    const { data: cachedSimplification } = await (adminClient as any)
        .from('news_simplifications')
        .select('*')
        .eq('article_id', articleId)
        .eq('difficulty', difficulty)
        .eq('native_language', nativeLanguage)
        .single();

    if (cachedSimplification) {
        // Cache hit - record history without consuming credit
        await recordHistory(adminClient, user.id, articleId, difficulty);

        const vocab: VocabItem[] = (cachedSimplification.vocabulary || []).map((v: any) => ({
            ...v, saved: false,
        }));
        const grammar: GrammarPattern[] = (cachedSimplification.grammar_patterns || []).map((g: any) => ({
            ...g, saved: false,
        }));

        return {
            data: {
                articleId,
                originalTitle,
                simplifiedTitle: cachedSimplification.simplified_title,
                simplifiedText: cachedSimplification.simplified_text,
                vocabulary: vocab,
                grammarPatterns: grammar,
                difficulty,
                imageUrl,
                sourceUrl,
            },
        };
    }

    // 3. Cache miss - consume credit
    const limitCheck = await checkAndConsumeCredit(user.id, 'news', supabase);
    if (!limitCheck.allowed) {
        return { error: limitCheck.error || 'クレジットが不足しています' };
    }

    // 4. Call OpenAI
    const prompt = buildProcessingPrompt(difficulty, learningLanguage, nativeLanguage);
    let contentForAI: string;
    if (originalContent && originalContent.length > 50) {
        contentForAI = `Title: ${originalTitle}\n\nContent:\n${originalContent.slice(0, 5000)}`;
    } else {
        // Content extraction failed — use title + RSS description
        const desc = descriptionHint || '';
        contentForAI = `News headline: ${originalTitle}\n\n${desc ? `Summary: ${desc}\n\n` : ''}Based on this headline${desc ? ' and summary' : ''}, write a complete news article about this topic. Use your knowledge of current events to provide accurate context.`;
    }

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-5.2',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: contentForAI },
            ],
            response_format: { type: 'json_object' },
        });

        const raw = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(raw);

        // Log token usage
        logTokenUsage(
            user.id,
            'news',
            'gpt-5-mini',
            response.usage?.prompt_tokens || 0,
            response.usage?.completion_tokens || 0
        ).catch(console.error);

        // 5. Cache simplification
        await (adminClient as any)
            .from('news_simplifications')
            .upsert({
                article_id: articleId,
                difficulty,
                native_language: nativeLanguage,
                simplified_title: parsed.simplified_title || originalTitle,
                simplified_text: parsed.simplified_text || '',
                vocabulary: parsed.vocabulary || [],
                grammar_patterns: parsed.grammar_patterns || [],
                model_used: 'gpt-5-mini',
            }, { onConflict: 'article_id,difficulty,native_language' });

        // 6. Record history
        await recordHistory(adminClient, user.id, articleId, difficulty);

        const vocab: VocabItem[] = (parsed.vocabulary || []).map((v: any) => ({
            word: v.word || '',
            reading: v.reading || null,
            pos: v.pos || '',
            definition: v.definition || '',
            example_sentence: v.example_sentence || '',
            saved: false,
        }));
        const grammar: GrammarPattern[] = (parsed.grammar_patterns || []).map((g: any) => ({
            pattern: g.pattern || '',
            explanation: g.explanation || '',
            example: g.example || '',
            level: g.level || difficulty,
            saved: false,
        }));

        return {
            data: {
                articleId,
                originalTitle,
                simplifiedTitle: parsed.simplified_title || originalTitle,
                simplifiedText: parsed.simplified_text || '',
                vocabulary: vocab,
                grammarPatterns: grammar,
                difficulty,
                imageUrl,
                sourceUrl,
            },
        };
    } catch (e: any) {
        console.error('News processing error:', e);
        return { error: `記事の処理中にエラーが発生しました: ${e?.message || String(e)}` };
    }
}

// ── History ──

export async function getNewsHistory(): Promise<NewsHistoryEntry[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await (supabase as any)
        .from('user_news_history')
        .select(`
            id, article_id, difficulty, read_at, saved_vocabulary, saved_grammar,
            news_articles ( original_title, source_url, image_url )
        `)
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(50);

    if (!data) return [];

    return data.map((row: any) => ({
        id: row.id,
        article_id: row.article_id,
        difficulty: row.difficulty,
        read_at: row.read_at,
        saved_vocabulary: row.saved_vocabulary || [],
        saved_grammar: row.saved_grammar || [],
        article_title: row.news_articles?.original_title || '',
        article_url: row.news_articles?.source_url || '',
        article_image: row.news_articles?.image_url || null,
    }));
}

export async function saveNewsProgress(
    articleId: string,
    difficulty: string,
    savedVocabulary: any[],
    savedGrammar: any[]
): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const adminClient = await createAdminClient();
    await (adminClient as any)
        .from('user_news_history')
        .upsert({
            user_id: user.id,
            article_id: articleId,
            difficulty,
            saved_vocabulary: savedVocabulary,
            saved_grammar: savedGrammar,
            read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,article_id,difficulty' });
}

// ── Helpers ──

async function recordHistory(
    adminClient: any,
    userId: string,
    articleId: string,
    difficulty: string
) {
    await (adminClient as any)
        .from('user_news_history')
        .upsert({
            user_id: userId,
            article_id: articleId,
            difficulty,
            read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,article_id,difficulty' });
}

function buildProcessingPrompt(
    difficulty: NewsDifficulty,
    learningLanguage: string,
    nativeLanguage: string
): string {
    const learningLangName = LANG_NAMES[learningLanguage] || learningLanguage;
    const nativeLangName = LANG_NAMES[nativeLanguage] || nativeLanguage;

    const difficultyGuidelines: Record<NewsDifficulty, string> = {
        beginner: `
- Use only the 500 most common words in ${learningLangName}
- Simple sentence structures (S-V-O, no complex subordination)
- Short sentences (under 15 words each)
- Present tense primarily
- Avoid idioms, metaphors, and cultural references
- Total length: approximately 200 words`,
        intermediate: `
- Use the 2000 most common words in ${learningLangName}
- Mix of simple and compound sentences
- Some subordinate clauses allowed
- Past, present, and future tenses
- Common idioms are acceptable
- Total length: approximately 300 words`,
        advanced: `
- Natural vocabulary appropriate for news (including formal register)
- Complex sentence structures including relative clauses, conditionals
- All tenses and moods
- Idioms, metaphors, and cultural references are fine
- Maintain the nuance and tone of the original
- Total length: approximately 400 words`,
    };

    return `You are a language learning content creator specializing in ${learningLangName}.

Rewrite the following news article in ${learningLangName} for a ${difficulty}-level language learner.

DIFFICULTY GUIDELINES:
${difficultyGuidelines[difficulty]}

TASKS:
1. Rewrite the article content following the difficulty guidelines above.
2. Pick 15-20 words/phrases FROM YOUR REWRITTEN TEXT that a ${difficulty}-level learner would likely NOT know. Focus on:
   - Topic-specific vocabulary (politics, science, economy, etc.)
   - Formal/written register words uncommon in everyday speech
   - Collocations, compound words, or idiomatic expressions used in the article
   Do NOT pick basic/common words the learner already knows.
3. Pick 6-8 useful EXPRESSION PATTERNS from your rewritten text that the learner can reuse in other contexts. For example:
   - "feel like ...ing", "be likely to ...", "turn out to be ...", "not only ... but also ..."
   - Show the pattern as a reusable template (with "..." for variable parts), NOT as a grammar term.
   Do NOT use linguistic jargon like "passive voice" or "relative clause" — just show the pattern itself.

Respond in JSON:
{
    "simplified_title": "Rewritten title in ${learningLangName}",
    "simplified_text": "Rewritten article text in ${learningLangName}. Use paragraph breaks (\\n\\n) for readability.",
    "vocabulary": [
        {
            "word": "the challenging word/phrase in ${learningLangName} exactly as it appears in simplified_text",
            "reading": "pronunciation guide (hiragana for ja, pinyin for zh, romanization for ko, IPA for others, or null)",
            "pos": "noun/verb/adjective/adverb/phrase/etc.",
            "definition": "clear definition in ${nativeLangName}",
            "example_sentence": "copy the exact sentence from simplified_text where this word appears"
        }
    ],
    "grammar_patterns": [
        {
            "pattern": "reusable expression template like 'be likely to ...' or 'the more ..., the more ...'",
            "explanation": "brief explanation in ${nativeLangName} of meaning and when to use it, with 1-2 extra example sentences showing different uses",
            "example": "copy the exact sentence from simplified_text that uses this pattern",
            "level": "beginner/intermediate/advanced"
        }
    ]
}

IMPORTANT:
- The simplified_text MUST be written entirely in ${learningLangName}.
- Vocabulary and grammar must come FROM the simplified_text you wrote — not invented separately.
- Definitions and explanations MUST be in ${nativeLangName}.
- Do NOT fabricate facts. Maintain the core meaning of the original article.
- You MUST include AT LEAST 15 vocabulary items and AT LEAST 6 grammar patterns. This is a hard minimum.`;
}
