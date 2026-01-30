"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Send, Mic, Globe, Sparkles, Volume2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import s from "../page.module.css";
import { translations, NativeLanguage } from "@/lib/translations";

/* ─── Types ─── */
type TranslationsType = typeof translations[NativeLanguage];

/* ─── Language Options ─── */
const LANGUAGES: { code: NativeLanguage; label: string; flag: string }[] = [
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

/* ─── Language-Specific Data ─── */

// Scene 2 (Pivot): Baby learning target language
// Non-English speakers learn English, English speakers learn French
const PIVOT_DATA: Record<NativeLanguage, {
  syllables: { text: string; x: string; y: string }[];
  firstWord: string;
  words: { text: string; x: string; y: string; size: string }[];
  phrase1: string[];
  phrase2: string[];
}> = {
  // Japanese speakers learning English
  ja: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // English speakers learning French
  en: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "man", x: "56%", y: "40%" },
      { text: "lait", x: "30%", y: "58%" }, { text: "veux", x: "65%", y: "52%" }, { text: "où", x: "48%", y: "62%" },
    ],
    firstWord: "Maman",
    words: [
      { text: "lait", x: "30%", y: "35%", size: "1.5rem" },
      { text: "veux", x: "68%", y: "58%", size: "1.4rem" },
      { text: "chien", x: "25%", y: "65%", size: "1.6rem" },
      { text: "où", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Maman,", " du lait ", "s'il te plaît"],
    phrase2: ["Où est ", "le chien?"],
  },
  // Korean speakers learning English
  ko: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // Chinese speakers learning English
  zh: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // French speakers learning English
  fr: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // Spanish speakers learning English
  es: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // German speakers learning English
  de: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // Russian speakers learning English
  ru: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
  // Vietnamese speakers learning English
  vi: {
    syllables: [
      { text: "ma", x: "40%", y: "43%" }, { text: "ma", x: "56%", y: "40%" },
      { text: "milk", x: "30%", y: "58%" }, { text: "want", x: "65%", y: "52%" }, { text: "dog", x: "48%", y: "62%" },
    ],
    firstWord: "Mama",
    words: [
      { text: "milk", x: "30%", y: "35%", size: "1.5rem" },
      { text: "want", x: "68%", y: "58%", size: "1.4rem" },
      { text: "doggy", x: "25%", y: "65%", size: "1.6rem" },
      { text: "where", x: "72%", y: "30%", size: "1.3rem" },
    ],
    phrase1: ["Mama,", " milk ", "please"],
    phrase2: ["Where's ", "doggy?"],
  },
};

// Scene 3 (Grammar): Grammar rules being shown
// Non-English speakers see English grammar, English speakers see French grammar
const GRAMMAR_DATA: Record<NativeLanguage, {
  words: { word: string; label: string; sub: string }[];
  rules: { text: string; x: string; y: string; rotate: number }[];
}> = {
  // Japanese speakers learning English grammar
  ja: {
    words: [
      { word: "I", label: "主語", sub: "一人称" },
      { word: "eat", label: "動詞", sub: "他動詞" },
      { word: "sushi", label: "目的語", sub: "名詞" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "現在形・過去形", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "能動態 ↔ 受動態", x: "22%", y: "75%", rotate: -2 },
      { text: "過去・現在・未来", x: "72%", y: "78%", rotate: 4 },
      { text: "不定詞・動名詞", x: "45%", y: "15%", rotate: -1 },
      { text: "助動詞", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // English speakers learning French grammar
  en: {
    words: [
      { word: "Je", label: "Subject", sub: "1st person" },
      { word: "mange", label: "Verb", sub: "Transitive" },
      { word: "des sushis", label: "Object", sub: "Partitive" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "manger → mangé", x: "75%", y: "20%", rotate: 2 },
      { text: "Présent · Passé", x: "10%", y: "55%", rotate: -4 },
      { text: "le / la / les / du", x: "82%", y: "52%", rotate: 3 },
      { text: "Actif ↔ Passif", x: "22%", y: "75%", rotate: -2 },
      { text: "Imparfait · P. Composé", x: "72%", y: "78%", rotate: 4 },
      { text: "Subjonctif", x: "45%", y: "15%", rotate: -1 },
      { text: "Accord du participe", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // Korean speakers learning English grammar
  ko: {
    words: [
      { word: "I", label: "주어", sub: "1인칭" },
      { word: "eat", label: "동사", sub: "타동사" },
      { word: "sushi", label: "목적어", sub: "명사" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "현재형 · 과거형", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "능동태 ↔ 수동태", x: "22%", y: "75%", rotate: -2 },
      { text: "과거 · 현재 · 미래", x: "72%", y: "78%", rotate: 4 },
      { text: "부정사 · 동명사", x: "45%", y: "15%", rotate: -1 },
      { text: "조동사", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // Chinese speakers learning English grammar
  zh: {
    words: [
      { word: "I", label: "主语", sub: "第一人称" },
      { word: "eat", label: "动词", sub: "及物动词" },
      { word: "sushi", label: "宾语", sub: "名词" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "现在时 · 过去时", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "主动语态 ↔ 被动语态", x: "22%", y: "75%", rotate: -2 },
      { text: "过去 · 现在 · 将来", x: "72%", y: "78%", rotate: 4 },
      { text: "不定式 · 动名词", x: "45%", y: "15%", rotate: -1 },
      { text: "情态动词", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // French speakers learning English grammar
  fr: {
    words: [
      { word: "I", label: "Sujet", sub: "1ère pers." },
      { word: "eat", label: "Verbe", sub: "Transitif" },
      { word: "sushi", label: "COD", sub: "Nom" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "Present · Past", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "Active ↔ Passive", x: "22%", y: "75%", rotate: -2 },
      { text: "Past · Present · Future", x: "72%", y: "78%", rotate: 4 },
      { text: "Infinitive · Gerund", x: "45%", y: "15%", rotate: -1 },
      { text: "Modal Verbs", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // Spanish speakers learning English grammar
  es: {
    words: [
      { word: "I", label: "Sujeto", sub: "1ª persona" },
      { word: "eat", label: "Verbo", sub: "Transitivo" },
      { word: "sushi", label: "OD", sub: "Sustantivo" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "Presente · Pasado", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "Activa ↔ Pasiva", x: "22%", y: "75%", rotate: -2 },
      { text: "Pasado · Presente · Futuro", x: "72%", y: "78%", rotate: 4 },
      { text: "Infinitivo · Gerundio", x: "45%", y: "15%", rotate: -1 },
      { text: "Verbos modales", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // German speakers learning English grammar
  de: {
    words: [
      { word: "I", label: "Subjekt", sub: "1. Person" },
      { word: "eat", label: "Verb", sub: "Transitiv" },
      { word: "sushi", label: "Objekt", sub: "Nomen" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "Präsens · Präteritum", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "Aktiv ↔ Passiv", x: "22%", y: "75%", rotate: -2 },
      { text: "Vergangenheit · Gegenwart", x: "72%", y: "78%", rotate: 4 },
      { text: "Infinitiv · Gerundium", x: "45%", y: "15%", rotate: -1 },
      { text: "Modalverben", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // Russian speakers learning English grammar
  ru: {
    words: [
      { word: "I", label: "Подлежащее", sub: "1-е лицо" },
      { word: "eat", label: "Глагол", sub: "Переходный" },
      { word: "sushi", label: "Дополнение", sub: "Сущ." },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "Настоящее · Прошедшее", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "Актив ↔ Пассив", x: "22%", y: "75%", rotate: -2 },
      { text: "Прошлое · Настоящее", x: "72%", y: "78%", rotate: 4 },
      { text: "Инфинитив · Герундий", x: "45%", y: "15%", rotate: -1 },
      { text: "Модальные глаголы", x: "50%", y: "82%", rotate: 1 },
    ],
  },
  // Vietnamese speakers learning English grammar
  vi: {
    words: [
      { word: "I", label: "Chủ ngữ", sub: "Ngôi 1" },
      { word: "eat", label: "Động từ", sub: "Ngoại động" },
      { word: "sushi", label: "Tân ngữ", sub: "Danh từ" },
    ],
    rules: [
      { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
      { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
      { text: "Hiện tại · Quá khứ", x: "10%", y: "55%", rotate: -4 },
      { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
      { text: "Chủ động ↔ Bị động", x: "22%", y: "75%", rotate: -2 },
      { text: "Quá khứ · Hiện tại", x: "72%", y: "78%", rotate: 4 },
      { text: "Động từ nguyên mẫu", x: "45%", y: "15%", rotate: -1 },
      { text: "Động từ khuyết thiếu", x: "50%", y: "82%", rotate: 1 },
    ],
  },
};

// Scene 4 (Awareness): Pattern discovery
// Non-English speakers discover English patterns, English speakers discover French patterns
const AWARENESS_DATA: Record<NativeLanguage, {
  phrases: { before: string; highlight: string; translation: string }[];
  pattern: string;
  meaning: string;
}> = {
  // Japanese speakers discovering English "want to" pattern
  ja: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "食べたい" },
      { before: "I ", highlight: "want to go", translation: "行きたい" },
      { before: "I ", highlight: "want to learn", translation: "学びたい" },
    ],
    pattern: "want to ~",
    meaning: "= 〜したい",
  },
  // English speakers discovering French "vouloir" pattern
  en: {
    phrases: [
      { before: "Je ", highlight: "veux manger", translation: "I want to eat" },
      { before: "Je ", highlight: "veux partir", translation: "I want to leave" },
      { before: "Je ", highlight: "veux apprendre", translation: "I want to learn" },
    ],
    pattern: "vouloir + inf",
    meaning: "= want to ~",
  },
  // Korean speakers discovering English "want to" pattern
  ko: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "먹고 싶어" },
      { before: "I ", highlight: "want to go", translation: "가고 싶어" },
      { before: "I ", highlight: "want to learn", translation: "배우고 싶어" },
    ],
    pattern: "want to ~",
    meaning: "= ~고 싶다",
  },
  // Chinese speakers discovering English "want to" pattern
  zh: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "想吃" },
      { before: "I ", highlight: "want to go", translation: "想去" },
      { before: "I ", highlight: "want to learn", translation: "想学" },
    ],
    pattern: "want to ~",
    meaning: "= 想 + V",
  },
  // French speakers discovering English "want to" pattern
  fr: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "Je veux manger" },
      { before: "I ", highlight: "want to go", translation: "Je veux partir" },
      { before: "I ", highlight: "want to learn", translation: "Je veux apprendre" },
    ],
    pattern: "want to ~",
    meaning: "= vouloir + inf",
  },
  // Spanish speakers discovering English "want to" pattern
  es: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "Quiero comer" },
      { before: "I ", highlight: "want to go", translation: "Quiero ir" },
      { before: "I ", highlight: "want to learn", translation: "Quiero aprender" },
    ],
    pattern: "want to ~",
    meaning: "= querer + inf",
  },
  // German speakers discovering English "want to" pattern
  de: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "Ich will essen" },
      { before: "I ", highlight: "want to go", translation: "Ich will gehen" },
      { before: "I ", highlight: "want to learn", translation: "Ich will lernen" },
    ],
    pattern: "want to ~",
    meaning: "= wollen + inf",
  },
  // Russian speakers discovering English "want to" pattern
  ru: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "Я хочу есть" },
      { before: "I ", highlight: "want to go", translation: "Я хочу пойти" },
      { before: "I ", highlight: "want to learn", translation: "Я хочу учить" },
    ],
    pattern: "want to ~",
    meaning: "= хотеть + inf",
  },
  // Vietnamese speakers discovering English "want to" pattern
  vi: {
    phrases: [
      { before: "I ", highlight: "want to eat", translation: "Tôi muốn ăn" },
      { before: "I ", highlight: "want to go", translation: "Tôi muốn đi" },
      { before: "I ", highlight: "want to learn", translation: "Tôi muốn học" },
    ],
    pattern: "want to ~",
    meaning: "= muốn + V",
  },
};

// Scene 5 (Try It): Using the pattern
// Non-English speakers practice English, English speakers practice French
const TRYIT_DATA: Record<NativeLanguage, {
  pattern: string;
  example: string;
  exampleMeaning: string;
  attemptWords: string[];
}> = {
  ja: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= 食べたい", attemptWords: ["I", "want", "to eat", "sushi..."] },
  en: { pattern: "vouloir + inf", example: "veux manger", exampleMeaning: "= want to eat", attemptWords: ["Je", "veux", "manger..."] },
  ko: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= 먹고 싶어", attemptWords: ["I", "want", "to eat", "sushi..."] },
  zh: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= 想吃", attemptWords: ["I", "want", "to eat", "sushi..."] },
  fr: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= veux manger", attemptWords: ["I", "want", "to eat", "sushi..."] },
  es: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= quiero comer", attemptWords: ["I", "want", "to eat", "sushi..."] },
  de: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= will essen", attemptWords: ["I", "want", "to eat", "sushi..."] },
  ru: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= хочу есть", attemptWords: ["I", "want", "to eat", "sushi..."] },
  vi: { pattern: "want to ~", example: "want to eat", exampleMeaning: "= muốn ăn", attemptWords: ["I", "want", "to eat", "sushi..."] },
};

// Scene 6 (AI Correction): Common learner mistakes
// Non-English speakers make English mistakes, English speakers make French mistakes
const CORRECTION_DATA: Record<NativeLanguage, {
  inputText: string;
  yourAttemptText: { before: string; error: string; after: string };
  correctedText: { before: string; fix: string; after: string };
  translation: string;
  score: number;
}> = {
  // Japanese speaker making English mistake
  ja: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "お寿司が食べたい",
    score: 68,
  },
  // English speaker making French mistake
  en: {
    inputText: "Je veux mange sushi",
    yourAttemptText: { before: "Je veux ", error: "mange", after: " sushi" },
    correctedText: { before: "Je veux ", fix: "manger des", after: " sushis" },
    translation: "I want to eat sushi",
    score: 60,
  },
  // Korean speaker making English mistake
  ko: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "초밥을 먹고 싶어",
    score: 68,
  },
  // Chinese speaker making English mistake
  zh: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "我想吃寿司",
    score: 68,
  },
  // French speaker making English mistake
  fr: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "Je veux manger des sushis",
    score: 68,
  },
  // Spanish speaker making English mistake
  es: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "Quiero comer sushi",
    score: 68,
  },
  // German speaker making English mistake
  de: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "Ich will Sushi essen",
    score: 68,
  },
  // Russian speaker making English mistake
  ru: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "Я хочу есть суши",
    score: 68,
  },
  // Vietnamese speaker making English mistake
  vi: {
    inputText: "I want eat sushi",
    yourAttemptText: { before: "I want ", error: "eat", after: " sushi" },
    correctedText: { before: "I want ", fix: "to eat", after: " sushi" },
    translation: "Tôi muốn ăn sushi",
    score: 68,
  },
};

const SOUND_DOTS = [
  { x: "20%", y: "30%" }, { x: "45%", y: "22%" }, { x: "72%", y: "35%" },
  { x: "15%", y: "55%" }, { x: "50%", y: "48%" }, { x: "82%", y: "52%" },
  { x: "30%", y: "72%" }, { x: "62%", y: "68%" }, { x: "85%", y: "25%" },
  { x: "38%", y: "40%" }, { x: "58%", y: "58%" }, { x: "25%", y: "42%" },
];

const PHRASE_LANGS = [
  { code: "EN", text: "I want to eat sushi" },
  { code: "JA", text: "お寿司が食べたい" },
  { code: "KO", text: "초밥을 먹고 싶어요" },
  { code: "ZH", text: "我想吃寿司" },
  { code: "FR", text: "Je veux manger des sushis" },
  { code: "ES", text: "Quiero comer sushi" },
  { code: "DE", text: "Ich will Sushi essen" },
  { code: "RU", text: "Хочу есть суши" },
  { code: "VI", text: "Tôi muốn ăn sushi" },
];

const ALL_LANG_CODES = ["EN", "JA", "KO", "ZH", "FR", "ES", "DE", "RU", "VI"];

const SCENE_DURATIONS = [4000, 13500, 10500, 11500, 7000, 10500, 13000, 8500, Infinity];
const TOTAL_SCENES = SCENE_DURATIONS.length;

/* ─── Scene Components ─── */

function SceneOpening({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTitle(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className={s.openingDot}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{ scale: 80, opacity: 0.08 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <AnimatePresence>
        {showTitle && (
          <motion.h1
            className={s.openingTitle}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            PolyLinga
          </motion.h1>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SceneGrammarRejection({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);
  const grammarData = GRAMMAR_DATA[lang];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 6200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isDimmed = step >= 3;

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <AnimatePresence mode="wait">
        {step < 4 ? (
          <motion.div
            key="grammar"
            className={s.grammarStage}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            <div className={s.grammarSentence}>
              {grammarData.words.map((gw, i) => {
                const fallDrift = [-35, 8, 45][i];
                const fallRotate = [-18, 4, 22][i];
                return (
                  <motion.div
                    key={gw.word}
                    className={s.grammarWord}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{
                      opacity: isDimmed ? 0 : 1,
                      y: isDimmed ? 650 : 0,
                      x: isDimmed ? fallDrift : 0,
                      rotate: isDimmed ? fallRotate : 0,
                      filter: isDimmed ? "blur(2px)" : "blur(0px)",
                    }}
                    transition={
                      isDimmed
                        ? { duration: 0.9, delay: i * 0.06, ease: [0.42, 0, 1, 1] }
                        : { duration: 0.5, delay: i * 0.15 }
                    }
                  >
                    <span className={s.grammarWordText}>{gw.word}</span>
                    <motion.span
                      className={s.grammarBracket}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{
                        opacity: step >= 1 ? (isDimmed ? 0.15 : 1) : 0,
                        y: 0,
                      }}
                      transition={{ delay: i * 0.12, duration: 0.4 }}
                    >
                      {gw.label}
                    </motion.span>
                    <motion.span
                      className={s.grammarBracketSub}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{
                        opacity: step >= 1 ? (isDimmed ? 0.1 : 0.6) : 0,
                        y: 0,
                      }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
                    >
                      {gw.sub}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>

            {grammarData.rules.map((rule, i) => (
              <motion.div
                key={rule.text}
                className={s.scatteredRule}
                style={{
                  left: rule.x,
                  top: rule.y,
                  rotate: rule.rotate,
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: step >= 2 ? (isDimmed ? 0 : 0.85) : 0,
                  scale: step >= 2 ? 1 : 0.7,
                  y: isDimmed ? 500 : 0,
                  filter: isDimmed ? "blur(3px)" : "blur(0px)",
                }}
                transition={
                  isDimmed
                    ? { duration: 0.8, delay: i * 0.04, ease: [0.42, 0, 1, 1] }
                    : { duration: 0.45, delay: step === 2 ? i * 0.08 : 0 }
                }
              >
                {rule.text}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="rejection"
            className={s.rejectionMessage}
            initial={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.0 }}
            style={{ whiteSpace: "pre-line" }}
          >
            {(t as any).intro_grammarRejection}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScenePivot({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);
  const pivotData = PIVOT_DATA[lang];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(4), 6000),
      setTimeout(() => setStep(5), 8200),
      setTimeout(() => setStep(6), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.pivotStage}>
        {SOUND_DOTS.map((dot, i) => (
          <motion.div
            key={`dot-${i}`}
            className={s.soundDot}
            style={{ left: dot.x, top: dot.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: step < 2 ? 0.4 : 0,
              scale: step < 2 ? 1 : 0,
            }}
            transition={{ delay: step === 0 ? i * 0.06 : 0, duration: 0.5 }}
          >
            <motion.div
              className={s.soundDotPulse}
              animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2 + i * 0.15, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>
        ))}

        {pivotData.syllables.map((syl, i) => (
          <motion.div
            key={`syl-${i}`}
            className={s.pivotSyllable}
            style={{ left: syl.x, top: syl.y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: step === 1 ? 0.7 : 0,
              scale: step === 1 ? 1 : 0.5,
            }}
            transition={{ delay: step === 1 ? i * 0.15 : 0, duration: 0.4 }}
          >
            {syl.text}
          </motion.div>
        ))}

        <AnimatePresence>
          {step >= 2 && step < 4 && (
            <motion.div
              className={s.pivotFirstWord}
              style={{ left: "50%", top: "45%" }}
              initial={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.7, type: "spring", stiffness: 150, damping: 20 }}
            >
              <motion.span
                style={{ display: "block" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ delay: 0.7, duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {pivotData.firstWord}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {pivotData.words.map((w, i) => (
          <AnimatePresence key={w.text}>
            {step >= 3 && step < 4 && (
              <motion.div
                className={s.pivotWord}
                style={{ left: w.x, top: w.y, fontSize: w.size }}
                initial={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
              >
                <motion.span
                  style={{ display: "block" }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    delay: i * 0.2 + 0.6,
                    duration: 2.5 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {w.text}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        <AnimatePresence>
          {step >= 4 && step < 6 && (
            <motion.div
              className={s.pivotPhrase}
              style={{ top: "42%" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {pivotData.phrase1.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 5 && step < 6 && (
            <motion.div
              className={s.pivotPhrase}
              style={{ top: "55%" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.8 }}
            >
              {pivotData.phrase2.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.25, duration: 0.5 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 6 && (
            <motion.p
              className={s.pivotMessage}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.3 }}
            >
              {(t as any).intro_pivotMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAICorrection({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const correctionData = CORRECTION_DATA[lang];
  const INPUT_TEXT = correctionData.inputText;

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2200),
      setTimeout(() => setStep(2), 3200),
      setTimeout(() => setStep(3), 4200),
      setTimeout(() => setStep(4), 5600),
      setTimeout(() => setStep(5), 6900),
      setTimeout(() => setStep(6), 8900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < INPUT_TEXT.length; i++) {
      timers.push(setTimeout(() => setCharCount(i + 1), 400 + i * 100));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const STARS = [1, 2, 3, 4, 5];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.correctionContent}>
        <AnimatePresence mode="wait">
          {step < 2 && (
            <motion.div
              key="input"
              className={s.inputBar}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className={s.inputText}>
                {INPUT_TEXT.slice(0, charCount)}
                {step < 1 && <span className={s.inputCursor}>|</span>}
              </div>
              <motion.div
                className={s.sendButton}
                animate={step >= 1 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Send size={18} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              className={s.mockCard}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            >
              <div className={s.cardLabel}>{t.yourAttempt}</div>
              <div className={s.cardText}>
                {correctionData.yourAttemptText.before}
                <span className={step >= 5 ? s.diffDelete : ""}>{correctionData.yourAttemptText.error}</span>
                {correctionData.yourAttemptText.after}
              </div>

              <AnimatePresence>
                {step >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={s.cardDivider} />
                    <div className={s.scoreLabel}>{t.naturalnessScore}</div>
                    <div className={s.scoreRow}>
                      <div className={s.starRating}>
                        {STARS.map((star) => (
                          <motion.span
                            key={star}
                            className={star <= 3 ? s.starFilled : s.starEmpty}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: star * 0.1,
                              duration: 0.3,
                              type: "spring",
                              stiffness: 300,
                            }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                      <motion.span
                        className={s.scoreValue}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                      >
                        {correctionData.score}
                      </motion.span>
                    </div>
                    <motion.p
                      className={s.scoreSummary}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      {(t as any).intro_missingPreposition}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === 4 && (
            <motion.div
              className={s.loadingDots}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={s.loadingDot}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              className={s.connector}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ArrowDown size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              className={`${s.mockCard} ${s.mockCardAccent}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            >
              <div className={s.cardLabel}>{t.betterPhrasing}</div>
              <div className={s.cardText}>
                {correctionData.correctedText.before}
                <span className={s.diffInsert}>{correctionData.correctedText.fix}</span>
                {correctionData.correctedText.after}
              </div>
              <div className={s.cardTranslation}>{correctionData.translation}</div>
              <div className={s.whyBetter}>
                <div className={s.whyBetterTitle}>{t.whyBetter}</div>
                <p className={s.whyBetterText}>
                  {(t as any).intro_grammarHint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 6 && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>{(t as any).intro_aiCorrectionLabel}</span>
              <span className={s.featureSubtitle}>{(t as any).intro_aiCorrectionSub}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ScenePractice({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);

  const CYCLE_ITEMS = [
    (t as any).intro_cycleExplore,
    (t as any).intro_cycleGuess,
    (t as any).intro_cycleOutput,
    (t as any).intro_cycleCorrect,
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => setStep(4), 3800),
      setTimeout(() => setStep(5), 5000),
      setTimeout(() => setStep(6), 8000),
      setTimeout(() => setStep(7), 9500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const positions = [
    { x: 0, y: -100 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
    { x: -100, y: 0 },
  ];

  const smoothEase = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className={s.practiceContent}>
        <AnimatePresence mode="wait">
          {step >= 1 && step < 7 && (
            <motion.div
              className={s.refinedFlow}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                filter: "blur(12px)",
                transition: { duration: 1.2, ease: smoothEase }
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className={s.refinedAmbient}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: [0.1, 0.25, 0.1],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className={s.refinedRing}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{
                  opacity: step >= 4 ? 0.4 : 0.15,
                  scale: 1,
                }}
                transition={{ duration: 1.5, ease: smoothEase }}
              />

              <AnimatePresence>
                {step >= 5 && step < 6 && (
                  <motion.div
                    className={s.refinedOrbit}
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      rotate: 360,
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.8, ease: "easeInOut" }
                    }}
                    transition={{
                      opacity: { duration: 0.5, ease: "easeOut" },
                      rotate: {
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                  >
                    <motion.div
                      className={s.refinedParticle}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {CYCLE_ITEMS.map((item, i) => {
                const isVisible = step >= i + 1;
                const isConverging = step >= 6;
                const pos = positions[i];

                return (
                  <motion.div
                    key={item}
                    className={s.refinedItem}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      x: 0,
                      y: 0,
                    }}
                    animate={{
                      opacity: isConverging ? 0 : isVisible ? 1 : 0,
                      scale: isConverging ? 0.7 : isVisible ? 1 : 0.8,
                      x: isConverging ? 0 : isVisible ? pos.x : 0,
                      y: isConverging ? 0 : isVisible ? pos.y : 0,
                    }}
                    transition={{
                      duration: 1.2,
                      ease: smoothEase,
                    }}
                  >
                    <motion.span
                      animate={{
                        opacity: step >= 5 && step < 6 ? [1, 0.7, 1] : 1,
                      }}
                      transition={{
                        duration: 3,
                        repeat: step >= 5 && step < 6 ? Infinity : 0,
                        delay: i * 0.75,
                        ease: "easeInOut",
                      }}
                    >
                      {item}
                    </motion.span>
                  </motion.div>
                );
              })}

              <svg className={s.refinedLines} viewBox="0 0 260 260">
                {[0, 1, 2, 3].map((i) => {
                  const cx = 130;
                  const cy = 130;
                  const r = 100;

                  const startAngle = -90 + i * 90 + 12;
                  const endAngle = -90 + i * 90 + 78;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);

                  const isLineVisible = step >= i + 2 && step < 6;

                  return (
                    <motion.path
                      key={i}
                      d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: isLineVisible ? 1 : 0,
                        opacity: isLineVisible ? 0.3 : 0,
                      }}
                      transition={{
                        duration: 1.2,
                        ease: smoothEase,
                      }}
                    />
                  );
                })}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 7 && (
            <motion.div
              className={s.practiceMessageWrap}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.p
                className={s.practiceMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: smoothEase }}
              >
                {(t as any).intro_practiceMessage}
              </motion.p>
              <motion.p
                className={s.practiceSubMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: smoothEase }}
              >
                {(t as any).intro_practiceSubMessage}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneMultilingual({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [langIdx, setLangIdx] = useState(0);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIdx((prev) => (prev + 1) % PHRASE_LANGS.length);
    }, 900);
    const timer = setTimeout(() => setShowLabel(true), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const current = PHRASE_LANGS[langIdx];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.multilingualContent}>
        <motion.div
          className={s.phraseCardMorph}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.code}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <span className={s.morphLangCode}>{current.code}</span>
              <span className={s.morphText}>{current.text}</span>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className={s.playPulse}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Volume2 size={20} />
          </motion.div>
        </motion.div>

        <div className={s.languageBadges}>
          {ALL_LANG_CODES.map((code) => (
            <div
              key={code}
              className={`${s.languageBadge} ${code === current.code ? s.languageBadgeActive : ""}`}
            >
              {code}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showLabel && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>{(t as any).intro_multilingualLabel}</span>
              <span className={s.featureSubtitle}>{(t as any).intro_multilingualSub}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAwareness({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [highlightOn, setHighlightOn] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const awarenessData = AWARENESS_DATA[lang];

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleCount(1), 600),
      setTimeout(() => setVisibleCount(2), 1800),
      setTimeout(() => setVisibleCount(3), 3000),
      setTimeout(() => setHighlightOn(true), 4800),
      setTimeout(() => setShowDiscovery(true), 6400),
      setTimeout(() => setShowLabel(true), 7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.discoveryContent}>
        <div className={s.discoveryPhrases}>
          {awarenessData.phrases.map((phrase, i) => (
            <AnimatePresence key={i}>
              {visibleCount > i && (
                <motion.div
                  className={s.discoveryRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, type: "spring", stiffness: 140, damping: 20 }}
                >
                  <span className={s.discoveryBefore}>{phrase.before}</span>
                  <span
                    className={`${s.discoveryHighlight} ${highlightOn ? s.discoveryHighlightActive : ""}`}
                  >
                    {phrase.highlight}
                  </span>
                  <span className={s.discoveryTranslation}>{phrase.translation}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {highlightOn && (
            <motion.div
              className={s.discoveryConnector}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDiscovery && (
            <motion.div
              className={s.discoveryCard}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            >
              <span className={s.discoveryPattern}>{awarenessData.pattern}</span>
              <span className={s.discoveryMeaning}>{awarenessData.meaning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLabel && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>{(t as any).intro_awarenessLabel}</span>
              <span className={s.featureSubtitle}>{(t as any).intro_awarenessSub}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneTryIt({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);
  const tryItData = TRYIT_DATA[lang];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.tryItContent}>
        <motion.div
          className={s.tryItPattern}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: step < 3 ? 1 : 0,
            scale: 1,
            y: step >= 2 ? -20 : 0,
          }}
          transition={{ duration: 0.6 }}
        >
          {tryItData.pattern}
        </motion.div>

        <AnimatePresence>
          {step >= 1 && step < 3 && (
            <motion.div
              className={s.tryItWord}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6 }}
            >
              <span className={s.tryItWordMain}>{tryItData.example}</span>
              <span className={s.tryItWordSub}>{tryItData.exampleMeaning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && step < 3 && (
            <motion.div
              className={s.tryItAttempt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {tryItData.attemptWords.map((word, i) => (
                <motion.span
                  key={word}
                  className={s.tryItAttemptWord}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 3 && (
            <motion.p
              className={s.tryItMessage}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.2 }}
            >
              {(t as any).intro_tryItMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneFinal({ t, lang }: { t: TranslationsType; lang: NativeLanguage }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const FEATURES = [
    { icon: Sparkles, label: (t as any).intro_featureAwareness },
    { icon: Mic, label: (t as any).intro_featureCorrection },
    { icon: Globe, label: (t as any).intro_featureLanguages },
  ];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className={s.finalContent}>
        <motion.div className={s.finalLogo}>
          {"PolyLinga".split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        <AnimatePresence>
          {step >= 1 && (
            <motion.p
              className={s.finalTagline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9 }}
            >
              {(t as any).intro_tagline}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              className={s.featurePills}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className={s.featurePill}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  <f.icon size={16} />
                  {f.label}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <motion.button
                className={s.ctaButton}
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(217, 69, 40, 0)",
                    "0 0 0 10px rgba(217, 69, 40, 0.12)",
                    "0 0 0 0px rgba(217, 69, 40, 0)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {(t as any).intro_getStarted}
              </motion.button>
              <p className={s.signInLink}>
                {(t as any).intro_alreadyHaveAccount}{" "}
                <span style={{ color: "var(--color-accent)", cursor: "pointer" }}>{(t as any).intro_signIn}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
const SCENES = [
  SceneOpening,
  ScenePivot,
  SceneGrammarRejection,
  SceneAwareness,
  SceneTryIt,
  SceneAICorrection,
  ScenePractice,
  SceneMultilingual,
  SceneFinal,
];

const SCENE_NAMES = [
  "Opening",
  "Pivot",
  "Grammar",
  "Awareness",
  "Try It",
  "AI Correction",
  "Practice",
  "Multilingual",
  "Final",
];

export default function PreviewPage() {
  const [scene, setScene] = useState(0);
  const [lang, setLang] = useState<NativeLanguage>("ja");
  const [autoPlay, setAutoPlay] = useState(false);
  const [key, setKey] = useState(0);

  const t = translations[lang];

  // Auto-advance scenes
  useEffect(() => {
    if (!autoPlay) return;
    const duration = SCENE_DURATIONS[scene];
    if (duration === Infinity) {
      setAutoPlay(false);
      return;
    }
    const timer = setTimeout(() => setScene((s) => s + 1), duration);
    return () => clearTimeout(timer);
  }, [scene, autoPlay]);

  const restart = () => {
    setScene(0);
    setKey((k) => k + 1);
    setAutoPlay(true);
  };

  const goToScene = (index: number) => {
    setScene(index);
    setKey((k) => k + 1);
    setAutoPlay(false);
  };

  const prevScene = () => {
    if (scene > 0) {
      setScene(scene - 1);
      setKey((k) => k + 1);
      setAutoPlay(false);
    }
  };

  const nextScene = () => {
    if (scene < TOTAL_SCENES - 1) {
      setScene(scene + 1);
      setKey((k) => k + 1);
      setAutoPlay(false);
    }
  };

  const CurrentScene = SCENES[scene];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "20px" }}>
      {/* Language Selector */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "16px",
        flexWrap: "wrap",
      }}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => {
              setLang(l.code);
              setKey((k) => k + 1);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "9999px",
              background: lang === l.code ? "var(--color-accent)" : "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: lang === l.code ? "white" : "var(--color-fg)",
              cursor: "pointer",
              fontWeight: lang === l.code ? 600 : 400,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Scene Selector */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "16px",
        flexWrap: "wrap",
      }}>
        {SCENE_NAMES.map((name, i) => (
          <button
            key={name}
            onClick={() => goToScene(i)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: scene === i ? "var(--color-accent)" : "var(--color-bg-alt)",
              border: "1px solid var(--color-border)",
              color: scene === i ? "white" : "var(--color-fg-muted)",
              cursor: "pointer",
              fontWeight: scene === i ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            {i + 1}. {name}
          </button>
        ))}
      </div>

      {/* Main Preview */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "500px",
        aspectRatio: "9 / 16",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
      }}>
        <div className={s.squareFrame} style={{ position: "absolute", inset: 0 }}>
          <AnimatePresence mode="wait">
            <CurrentScene key={`${scene}-${key}`} t={t} lang={lang} />
          </AnimatePresence>

          <div className={s.progressDots}>
            {SCENES.map((_, i) => (
              <div
                key={i}
                className={`${s.progressDot} ${i === scene ? s.progressDotActive : ""}`}
                onClick={() => goToScene(i)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        marginTop: "20px",
      }}>
        <button
          onClick={prevScene}
          disabled={scene === 0}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: scene === 0 ? "var(--color-fg-muted)" : "var(--color-fg)",
            cursor: scene === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ChevronLeft size={18} />
          Prev
        </button>
        <button
          onClick={restart}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "var(--color-accent)",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RotateCcw size={18} />
          Restart (Auto)
        </button>
        <button
          onClick={nextScene}
          disabled={scene === TOTAL_SCENES - 1}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: scene === TOTAL_SCENES - 1 ? "var(--color-fg-muted)" : "var(--color-fg)",
            cursor: scene === TOTAL_SCENES - 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Current Language Info */}
      <div style={{
        textAlign: "center",
        marginTop: "20px",
        color: "var(--color-fg-muted)",
        fontSize: "0.9rem",
      }}>
        Current Language: <strong>{LANGUAGES.find(l => l.code === lang)?.flag} {LANGUAGES.find(l => l.code === lang)?.label}</strong>
        {" | "}
        Scene: <strong>{scene + 1}/{TOTAL_SCENES}</strong>
        {autoPlay && " | ▶️ Auto-playing"}
      </div>
    </div>
  );
}
