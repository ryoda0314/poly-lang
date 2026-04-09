import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Singleton pattern - only create one client instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return supabaseInstance;
}
