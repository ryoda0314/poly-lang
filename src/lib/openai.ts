import OpenAI from "openai";

let _instance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (!_instance) {
        _instance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _instance;
}
