"use client";

import React from "react";
import { useChatStore, SITUATION_PRESETS, Gender, Relationship, AgeGroup, Personality, LanguageStyle } from "@/store/chat-store";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./ChatSettings.module.css";
import clsx from "clsx";
import { Lightbulb, Smartphone } from "lucide-react";

export default function ChatSettings() {
    const { settings, updatePartnerSettings, setSituation, assistMode, setAssistMode, immersionMode, setImmersionMode } = useChatStore();
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const getLabel = (key: string, fallback: string) => {
        return (t as Record<string, string>)[key] || fallback;
    };

    const genderOptions: { value: Gender; label: string }[] = [
        { value: 'male', label: getLabel('chatGenderMale', '男性') },
        { value: 'female', label: getLabel('chatGenderFemale', '女性') },
        { value: 'unspecified', label: getLabel('chatGenderUnspecified', '指定なし') },
    ];

    const relationshipOptions: { value: Relationship; label: string }[] = [
        { value: 'friend', label: getLabel('chatRelFriend', '友人') },
        { value: 'boss', label: getLabel('chatRelBoss', '上司') },
        { value: 'subordinate', label: getLabel('chatRelSubordinate', '部下') },
        { value: 'shopkeeper', label: getLabel('chatRelShopkeeper', '店員') },
        { value: 'teacher', label: getLabel('chatRelTeacher', '先生') },
        { value: 'stranger', label: getLabel('chatRelStranger', '初対面') },
    ];

    const ageOptions: { value: AgeGroup; label: string }[] = [
        { value: 'older', label: getLabel('chatAgeOlder', '年上') },
        { value: 'same', label: getLabel('chatAgeSame', '同年代') },
        { value: 'younger', label: getLabel('chatAgeYounger', '年下') },
    ];

    const personalityOptions: { value: Personality; label: string }[] = [
        { value: 'friendly', label: getLabel('chatPersonalityFriendly', 'フレンドリー') },
        { value: 'formal', label: getLabel('chatPersonalityFormal', 'フォーマル') },
        { value: 'casual', label: getLabel('chatPersonalityCasual', 'カジュアル') },
        { value: 'strict', label: getLabel('chatPersonalityStrict', '厳しめ') },
    ];

    const styleOptions: { value: LanguageStyle; label: string }[] = [
        { value: 'standard', label: getLabel('chatStyleStandard', 'スタンダード') },
        { value: 'texting', label: getLabel('chatStyleTexting', 'チャット風') },
    ];

    const situations = SITUATION_PRESETS.filter(p => p.id !== 'custom').map(p => ({ value: p.id, label: getLabel(p.labelKey, p.description) }));

    return (
        <div className={styles.container}>
            <div className={styles.toggleRow}>
                <button
                    type="button"
                    className={clsx(styles.assistToggle, assistMode && styles.assistToggleActive)}
                    onClick={() => setAssistMode(!assistMode)}
                >
                    <Lightbulb size={18} />
                    <span>{getLabel('chatAssistMode', 'アシストモード')}</span>
                    <span className={styles.assistStatus}>
                        {assistMode ? getLabel('chatAssistOn', 'ON') : getLabel('chatAssistOff', 'OFF')}
                    </span>
                </button>

                <button
                    type="button"
                    className={clsx(styles.assistToggle, immersionMode && styles.assistToggleActive)}
                    onClick={() => setImmersionMode(!immersionMode)}
                >
                    <Smartphone size={18} />
                    <span>{getLabel('chatImmersionMode', '臨場感モード')}</span>
                    <span className={styles.assistStatus}>
                        {immersionMode ? getLabel('chatAssistOn', 'ON') : getLabel('chatAssistOff', 'OFF')}
                    </span>
                </button>
            </div>

            <div className={styles.group}>
                <span className={styles.groupLabel}>{getLabel('chatRelationship', '関係')}</span>
                <div className={styles.tags}>
                    {relationshipOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={clsx(styles.tag, settings.partner.relationship === o.value && styles.tagActive)}
                            onClick={() => updatePartnerSettings({ relationship: o.value })}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.group}>
                <span className={styles.groupLabel}>{getLabel('chatPersonality', '性格')}</span>
                <div className={styles.tags}>
                    {personalityOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={clsx(styles.tag, settings.partner.personality === o.value && styles.tagActive)}
                            onClick={() => updatePartnerSettings({ personality: o.value })}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.group}>
                    <span className={styles.groupLabel}>{getLabel('chatAge', '年齢')}</span>
                    <div className={styles.tags}>
                        {ageOptions.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className={clsx(styles.tag, settings.partner.ageGroup === o.value && styles.tagActive)}
                                onClick={() => updatePartnerSettings({ ageGroup: o.value })}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.group}>
                    <span className={styles.groupLabel}>{getLabel('chatGender', '性別')}</span>
                    <div className={styles.tags}>
                        {genderOptions.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className={clsx(styles.tag, settings.partner.gender === o.value && styles.tagActive)}
                                onClick={() => updatePartnerSettings({ gender: o.value })}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.group}>
                <span className={styles.groupLabel}>{getLabel('chatLanguageStyle', '言葉遣い')}</span>
                <div className={styles.tags}>
                    {styleOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={clsx(styles.tag, settings.partner.languageStyle === o.value && styles.tagActive)}
                            onClick={() => updatePartnerSettings({ languageStyle: o.value })}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.group}>
                <span className={styles.groupLabel}>{getLabel('chatSituation', '場面')}</span>
                <div className={styles.tags}>
                    {situations.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            className={clsx(styles.tag, settings.situationId === s.value && styles.tagActive)}
                            onClick={() => setSituation(s.value)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
