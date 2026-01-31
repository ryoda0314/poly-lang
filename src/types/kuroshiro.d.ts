declare module "kuroshiro" {
    interface ConvertOptions {
        to: "hiragana" | "katakana" | "romaji";
        mode?: "normal" | "spaced" | "okurigana" | "furigana";
        romajiSystem?: "nippon" | "passport" | "hepburn";
        delimiter_start?: string;
        delimiter_end?: string;
    }

    class Kuroshiro {
        constructor();
        init(analyzer: any): Promise<void>;
        convert(text: string, options?: ConvertOptions): Promise<string>;
    }

    export default Kuroshiro;
}

declare module "kuroshiro-analyzer-kuromoji" {
    interface KuromojiAnalyzerOptions {
        dictPath?: string;
    }

    class KuromojiAnalyzer {
        constructor(options?: KuromojiAnalyzerOptions);
        init(): Promise<void>;
        parse(text: string): Promise<any[]>;
    }

    export default KuromojiAnalyzer;
}
