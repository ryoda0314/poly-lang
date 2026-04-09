"use client";

import { useState, useCallback } from "react";
import { X, Link2 } from "lucide-react";
import styles from "./UrlSubmitModal.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
}

export default function UrlSubmitModal({ isOpen, onClose, onSubmit }: Props) {
    const [url, setUrl] = useState("");

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = url.trim();
        if (trimmed) {
            onSubmit(trimmed);
            setUrl("");
            onClose();
        }
    }, [url, onSubmit, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <Link2 size={18} />
                        <span>URL to read</span>
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="url"
                        className={styles.input}
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className={styles.submitBtn} disabled={!url.trim()}>
                        Read this article
                    </button>
                </form>
            </div>
        </div>
    );
}
