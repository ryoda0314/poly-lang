export interface ExtractedArticle {
    title: string;
    content: string;
    imageUrl: string | null;
    resolvedUrl: string;
}

function extractMetaContent(html: string, property: string): string | null {
    // Try property= and name= forms
    const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*?)["']|` +
        `<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${property}["']`,
        'i'
    );
    const match = html.match(regex);
    return match ? (match[1] || match[2] || null) : null;
}

function extractTitle(html: string): string {
    // Try og:title first, then <title>
    const ogTitle = extractMetaContent(html, 'og:title');
    if (ogTitle) return ogTitle;

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
}

function extractImage(html: string): string | null {
    return extractMetaContent(html, 'og:image');
}

function stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractContent(html: string): string {
    // Remove scripts, styles, nav, header, footer, aside
    let cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    // Try <article> tag first
    const articleMatch = cleaned.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
        const paragraphs = articleMatch[1].match(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi);
        if (paragraphs && paragraphs.length > 0) {
            return paragraphs.map(p => stripTags(p)).filter(t => t.length > 20).join('\n\n');
        }
    }

    // Try main tag
    const mainMatch = cleaned.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
        const paragraphs = mainMatch[1].match(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi);
        if (paragraphs && paragraphs.length > 0) {
            return paragraphs.map(p => stripTags(p)).filter(t => t.length > 20).join('\n\n');
        }
    }

    // Fallback: all <p> tags
    const paragraphs = cleaned.match(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi);
    if (paragraphs && paragraphs.length > 0) {
        return paragraphs.map(p => stripTags(p)).filter(t => t.length > 20).join('\n\n');
    }

    return '';
}

/**
 * Resolve Google News redirect URL to the actual article URL.
 * Google News RSS links go through news.google.com which redirects to the real article.
 */
async function resolveRedirectUrl(url: string): Promise<string> {
    if (!url.includes('news.google.com')) return url;

    try {
        // Use HEAD with redirect: 'manual' to capture the Location header
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
        });
        // response.url contains the final URL after all redirects
        if (res.url && res.url !== url && !res.url.includes('consent.google')) {
            return res.url;
        }
    } catch {
        // Ignore - fall back to original URL
    }
    return url;
}

export async function extractArticleContent(url: string): Promise<ExtractedArticle> {
    // First resolve Google News redirect URLs
    const resolvedUrl = await resolveRedirectUrl(url);

    const response = await fetch(resolvedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const title = extractTitle(html);
    const imageUrl = extractImage(html);
    const content = extractContent(html);

    return { title, content, imageUrl, resolvedUrl: response.url || resolvedUrl };
}
