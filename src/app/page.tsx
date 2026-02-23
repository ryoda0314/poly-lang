"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";

const HAS_SEEN_INTRO_KEY = "poly.hasSeenIntro";

export default function HomePage() {
    const router = useRouter();
    const { isLoggedIn, isLoading } = useAppStore();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        if (!standalone) {
            router.replace("/install");
            return;
        }

        // PWA mode
        if (!isLoading) {
            if (isLoggedIn) {
                router.replace("/app");
            } else {
                const hasSeen = localStorage.getItem(HAS_SEEN_INTRO_KEY) === "true";
                router.replace(hasSeen ? "/login" : "/intro-animation");
            }
            setChecked(true);
        }
    }, [isLoggedIn, isLoading, router]);

    if (!checked) {
        return null;
    }

    return null;
}
