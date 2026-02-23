"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share, MoreVertical, Plus, Download, Smartphone, Monitor, Globe, ExternalLink, Copy, Check } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";
import { translations, type NativeLanguage } from "@/lib/translations";
import { detectBrowserLanguage, detectInAppBrowser, type InAppBrowser } from "@/lib/detect-browser-language";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

const IN_APP_NAMES: Record<Exclude<InAppBrowser, null>, string> = {
  instagram: "Instagram",
  twitter: "X (Twitter)",
  line: "LINE",
  facebook: "Facebook",
  tiktok: "TikTok",
  wechat: "WeChat",
};

function renderStep(template: string, bold: string) {
  const parts = template.split("{0}");
  return <>{parts[0]}<strong>{bold}</strong>{parts[1] ?? ""}</>;
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [lang, setLang] = useState<NativeLanguage>("en");
  const [inApp, setInApp] = useState<InAppBrowser>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setLang(detectBrowserLanguage());
    setInApp(detectInAppBrowser());

    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (standalone) {
      window.location.href = "/app";
    }
  }, []);

  const t = translations[lang] as any;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

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
          {t.install_subtitle}
        </motion.p>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {inApp ? (
            <>
              <div className={`${styles.cardIcon} ${styles.warningIcon}`}>
                <ExternalLink size={24} strokeWidth={1.5} />
              </div>
              <h2 className={styles.cardTitle}>{t.install_inAppTitle}</h2>
              <p className={styles.cardDescription}>
                {(t.install_inAppDesc as string).replace("{0}", IN_APP_NAMES[inApp])}
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    {platform === "ios" ? <Share size={20} /> : <MoreVertical size={20} />}
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      {platform === "ios" ? t.install_inAppIosStep : t.install_inAppAndroidStep}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.copySection}>
                <p className={styles.copyHint}>{t.install_inAppManualHint}</p>
                <button className={styles.copyButton} onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t.install_inAppCopied : t.install_inAppCopyUrl}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.cardIcon}>
                {platform === "desktop" ? (
                  <Monitor size={24} strokeWidth={1.5} />
                ) : (
                  <Smartphone size={24} strokeWidth={1.5} />
                )}
              </div>
              <h2 className={styles.cardTitle}>{t.install_cardTitle}</h2>
              <p className={styles.cardDescription}>
                {platform === "desktop" ? t.install_descDesktop : t.install_descMobile}
              </p>

              {platform === "ios" ? (
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Share size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>1</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_iosStep1, t.install_iosStep1Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Plus size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>2</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_iosStep2, t.install_iosStep2Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Plus size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>3</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_iosStep3, t.install_iosStep3Bold)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : platform === "android" ? (
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><MoreVertical size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>1</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_androidStep1, t.install_androidStep1Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Download size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>2</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_androidStep2, t.install_androidStep2Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Plus size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>3</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_androidStep3, t.install_androidStep3Bold)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.steps}>
                  <div className={styles.platformLabel}>{t.install_desktopLabel}</div>
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Globe size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>1</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_desktopStep1, t.install_desktopStep1Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.step}>
                    <div className={styles.stepIcon}><Download size={20} /></div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepNumber}>2</span>
                      <span className={styles.stepText}>
                        {renderStep(t.install_desktopStep2, t.install_desktopStep2Bold)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.desktopAlt}>
                    <p>{t.install_desktopAlt}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {!inApp && (
          <motion.p
            className={styles.hint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {platform === "desktop" ? t.install_hintDesktop : t.install_hintMobile}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
