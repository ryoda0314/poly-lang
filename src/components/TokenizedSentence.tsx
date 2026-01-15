"use client";

import React, { useMemo } from "react";
import { useExplorer } from "@/hooks/use-explorer";
import { useAppStore } from "@/store/app-context";
import styles from "./TokenizedSentence.module.css";
import { useAwarenessStore } from "@/store/awareness-store";
import { pinyin } from "pinyin-pro";
import { useLongPress } from "@/hooks/use-long-press";

interface Props {
    text: string;
    tokens?: string[];
    direction?: "ltr" | "rtl";
    phraseId: string;
}

// Sub-component for individual tokens to enable Hooks usage
const TokenButton = ({
    text,
    index,
    isSelected,
    isStart,
    isEnd,
    isMulti,
    confidenceClass,
    shouldShowPinyin,
    tokenPinyin,
    displayText,
    onTokenClick,
    onTokenLongPress,
    onTokenDragStart
}: any) => {
    const bind = useLongPress({
        onLongPress: (e) => onTokenLongPress(text, index, e),
        onClick: (e) => onTokenClick(text, index, e)
    });

    return (
        <button
            {...bind}
            data-token-index={index}
            draggable={true}
            onDragStart={(e) => {
                // Manually trigger drag start logic
                // Note: useLongPress might capture mouseDown, but standard HTML5 drag usually overrides if draggable=true and moved.
                // We need to ensure dataTransfer is set.
                // Call parent handler
                if (onTokenDragStart) onTokenDragStart(text, index, e);
            }}
            className={`${styles.tokenBtn} ${confidenceClass ?? ""} ${isSelected ? (isMulti ? styles.selected : styles.selectedSingle) : ""} ${isStart ? styles.selectedStart : ""} ${isEnd ? styles.selectedEnd : ""}`.trim()}
            style={{
                cursor: "grab",
                display: shouldShowPinyin ? "inline-flex" : undefined,
                flexDirection: shouldShowPinyin ? "column" : undefined,
                alignItems: shouldShowPinyin ? "center" : undefined,
                position: shouldShowPinyin ? "relative" : undefined,
            }}
        >
            {tokenPinyin && (
                <span
                    style={{
                        fontSize: "0.75em",
                        color: "var(--color-accent, #7c3aed)",
                        fontWeight: 500,
                        lineHeight: 1,
                        marginBottom: "2px",
                        whiteSpace: "nowrap",
                    }}
                >
                    {tokenPinyin}
                </span>
            )}
            <span>{displayText}</span>
        </button>
    );
};

const CONFIDENCE_CLASS_MAP = {
    high: styles.confidenceHigh,
    medium: styles.confidenceMedium,
    low: styles.confidenceLow,
};

export default function TokenizedSentence({ text, tokens: providedTokens, direction, phraseId }: Props) {
    const { openExplorer } = useExplorer();
    const { activeLanguageCode, user, showPinyin } = useAppStore();
    const { memos, selectToken, memosByText, isMemoMode, addMemo, selectedToken, clearSelection } = useAwarenessStore();
    const { profile } = useAppStore();
    const isRtl = direction ? direction === "rtl" : activeLanguageCode === "ar";
    const isChinese = activeLanguageCode === "zh";
    const isKorean = activeLanguageCode === "ko";
    const isCharMode = isChinese || isKorean;

    // Track user inputs for placeholders (e.g. "____")
    // Key: token index (or unique ID), Value: user typed string
    const [customInputs, setCustomInputs] = React.useState<Record<number, string>>({});
    const selectionInteractionRef = React.useRef(false);

    // Mobile touch selection state
    const [isTouchSelecting, setIsTouchSelecting] = React.useState(false);
    const touchStartIndexRef = React.useRef<number | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Listener to clear multi-selection when Shift is released, BUT ONLY IF no interaction happened during the press.
    // This allows "Tap Shift to Clear" behavior, while allowing "Shift+Click -> Release -> Keep Selection" behavior.
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift" && !e.repeat) {
                selectionInteractionRef.current = false;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                // If the user clicked something while Shift was held, we assume they wanted to make a selection.
                // In that case, we DO NOT clear it when they release Shift.
                if (selectionInteractionRef.current) {
                    return;
                }

                // If they did NOT click anything (just pressed Shift and released), treat it as a "Cancel" token.
                // Clear multi-selection if exists.
                if (selectedToken && selectedToken.phraseId === phraseId && selectedToken.startIndex !== selectedToken.endIndex) {
                    clearSelection();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [selectedToken, phraseId, clearSelection]);

    // Reconstruction logic: if providedTokens, map them to text to find gaps
    let items: { text: string; isToken: boolean; tokenIndex: number }[] = [];

    // Prioritize provided tokens if they exist AND they match the text (e.g. from LangPack)
    // Validate that tokens join back to text to avoid display issues with malformed GPT responses
    const tokensValid = providedTokens && providedTokens.length > 0 && providedTokens.join('') === text;

    if (tokensValid) {
        let cursor = 0;
        let tokenCount = 0;
        providedTokens!.forEach((token, idx) => {
            const index = text.indexOf(token, cursor);
            if (index !== -1) {
                // Gap
                if (index > cursor) {
                    items.push({ text: text.slice(cursor, index), isToken: false, tokenIndex: -1 });
                }
                // Token
                items.push({ text: token, isToken: true, tokenIndex: idx });
                cursor = index + token.length;
                tokenCount++;
            }
        });
        // Trailing text
        if (cursor < text.length) {
            items.push({ text: text.slice(cursor), isToken: false, tokenIndex: -1 });
        }
    } else if (isCharMode) {
        // Character-based tokenization for Chinese/Korean when no tokens are provided
        let currentIndex = 0;
        const parts = text.split(/(_+)/);
        parts.forEach(part => {
            if (!part) return;
            if (part.startsWith('_')) {
                // Placeholder token
                items.push({ text: part, isToken: true, tokenIndex: currentIndex });
                currentIndex += part.length;
            } else {
                // Split into individual characters
                const chars = part.split("");
                chars.forEach(char => {
                    items.push({ text: char, isToken: true, tokenIndex: currentIndex });
                    currentIndex++;
                });
            }
        });
    } else {
        const fallbackSegments = () =>
            text
                .split(/([ \t\n\r,.!?;:"'']+)/)
                .filter(Boolean)
                .map((segment, idx) => ({
                    text: segment,
                    isToken: !/^[ \t\n\r,.!?;:"'']+$/.test(segment),
                    tokenIndex: idx // Fallback index logic (just sequential)
                }));

        const intlSegments = () => {
            if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return null;
            try {
                const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
                const segmented = Array.from(segmenter.segment(text))
                    .filter(part => part.segment.length > 0)
                    .map((part, idx) => ({
                        text: part.segment,
                        isToken: Boolean(part.isWordLike),
                        tokenIndex: idx // Fallback index logic
                    }));
                return segmented.length ? segmented : null;
            } catch {
                return null;
            }
        };

        items = intlSegments() ?? fallbackSegments();
    }

    const isWord = (t: string) => {
        // For Chinese, almost everything is a "word" except pure punctuation if we want to be strict,
        // but let's keep the regex check to filter out obviously non-word chars (like spaces).
        // Actually for Chinese char mode, we might want to allow even punctuation to be selectable if needed,
        // but usually we don't memo punctuation.
        // Let's rely on standard check for now.
        return !/^[ \t\n\r,.!?;:"'']+$/.test(t);
    };

    // Unified Range Logic (used by Shift+Click and Long Press)
    const handleRangeSelection = (token: string, index: number) => {
        selectionInteractionRef.current = true;
        let start = index;
        let end = index;

        // If we have an existing selection in this phrase, extend it
        if (selectedToken && selectedToken.phraseId === phraseId) {
            start = Math.min(selectedToken.startIndex, index);
            end = Math.max(selectedToken.startIndex, index); // Use existing start as anchor?
            // Actually, typical Shift-Select keeps the *anchor* and moves the *focus*.
            // In our simple store, we track start/end. We don't implicitly know which side was the anchor without more state.
            // Assumption: anchor is selectedToken.startIndex (or we can just keep min/max of current range + new point)

            // To allow extending EITHER WAY from the *current* selection range:
            // If new index < start -> new range is [new, end] (keeps old end?) or [new, start_anchor]?
            // Simple logic: Extend the bounding box to include new index.
            start = Math.min(selectedToken.startIndex, index);
            end = Math.max(selectedToken.endIndex, index);
        }

        // Re-construct text
        const startItemIdx = items.findIndex(item => item.tokenIndex === start);
        const endItemIdx = items.findIndex(item => item.tokenIndex === end);

        let combinedText = "";
        if (startItemIdx !== -1 && endItemIdx !== -1) {
            const rangeItems = items.slice(startItemIdx, endItemIdx + 1);
            combinedText = rangeItems.map(i => i.text).join("");
        } else {
            const selectedItems = items.filter(item => item.tokenIndex !== -1 && item.tokenIndex >= start && item.tokenIndex <= end);
            combinedText = selectedItems.map(i => i.text).join("");
        }
        if (!combinedText) combinedText = token;

        // Force isRangeSelection = true for Long Press / Shift
        selectToken(phraseId, start, end, combinedText, 'dictionary', true);
    };

    // Mobile: Start touch selection mode on long press
    const handleTouchSelectionStart = (token: string, index: number, e?: React.TouchEvent | React.MouseEvent) => {
        setIsTouchSelecting(true);
        touchStartIndexRef.current = index;
        // Store initial touch position for direction detection
        if (e && 'touches' in e) {
            touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        // Initial selection of single token
        selectToken(phraseId, index, index, token, 'dictionary', true);
    };

    // Track touch start position for direction detection
    const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
    const [gestureMode, setGestureMode] = React.useState<'none' | 'select' | 'drag'>('none');

    // Mobile: Handle touch move - detect direction and act accordingly
    const handleContainerTouchMove = (e: React.TouchEvent) => {
        if (!isTouchSelecting || touchStartIndexRef.current === null) return;

        const touch = e.touches[0];
        const startPos = touchStartPosRef.current;

        // Detect direction if not yet determined
        if (gestureMode === 'none' && startPos) {
            const dx = touch.clientX - startPos.x;
            const dy = touch.clientY - startPos.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            // Only determine mode after moving at least 15px
            if (absDx > 15 || absDy > 15) {
                if (absDx > absDy) {
                    // Horizontal movement → Multi-select mode
                    setGestureMode('select');
                } else if (dy < -15) {
                    // Upward movement → Drag mode
                    setGestureMode('drag');
                    // Trigger simulated drag start (for visual feedback)
                    // Note: We can't actually start HTML5 drag from touchmove, 
                    // so we'll handle this specially
                }
            }
        }

        // Handle based on detected mode
        if (gestureMode === 'select') {
            const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;

            if (element) {
                const tokenIndexStr = element.getAttribute('data-token-index') || element.closest('[data-token-index]')?.getAttribute('data-token-index');
                if (tokenIndexStr) {
                    const currentIndex = parseInt(tokenIndexStr, 10);
                    if (!isNaN(currentIndex)) {
                        const startIdx = touchStartIndexRef.current;
                        const start = Math.min(startIdx, currentIndex);
                        const end = Math.max(startIdx, currentIndex);

                        const startItemIdx = items.findIndex(item => item.tokenIndex === start);
                        const endItemIdx = items.findIndex(item => item.tokenIndex === end);
                        let combinedText = "";
                        if (startItemIdx !== -1 && endItemIdx !== -1) {
                            combinedText = items.slice(startItemIdx, endItemIdx + 1).map(i => i.text).join("");
                        }

                        selectToken(phraseId, start, end, combinedText || "", 'dictionary', true);
                    }
                }
            }
        }
        // For drag mode, we show visual feedback but actual drop happens on touchend
    };

    // Mobile: End touch selection
    const handleContainerTouchEnd = (e: React.TouchEvent) => {
        if (isTouchSelecting) {
            // If in drag mode, simulate drop at current position
            if (gestureMode === 'drag' && selectedToken && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;

                // Check if drop target is a drop zone
                const dropZone = dropTarget?.closest('[data-drop-zone]');
                if (dropZone) {
                    // Dispatch custom event for drop zone to handle
                    const dropEvent = new CustomEvent('touch-drop', {
                        detail: {
                            text: selectedToken.text,
                            phraseId: selectedToken.phraseId,
                            startIndex: selectedToken.startIndex,
                            endIndex: selectedToken.endIndex
                        },
                        bubbles: true
                    });
                    dropZone.dispatchEvent(dropEvent);
                }
            }

            setIsTouchSelecting(false);
            setGestureMode('none');
            touchStartIndexRef.current = null;
            touchStartPosRef.current = null;
        }
    };

    const handleTokenClick = async (token: string, index: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();

        // 1. Shift + Click (Desktop)
        if ('shiftKey' in e && e.shiftKey) {
            handleRangeSelection(token, index);
            return;
        }

        // 2. Normal Click
        const isInsideCurrentSelection = selectedToken
            && selectedToken.phraseId === phraseId
            && index >= selectedToken.startIndex
            && index <= selectedToken.endIndex
            && (selectedToken.endIndex > selectedToken.startIndex);

        if (isInsideCurrentSelection && selectedToken) {
            openExplorer(selectedToken.text);
        } else {
            // New Single Selection (Reset)
            selectToken(phraseId, index, index, token, 'dictionary', false);
            openExplorer(token);
        }
    };

    const handleDragStart = (token: string, index: number, e: React.DragEvent) => {
        // e.stopPropagation(); // Don't stop propagation, DnD needs it?
        e.dataTransfer.effectAllowed = "copy";

        // If dragging a token that is part of the current selection, drag the whole selection text
        let textToDrag = token;
        const isMultiDrag = selectedToken && selectedToken.phraseId === phraseId &&
            index >= selectedToken.startIndex && index <= selectedToken.endIndex;

        if (isMultiDrag) {
            textToDrag = selectedToken.text;
        }

        e.dataTransfer.setData("application/json", JSON.stringify({
            text: textToDrag,
            phraseId,
            index
        }));

        // Custom Drag Image for Multi-Select
        if (isMultiDrag && textToDrag.length > token.length) {
            const target = e.currentTarget as HTMLElement;
            const clone = target.cloneNode(true) as HTMLElement;

            // Update text content to show full selection
            clone.innerText = textToDrag;

            clone.style.position = "absolute";
            clone.style.top = "-1000px";
            clone.style.left = "-1000px";
            clone.style.width = "auto";
            clone.style.height = "auto";

            // Force full border to ensure frame is visible even if original token has merged borders
            clone.style.border = "2px solid var(--color-accent, #7c3aed)";
            clone.style.borderRadius = "6px";
            clone.style.zIndex = "9999";
            clone.style.backgroundColor = "var(--color-surface, #fff)"; // Ensure background opaque

            // Append to parent to preserve CSS module scope
            if (target.parentNode) {
                target.parentNode.appendChild(clone);
                e.dataTransfer.setDragImage(clone, 0, 0);

                setTimeout(() => {
                    clone.remove();
                }, 0);
            }
        }
    };

    // Abstract the long press binding per token
    // We need to call hook inside loop? No, hooks must be top level.
    // Solution: Create a sub-component 'TokenButton' or just define the hook handlers inline if possible?
    // Hooks cannot be called in map.
    // We must extract a 'TokenButton' component.


    const containerClass = isRtl ? `${styles.container} ${styles.rtl}` : styles.container;
    const shouldShowPinyin = isChinese && showPinyin;

    // Generate pinyin at SENTENCE level for accurate pronunciation, then map to each character position
    const sentencePinyinMap = useMemo(() => {
        if (!shouldShowPinyin) return new Map<number, string>();

        // Get pinyin for entire sentence - this handles context-dependent pronunciation
        const pinyinArray = pinyin(text, {
            toneType: "symbol",
            type: "array"
        });

        // Create a map from character position in original text to its pinyin
        const result = new Map<number, string>();
        const chars = text.split("");
        chars.forEach((char, index) => {
            if (/[\u4e00-\u9fff]/.test(char)) {
                result.set(index, pinyinArray[index] || "");
            }
        });
        return result;
    }, [shouldShowPinyin, text]);

    // Pre-calculate memo coverage for multi-token support
    const memoCoverage = useMemo(() => {
        const coverage = new Map<number, any>();
        if (!items || items.length === 0) return coverage;

        // 1. Local Coverage (same phraseId, same tokenIndex)
        items.forEach((item) => {
            const key = `${phraseId}-${item.tokenIndex}`;
            const memoList = memos[key];
            if (memoList && memoList.length > 0) {
                const bestMemo = memoList.find(m => m.confidence === 'high') || memoList[0];

                // For Char Mode, we assume tokens are chars, so text length maps to token range
                // For Word Mode, we treat the memo as applying to this token only (unless we add multi-token logic later)
                if (isCharMode) {
                    const textLen = (bestMemo.token_text || "").length;
                    for (let k = 0; k < textLen; k++) {
                        const targetIdx = item.tokenIndex + k;
                        coverage.set(targetIdx, bestMemo);
                    }
                } else {
                    coverage.set(item.tokenIndex, bestMemo);
                }
            }
        });

        // 2. Global Text Matching Coverage (Any occurrence of memo text)
        // Only run if we have global memos to check
        const allGlobalMemos = Object.values(memosByText).flat();
        if (allGlobalMemos.length > 0) {
            const uniqueMemos = new Map<string, any>();
            allGlobalMemos.forEach(m => {
                const txt = m.token_text;
                if (!txt) return;
                const existing = uniqueMemos.get(txt);
                // prioritize high confidence
                if (!existing || (existing.confidence !== 'high' && m.confidence === 'high')) {
                    uniqueMemos.set(txt, m);
                }
            });

            // For each item, look ahead to see if a sequence patches any memo
            // This ensures strict token boundary compliance
            for (let i = 0; i < items.length; i++) {
                let sequenceText = "";
                // Build sequence starting from i
                for (let j = i; j < items.length; j++) {
                    sequenceText += items[j].text;

                    const matchedMemo = uniqueMemos.get(sequenceText);
                    if (matchedMemo) {
                        // Found a strictly token-aligned match!
                        // Mark range [i, j]
                        for (let k = i; k <= j; k++) {
                            const tIdx = items[k].tokenIndex;
                            // Only mark checking if better
                            const existing = coverage.get(tIdx);
                            if (!existing || (existing.confidence !== 'high' && matchedMemo.confidence === 'high')) {
                                coverage.set(tIdx, matchedMemo);
                            } else if (!existing) {
                                coverage.set(tIdx, matchedMemo);
                            }
                        }
                    }
                }
            }
        }
        return coverage;
    }, [items, memos, memosByText, phraseId, text]);

    // Helper to get pinyin for a token based on its position in the original text
    const getTokenPinyin = (tokenText: string, tokenStartInText: number): string => {
        if (!shouldShowPinyin) return "";
        const pinyinParts: string[] = [];
        for (let i = 0; i < tokenText.length; i++) {
            const charPinyin = sentencePinyinMap.get(tokenStartInText + i);
            if (charPinyin) {
                // Remove punctuation from pinyin (。？！etc.)
                const cleanPinyin = charPinyin.replace(/[。？！?!.,，、；：]/g, "").trim();
                if (cleanPinyin) {
                    pinyinParts.push(cleanPinyin);
                }
            }
        }
        return pinyinParts.join(" ");
    };

    // Track position in original text while rendering
    let currentTextPosition = 0;

    // Chinese-specific styles
    const chineseStyles = isChinese ? {
        fontFamily: 'var(--font-chinese), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        lineHeight: shouldShowPinyin ? 2.2 : 1.6,
    } : undefined;

    return (
        <div
            ref={containerRef}
            className={containerClass}
            dir={isRtl ? "rtl" : "ltr"}
            style={chineseStyles}
            lang={isChinese ? "zh-CN" : undefined}
            onTouchMove={handleContainerTouchMove}
            onTouchEnd={handleContainerTouchEnd}
            onTouchCancel={handleContainerTouchEnd}
        >
            {(() => {
                let textPos = 0; // Track position in original text

                // Pre-calculate visual indices for the selection
                let visualStartIdx = -1;
                let visualEndIdx = -1;

                if (selectedToken && selectedToken.phraseId === phraseId) {
                    // Find visual index of start token
                    visualStartIdx = items.findIndex(item => item.tokenIndex === selectedToken.startIndex);
                    // Find visual index of end token - if multiple with same index? tokenIndex is unique by definition in this file.
                    visualEndIdx = items.findIndex(item => item.tokenIndex === selectedToken.endIndex);
                }

                return items.map((item, i) => {
                    const { text: tokenText, isToken, tokenIndex } = item;
                    const currentPos = textPos;
                    textPos += tokenText.length;

                    // Determine visual selection based on ARRAY INDEX
                    const isVisuallySelected = (visualStartIdx !== -1 && visualEndIdx !== -1)
                        && (i >= visualStartIdx && i <= visualEndIdx);

                    const isMultiSelection = (visualStartIdx !== visualEndIdx) || !!selectedToken?.isRangeSelection;

                    const isSelectionStart = isVisuallySelected && isMultiSelection && i === visualStartIdx;
                    const isSelectionEnd = isVisuallySelected && isMultiSelection && i === visualEndIdx;

                    let selectedClass = "";
                    if (isVisuallySelected) {
                        selectedClass = isMultiSelection ? styles.selected : styles.selectedSingle;
                    }

                    const startClass = isSelectionStart ? styles.selectedStart : "";
                    const endClass = isSelectionEnd ? styles.selectedEnd : "";

                    // CHECK FOR PLACEHOLDER (Underscores only)
                    const isPlaceholder = /^__+$/.test(tokenText);
                    if (isPlaceholder) {
                        const val = customInputs[i] ?? (profile?.username || tokenText);
                        // Calculate visual width based on char length? Min-width handled by CSS
                        // Input Change Handler
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            setCustomInputs(prev => ({ ...prev, [i]: e.target.value }));
                        };

                        return (
                            <input
                                key={i}
                                className={`${styles.nameInput} ${selectedClass} ${startClass} ${endClass}`.trim()}
                                value={val}
                                onChange={handleChange}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: `${Math.max(val.length, 2)}ch` }}
                                aria-label="Name input"
                            />
                        );
                    }










                    // Only make it a button if it is a token AND it is a word
                    if (isToken && isWord(tokenText)) {
                        // Strip trailing punctuation from token for cleaner display
                        const punctPattern = /[。？！，、；：""''【】（）《》\u3000-\u303F\uFF00-\uFFEF]+$/;
                        const trailingPunct = tokenText.match(punctPattern)?.[0] || "";
                        const cleanTokenText = trailingPunct ? tokenText.slice(0, -trailingPunct.length) : tokenText;

                        // Skip rendering if token is only punctuation after cleaning
                        if (!cleanTokenText) {
                            if (shouldShowPinyin) return null;
                            return (
                                <span key={i} className={`${styles.punct} ${selectedClass} ${startClass} ${endClass}`.trim()}>
                                    {tokenText}
                                </span>
                            );
                        }
                        // Start of Memo Logic
                        const getBestMemo = (memoList: any[]) => {
                            if (!memoList || memoList.length === 0) return null;
                            const high = memoList.find(m => m.confidence === 'high');
                            if (high) return high;
                            const medium = memoList.find(m => m.confidence === 'medium');
                            if (medium) return medium;
                            return memoList[0]; // fallback to first (Low)
                        };

                        // Use the original token index for the key if available, otherwise fallback to item index?
                        // Actually, for fallback mode tokenIndex is just partial sequential, but providedTokens mode needs explicit index
                        const safeIndex = tokenIndex !== -1 ? tokenIndex : i;
                        const key = `${phraseId}-${safeIndex}`;
                        const localMemos = memos[key];
                        const globalMemos = memosByText[tokenText.toLowerCase()] || [];

                        // Use local memo if exists, otherwise global
                        // Use local memo (potentially multi-token coverage) if exists, otherwise global
                        const effectiveMemo = memoCoverage.get(safeIndex) || getBestMemo(localMemos) || getBestMemo(globalMemos);

                        const confidenceClass = effectiveMemo?.confidence
                            ? CONFIDENCE_CLASS_MAP[effectiveMemo.confidence as keyof typeof CONFIDENCE_CLASS_MAP]
                            : undefined;



                        // Get pinyin for this token using sentence-level context (use clean text)
                        const displayText = shouldShowPinyin ? cleanTokenText : tokenText;
                        const tokenPinyin = shouldShowPinyin ? getTokenPinyin(cleanTokenText, currentPos) : null;

                        return (
                            <TokenButton
                                key={i}
                                text={tokenText}
                                index={safeIndex}
                                isSelected={isVisuallySelected}
                                isStart={isSelectionStart}
                                isEnd={isSelectionEnd}
                                isMulti={isMultiSelection}
                                confidenceClass={confidenceClass}
                                shouldShowPinyin={shouldShowPinyin}
                                tokenPinyin={tokenPinyin}
                                displayText={displayText}
                                onTokenClick={handleTokenClick}
                                onTokenLongPress={(t: string, idx: number, e?: React.TouchEvent | React.MouseEvent) => handleTouchSelectionStart(t, idx, e)}
                                onTokenDragStart={handleDragStart}
                            />
                        );
                    }
                    // Punctuation: Don't show punctuation in pinyin mode for cleaner display
                    if (shouldShowPinyin) {
                        // Check if this is a Chinese/Japanese punctuation mark
                        const isCJKPunct = /^[\u3000-\u303F\uFF00-\uFFEF\u0020\u3002\uFF1F\uFF01\u3001\uFF0C\uFF1B\uFF1A\u201C\u201D\u2018\u2019\u3010\u3011\uFF08\uFF09\u300A\u300B。？！，、；：""''【】（）《》\s]+$/.test(tokenText);
                        if (isCJKPunct) {
                            return null; // Hide CJK punctuation in pinyin mode
                        }
                    }
                    return (

                        <button
                            key={i}
                            className={`${styles.punct} ${selectedClass} ${startClass} ${endClass}`.trim()}
                            tabIndex={-1}
                            style={{
                                display: shouldShowPinyin ? "inline-flex" : undefined,
                                flexDirection: shouldShowPinyin ? "column" : undefined,
                                alignItems: shouldShowPinyin ? "center" : undefined,
                                verticalAlign: shouldShowPinyin ? "bottom" : undefined,
                            }}
                        >
                            {shouldShowPinyin && (
                                <span style={{
                                    fontSize: "0.75em",
                                    lineHeight: 1,
                                    marginBottom: "2px",
                                    visibility: "hidden",
                                    whiteSpace: "nowrap"
                                }}>
                                    &nbsp;
                                </span>
                            )}
                            <span>{tokenText}</span>
                        </button>
                    );
                });
            })()
            }
        </div>
    );
}

