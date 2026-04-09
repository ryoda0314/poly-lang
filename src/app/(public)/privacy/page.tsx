"use client";

import Link from "next/link";
import { useMemo } from "react";
import { translations } from "@/lib/translations";
import { detectBrowserLanguage } from "@/lib/detect-browser-language";
import styles from "./page.module.css";

export default function PublicPrivacyPage() {
    const t = useMemo(() => {
        const lang = detectBrowserLanguage();
        return translations[lang] || translations.ja;
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className={styles.title}>{t.privacyPolicy}</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.lastUpdated}>{(t as any).privacyLastUpdated}</p>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection1Title}</h2>
                    <p>{(t as any).privacySection1Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection2Title}</h2>
                    <p>{(t as any).privacySection2Intro}</p>

                    <h3>{(t as any).privacyAccountInfoTitle}</h3>
                    <ul>
                        <li>{(t as any).privacyAccountInfo1}</li>
                        <li>{(t as any).privacyAccountInfo2}</li>
                        <li>{(t as any).privacyAccountInfo3}</li>
                        <li>{(t as any).privacyAccountInfo4}</li>
                    </ul>

                    <h3>{(t as any).privacyLearningDataTitle}</h3>
                    <ul>
                        <li>{(t as any).privacyLearningData1}</li>
                        <li>{(t as any).privacyLearningData2}</li>
                        <li>{(t as any).privacyLearningData3}</li>
                        <li>{(t as any).privacyLearningData4}</li>
                    </ul>

                    <h3>{(t as any).privacyFeatureDataTitle}</h3>
                    <ul>
                        <li><strong>{(t as any).privacyVoiceFeature}</strong>{(t as any).privacyVoiceData}</li>
                        <li><strong>{(t as any).privacyImageFeature}</strong>{(t as any).privacyImageData}</li>
                        <li><strong>{(t as any).privacyCorrectionFeature}</strong>{(t as any).privacyCorrectionData}</li>
                    </ul>

                    <h3>{(t as any).privacyUsageInfoTitle}</h3>
                    <ul>
                        <li>{(t as any).privacyUsageInfo1}</li>
                        <li>{(t as any).privacyUsageInfo2}</li>
                        <li>{(t as any).privacyUsageInfo3}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection3Title}</h2>
                    <p>{(t as any).privacySection3Intro}</p>
                    <ul>
                        <li><strong>OpenAI：</strong>{(t as any).privacyOpenAI}</li>
                        <li><strong>Google (Gemini)：</strong>{(t as any).privacyGoogle}</li>
                        <li><strong>Supabase：</strong>{(t as any).privacySupabase}</li>
                        <li><strong>{(t as any).privacyStripeLabel}</strong>{(t as any).privacyStripeData}</li>
                    </ul>
                    <p>{(t as any).privacySection3Note}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection4Title}</h2>
                    <p>{(t as any).privacySection4Intro}</p>
                    <ul>
                        <li>{(t as any).privacyPurpose1}</li>
                        <li>{(t as any).privacyPurpose2}</li>
                        <li>{(t as any).privacyPurpose3}</li>
                        <li>{(t as any).privacyPurpose4}</li>
                        <li>{(t as any).privacyPurpose5}</li>
                        <li>{(t as any).privacyPurpose6}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection5Title}</h2>
                    <p>{(t as any).privacySection5Intro}</p>
                    <ul>
                        <li>{(t as any).privacySharing1}</li>
                        <li>{(t as any).privacySharing2}</li>
                        <li>{(t as any).privacySharing3}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection6Title}</h2>
                    <p>{(t as any).privacySection6Intro}</p>
                    <ul>
                        <li>{(t as any).privacyProtection1}</li>
                        <li>{(t as any).privacyProtection2}</li>
                        <li>{(t as any).privacyProtection3}</li>
                        <li>{(t as any).privacyProtection4}</li>
                        <li>{(t as any).privacyProtection5}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection7Title}</h2>
                    <p>{(t as any).privacySection7Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection8Title}</h2>
                    <p>{(t as any).privacySection8Intro}</p>
                    <ul>
                        <li>{(t as any).privacyRights1}</li>
                        <li>{(t as any).privacyRights2}</li>
                        <li>{(t as any).privacyRights3}</li>
                    </ul>
                    <p>{(t as any).privacySection8Note}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection9Title}</h2>
                    <p>{(t as any).privacySection9Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection10Title}</h2>
                    <p>{(t as any).privacySection10Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).privacySection11Title}</h2>
                    <p>{(t as any).privacySection11Content}</p>
                </section>
            </div>
        </div>
    );
}
