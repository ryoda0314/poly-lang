"use client";

import { createClient } from "@/lib/supa-client";
import { useState } from "react";

export default function CheckDbPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const supabase = createClient();

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

    const runDiagnostics = async () => {
        setLogs(["Starting diagnostics..."]);

        // 0. Check Env Vars & Network
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        addLog(`Env URL: ${url ? url.substring(0, 15) + '...' : 'MISSING'}`);
        addLog(`Env Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);

        try {
            addLog("Testing basic fetch to Supabase URL...");
            // Simple fetch check to see if network is reachable
            const res = await fetch(`${url}/auth/v1/health`, { method: 'GET', headers: { apikey: key || '' } });
            addLog(`Fetch Health Status: ${res.status}`);
        } catch (e: any) {
            addLog(`❌ Network Fetch Error: ${e.message}`);
            return; // Stop if network is down
        }

        try {
            // 1. Check Session
            addLog("Checking session (with timeout)...");

            // Add timeout to getSession
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session check timed out")), 5000));

            const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;

            if (sessionError) {
                addLog(`❌ Session Error: ${sessionError.message}`);
                return;
            }

            if (!session) {
                addLog("❌ No active session found. Please login first.");
                return;
            }

            addLog(`✅ Authenticated as: ${session.user.id}`);

            // 2. Check Table Access (SELECT)
            addLog("Testing SELECT from awareness_memos...");
            const { data: selectData, error: selectError } = await supabase
                .from('awareness_memos')
                .select('count') // just count or small select
                .limit(1);

            if (selectError) {
                addLog(`❌ SELECT Failed: ${JSON.stringify(selectError)}`);
            } else {
                addLog(`✅ SELECT Success. Data: ${JSON.stringify(selectData)}`);
            }

            // 3. Check Insert (INSERT)
            addLog("Testing INSERT into awareness_memos...");
            const testId = `test-${Date.now()}`;
            const { data: insertData, error: insertError } = await supabase
                .from('awareness_memos')
                .insert({
                    user_id: session.user.id,
                    phrase_id: 'test-phrase',
                    token_index: 0,
                    confidence: 'low',
                    memo: 'Diagnostic test memo',
                    // id is usually auto-generated but we can let it be
                })
                .select()
                .single();

            if (insertError) {
                addLog(`❌ INSERT Failed: ${JSON.stringify(insertError)}`);
            } else {
                addLog(`✅ INSERT Success. Created ID: ${insertData.id}`);

                // Cleanup
                addLog("Cleaning up test record...");
                await supabase.from('awareness_memos').delete().eq('id', insertData.id);
                addLog("✅ Cleanup complete");
            }

        } catch (e: any) {
            addLog(`❌ Uncaught Exception: ${e.message}`);
        }

        addLog("Diagnostics finished.");
    };

    const clearSession = async () => {
        addLog("Clearing local storage and signing out...");
        localStorage.clear();
        sessionStorage.clear();
        addLog("Local/Session storage cleared.");
        try {
            await supabase.auth.signOut();
            addLog("Signed out.");
        } catch (e: any) {
            addLog(`Sign out error (expected if session broken): ${e.message}`);
        }
        window.location.reload();
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>Database Diagnostics</h1>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={runDiagnostics}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    Run Tests
                </button>
                <button
                    onClick={clearSession}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        background: '#ffdddd',
                        border: '1px solid red'
                    }}
                >
                    ⚠️ Force Clear Session
                </button>
            </div>
            <div style={{
                background: '#f0f0f0',
                padding: '1rem',
                borderRadius: '5px',
                minHeight: '200px',
                whiteSpace: 'pre-wrap'
            }}>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
