"use client";

import Link from "next/link";
import { useMemo } from "react";
import { translations } from "@/lib/translations";
import { detectBrowserLanguage } from "@/lib/detect-browser-language";
import styles from "./page.module.css";

export default function PublicTermsPage() {
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
                <h1 className={styles.title}>{t.termsOfService}</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.lastUpdated}>{(t as any).termsLastUpdated}</p>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection1Title}</h2>
                    <p>{(t as any).termsSection1Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection2Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection2Item1}</li>
                        <li>
                            {(t as any).termsSection2Item2}
                            <ul className={styles.subList}>
                                <li>{(t as any).termsSection2Sub1}</li>
                                <li>{(t as any).termsSection2Sub2}</li>
                                <li>{(t as any).termsSection2Sub3}</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection3Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection3Item1}</li>
                        <li>{(t as any).termsSection3Item2}</li>
                        <li>{(t as any).termsSection3Item3}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection4Title}</h2>
                    <p>{(t as any).termsSection4Intro}</p>
                    <ul>
                        <li>{(t as any).termsProhibited1}</li>
                        <li>{(t as any).termsProhibited2}</li>
                        <li>{(t as any).termsProhibited3}</li>
                        <li>{(t as any).termsProhibited4}</li>
                        <li>{(t as any).termsProhibited5}</li>
                        <li>{(t as any).termsProhibited6}</li>
                        <li>{(t as any).termsProhibited7}</li>
                        <li>{(t as any).termsProhibited8}</li>
                        <li>{(t as any).termsProhibited9}</li>
                        <li>{(t as any).termsProhibited10}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection5Title}</h2>
                    <p>{(t as any).termsSection5Intro}</p>
                    <ul>
                        <li>{(t as any).termsFeature1}</li>
                        <li>{(t as any).termsFeature2}</li>
                        <li>{(t as any).termsFeature3}</li>
                        <li>{(t as any).termsFeature4}</li>
                        <li>{(t as any).termsFeature5}</li>
                        <li>{(t as any).termsFeature6}</li>
                        <li>{(t as any).termsFeature7}</li>
                    </ul>
                    <p>{(t as any).termsSection5Note}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection6Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection6Item1}</li>
                        <li>{(t as any).termsSection6Item2}</li>
                        <li>{(t as any).termsSection6Item3}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection7Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection7Item1}</li>
                        <li>
                            {(t as any).termsSection7Item2}
                            <ul className={styles.subList}>
                                <li>{(t as any).termsSection7Sub1}</li>
                                <li>{(t as any).termsSection7Sub2}</li>
                                <li>{(t as any).termsSection7Sub3}</li>
                                <li>{(t as any).termsSection7Sub4}</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection8Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection8Item1}</li>
                        <li>{(t as any).termsSection8Item2}</li>
                        <li>{(t as any).termsSection8Item3}</li>
                        <li>{(t as any).termsSection8Item4}</li>
                        <li>{(t as any).termsSection8Item5}</li>
                        <li>{(t as any).termsSection8Item6}</li>
                        <li>{(t as any).termsSection8Item7}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection9Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection9Item1}</li>
                        <li>{(t as any).termsSection9Item2}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection10Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection10Item1}</li>
                        <li>{(t as any).termsSection10Item2}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection11Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection11Item1}</li>
                        <li>{(t as any).termsSection11Item2}</li>
                        <li>{(t as any).termsSection11Item3}</li>
                        <li>{(t as any).termsSection11Item4}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection12Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection12Item1}</li>
                        <li>{(t as any).termsSection12Item2}</li>
                        <li>{(t as any).termsSection12Item3}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection13Title}</h2>
                    <p>{(t as any).termsSection13Content}</p>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsSection14Title}</h2>
                    <ul>
                        <li>{(t as any).termsSection14Item1}</li>
                        <li>{(t as any).termsSection14Item2}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{(t as any).termsContactTitle}</h2>
                    <p>{(t as any).termsContactContent}</p>
                </section>
            </div>
        </div>
    );
}
