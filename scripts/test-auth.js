const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');
let apiKey = '';

if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=([^\r\n]+)/);
    if (match) apiKey = match[1].trim();
}

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=([^\r\n]+)/);
    if (match) apiKey = match[1].trim();
}

console.log("Using API Key:", apiKey ? "FOUND" : "MISSING");

async function listModels() {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        // Correct method to list models in v1/v0.1 depends on SDK version, 
        // usually ai.models.list() or client.list_models()
        // SDK @google/genai (new) might be different. 
        // Let's try standard approach or just a simple generation with 'gemini-1.5-flash' to test auth.
        console.log("Attempting generation with 'gemini-1.5-flash' to verify Auth...");
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("Success! Auth works. Response snippet:", response?.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", JSON.stringify(e, null, 2));
    }
}

listModels();
