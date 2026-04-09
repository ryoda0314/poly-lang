import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Singleton pattern - only create one client instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build-time static generation, env vars may not be available.
    // Return an uncached placeholder client to avoid crashing the build.
    if (!url || !key) {
        return createBrowserClient<Database>(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder-anon-key'
        );
    }

    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient<Database>(url, key);
    }
    return supabaseInstance;
}
