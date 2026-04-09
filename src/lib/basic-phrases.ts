import datasetRaw from "@/data/dataset_tokenized_modeB.json";

export interface BasicPhraseItem {
    id: string;
    lang: string;
    categoryId: string;
    targetText: string;
    translation: string;
    mode: string;
    tokens: string[];
    tokensSlash: string;
}

interface DatasetMeta {
    mode: string;
    tokenDelimiter: string;
    itemCount: number;
    languages: string[];
    categories: string[];
}

interface Dataset {
    meta: DatasetMeta;
    items: BasicPhraseItem[];
}

const dataset = datasetRaw as Dataset;

export const BASIC_PHRASE_CATEGORIES = dataset.meta.categories;
export const BASIC_PHRASES = dataset.items;

export const getBasicPhrasesByCategory = (categoryId: string) => {
    if (categoryId === "all") return BASIC_PHRASES;
    return BASIC_PHRASES.filter(p => p.categoryId === categoryId);
};

export const getCategoryLabel = (categoryId: string): string => {
    const labels: Record<string, string> = {
        greeting: "挨拶",
        dining: "食事",
        travel: "旅行",
        emotions: "感情"
    };
    return labels[categoryId] || categoryId;
};
