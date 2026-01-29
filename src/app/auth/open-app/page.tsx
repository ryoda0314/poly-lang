"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Smartphone, ExternalLink } from "lucide-react";
import styles from "./page.module.css";

const translations = {
    en: {
        title: "Email Verified!",
        subtitle: "Your account has been successfully activated.",
        openApp: "Open PolyLinga",
        instruction: "Tap the button below to open the app",
        noApp: "Don't have the app installed?",
        installTip: "Add PolyLinga to your home screen for the best experience",
    },
    ja: {
        title: "メール認証完了！",
        subtitle: "アカウントが有効化されました。",
        openApp: "PolyLingaを開く",
        instruction: "下のボタンをタップしてアプリを開いてください",
        noApp: "アプリをインストールしていませんか？",
        installTip: "ホーム画面に追加すると、より快適にご利用いただけます",
    },
    ko: {
        title: "이메일 인증 완료!",
        subtitle: "계정이 활성화되었습니다.",
        openApp: "PolyLinga 열기",
        instruction: "아래 버튼을 탭하여 앱을 여세요",
        noApp: "앱이 설치되어 있지 않으신가요?",
        installTip: "홈 화면에 추가하면 더 편리하게 이용할 수 있습니다",
    },
    zh: {
        title: "邮箱验证完成！",
        subtitle: "您的账户已成功激活。",
        openApp: "打开 PolyLinga",
        instruction: "点击下方按钮打开应用",
        noApp: "还没有安装应用？",
        installTip: "添加到主屏幕以获得最佳体验",
    },
    fr: {
        title: "Email vérifié !",
        subtitle: "Votre compte a été activé avec succès.",
        openApp: "Ouvrir PolyLinga",
        instruction: "Appuyez sur le bouton ci-dessous pour ouvrir l'application",
        noApp: "Vous n'avez pas l'application installée ?",
        installTip: "Ajoutez PolyLinga à votre écran d'accueil pour une meilleure expérience",
    },
    es: {
        title: "¡Email verificado!",
        subtitle: "Tu cuenta ha sido activada correctamente.",
        openApp: "Abrir PolyLinga",
        instruction: "Toca el botón de abajo para abrir la aplicación",
        noApp: "¿No tienes la aplicación instalada?",
        installTip: "Añade PolyLinga a tu pantalla de inicio para una mejor experiencia",
    },
    de: {
        title: "E-Mail bestätigt!",
        subtitle: "Ihr Konto wurde erfolgreich aktiviert.",
        openApp: "PolyLinga öffnen",
        instruction: "Tippen Sie auf die Schaltfläche unten, um die App zu öffnen",
        noApp: "Haben Sie die App nicht installiert?",
        installTip: "Fügen Sie PolyLinga zu Ihrem Startbildschirm hinzu für das beste Erlebnis",
    },
    ru: {
        title: "Email подтвержден!",
        subtitle: "Ваш аккаунт успешно активирован.",
        openApp: "Открыть PolyLinga",
        instruction: "Нажмите кнопку ниже, чтобы открыть приложение",
        noApp: "Приложение не установлено?",
        installTip: "Добавьте PolyLinga на главный экран для лучшего опыта",
    },
    vi: {
        title: "Xác minh email thành công!",
        subtitle: "Tài khoản của bạn đã được kích hoạt.",
        openApp: "Mở PolyLinga",
        instruction: "Nhấn nút bên dưới để mở ứng dụng",
        noApp: "Chưa cài đặt ứng dụng?",
        installTip: "Thêm PolyLinga vào màn hình chính để có trải nghiệm tốt nhất",
    },
};

export default function OpenAppPage() {
    const searchParams = useSearchParams();
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
            window.location.href = "/app";
        }
    }, []);

    const handleOpenApp = () => {
        // Try to open the PWA
        window.location.href = "/app";
    };

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

                <motion.button
                    className={styles.openButton}
                    onClick={handleOpenApp}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Smartphone size={20} />
                    {t.openApp}
                    <ExternalLink size={16} />
                </motion.button>

                <p className={styles.instruction}>{t.instruction}</p>

                {!isStandalone && (
                    <div className={styles.installHint}>
                        <p className={styles.noApp}>{t.noApp}</p>
                        <p className={styles.installTip}>{t.installTip}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}