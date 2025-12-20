const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we are running with node
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

if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in .env.local");
    process.exit(1);
}

const text = "こんにちは";
const voiceName = "Kore";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${apiKey}`;

console.log("Testing URL:", url.replace(apiKey, "HIDDEN"));

const payload = JSON.stringify({
    contents: [{
        parts: [{ text: `Please read: "${text}"` }]
    }],
    generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: voiceName
                }
            }
        }
    }
});

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", data);
    });
});

req.on('error', (e) => {
    console.error("Request Error:", e);
});

req.write(payload);
req.end();
