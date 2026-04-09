"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-context";
import { translations, NativeLanguage } from "@/lib/translations";
import styles from "./CreditDepletedModal.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export default function CreditDepletedModal({ isOpen, onClose, message }: Props) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { nativeLanguage } = useAppStore();
    const t = translations[(nativeLanguage || "en") as NativeLanguage] || translations.en;

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const handleShop = () => {
        onClose();
        router.push("/app/shop");
    };

    const handleBackdrop = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div className={styles.backdrop} onClick={handleBackdrop}>
            <div className={styles.modal} role="alertdialog" aria-modal="true">
                <div className={styles.body}>
                    <div className={styles.iconWrap}>
                        <AlertTriangle size={28} />
                    </div>
                    <h3 className={styles.title}>
                        {(t as any).insufficientCredits || "クレジットが不足しています"}
                    </h3>
                    <p className={styles.message}>{message}</p>
                    <div className={styles.actions}>
                        <button className={styles.shopButton} onClick={handleShop}>
                            <ShoppingBag size={18} />
                            {(t as any).shop || "ショップ"}
                        </button>
                        <button className={styles.closeButton} onClick={onClose}>
                            {(t as any).close || "閉じる"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
