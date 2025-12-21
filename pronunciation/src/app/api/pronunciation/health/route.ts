import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
    const status = {
        api: true,
        database: false,
        openai: false,
        azure_speech: false,
        error: null as string | null,
    };

    // Check Supabase
    try {
        const supabase = createServerClient();
        const { error } = await supabase.from('pronunciation_runs').select('id').limit(1);
        if (!error) {
            status.database = true;
        } else {
            status.error = 'Database table not found. Please run the SQL schema.';
        }
    } catch (e) {
        status.error = 'Supabase connection failed. Check environment variables.';
    }

    // Check OpenAI key
    status.openai = !!process.env.OPENAI_API_KEY;
    if (!status.openai && !status.error) {
        status.error = 'OPENAI_API_KEY not configured.';
    }

    // Check Azure Speech
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION;
    status.azure_speech = !!(azureKey && azureRegion);

    if (!status.azure_speech && !status.error) {
        status.error = 'Azure Speech not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local';
    }

    return NextResponse.json(status);
}
