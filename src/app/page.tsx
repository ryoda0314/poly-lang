"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import LandingPage from "./landing/LandingPage";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAppStore();
  const [shouldShowLanding, setShouldShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return;

    if (isLoggedIn) {
      // Logged in users go directly to the app
      router.replace("/app");
    } else {
      // Non-logged-in users see the landing page
      setShouldShowLanding(true);
    }
  }, [isLoggedIn, isLoading, router]);

  // Show nothing while determining state
  if (isLoading || shouldShowLanding === null) {
    return null;
  }

  // Show landing page for non-logged-in users
  if (shouldShowLanding) {
    return <LandingPage />;
  }

  return null;
}
