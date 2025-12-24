"use client";

import React, { useEffect } from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import { useAppStore } from "@/store/app-context";
import { useAwarenessStore } from "@/store/awareness-store";

import { CorrectionSidebar } from "@/components/stream/CorrectionSidebar";

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
            <div style={{
                padding: "var(--space-3)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-bg)"
            }}>
                <h2 style={{ fontSize: "1rem", margin: 0 }}>AI Correction Stream</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>beta</div>
            </div>

            <StreamCanvas />


        </StreamLayout>
    );
}
