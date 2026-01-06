"use client";

import React, { useEffect } from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";

import { CorrectionSidebar } from "@/components/stream/CorrectionSidebar";
import styles from "./page.module.css";

export default function CorrectionPage() {
    const { user, activeLanguageCode } = useAppStore();
    const { fetchMemos } = useAwarenessStore();

    useEffect(() => {
        if (user?.id && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user?.id, activeLanguageCode, fetchMemos]);

    return (
        <StreamLayout leftSidebar={<CorrectionSidebar />}>
            <div className={styles.headerContainer}>
                <h2 className={styles.headerTitle}>AI Correction Stream</h2>
                <div className={styles.headerBeta}>beta</div>
            </div>

            <StreamCanvas />


        </StreamLayout>
    );
}
