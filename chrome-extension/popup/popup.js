// Poly-Lang Chrome Extension - Popup Script (Save Only)

let currentUser = null;
let userProfile = null;

// DOM Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await supabase.init();
    await checkAuthState();
    setupEventListeners();
});

// Check authentication state
async function checkAuthState() {
    showLoading(true);

    const user = supabase.getUser();

    if (user) {
        currentUser = user;
        await loadUserProfile();
        showMainView();
    } else {
        showLoginView();
    }

    showLoading(false);
}

// Load user profile from database
async function loadUserProfile() {
    if (!currentUser) return;

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (data) {
        userProfile = data;
        updateUserDisplay();
        await loadRecentPhrases();
    }
}

// Update user display in UI
function updateUserDisplay() {
    if (!userProfile) return;

    const initial = (userProfile.username || currentUser.email || 'U')[0].toUpperCase();
    document.getElementById('userInitial').textContent = initial;
    document.getElementById('userName').textContent = userProfile.username || currentUser.email?.split('@')[0] || 'User';

    const nativeLang = getLanguageName(userProfile.native_language || 'ja');
    const learningLang = getLanguageName(userProfile.learning_language || 'en');
    document.getElementById('userLang').textContent = `${nativeLang} → ${learningLang}`;

    // Update settings
    document.getElementById('nativeLang').value = userProfile.native_language || 'ja';
    document.getElementById('learningLang').value = userProfile.learning_language || 'en';
}

// Load recent phrases
async function loadRecentPhrases() {
    if (!currentUser || !userProfile) return;

    const phrasesContainer = document.getElementById('recentPhrases');

    // Get user's phrase sets
    const { data: phraseSets } = await supabase
        .from('phrase_sets')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('language_code', userProfile.learning_language || 'en');

    if (!phraseSets || phraseSets.length === 0) {
        phrasesContainer.innerHTML = '<p class="empty-state">保存したフレーズはありません</p>';
        return;
    }

    const setIds = phraseSets.map(s => s.id);

    // Get recent phrases from those sets
    const { data: phrases } = await supabase
        .from('phrase_set_items')
        .select('*')
        .in('phrase_set_id', setIds)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!phrases || phrases.length === 0) {
        phrasesContainer.innerHTML = '<p class="empty-state">保存したフレーズはありません</p>';
        return;
    }

    phrasesContainer.innerHTML = phrases.map(phrase => `
        <div class="phrase-item">
            <div class="target">${escapeHtml(phrase.target_text)}</div>
            <div class="translation">${escapeHtml(phrase.translation)}</div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Settings navigation
    document.getElementById('settingsBtn').addEventListener('click', () => showSettingsView());
    document.getElementById('backBtn').addEventListener('click', () => showMainView());

    // Save phrase
    document.getElementById('saveBtn').addEventListener('click', handleSavePhrase);

    // Ctrl+Enter to save
    document.getElementById('translationText').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSavePhrase();
        }
    });

    // Settings changes
    document.getElementById('nativeLang').addEventListener('change', handleSettingsChange);
    document.getElementById('learningLang').addEventListener('change', handleSettingsChange);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    showLoading(true);

    const { data, error } = await supabase.signInWithPassword(email, password);

    if (error) {
        showToast(error.message || 'ログインに失敗しました', 'error');
        showLoading(false);
        return;
    }

    currentUser = data.user;
    await loadUserProfile();
    showMainView();
    showToast('ログインしました', 'success');
    showLoading(false);
}

// Handle logout
async function handleLogout() {
    showLoading(true);

    await supabase.signOut();
    currentUser = null;
    userProfile = null;

    showLoginView();
    showToast('ログアウトしました', 'success');
    showLoading(false);
}

// Handle save phrase
async function handleSavePhrase() {
    if (!currentUser || !userProfile) {
        showToast('ログインが必要です', 'error');
        return;
    }

    const targetText = document.getElementById('targetText').value.trim();
    const translation = document.getElementById('translationText').value.trim();

    if (!targetText) {
        showToast('原文を入力してください', 'error');
        return;
    }
    if (!translation) {
        showToast('翻訳を入力してください', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'savePhrase',
            targetText: targetText,
            translation: translation,
        });

        if (response.error) {
            throw new Error(response.error);
        }

        showToast('保存しました', 'success');

        // Clear inputs
        document.getElementById('targetText').value = '';
        document.getElementById('translationText').value = '';

        await loadRecentPhrases();

    } catch (error) {
        showToast(error.message || '保存に失敗しました', 'error');
    }

    showLoading(false);
}

// Handle settings change (synced to DB)
async function handleSettingsChange(e) {
    if (!currentUser) return;

    const field = e.target.id === 'nativeLang' ? 'native_language' : 'learning_language';
    const value = e.target.value;

    showLoading(true);

    const { error } = await supabase
        .from('profiles')
        .eq('id', currentUser.id)
        .update({ [field]: value });

    if (error) {
        showToast('設定の保存に失敗しました', 'error');
    } else {
        userProfile[field] = value;
        updateUserDisplay();
        showToast('設定を保存しました', 'success');
    }

    showLoading(false);
}

// View management
function showLoginView() {
    loginView.classList.remove('hidden');
    mainView.classList.add('hidden');
    settingsView.classList.add('hidden');
}

function showMainView() {
    loginView.classList.add('hidden');
    mainView.classList.remove('hidden');
    settingsView.classList.add('hidden');
}

function showSettingsView() {
    loginView.classList.add('hidden');
    mainView.classList.add('hidden');
    settingsView.classList.remove('hidden');
}

// Utility functions
function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function getLanguageName(code) {
    const names = {
        ja: '日本語',
        en: 'English',
        ko: '한국어',
        zh: '中文',
        fr: 'Français',
        es: 'Español',
        de: 'Deutsch',
        ru: 'Русский',
        vi: 'Tiếng Việt',
    };
    return names[code] || code;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
