// Poly-Lang Chrome Extension - Background Service Worker

// Configuration
const SUPABASE_URL = 'https://uttfgsxrbrwubjewxblw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dGZnc3hyYnJ3dWJqZXd4Ymx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MTksImV4cCI6MjA4MjA1NzUxOX0.iwtboQApFNc7dHfE6PEMg4mWJz6O9zk1-P9WNOToki8';
const APP_URL = 'http://localhost:3000'; // 開発用。本番は 'https://poly-lang.vercel.app'

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'poly-lang-save',
        title: 'Poly-Langに保存',
        contexts: ['selection'],
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!info.selectionText) return;

    if (info.menuItemId === 'poly-lang-save') {
        // Send selected text to content script to show save dialog
        chrome.tabs.sendMessage(tab.id, {
            action: 'showSaveDialog',
            text: info.selectionText,
        });
    }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'savePhrase') {
        handleSavePhrase(message).then(sendResponse);
        return true;
    }

    if (message.action === 'smartSave') {
        handleSmartSave(message).then(sendResponse);
        return true;
    }

    if (message.action === 'translate') {
        handleTranslate(message).then(sendResponse);
        return true;
    }

    if (message.action === 'getSession') {
        getSession().then(sendResponse);
        return true;
    }

    if (message.action === 'getUserProfile') {
        handleGetUserProfile().then(sendResponse);
        return true;
    }
});

// Handle smart save request (detect language and auto-translate)
async function handleSmartSave(message) {
    try {
        const session = await getSession();
        if (!session?.access_token) {
            return { success: false, error: 'ログインが必要です' };
        }

        // Step 1: Detect language and get translations
        const detectResponse = await fetch(`${APP_URL}/api/extension/smart-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ text: message.text }),
        });

        if (!detectResponse.ok) {
            const errorData = await detectResponse.json().catch(() => ({}));
            throw new Error(errorData.error || '言語検知に失敗しました');
        }

        const data = await detectResponse.json();
        console.log('[Poly-Lang] Smart save detected:', data);

        // Step 2: Save the phrase
        const profile = await getUserProfile(session);
        if (!profile) {
            throw new Error('プロファイルが見つかりません');
        }

        await savePhrase(session, profile, data.target_text, data.translation);

        return {
            success: true,
            detected_language: data.detected_language,
            is_learning_language: data.is_learning_language,
            target_text: data.target_text,
            translation: data.translation,
            error: null,
        };
    } catch (error) {
        console.error('[Poly-Lang] Smart save error:', error);
        return { success: false, error: error.message || '保存に失敗しました' };
    }
}

// Handle translate request (using OpenAI via backend)
async function handleTranslate(message) {
    try {
        const session = await getSession();
        if (!session?.access_token) {
            return { translation: null, error: 'ログインが必要です' };
        }

        const response = await fetch(`${APP_URL}/api/extension/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ text: message.text }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || '翻訳に失敗しました');
        }

        const data = await response.json();
        return { translation: data.translation, error: null };
    } catch (error) {
        console.error('Translation error:', error);
        return { translation: null, error: error.message || '翻訳に失敗しました' };
    }
}

// Handle save phrase request
async function handleSavePhrase(message) {
    try {
        console.log('[Poly-Lang] Saving phrase:', message);

        const session = await getSession();
        console.log('[Poly-Lang] Session:', session ? 'found' : 'not found');

        if (!session) {
            throw new Error('ログインが必要です');
        }

        const profile = await getUserProfile(session);
        console.log('[Poly-Lang] Profile:', profile);

        if (!profile) {
            throw new Error('プロファイルが見つかりません');
        }

        await savePhrase(session, profile, message.targetText, message.translation);
        console.log('[Poly-Lang] Phrase saved successfully');

        return { success: true, error: null };
    } catch (error) {
        console.error('[Poly-Lang] Save error:', error);
        return { success: false, error: error.message };
    }
}

// Handle get user profile request
async function handleGetUserProfile() {
    try {
        const session = await getSession();
        if (!session) {
            return { profile: null, error: 'ログインが必要です' };
        }

        const profile = await getUserProfile(session);
        return { profile, error: null };
    } catch (error) {
        return { profile: null, error: error.message };
    }
}

// Get stored session
async function getSession() {
    const { supabase_session } = await chrome.storage.local.get(['supabase_session']);
    return supabase_session || null;
}

// Get user profile
async function getUserProfile(session) {
    if (!session?.user?.id) return null;

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`,
            },
        }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data[0] || null;
}

// Save phrase to database
async function savePhrase(session, profile, targetText, translation) {
    const userId = session.user.id;
    const languageCode = profile.learning_language || 'en';

    console.log('[Poly-Lang] Saving for user:', userId, 'lang:', languageCode);

    // Get or create "Chrome Extension" phrase set
    let phraseSetId;

    // Check for existing set - URL encode the name
    const setName = encodeURIComponent('Chrome Extension');
    const setsUrl = `${SUPABASE_URL}/rest/v1/phrase_sets?user_id=eq.${userId}&language_code=eq.${languageCode}&name=eq.${setName}&select=id`;
    console.log('[Poly-Lang] Checking sets URL:', setsUrl);

    const setsResponse = await fetch(setsUrl, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
        },
    });

    console.log('[Poly-Lang] Sets response status:', setsResponse.status);

    if (!setsResponse.ok) {
        const errorText = await setsResponse.text();
        console.error('[Poly-Lang] Sets fetch error:', errorText);
        throw new Error('フレーズセットの取得に失敗しました');
    }

    const existingSets = await setsResponse.json();
    console.log('[Poly-Lang] Existing sets:', existingSets);

    if (Array.isArray(existingSets) && existingSets.length > 0) {
        phraseSetId = existingSets[0].id;
        console.log('[Poly-Lang] Using existing set:', phraseSetId);
    } else {
        // Create new phrase set
        console.log('[Poly-Lang] Creating new phrase set...');
        const createResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/phrase_sets`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    user_id: userId,
                    language_code: languageCode,
                    name: 'Chrome Extension',
                    description: 'Chrome拡張機能から保存したフレーズ',
                    position: 0,
                }),
            }
        );

        console.log('[Poly-Lang] Create set response status:', createResponse.status);

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('[Poly-Lang] Create set error:', errorText);
            throw new Error('フレーズセットの作成に失敗しました');
        }

        const newSet = await createResponse.json();
        console.log('[Poly-Lang] New set created:', newSet);
        phraseSetId = newSet[0]?.id;

        if (!phraseSetId) {
            throw new Error('フレーズセットIDが取得できません');
        }
    }

    // Add phrase to set
    console.log('[Poly-Lang] Adding phrase to set:', phraseSetId);
    const addResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/phrase_set_items`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify({
                phrase_set_id: phraseSetId,
                target_text: targetText,
                translation: translation,
                position: 0,
            }),
        }
    );

    console.log('[Poly-Lang] Add phrase response status:', addResponse.status);

    if (!addResponse.ok) {
        const errorText = await addResponse.text();
        console.error('[Poly-Lang] Add phrase error:', errorText);
        throw new Error('フレーズの保存に失敗しました');
    }

    const savedPhrase = await addResponse.json();
    console.log('[Poly-Lang] Phrase saved:', savedPhrase);
}
