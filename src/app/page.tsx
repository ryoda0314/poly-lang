"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";

const HAS_SEEN_INTRO_KEY = "poly.hasSeenIntro";

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
    } else if (!hasSeenIntro) {
      // First-time visitors see the intro animation
      router.replace("/intro-animation");
    } else {
      // Returning visitors who aren't logged in go to login
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show nothing while determining where to redirect
  return null;
}