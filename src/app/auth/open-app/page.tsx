"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Home, Globe } from "lucide-react";
import styles from "./page.module.css";

const translations = {
    en: {
        title: "Email Verified!",
        subtitle: "Your account has been successfully activated.",
        instruction: "Please open PolyLinga from your home screen to start learning.",
        continueInBrowser: "Continue in Browser",
        noApp: "Don't have the app installed?",
        installTip: "Add PolyLinga to your home screen for the best experience",
    },
    ja: {
        title: "メール認証完了！",
        subtitle: "アカウントが有効化されました。",
        instruction: "ホーム画面からPolyLingaを開いて学習を始めましょう。",
        continueInBrowser: "ブラウザで続ける",
        noApp: "アプリをインストールしていませんか？",
        installTip: "ホーム画面に追加すると、より快適にご利用いただけます",
    },
    ko: {
        title: "이메일 인증 완료!",
        subtitle: "계정이 활성화되었습니다.",
        instruction: "홈 화면에서 PolyLinga를 열어 학습을 시작하세요.",
        continueInBrowser: "브라우저에서 계속",
        noApp: "앱이 설치되어 있지 않으신가요?",
        installTip: "홈 화면에 추가하면 더 편리하게 이용할 수 있습니다",
    },
    zh: {
        title: "邮箱验证完成！",
        subtitle: "您的账户已成功激活。",
        instruction: "请从主屏幕打开 PolyLinga 开始学习。",
        continueInBrowser: "在浏览器中继续",
        noApp: "还没有安装应用？",
        installTip: "添加到主屏幕以获得最佳体验",
    },
    fr: {
        title: "Email vérifié !",
        subtitle: "Votre compte a été activé avec succès.",
        instruction: "Ouvrez PolyLinga depuis votre écran d'accueil pour commencer.",
        continueInBrowser: "Continuer dans le navigateur",
        noApp: "Vous n'avez pas l'application installée ?",
        installTip: "Ajoutez PolyLinga à votre écran d'accueil pour une meilleure expérience",
    },
    es: {
        title: "¡Email verificado!",
        subtitle: "Tu cuenta ha sido activada correctamente.",
        instruction: "Abre PolyLinga desde tu pantalla de inicio para empezar.",
        continueInBrowser: "Continuar en el navegador",
        noApp: "¿No tienes la aplicación instalada?",
        installTip: "Añade PolyLinga a tu pantalla de inicio para una mejor experiencia",
    },
    de: {
        title: "E-Mail bestätigt!",
        subtitle: "Ihr Konto wurde erfolgreich aktiviert.",
        instruction: "Öffnen Sie PolyLinga vom Startbildschirm, um zu beginnen.",
        continueInBrowser: "Im Browser fortfahren",
        noApp: "Haben Sie die App nicht installiert?",
        installTip: "Fügen Sie PolyLinga zu Ihrem Startbildschirm hinzu für das beste Erlebnis",
    },
    ru: {
        title: "Email подтвержден!",
        subtitle: "Ваш аккаунт успешно активирован.",
        instruction: "Откройте PolyLinga с главного экрана, чтобы начать.",
        continueInBrowser: "Продолжить в браузере",
        noApp: "Приложение не установлено?",
        installTip: "Добавьте PolyLinga на главный экран для лучшего опыта",
    },
    vi: {
        title: "Xác minh email thành công!",
        subtitle: "Tài khoản của bạn đã được kích hoạt.",
        instruction: "Mở PolyLinga từ màn hình chính để bắt đầu học.",
        continueInBrowser: "Tiếp tục trên trình duyệt",
        noApp: "Chưa cài đặt ứng dụng?",
        installTip: "Thêm PolyLinga vào màn hình chính để có trải nghiệm tốt nhất",
    },
};

export default function OpenAppPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const lang = (searchParams.get("lang") as keyof typeof translations) || "en";
    const t = translations[lang] || translations.en;
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running as PWA (standalone mode)
        const standalone = window.matchMedia("(display-mode: standalone)").matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // If already in PWA, redirect to app
        if (standalone) {
            router.push("/app");
        }
    }, [router]);

    const handleContinueInBrowser = () => {
        router.push("/app");
    };

    // If in PWA, show nothing while redirecting
    if (isStandalone) {
        return null;
    }

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className={styles.iconWrapper}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    <CheckCircle className={styles.checkIcon} size={64} />
                </motion.div>

                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.subtitle}>{t.subtitle}</p>

                <div className={styles.instructionBox}>
                    <Home size={24} className={styles.homeIcon} />
                    <p className={styles.instruction}>{t.instruction}</p>
                </div>

                <motion.button
                    className={styles.browserButton}
                    onClick={handleContinueInBrowser}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Globe size={18} />
                    {t.continueInBrowser}
                </motion.button>

                <div className={styles.installHint}>
                    <p className={styles.noApp}>{t.noApp}</p>
                    <p className={styles.installTip}>{t.installTip}</p>
                </div>
            </motion.div>
        </div>
    );
}