"use client";

import React, { useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Minimize2 } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import styles from "./page.module.css";

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
    } = useChatStore();

    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [input, setInput] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

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

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Add user message
        addMessage({ role: 'user', content: userContent });

        // Add placeholder for assistant
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
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Chat failed');
            }

            const data = await response.json();

            // Update assistant message with reply
            updateMessage(assistantId, data.reply || '');

            // Handle correction if present
            if (data.correction?.hasError) {
                addCorrection({
                    messageId: assistantId,
                    original: data.correction.original,
                    corrected: data.correction.corrected,
                    explanation: data.correction.explanation,
                });
                // Switch to corrections tab to show the new correction
                setSidebarTab('corrections');
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
                    messages: messages.slice(0, -5), // Keep last 5, compact the rest
                    nativeLanguage,
                }),
            });

            if (response.ok) {
                const { summary } = await response.json();
                setCompactedContext(summary);
                // Clear all but last 5 messages - this is handled in UI display
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
                <div className={styles.messagesContainer}>
                    {messages.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>{getLabel('chatEmptyState', '会話を始めましょう...')}</p>
                            <p className={styles.emptyHint}>
                                {getLabel('chatLearningHint', '学習中の言語で話しかけてみてください。間違いがあれば添削します。')}
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${styles[msg.role]}`}
                        >
                            <div className={styles.messageContent}>
                                {msg.content || (isStreaming && msg.role === 'assistant' && (
                                    <span className={styles.cursor}>...</span>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={styles.inputContainer}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getLabel('chatPlaceholder', 'メッセージを入力...')}
                        className={styles.input}
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isStreaming}
                        className={styles.sendButton}
                        aria-label="Send"
                    >
                        {isStreaming ? (
                            <Loader2 size={20} className={styles.spin} />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </ChatLayout>
    );
}
