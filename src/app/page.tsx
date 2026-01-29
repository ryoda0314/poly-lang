"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";

const HAS_SEEN_INTRO_KEY = "poly.hasSeenIntro";

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;

  // iOS Safari
  if ("standalone" in window.navigator) {
    return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  // Android Chrome / Other browsers
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAppStore();

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return;

    const hasSeenIntro = localStorage.getItem(HAS_SEEN_INTRO_KEY);

    if (isLoggedIn) {
      // Logged in users go directly to the app
      router.replace("/app");
    } else if (!isStandalone()) {
      // Browser users see the install prompt
      router.replace("/install");
    } else if (!hasSeenIntro) {
      // First-time visitors (in standalone mode) see the intro animation
      router.replace("/intro-animation");
    } else {
      // Returning visitors who aren't logged in go to login
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show nothing while determining where to redirect
  return null;
}