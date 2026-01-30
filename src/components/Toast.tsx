"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./Toast.module.css";
import { useExtractionJobsStore, type Toast as ToastType } from "@/store/extraction-jobs-store";

interface ToastProps {
    toast: ToastType;
}

function Toast({ toast }: ToastProps) {
    const router = useRouter();
    const removeToast = useExtractionJobsStore(state => state.removeToast);

    const handleClick = () => {
        if (toast.jobId) {
            router.push('/app/extraction-history');
        }
        removeToast(toast.id);
    };

    const Icon = toast.type === 'success' ? CheckCircle :
        toast.type === 'error' ? AlertCircle : Info;

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={handleClick}
            role="alert"
        >
            <Icon className={styles.icon} size={20} />
            <div className={styles.content}>
                <div className={styles.title}>{toast.title}</div>
                <div className={styles.message}>{toast.message}</div>
            </div>
            <button
                className={styles.closeButton}
                onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                }}
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useExtractionJobsStore(state => state.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
