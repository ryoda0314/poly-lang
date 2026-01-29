"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, MoreVertical, Plus, X, Download } from "lucide-react";
import styles from "./InstallPrompt.module.css";

const DISMISSED_KEY = "poly.installPromptDismissed";
const DISMISS_DURATION_DAYS = 7; // 7日後に再表示

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;

  // iOS Safari
  if ("standalone" in window.navigator) {
    return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  // Android Chrome / Other browsers
  return window.matchMedia("(display-mode: standalone)").matches;
}

function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;

  // Already in standalone mode
  if (isStandalone()) return false;

  // Check if dismissed recently
  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  if (dismissedAt) {
    const dismissedDate = new Date(parseInt(dismissedAt));
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < DISMISS_DURATION_DAYS) return false;
  }

  // Only show on iOS or Android
  const platform = detectPlatform();
  return platform === "ios" || platform === "android";
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    // Wait for splash screen to finish (3 seconds)
    const timer = setTimeout(() => {
      if (shouldShowPrompt()) {
        setPlatform(detectPlatform());
        setVisible(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button className={styles.closeButton} onClick={handleDismiss}>
              <X size={20} />
            </button>

            <div className={styles.iconWrapper}>
              <Download size={32} strokeWidth={1.5} />
            </div>

            <h2 className={styles.title}>アプリをインストール</h2>
            <p className={styles.description}>
              ホーム画面に追加して、より快適にご利用ください
            </p>

            {platform === "ios" ? (
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <Share size={20} />
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepNumber}>1</span>
                    画面下の<strong>共有ボタン</strong>をタップ
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <Plus size={20} />
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepNumber}>2</span>
                    <strong>ホーム画面に追加</strong>を選択
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <MoreVertical size={20} />
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepNumber}>1</span>
                    画面右上の<strong>メニュー</strong>をタップ
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <Download size={20} />
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepNumber}>2</span>
                    <strong>アプリをインストール</strong>を選択
                  </div>
                </div>
              </div>
            )}

            <button className={styles.laterButton} onClick={handleDismiss}>
              あとで
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}