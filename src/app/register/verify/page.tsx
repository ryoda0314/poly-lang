"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

function VerifyContent() {
    const searchParams = useSearchParams();
    const lang = searchParams.get('lang') || 'en';

    const getText = (en: string, ja: string, ko: string) => {
        if (lang === 'ja') return ja;
        if (lang === 'ko') return ko;
        return en;
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.card}
            >
                {/* Icon */}
                <div className={styles.iconCircle}>
                    <Mail size={36} color="#fff" />
                </div>

                {/* Title */}
                <h1 className={styles.title}>
                    {getText("Check your email", "メールをご確認ください", "이메일을 확인해주세요")}
                </h1>

                {/* Description */}
                <p className={styles.description}>
                    {getText(
                        "We've sent you a verification email. Click the link in the email to activate your account.",
                        "認証メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。",
                        "인증 이메일을 보냈습니다. 이메일의 링크를 클릭하여 계정을 활성화해주세요."
                    )}
                </p>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Login Link */}
                <Link href="/login" className={styles.loginLink}>
                    {getText("Go to Login", "ログイン画面へ", "로그인 화면으로")}
                    <ArrowRight size={18} />
                </Link>
            </motion.div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className={styles.container}><div className={styles.card}>Loading...</div></div>}>
            <VerifyContent />
        </Suspense>
    );
}
