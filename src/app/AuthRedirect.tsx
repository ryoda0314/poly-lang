"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";

export default function AuthRedirect() {
    const router = useRouter();
    const { isLoggedIn, isLoading } = useAppStore();

    useEffect(() => {
        if (!isLoading && isLoggedIn) {
            router.replace("/app");
        }
    }, [isLoggedIn, isLoading, router]);

    return null;
}
