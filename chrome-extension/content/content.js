// Poly-Lang Chrome Extension - Content Script

(function() {
    'use strict';

    let popup = null;
    let selectedText = '';

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'showSaveDialog') {
            showSaveDialog(message.text);
        }
    });

    // Handle text selection - show quick save button
    document.addEventListener('mouseup', async (e) => {
        // Ignore clicks inside our popup
        if (popup && popup.contains(e.target)) return;

        const selection = window.getSelection().toString().trim();

        if (!selection || selection.length < 2) {
            hidePopup();
            return;
        }

        selectedText = selection;
        showQuickButton(e.clientX, e.clientY);
    });

    // Hide popup when clicking elsewhere
    document.addEventListener('mousedown', (e) => {
        if (popup && !popup.contains(e.target)) {
            hidePopup();
        }
    });

    // Show quick save button
    function showQuickButton(x, y) {
        hidePopup();

        popup = document.createElement('div');
        popup.className = 'poly-lang-popup poly-lang-button';
        popup.innerHTML = `
            <button class="poly-save-btn" title="Poly-Langに保存">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
            </button>
        `;

        positionPopup(popup, x, y);
        document.body.appendChild(popup);

        popup.querySelector('.poly-save-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showSaveDialog(selectedText, x, y);
        });
    }

    // Show save dialog
    async function showSaveDialog(text, x, y) {
        hidePopup();

        popup = document.createElement('div');
        popup.className = 'poly-lang-popup poly-lang-save-dialog';
        popup.innerHTML = `
            <div class="poly-header">
                <span class="poly-title">Poly-Langに保存</span>
                <button class="poly-close-btn" title="閉じる">×</button>
            </div>
            <div class="poly-content">
                <div class="poly-field">
                    <label class="poly-label">学習中の言語（原文）</label>
                    <textarea class="poly-input poly-target" rows="2" placeholder="学習したいフレーズ">${escapeHtml(text)}</textarea>
                </div>
                <div class="poly-field">
                    <label class="poly-label">母国語（翻訳・意味）<span class="poly-ai-badge">AI</span></label>
                    <div class="poly-translation-wrapper">
                        <textarea class="poly-input poly-translation" rows="2" placeholder="AIが翻訳中..."></textarea>
                        <div class="poly-loading-indicator">
                            <div class="poly-spinner-small"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="poly-actions">
                <button class="poly-btn poly-btn-cancel">キャンセル</button>
                <button class="poly-btn poly-btn-save" disabled>保存</button>
            </div>
        `;

        if (x && y) {
            positionPopup(popup, x, y);
        } else {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                positionPopup(popup, rect.left + rect.width / 2, rect.bottom);
            } else {
                popup.style.position = 'fixed';
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
            }
        }

        document.body.appendChild(popup);

        // Setup event listeners
        popup.querySelector('.poly-close-btn').addEventListener('click', hidePopup);
        popup.querySelector('.poly-btn-cancel').addEventListener('click', hidePopup);
        popup.querySelector('.poly-btn-save').addEventListener('click', () => handleSave());

        // Save on Ctrl+Enter
        popup.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSave();
            }
            if (e.key === 'Escape') {
                hidePopup();
            }
        });

        // Fetch AI translation
        await fetchTranslation(text);
    }

    // Fetch translation from AI
    async function fetchTranslation(text) {
        const translationInput = popup?.querySelector('.poly-translation');
        const loadingIndicator = popup?.querySelector('.poly-loading-indicator');
        const saveBtn = popup?.querySelector('.poly-btn-save');

        if (!translationInput) return;

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'translate',
                text: text,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            if (translationInput && popup) {
                translationInput.value = response.translation || '';
                translationInput.placeholder = '翻訳・意味';
            }
        } catch (error) {
            if (translationInput && popup) {
                translationInput.placeholder = '翻訳を入力してください';
            }
            // Don't show toast for translation errors, just let user type manually
            console.log('Translation error:', error.message);
        } finally {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            if (saveBtn) {
                saveBtn.disabled = false;
            }
            if (translationInput) {
                translationInput.focus();
            }
        }
    }

    // Handle save
    async function handleSave() {
        const targetText = popup?.querySelector('.poly-target')?.value.trim();
        const translation = popup?.querySelector('.poly-translation')?.value.trim();

        console.log('[Poly-Lang] handleSave called', { targetText, translation });

        if (!targetText) {
            showToast('原文を入力してください', true);
            return;
        }
        if (!translation) {
            showToast('翻訳を入力してください', true);
            return;
        }

        const saveBtn = popup?.querySelector('.poly-btn-save');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
        }

        try {
            console.log('[Poly-Lang] Sending savePhrase message...');
            const response = await chrome.runtime.sendMessage({
                action: 'savePhrase',
                targetText: targetText,
                translation: translation,
            });

            console.log('[Poly-Lang] savePhrase response:', response);

            if (!response) {
                throw new Error('応答がありません');
            }

            if (response.error) {
                throw new Error(response.error);
            }

            showToast('保存しました');
            hidePopup();
        } catch (error) {
            console.error('[Poly-Lang] Save error:', error);
            showToast(error.message || '保存に失敗しました', true);
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '保存';
            }
        }
    }

    // Position popup near cursor/selection
    function positionPopup(element, x, y) {
        document.body.appendChild(element);

        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = x - rect.width / 2;
        let top = y + 10;

        if (left < 10) left = 10;
        if (left + rect.width > viewportWidth - 10) {
            left = viewportWidth - rect.width - 10;
        }
        if (top + rect.height > viewportHeight - 10) {
            top = y - rect.height - 10;
        }

        element.style.left = `${left + window.scrollX}px`;
        element.style.top = `${top + window.scrollY}px`;
    }

    // Hide popup
    function hidePopup() {
        if (popup) {
            popup.remove();
            popup = null;
        }
    }

    // Show toast notification
    function showToast(message, isError = false) {
        const existing = document.querySelector('.poly-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `poly-toast ${isError ? 'poly-toast-error' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('poly-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Escape HTML
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
