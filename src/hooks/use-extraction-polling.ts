"use client";

import { useEffect, useRef } from "react";
import { useExtractionJobsStore } from "@/store/extraction-jobs-store";

interface UseExtractionPollingOptions {
    /** Polling interval in milliseconds (default: 10000 = 10 seconds) */
    interval?: number;
    /** Whether polling is enabled (default: true) */
    enabled?: boolean;
}

/**
 * Hook that polls for completed extraction jobs and triggers toast notifications.
 * Should be used in a layout component that wraps the entire app.
 */
export function useExtractionPolling(options: UseExtractionPollingOptions = {}) {
    const { interval = 10000, enabled = true } = options;
    const pollForCompleted = useExtractionJobsStore(state => state.pollForCompleted);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial poll after a short delay
        const initialTimeout = setTimeout(() => {
            pollForCompleted();
        }, 2000);

        // Set up interval polling
        intervalRef.current = setInterval(() => {
            pollForCompleted();
        }, interval);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, interval, pollForCompleted]);
}
