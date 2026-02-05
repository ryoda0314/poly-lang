"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Book, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { getAvailableBibleBooks, importBibleChapter, getImportedChapters, getAllBooksProgress, type ChapterProgress, type BookProgress } from "@/actions/bible-import";
import type { BibleBook, BibleLanguage } from "@/data/bible-books";
import { getBookDisplayName } from "@/data/bible-books";
import { useAppStore } from "@/store/app-context";
import styles from "./page.module.css";
import clsx from "clsx";

type BookWithChapters = BibleBook & { chapters: number[] };

type ViewMode = 'books' | 'chapters';

export default function BibleImportPage() {
    const router = useRouter();
    const { activeLanguageCode } = useAppStore();
    const [books, setBooks] = useState<BookWithChapters[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('books');
    const [selectedBook, setSelectedBook] = useState<BookWithChapters | null>(null);
    const [testamentFilter, setTestamentFilter] = useState<'all' | 'old' | 'new'>('all');

    const [importingChapter, setImportingChapter] = useState<number | null>(null);
    const [chapterProgressMap, setChapterProgressMap] = useState<Map<number, ChapterProgress>>(new Map());
    const [bookProgressMap, setBookProgressMap] = useState<Map<string, BookProgress>>(new Map());
    const [importError, setImportError] = useState<string | null>(null);
    const [loadingImported, setLoadingImported] = useState(false);

    // Convert user's learning language to Bible language
    // Japanese has no Bible available, so fall back to English
    const bibleLanguage: BibleLanguage = useMemo(() => {
        const supportedLanguages: BibleLanguage[] = ['en', 'ko', 'de', 'es', 'fr', 'zh', 'ru', 'vi'];
        if (activeLanguageCode && supportedLanguages.includes(activeLanguageCode as BibleLanguage)) {
            return activeLanguageCode as BibleLanguage;
        }
        return 'en'; // default to English for unsupported languages (e.g., Japanese)
    }, [activeLanguageCode]);

    useEffect(() => {
        loadBooks();
    }, [bibleLanguage]);

    const loadBooks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [booksResult, progressResult] = await Promise.all([
                getAvailableBibleBooks(bibleLanguage),
                getAllBooksProgress(bibleLanguage),
            ]);
            if (booksResult.error) {
                setError(booksResult.error);
            } else {
                setBooks(booksResult.books);
            }
            setBookProgressMap(progressResult.progress);
        } catch (err) {
            setError('Failed to load Bible books');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookSelect = async (book: BookWithChapters) => {
        setSelectedBook(book);
        setViewMode('chapters');
        setImportError(null);

        // Load already imported chapters with progress
        setLoadingImported(true);
        try {
            const result = await getImportedChapters(book.id, bibleLanguage);
            if (!result.error) {
                const progressMap = new Map<number, ChapterProgress>();
                for (const cp of result.chapters) {
                    progressMap.set(cp.chapter, cp);
                }
                setChapterProgressMap(progressMap);
            }
        } catch (err) {
            console.error('Failed to load imported chapters:', err);
        } finally {
            setLoadingImported(false);
        }
    };

    const handleBackToBooks = () => {
        setViewMode('books');
        setSelectedBook(null);
        setChapterProgressMap(new Map());
    };

    const handleChapterClick = async (chapter: number) => {
        if (!selectedBook || importingChapter !== null) return;

        const progress = chapterProgressMap.get(chapter);

        // If already imported, navigate to that text
        if (progress) {
            router.push(`/app/long-text/${progress.textId}`);
            return;
        }

        // Otherwise, import the chapter
        setImportingChapter(chapter);
        setImportError(null);

        try {
            const result = await importBibleChapter(selectedBook.id, chapter, bibleLanguage);
            if (result.success && result.textId) {
                // Navigate to the imported text
                router.push(`/app/long-text/${result.textId}`);
            } else {
                setImportError(result.error || 'Import failed');
            }
        } catch (err) {
            setImportError('Import failed');
        } finally {
            setImportingChapter(null);
        }
    };

    const filteredBooks = books.filter(book => {
        if (testamentFilter === 'all') return true;
        return book.testament === testamentFilter;
    });

    const oldTestamentBooks = filteredBooks.filter(b => b.testament === 'old');
    const newTestamentBooks = filteredBooks.filter(b => b.testament === 'new');

    const totalChapters = selectedBook?.chapters.length || 0;

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <Loader2 className={styles.spinner} size={24} />
                    <span>聖書を読み込み中...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={loadBooks} className={styles.retryBtn}>
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button
                    onClick={() => {
                        if (viewMode === 'chapters') {
                            handleBackToBooks();
                        } else {
                            router.back();
                        }
                    }}
                    className={styles.backBtn}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>
                        {viewMode === 'books' ? '聖書' : (selectedBook ? getBookDisplayName(selectedBook, bibleLanguage) : '')}
                    </h1>
                    {viewMode === 'chapters' && totalChapters > 0 && (
                        <div className={styles.progressInfo}>
                            <span className={styles.progressText}>
                                全{totalChapters}章
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'books' && (
                <>
                    <div className={styles.filterTabs}>
                        <button
                            className={clsx(styles.filterTab, testamentFilter === 'all' && styles.filterTabActive)}
                            onClick={() => setTestamentFilter('all')}
                        >
                            全て
                        </button>
                        <button
                            className={clsx(styles.filterTab, testamentFilter === 'old' && styles.filterTabActive)}
                            onClick={() => setTestamentFilter('old')}
                        >
                            旧約聖書
                        </button>
                        <button
                            className={clsx(styles.filterTab, testamentFilter === 'new' && styles.filterTabActive)}
                            onClick={() => setTestamentFilter('new')}
                        >
                            新約聖書
                        </button>
                    </div>

                    <div className={styles.scrollArea}>
                        {(testamentFilter === 'all' || testamentFilter === 'old') && oldTestamentBooks.length > 0 && (
                            <div className={styles.section}>
                                {testamentFilter === 'all' && (
                                    <h2 className={styles.sectionTitle}>旧約聖書</h2>
                                )}
                                <div className={styles.bookList}>
                                    {oldTestamentBooks.map(book => {
                                        const progress = bookProgressMap.get(book.id);
                                        const progressPercent = progress && progress.totalSentences > 0
                                            ? Math.round((progress.completedSentences / progress.totalSentences) * 100)
                                            : 0;
                                        const displayName = getBookDisplayName(book, bibleLanguage);
                                        return (
                                            <button
                                                key={book.id}
                                                className={clsx(styles.bookItem, progress && styles.bookItemHasProgress)}
                                                onClick={() => handleBookSelect(book)}
                                            >
                                                <Book size={18} className={styles.bookIcon} />
                                                <div className={styles.bookInfo}>
                                                    <span className={styles.bookName}>{book.nameJa}</span>
                                                    <span className={styles.bookNameEn}>{displayName}</span>
                                                    {progress && (
                                                        <div className={styles.bookProgressBar}>
                                                            <div
                                                                className={styles.bookProgressFill}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.bookStats}>
                                                    {progress ? (
                                                        <span className={styles.progressPercent}>{progressPercent}%</span>
                                                    ) : (
                                                        <span className={styles.chapterCount}>{book.chapters.length}章</span>
                                                    )}
                                                </div>
                                                <ChevronRight size={18} className={styles.chevron} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(testamentFilter === 'all' || testamentFilter === 'new') && newTestamentBooks.length > 0 && (
                            <div className={styles.section}>
                                {testamentFilter === 'all' && (
                                    <h2 className={styles.sectionTitle}>新約聖書</h2>
                                )}
                                <div className={styles.bookList}>
                                    {newTestamentBooks.map(book => {
                                        const progress = bookProgressMap.get(book.id);
                                        const progressPercent = progress && progress.totalSentences > 0
                                            ? Math.round((progress.completedSentences / progress.totalSentences) * 100)
                                            : 0;
                                        const displayName = getBookDisplayName(book, bibleLanguage);
                                        return (
                                            <button
                                                key={book.id}
                                                className={clsx(styles.bookItem, progress && styles.bookItemHasProgress)}
                                                onClick={() => handleBookSelect(book)}
                                            >
                                                <Book size={18} className={styles.bookIcon} />
                                                <div className={styles.bookInfo}>
                                                    <span className={styles.bookName}>{book.nameJa}</span>
                                                    <span className={styles.bookNameEn}>{displayName}</span>
                                                    {progress && (
                                                        <div className={styles.bookProgressBar}>
                                                            <div
                                                                className={styles.bookProgressFill}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.bookStats}>
                                                    {progress ? (
                                                        <span className={styles.progressPercent}>{progressPercent}%</span>
                                                    ) : (
                                                        <span className={styles.chapterCount}>{book.chapters.length}章</span>
                                                    )}
                                                </div>
                                                <ChevronRight size={18} className={styles.chevron} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {filteredBooks.length === 0 && (
                            <div className={styles.emptyState}>
                                <BookOpen size={48} />
                                <p>聖書ファイルが見つかりません</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'chapters' && selectedBook && (
                <div className={styles.scrollArea}>
                    {importError && (
                        <div className={styles.importError}>{importError}</div>
                    )}

                    <p className={styles.chapterHint}>
                        {loadingImported ? '読み込み中...' : '章を選択してください'}
                    </p>

                    <div className={styles.chapterGrid}>
                        {selectedBook.chapters.map(chapter => {
                            const progress = chapterProgressMap.get(chapter);
                            const isImporting = importingChapter === chapter;
                            const progressPercent = progress && progress.totalCount > 0
                                ? Math.round((progress.completedCount / progress.totalCount) * 100)
                                : 0;

                            return (
                                <button
                                    key={chapter}
                                    className={clsx(
                                        styles.chapterBtn,
                                        progress && styles.chapterBtnImported,
                                        progress && progressPercent === 100 && styles.chapterBtnCompleted,
                                        isImporting && styles.chapterBtnLoading
                                    )}
                                    onClick={() => handleChapterClick(chapter)}
                                    disabled={importingChapter !== null}
                                    style={progress ? {
                                        '--progress': `${progressPercent}%`
                                    } as React.CSSProperties : undefined}
                                >
                                    {isImporting ? (
                                        <Loader2 size={16} className={styles.spinner} />
                                    ) : (
                                        <span className={styles.chapterNumber}>{chapter}</span>
                                    )}
                                    {progress && (
                                        <div
                                            className={styles.chapterProgressFill}
                                            style={{ height: `${progressPercent}%` }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
