// Supabase configuration for Chrome Extension
const SUPABASE_URL = 'https://uttfgsxrbrwubjewxblw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dGZnc3hyYnJ3dWJqZXd4Ymx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MTksImV4cCI6MjA4MjA1NzUxOX0.iwtboQApFNc7dHfE6PEMg4mWJz6O9zk1-P9WNOToki8';

// Simple Supabase client for Chrome Extension
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
    }

    // Initialize from stored session
    async init() {
        const stored = await chrome.storage.local.get(['supabase_session']);
        if (stored.supabase_session) {
            const session = stored.supabase_session;
            this.accessToken = session.access_token;
            this.refreshToken = session.refresh_token;
            this.user = session.user;

            // Check if token is expired and refresh if needed
            if (this.isTokenExpired(session.expires_at)) {
                await this.refreshSession();
            }
        }
        return this;
    }

    isTokenExpired(expiresAt) {
        if (!expiresAt) return true;
        return Date.now() >= expiresAt * 1000 - 60000; // 1 minute buffer
    }

    // Sign in with email and password
    async signInWithPassword(email, password) {
        try {
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.key,
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.error || 'Login failed');
            }

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.user = data.user;

            // Store session
            await chrome.storage.local.set({
                supabase_session: {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_at: data.expires_at,
                    user: data.user,
                }
            });

            return { data: { user: data.user, session: data }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Refresh session
    async refreshSession() {
        if (!this.refreshToken) {
            return { data: null, error: new Error('No refresh token') };
        }

        try {
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.key,
                },
                body: JSON.stringify({ refresh_token: this.refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.error || 'Refresh failed');
            }

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.user = data.user;

            await chrome.storage.local.set({
                supabase_session: {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_at: data.expires_at,
                    user: data.user,
                }
            });

            return { data: { session: data }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Sign out
    async signOut() {
        try {
            if (this.accessToken) {
                await fetch(`${this.url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'apikey': this.key,
                    },
                });
            }
        } catch (e) {
            // Ignore logout errors
        }

        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        await chrome.storage.local.remove(['supabase_session']);

        return { error: null };
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Database operations
    from(table) {
        return new QueryBuilder(this, table);
    }

    // Make authenticated request
    async request(method, path, body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.key,
            'Prefer': 'return=representation',
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.url}${path}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    }
}

// Query builder for database operations
class QueryBuilder {
    constructor(client, table) {
        this.client = client;
        this.table = table;
        this.filters = [];
        this.selectColumns = '*';
        this.orderColumn = null;
        this.orderAsc = true;
        this.limitCount = null;
        this.singleResult = false;
    }

    select(columns = '*') {
        this.selectColumns = columns;
        return this;
    }

    eq(column, value) {
        this.filters.push(`${column}=eq.${value}`);
        return this;
    }

    in(column, values) {
        this.filters.push(`${column}=in.(${values.join(',')})`);
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.orderColumn = column;
        this.orderAsc = ascending;
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.singleResult = true;
        this.limitCount = 1;
        return this;
    }

    buildUrl() {
        let url = `/rest/v1/${this.table}?select=${this.selectColumns}`;

        if (this.filters.length > 0) {
            url += '&' + this.filters.join('&');
        }

        if (this.orderColumn) {
            url += `&order=${this.orderColumn}.${this.orderAsc ? 'asc' : 'desc'}`;
        }

        if (this.limitCount) {
            url += `&limit=${this.limitCount}`;
        }

        return url;
    }

    async execute() {
        try {
            const data = await this.client.request('GET', this.buildUrl());

            if (this.singleResult) {
                return { data: data[0] || null, error: null };
            }

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Alias for execute
    async then(resolve) {
        const result = await this.execute();
        resolve(result);
    }

    async insert(records) {
        try {
            const data = await this.client.request(
                'POST',
                `/rest/v1/${this.table}`,
                Array.isArray(records) ? records : [records]
            );
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async update(updates) {
        try {
            let url = `/rest/v1/${this.table}`;
            if (this.filters.length > 0) {
                url += '?' + this.filters.join('&');
            }

            const data = await this.client.request('PATCH', url, updates);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async delete() {
        try {
            let url = `/rest/v1/${this.table}`;
            if (this.filters.length > 0) {
                url += '?' + this.filters.join('&');
            }

            await this.client.request('DELETE', url);
            return { data: null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
}

// Create singleton instance
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.supabase = supabase;
}
