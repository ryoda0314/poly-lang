
import { createBrowserClient } from '@supabase/ssr';
import { User, Session } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;
type MemoRow = Database['public']['Tables']['awareness_memos']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const LOCAL_MEMO_KEY = 'poly.local.awareness_memos';
const LOCAL_PROFILE_KEY = 'poly.local.profile';
const nowIso = () => new Date().toISOString();
const randomId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `local-${Math.random().toString(36).slice(2)}`);

const LOCAL_USER: User = {
    id: 'local-user',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: nowIso(),
    email: 'local@example.com',
    email_confirmed_at: nowIso(),
    last_sign_in_at: nowIso(),
    phone: '',
    role: 'authenticated',
    identities: [],
    factors: null
} as User;

const LOCAL_SESSION: Session = {
    access_token: 'local-access-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    refresh_token: 'local-refresh-token',
    user: LOCAL_USER
} as Session;

const defaultProfile = (): ProfileRow => ({
    id: LOCAL_USER.id,
    username: 'Local User',
    gender: 'unspecified',
    native_language: 'en',
    learning_language: 'fr',
    settings: null,
    created_at: nowIso()
});

const memoryStore = {
    memos: [] as MemoRow[],
    profile: defaultProfile()
};

const readLocal = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const writeLocal = (key: string, value: unknown) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch { }
};

const getMemos = (): MemoRow[] => {
    const stored = readLocal<MemoRow[]>(LOCAL_MEMO_KEY, memoryStore.memos);
    memoryStore.memos = stored;
    return [...stored];
};

const setMemos = (memos: MemoRow[]) => {
    memoryStore.memos = memos;
    writeLocal(LOCAL_MEMO_KEY, memos);
};

const getProfile = (): ProfileRow => {
    const stored = readLocal<ProfileRow | null>(LOCAL_PROFILE_KEY, null);
    if (stored) {
        memoryStore.profile = stored;
        return stored;
    }
    const fallback = memoryStore.profile || defaultProfile();
    setProfile(fallback);
    return fallback;
};

const setProfile = (profile: ProfileRow) => {
    memoryStore.profile = profile;
    writeLocal(LOCAL_PROFILE_KEY, profile);
};

const createMemoTable = () => {
    const select = (columns = '*') => {
        const state: { filters: Array<[keyof MemoRow, unknown]>; order?: { column: keyof MemoRow; ascending: boolean }; limit?: number } = { filters: [] };

        const apply = () => {
            let data = getMemos();
            state.filters.forEach(([column, value]) => {
                data = data.filter(row => (row as any)[column] === value);
            });
            if (state.order) {
                data = [...data].sort((a, b) => {
                    const av = (a as any)[state.order!.column];
                    const bv = (b as any)[state.order!.column];
                    if (av === bv) return 0;
                    return state.order!.ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
                });
            }
            if (typeof state.limit === 'number') {
                data = data.slice(0, state.limit);
            }

            if (columns.includes('count')) {
                return [{ count: data.length } as any];
            }

            return data;
        };

        const builder = {
            eq: (column: keyof MemoRow, value: unknown) => {
                state.filters.push([column, value]);
                return builder;
            },
            order: (column: keyof MemoRow, options?: { ascending?: boolean }) => {
                state.order = { column, ascending: options?.ascending !== false };
                return builder;
            },
            limit: (count: number) => {
                state.limit = count;
                return builder;
            },
            single: async () => ({ data: apply()[0] ?? null, error: null }),
            then: (resolve: (value: { data: MemoRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        };

        return builder as unknown as Promise<{ data: MemoRow[]; error: null }> & typeof builder;
    };

    const insert = (payload: Partial<MemoRow> | Partial<MemoRow>[]) => {
        const doInsert = () => {
            const rows = (Array.isArray(payload) ? payload : [payload]).map(item => {
                const timestamp = nowIso();
                return {
                    id: item.id ?? `local-memo-${randomId()}`,
                    user_id: item.user_id ?? LOCAL_USER.id,
                    phrase_id: item.phrase_id ?? 'unknown',
                    token_index: item.token_index ?? 0,
                    confidence: item.confidence ?? null,
                    memo: item.memo ?? null,
                    created_at: item.created_at ?? timestamp,
                    updated_at: item.updated_at ?? timestamp
                } as MemoRow;
            });

            const updated = [...getMemos(), ...rows];
            setMemos(updated);
            return rows.length === 1 ? rows[0] : rows;
        };

        return {
            select: () => ({
                single: async () => ({ data: doInsert(), error: null })
            }),
            single: async () => ({ data: doInsert(), error: null })
        };
    };

    const update = (updates: Partial<MemoRow>) => {
        const state: { filters: Array<[keyof MemoRow, unknown]> } = { filters: [] };

        const apply = () => {
            const updated: MemoRow[] = [];
            const next = getMemos().map(row => {
                const match = state.filters.every(([column, value]) => (row as any)[column] === value);
                if (!match) return row;
                const merged = { ...row, ...updates, updated_at: updates.updated_at ?? nowIso() } as MemoRow;
                updated.push(merged);
                return merged;
            });
            setMemos(next);
            return updated;
        };

        const builder = {
            eq: (column: keyof MemoRow, value: unknown) => {
                state.filters.push([column, value]);
                return builder;
            },
            select: () => ({
                then: (resolve: (value: { data: MemoRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                    Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
            }),
            then: (resolve: (value: { data: MemoRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        };

        return builder as unknown as Promise<{ data: MemoRow[]; error: null }> & typeof builder;
    };

    const deleteRows = () => {
        const state: { filters: Array<[keyof MemoRow, unknown]> } = { filters: [] };

        const apply = () => {
            const keep = getMemos().filter(row => !state.filters.every(([column, value]) => (row as any)[column] === value));
            setMemos(keep);
            return null;
        };

        const builder = {
            eq: (column: keyof MemoRow, value: unknown) => {
                state.filters.push([column, value]);
                return builder;
            },
            then: (resolve: (value: { data: null; error: null }) => void, reject: (reason?: unknown) => void) =>
                Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        };

        return builder as unknown as Promise<{ data: null; error: null }> & typeof builder;
    };

    return { select, insert, update, delete: deleteRows };
};

const createProfileTable = () => {
    const select = (columns = '*') => {
        const state: { filters: Array<[keyof ProfileRow, unknown]> } = { filters: [] };

        const apply = () => {
            const profile = getProfile();
            const match = state.filters.every(([column, value]) => (profile as any)[column] === value);
            if (!match) return [] as ProfileRow[];
            if (columns.includes('count')) return [{ count: 1 } as any];
            return [profile];
        };

        const builder = {
            eq: (column: keyof ProfileRow, value: unknown) => {
                state.filters.push([column, value]);
                return builder;
            },
            single: async () => ({ data: apply()[0] ?? null, error: null }),
            then: (resolve: (value: { data: ProfileRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        };

        return builder as unknown as Promise<{ data: ProfileRow[]; error: null }> & typeof builder;
    };

    const update = (updates: Partial<ProfileRow>) => {
        const state: { filters: Array<[keyof ProfileRow, unknown]> } = { filters: [] };

        const apply = () => {
            const profile = getProfile();
            const match = state.filters.every(([column, value]) => (profile as any)[column] === value);
            if (!match) return [] as ProfileRow[];
            const merged = { ...profile, ...updates } as ProfileRow;
            setProfile(merged);
            return [merged];
        };

        const builder = {
            eq: (column: keyof ProfileRow, value: unknown) => {
                state.filters.push([column, value]);
                return builder;
            },
            select: () => ({
                then: (resolve: (value: { data: ProfileRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                    Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
            }),
            then: (resolve: (value: { data: ProfileRow[]; error: null }) => void, reject: (reason?: unknown) => void) =>
                Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        };

        return builder as unknown as Promise<{ data: ProfileRow[]; error: null }> & typeof builder;
    };

    const upsert = (payload: Partial<ProfileRow> | Partial<ProfileRow>[]) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        const profile = getProfile();
        const merged = { ...profile, ...rows[0] } as ProfileRow;
        setProfile(merged);
        return Promise.resolve({ data: merged, error: null });
    };

    return { select, update, upsert };
};

const createMockClient = (): SupabaseClient => {
    console.warn('Supabase is not configured; using local mock client.');

    const from = (table: string) => {
        if (table === 'awareness_memos') return createMemoTable();
        if (table === 'profiles') return createProfileTable();
        return {
            select: () => ({ then: (resolve: (value: { data: []; error: null }) => void) => Promise.resolve({ data: [], error: null }).then(resolve) }),
            insert: () => ({ then: (resolve: (value: { data: []; error: null }) => void) => Promise.resolve({ data: [], error: null }).then(resolve) }),
            update: () => ({ then: (resolve: (value: { data: []; error: null }) => void) => Promise.resolve({ data: [], error: null }).then(resolve) })
        } as any;
    };

    const auth = {
        onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
            const subscription = { unsubscribe: () => void 0 };
            setTimeout(() => callback('SIGNED_IN', LOCAL_SESSION), 0);
            return { data: { subscription } } as any;
        },
        getSession: async () => ({ data: { session: LOCAL_SESSION }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { session: LOCAL_SESSION }, error: null }),
        signUp: async () => ({ data: { session: LOCAL_SESSION }, error: null })
    };

    return { auth, from } as unknown as SupabaseClient;
};

export const createClient = (): SupabaseClient => {
    if (isSupabaseConfigured) {
        return createBrowserClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    }
    return createMockClient();
};
