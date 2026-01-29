"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share, MoreVertical, Plus, Download, Smartphone } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";

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

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detectPlatform());

    // If already in PWA mode, redirect to app
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (standalone) {
      window.location.href = "/app";
    }
  }, []);

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className={styles.logoWrapper}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Image
            src="/icons/touka.png"
            alt="PolyLinga"
            width={200}
            height={200}
            priority
          />
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          PolyLinga
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Language learning reimagined
        </motion.p>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.cardIcon}>
            <Smartphone size={24} strokeWidth={1.5} />
          </div>
          <h2 className={styles.cardTitle}>アプリとしてインストール</h2>
          <p className={styles.cardDescription}>
            ホーム画面に追加して、アプリとして快適にご利用ください
          </p>

          {platform === "ios" ? (
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <Share size={20} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepNumber}>1</span>
                  <span className={styles.stepText}>
                    画面下の<strong>共有ボタン</strong>をタップ
                  </span>
                </div>
              </div>
              <div className={styles.stepConnector} />
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <Plus size={20} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepNumber}>2</span>
                  <span className={styles.stepText}>
                    <strong>ホーム画面に追加</strong>を選択
                  </span>
                </div>
              </div>
            </div>
          ) : platform === "android" ? (
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <MoreVertical size={20} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepNumber}>1</span>
                  <span className={styles.stepText}>
                    画面右上の<strong>メニュー</strong>をタップ
                  </span>
                </div>
              </div>
              <div className={styles.stepConnector} />
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <Download size={20} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepNumber}>2</span>
                  <span className={styles.stepText}>
                    <strong>アプリをインストール</strong>を選択
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.steps}>
              <p className={styles.desktopMessage}>
                スマートフォンでアクセスしてアプリをインストールしてください
              </p>
            </div>
          )}
        </motion.div>

        <motion.p
          className={styles.hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          インストール後、ホーム画面からアプリを開いてください
        </motion.p>
      </motion.div>
    </div>
  );
}
