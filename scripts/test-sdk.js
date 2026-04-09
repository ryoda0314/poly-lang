const { google } = require('@google/genai');

console.log("SDK Exports:", Object.keys(require('@google/genai')));

try {
    const client = new google.genai.Client({ apiKey: "TEST" });
    console.log("Client created successfully");
} catch (e) {
    console.error("Client creation failed:", e);
}
