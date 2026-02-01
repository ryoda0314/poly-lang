"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAppStore();

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      router.replace("/app");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  return null;
}
