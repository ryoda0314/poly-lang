"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Loader2, Trash2, Minimize2, Check, CheckCheck, Copy, Bookmark } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { SaveToCollectionModal } from "@/components/SaveToCollectionModal";
import { useCollectionsStore } from "@/store/collections-store";
import styles from "./page.module.css";
import clsx from "clsx";

type DesignVariant = 'A' | 'B' | 'D' | 'G' | 'I' | 'J';

export default function ChatPage() {
    const {
        messages,
        addMessage,
        updateMessage,
        clearMessages,
        settings,
        addCorrection,
        isStreaming,
        setIsStreaming,
        compactedContext,
        setCompactedContext,
        setSidebarTab,
        assistMode,
        suggestions,
        setSuggestions,
        immersionMode,
    } = useChatStore();

    const { user, nativeLanguage, activeLanguageCode } = useAppStore();
    const { savePhraseToCollection } = useCollectionsStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [input, setInput] = useState('');
    const [design, setDesign] = useState<DesignVariant>('A');
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        message: typeof messages[0] | null;
    }>({ visible: false, x: 0, y: 0, message: null });
    const [toast, setToast] = useState<string | null>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [pendingSaveText, setPendingSaveText] = useState('');
    const [pendingTranslation, setPendingTranslation] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

    // Select design based on immersion mode
    useEffect(() => {
        if (!immersionMode) {
            setDesign('G'); // Default: Glass
            return;
        }
        // Immersion mode: select design based on learning language
        const languageToDesign: Record<string, DesignVariant> = {
            ja: 'I',  // LINE (Japan)
            ko: 'J',  // KakaoTalk (Korea)
            en: 'B',  // iMessage (English-speaking)
            zh: 'D',  // WeChat-like (China) - using WhatsApp style
            fr: 'B',  // iMessage
            es: 'D',  // WhatsApp (popular in Spanish-speaking countries)
            de: 'D',  // WhatsApp (popular in Germany)
            ru: 'D',  // WhatsApp/Telegram style
            vi: 'D',  // WhatsApp style
        };
        setDesign(languageToDesign[activeLanguageCode] || 'G');
    }, [immersionMode, activeLanguageCode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = async () => {
        if (!input.trim() || isStreaming) return;

        const userContent = input.trim();
        setInput('');
        setIsStreaming(true);
        setSuggestions([]);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        addMessage({ role: 'user', content: userContent });
        const assistantId = addMessage({ role: 'assistant', content: '' });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userContent }],
                    settings,
                    learningLanguage: activeLanguageCode,
                    nativeLanguage,
                    compactedContext,
                    assistMode,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Chat failed');
            }

            const data = await response.json();
            updateMessage(assistantId, data.reply || '');

            if (data.correction?.hasError) {
                addCorrection({
                    messageId: assistantId,
                    original: data.correction.original,
                    corrected: data.correction.corrected,
                    explanation: data.correction.explanation,
                });
                setSidebarTab('corrections');
            }

            if (assistMode && data.suggestions && Array.isArray(data.suggestions)) {
                setSuggestions(data.suggestions);
            }

        } catch (error) {
            console.error('Chat error:', error);
            updateMessage(assistantId, getLabel('chatError', 'エラーが発生しました。もう一度お試しください。'));
        } finally {
            setIsStreaming(false);
        }
    };

    const handleCompact = async () => {
        if (messages.length < 10) return;

        try {
            const response = await fetch('/api/chat', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.slice(0, -5),
                    nativeLanguage,
                }),
            });

            if (response.ok) {
                const { summary } = await response.json();
                setCompactedContext(summary);
            }
        } catch (error) {
            console.error('Compact error:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        setSuggestions([]);
        textareaRef.current?.focus();
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    }, []);

    const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent, msg: typeof messages[0]) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        longPressTimer.current = setTimeout(() => {
            // Adjust menu position to stay within viewport
            const menuWidth = 160;
            const menuHeight = 100;
            let x = clientX;
            let y = clientY;

            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 16;
            }
            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 16;
            }

            setContextMenu({ visible: true, x, y, message: msg });
        }, 500);
    }, []);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleCopy = useCallback(async () => {
        if (contextMenu.message?.content) {
            try {
                await navigator.clipboard.writeText(contextMenu.message.content);
                showToast(getLabel('copied', 'コピーしました'));
            } catch {
                showToast(getLabel('copyFailed', 'コピーに失敗しました'));
            }
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, [contextMenu.message, showToast, getLabel]);

    const handleSave = useCallback(async () => {
        if (contextMenu.message?.content) {
            const text = contextMenu.message.content;
            setPendingSaveText(text);
            setContextMenu(prev => ({ ...prev, visible: false }));
            setIsTranslating(true);

            try {
                const res = await fetch('/api/chat', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        targetLanguage: nativeLanguage,
                        sourceLanguage: activeLanguageCode,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendingTranslation(data.translation || '');
                }
            } catch (e) {
                console.error('Translation failed:', e);
            } finally {
                setIsTranslating(false);
                setSaveModalOpen(true);
            }
        } else {
            setContextMenu(prev => ({ ...prev, visible: false }));
        }
    }, [contextMenu.message, nativeLanguage, activeLanguageCode]);

    const handleConfirmSave = useCallback(async (collectionId: string | null) => {
        if (!user || !activeLanguageCode || !pendingSaveText) return;
        try {
            await savePhraseToCollection(
                user.id,
                activeLanguageCode,
                pendingSaveText,
                pendingTranslation,
                collectionId
            );
            setSaveModalOpen(false);
            setPendingSaveText('');
            setPendingTranslation('');
            showToast(getLabel('saved', '保存しました'));
        } catch (e) {
            console.error("Save failed", e);
            showToast(getLabel('saveFailed', '保存に失敗しました'));
        }
    }, [user, activeLanguageCode, pendingSaveText, pendingTranslation, savePhraseToCollection, showToast, getLabel]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    // Long press event handlers for messages
    const messageHandlers = (msg: typeof messages[0]) => ({
        onTouchStart: (e: React.TouchEvent) => handleLongPressStart(e, msg),
        onTouchEnd: handleLongPressEnd,
        onTouchMove: handleLongPressEnd,
        onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            handleLongPressStart(e, msg);
        },
    });

    // Render message based on design variant
    const renderMessage = (msg: typeof messages[0]) => {
        const content = msg.content || (isStreaming && msg.role === 'assistant' && (
            <span className={styles.cursor}>...</span>
        ));

        const handlers = messageHandlers(msg);

        switch (design) {
            case 'A':
                return (
                    <div key={msg.id} className={clsx(styles.messageA, styles[`${msg.role}A`])} {...handlers}>
                        <div className={styles.messageContentA}>{content}</div>
                    </div>
                );

            case 'B':
                return (
                    <div key={msg.id} className={clsx(styles.messageB, styles[`${msg.role}B`])} {...handlers}>
                        <div className={styles.messageContentB}>{content}</div>
                    </div>
                );

            case 'D':
                return (
                    <div key={msg.id} className={clsx(styles.messageD, styles[`${msg.role}D`])} {...handlers}>
                        <div className={styles.messageContentD}>
                            {content}
                            <div className={styles.messageMetaD}>
                                <span className={styles.messageTimeD}>{formatTime(msg.timestamp)}</span>
                                {msg.role === 'user' && <CheckCheck size={14} color="rgba(0,0,0,0.45)" />}
                            </div>
                        </div>
                    </div>
                );

            case 'G':
                return (
                    <div key={msg.id} className={clsx(styles.messageG, styles[`${msg.role}G`])} {...handlers}>
                        <div className={styles.messageContentG}>{content}</div>
                    </div>
                );

            case 'I':
                return (
                    <div key={msg.id} className={clsx(styles.messageI, styles[`${msg.role}I`])} {...handlers}>
                        <div className={styles.avatarI}>AI</div>
                        <div className={styles.messageMetaI}>
                            {msg.role === 'user' && <span className={styles.readI}>既読</span>}
                            <span className={styles.messageTimeI}>{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className={styles.messageContentI}>{content}</div>
                    </div>
                );

            case 'J':
                return (
                    <div key={msg.id} className={clsx(styles.messageJ, styles[`${msg.role}J`])} {...handlers}>
                        <div className={styles.avatarJ}>🤖</div>
                        <div className={styles.messageBodyJ}>
                            <span className={styles.messageNameJ}>Assistant</span>
                            <div className={styles.messageRowJ}>
                                <div className={styles.messageContentJ}>{content}</div>
                                <span className={styles.messageTimeJ}>{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const getMessagesContainerClass = () => {
        switch (design) {
            case 'D': return clsx(styles.messagesContainer, styles.messagesContainerD);
            case 'G': return clsx(styles.messagesContainer, styles.messagesContainerG);
            case 'I': return clsx(styles.messagesContainer, styles.messagesContainerI);
            case 'J': return clsx(styles.messagesContainer, styles.messagesContainerJ);
            default: return styles.messagesContainer;
        }
    };

    const getInputContainerClass = () => {
        switch (design) {
            case 'B': return clsx(styles.inputContainer, styles.inputContainerB);
            case 'D': return clsx(styles.inputContainer, styles.inputContainerD);
            case 'G': return clsx(styles.inputContainer, styles.inputContainerG);
            case 'I': return clsx(styles.inputContainer, styles.inputContainerI);
            case 'J': return clsx(styles.inputContainer, styles.inputContainerJ);
            default: return styles.inputContainer;
        }
    };

    const getInputClass = () => {
        switch (design) {
            case 'B': return clsx(styles.input, styles.inputB);
            case 'D': return clsx(styles.input, styles.inputD);
            case 'G': return clsx(styles.input, styles.inputG);
            case 'I': return clsx(styles.input, styles.inputI);
            case 'J': return clsx(styles.input, styles.inputJ);
            default: return styles.input;
        }
    };

    const getSendButtonClass = () => {
        switch (design) {
            case 'B': return clsx(styles.sendButton, styles.sendButtonB);
            case 'D': return clsx(styles.sendButton, styles.sendButtonD);
            case 'G': return clsx(styles.sendButton, styles.sendButtonG);
            case 'I': return clsx(styles.sendButton, styles.sendButtonI);
            case 'J': return clsx(styles.sendButton, styles.sendButtonJ);
            default: return styles.sendButton;
        }
    };

    return (
        <ChatLayout sidebar={<ChatSidebar />}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>{getLabel('chat', 'チャット')}</h1>
                    <div className={styles.headerActions}>
                        {messages.length >= 10 && (
                            <button
                                className={styles.headerBtn}
                                onClick={handleCompact}
                                title={getLabel('chatCompact', '会話を要約')}
                            >
                                <Minimize2 size={18} />
                            </button>
                        )}
                        {messages.length > 0 && (
                            <button
                                className={styles.headerBtn}
                                onClick={clearMessages}
                                title={getLabel('chatClear', 'クリア')}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Compacted Context Banner */}
                {compactedContext && (
                    <div className={styles.compactBanner}>
                        <Minimize2 size={14} />
                        <span>{getLabel('chatCompacted', '過去の会話は要約されました')}</span>
                    </div>
                )}

                {/* Messages */}
                <div className={getMessagesContainerClass()}>
                    {messages.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>{getLabel('chatEmptyState', '会話を始めましょう...')}</p>
                            <p className={styles.emptyHint}>
                                {getLabel('chatLearningHint', '学習中の言語で話しかけてみてください。間違いがあれば添削します。')}
                            </p>
                        </div>
                    )}

                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {assistMode && suggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                className={styles.suggestionBtn}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className={getInputContainerClass()}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getLabel('chatPlaceholder', 'メッセージを入力...')}
                        className={getInputClass()}
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isStreaming}
                        className={getSendButtonClass()}
                        aria-label="Send"
                    >
                        {isStreaming ? (
                            <Loader2 size={20} className={styles.spin} />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>

                {/* Context Menu */}
                {contextMenu.visible && (
                    <>
                        <div className={styles.contextMenuOverlay} onClick={closeContextMenu} />
                        <div
                            className={styles.contextMenu}
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <button className={styles.contextMenuItem} onClick={handleCopy}>
                                <Copy size={18} className={styles.contextMenuIcon} />
                                {getLabel('copy', 'コピー')}
                            </button>
                            <div className={styles.contextMenuDivider} />
                            <button className={styles.contextMenuItem} onClick={handleSave}>
                                <Bookmark size={18} className={styles.contextMenuIcon} />
                                {getLabel('save', '保存')}
                            </button>
                        </div>
                    </>
                )}

                {/* Toast */}
                {toast && <div className={styles.toast}>{toast}</div>}
                {isTranslating && <div className={styles.toast}>{getLabel('translating', '翻訳中...')}</div>}

                {/* Save to Collection Modal */}
                <SaveToCollectionModal
                    isOpen={saveModalOpen}
                    onClose={() => {
                        setSaveModalOpen(false);
                        setPendingSaveText('');
                        setPendingTranslation('');
                    }}
                    onSave={handleConfirmSave}
                    text={pendingSaveText}
                    translation={pendingTranslation}
                />
            </div>
        </ChatLayout>
    );
}
