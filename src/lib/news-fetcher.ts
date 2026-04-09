const NEWS_RSS_URLS: Record<string, string> = {
    en: 'https://news.google.com/rss?hl=en&gl=US&ceid=US:en',
    ja: 'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja',
    ko: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    zh: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    fr: 'https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr',
    es: 'https://news.google.com/rss?hl=es&gl=ES&ceid=ES:es',
    de: 'https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de',
    ru: 'https://news.google.com/rss?hl=ru&gl=RU&ceid=RU:ru',
    vi: 'https://news.google.com/rss?hl=vi&gl=VN&ceid=VN:vi',
};

export interface RSSArticle {
    title: string;
    link: string;
    pubDate: string | null;
    source: string | null;
    description: string | null;
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

function stripHtmlTags(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
    const match = xml.match(regex);
    if (!match) return null;
    return decodeHtmlEntities((match[1] || match[2] || '').trim());
}

function parseRSSItems(xml: string): RSSArticle[] {
    const items: RSSArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const pubDate = extractTag(itemXml, 'pubDate');
        const source = extractTag(itemXml, 'source');
        const rawDesc = extractTag(itemXml, 'description');
        const description = rawDesc ? stripHtmlTags(rawDesc) : null;

        if (title && link) {
            items.push({ title, link, pubDate, source, description });
        }
    }

    return items;
}

export async function fetchNewsFeed(languageCode: string): Promise<RSSArticle[]> {
    const rssUrl = NEWS_RSS_URLS[languageCode];
    if (!rssUrl) return [];

    try {
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'PolyLang/1.0' },
            next: { revalidate: 1800 },
        });

        if (!response.ok) return [];

        const xml = await response.text();
        return parseRSSItems(xml);
    } catch (e) {
        console.error('Failed to fetch news RSS:', e);
        return [];
    }
}
