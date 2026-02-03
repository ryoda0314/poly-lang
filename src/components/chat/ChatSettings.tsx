"use client";

import React from "react";
import { User, Users, Calendar, Sparkles, MapPin, MessageSquare } from "lucide-react";
import { useChatStore, SITUATION_PRESETS, Gender, Relationship, AgeGroup, Personality, LanguageStyle } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./ChatSettings.module.css";
import clsx from "clsx";

interface OptionButtonProps {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function OptionButton({ selected, onClick, children }: OptionButtonProps) {
    return (
        <button
            className={clsx(styles.optionBtn, selected && styles.optionBtnSelected)}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    );
}

export default function ChatSettings() {
    const { settings, updatePartnerSettings, setSituation } = useChatStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const genderOptions: { value: Gender; labelKey: string }[] = [
        { value: 'male', labelKey: 'chatGenderMale' },
        { value: 'female', labelKey: 'chatGenderFemale' },
        { value: 'unspecified', labelKey: 'chatGenderUnspecified' },
    ];

    const relationshipOptions: { value: Relationship; labelKey: string }[] = [
        { value: 'friend', labelKey: 'chatRelFriend' },
        { value: 'boss', labelKey: 'chatRelBoss' },
        { value: 'subordinate', labelKey: 'chatRelSubordinate' },
        { value: 'shopkeeper', labelKey: 'chatRelShopkeeper' },
        { value: 'teacher', labelKey: 'chatRelTeacher' },
        { value: 'stranger', labelKey: 'chatRelStranger' },
    ];

    const ageOptions: { value: AgeGroup; labelKey: string }[] = [
        { value: 'older', labelKey: 'chatAgeOlder' },
        { value: 'same', labelKey: 'chatAgeSame' },
        { value: 'younger', labelKey: 'chatAgeYounger' },
    ];

    const personalityOptions: { value: Personality; labelKey: string }[] = [
        { value: 'friendly', labelKey: 'chatPersonalityFriendly' },
        { value: 'formal', labelKey: 'chatPersonalityFormal' },
        { value: 'casual', labelKey: 'chatPersonalityCasual' },
        { value: 'strict', labelKey: 'chatPersonalityStrict' },
    ];

    const languageStyleOptions: { value: LanguageStyle; labelKey: string; descKey: string }[] = [
        { value: 'standard', labelKey: 'chatStyleStandard', descKey: 'chatStyleStandardDesc' },
        { value: 'texting', labelKey: 'chatStyleTexting', descKey: 'chatStyleTextingDesc' },
    ];

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

    return (
        <div className={styles.container}>
            {/* Partner Settings */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <User size={16} />
                    {getLabel('chatPartnerSettings', '会話相手')}
                </h3>

                {/* Gender */}
                <div className={styles.field}>
                    <label className={styles.label}>{getLabel('chatGender', '性別')}</label>
                    <div className={styles.options}>
                        {genderOptions.map((opt) => (
                            <OptionButton
                                key={opt.value}
                                selected={settings.partner.gender === opt.value}
                                onClick={() => updatePartnerSettings({ gender: opt.value })}
                            >
                                {getLabel(opt.labelKey, opt.value)}
                            </OptionButton>
                        ))}
                    </div>
                </div>

                {/* Relationship */}
                <div className={styles.field}>
                    <label className={styles.label}>{getLabel('chatRelationship', '関係性')}</label>
                    <div className={styles.options}>
                        {relationshipOptions.map((opt) => (
                            <OptionButton
                                key={opt.value}
                                selected={settings.partner.relationship === opt.value}
                                onClick={() => updatePartnerSettings({ relationship: opt.value })}
                            >
                                {getLabel(opt.labelKey, opt.value)}
                            </OptionButton>
                        ))}
                    </div>
                </div>

                {/* Age */}
                <div className={styles.field}>
                    <label className={styles.label}>{getLabel('chatAge', '年齢層')}</label>
                    <div className={styles.options}>
                        {ageOptions.map((opt) => (
                            <OptionButton
                                key={opt.value}
                                selected={settings.partner.ageGroup === opt.value}
                                onClick={() => updatePartnerSettings({ ageGroup: opt.value })}
                            >
                                {getLabel(opt.labelKey, opt.value)}
                            </OptionButton>
                        ))}
                    </div>
                </div>

                {/* Personality */}
                <div className={styles.field}>
                    <label className={styles.label}>{getLabel('chatPersonality', '性格')}</label>
                    <div className={styles.options}>
                        {personalityOptions.map((opt) => (
                            <OptionButton
                                key={opt.value}
                                selected={settings.partner.personality === opt.value}
                                onClick={() => updatePartnerSettings({ personality: opt.value })}
                            >
                                {getLabel(opt.labelKey, opt.value)}
                            </OptionButton>
                        ))}
                    </div>
                </div>
            </section>

            {/* Language Style */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <MessageSquare size={16} />
                    {getLabel('chatLanguageStyle', '言葉遣い')}
                </h3>
                <div className={styles.options}>
                    {languageStyleOptions.map((opt) => (
                        <OptionButton
                            key={opt.value}
                            selected={settings.partner.languageStyle === opt.value}
                            onClick={() => updatePartnerSettings({ languageStyle: opt.value })}
                        >
                            {getLabel(opt.labelKey, opt.value)}
                        </OptionButton>
                    ))}
                </div>
            </section>

            {/* Situation Settings */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <MapPin size={16} />
                    {getLabel('chatSituation', 'シチュエーション')}
                </h3>

                <div className={styles.situationGrid}>
                    {SITUATION_PRESETS.filter(p => p.id !== 'custom').map((preset) => (
                        <button
                            key={preset.id}
                            className={clsx(
                                styles.situationBtn,
                                settings.situationId === preset.id && styles.situationBtnSelected
                            )}
                            onClick={() => setSituation(preset.id)}
                        >
                            {getLabel(preset.labelKey, preset.description)}
                        </button>
                    ))}
                </div>

                {/* Custom Situation */}
                <div className={styles.customField}>
                    <label className={styles.label}>
                        <Sparkles size={14} />
                        {getLabel('chatCustomSituation', 'カスタム')}
                    </label>
                    <textarea
                        className={styles.textarea}
                        placeholder={getLabel('chatCustomPlaceholder', '例: 初めて会った人と趣味について話す')}
                        value={settings.customSituation}
                        onChange={(e) => setSituation('custom', e.target.value)}
                        onFocus={() => setSituation('custom', settings.customSituation)}
                        rows={2}
                    />
                </div>
            </section>
        </div>
    );
}
