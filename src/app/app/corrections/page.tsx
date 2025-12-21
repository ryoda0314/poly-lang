"use client";

import React from "react";
import StreamLayout from "@/components/stream/StreamLayout";
import StreamCanvas from "@/components/stream/StreamCanvas";
import MouthpieceDock from "@/components/stream/MouthpieceDock";
import { AwarenessSidebar } from "@/components/awareness/AwarenessSidebar";

export default function CorrectionPage() {
    return (
        <StreamLayout leftSidebar={<AwarenessSidebar />}>
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

            <MouthpieceDock />
        </StreamLayout>
    );
}
