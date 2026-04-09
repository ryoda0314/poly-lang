import { NextResponse } from 'next/server';

export async function GET() {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
        return NextResponse.json({ error: 'Azure Speech credentials not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to issue token' }, { status: response.status });
        }

        const token = await response.text();
        return NextResponse.json({ token, region: speechRegion });

    } catch (error) {
        console.error('Speech token error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
