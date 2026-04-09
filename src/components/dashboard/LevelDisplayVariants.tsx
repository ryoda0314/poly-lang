"use client";

import { useState } from "react";
import { Flame, Star, Trophy, Sparkles, Target, TrendingUp } from "lucide-react";
import styles from "./LevelDisplayVariants.module.css";

interface LevelData {
    level: number;
    title: string;
    currentXp: number;
    nextLevelXp: number;
    progressPercent: number;
    totalWords: number;
    streak: number;
}

const mockData: LevelData = {
    level: 7,
    title: "熟練者",
    currentXp: 2450,
    nextLevelXp: 3000,
    progressPercent: 81.7,
    totalWords: 342,
    streak: 12,
};

// ============================================
// A: ウォームバー
// ============================================
function VariantA({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>A</div>
            <div className={styles.aHeader}>
                <div className={styles.aLevelBadge}>Lv.{data.level}</div>
                <span className={styles.aTitle}>{data.title}</span>
            </div>
            <div className={styles.aBarWrapper}>
                <div className={styles.aBar}>
                    <div className={styles.aProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.aXp}>{data.currentXp} XP</span>
            </div>
            <div className={styles.aFooter}>
                <div className={styles.aStat}>
                    <Flame size={14} />
                    <span>{data.streak}日連続</span>
                </div>
                <span className={styles.aNext}>次まで {Math.ceil(data.nextLevelXp - data.currentXp)} XP</span>
            </div>
        </div>
    );
}

// ============================================
// B: レベルフォーカス
// ============================================
function VariantB({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>B</div>
            <div className={styles.bLayout}>
                <div className={styles.bLevelCircle}>
                    <span className={styles.bLevelNum}>{data.level}</span>
                </div>
                <div className={styles.bContent}>
                    <div className={styles.bTitle}>{data.title}</div>
                    <div className={styles.bBar}>
                        <div className={styles.bProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                    <div className={styles.bMeta}>
                        <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                        <span className={styles.bStreak}><Flame size={12} /> {data.streak}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// C: カード分割
// ============================================
function VariantC({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cCard}`}>
            <div className={styles.variantLabel}>C</div>
            <div className={styles.cLeft}>
                <span className={styles.cLevelNum}>{data.level}</span>
                <span className={styles.cLevelLabel}>LEVEL</span>
            </div>
            <div className={styles.cRight}>
                <div className={styles.cTitle}>{data.title}</div>
                <div className={styles.cXpRow}>
                    <span className={styles.cXpCurrent}>{data.currentXp}</span>
                    <span className={styles.cXpTotal}>/ {data.nextLevelXp} XP</span>
                </div>
                <div className={styles.cBar}>
                    <div className={styles.cProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.cStats}>
                    <span><Flame size={12} /> {data.streak}日</span>
                    <span><Star size={12} /> {data.totalWords}語</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// D: プログレスリング
// ============================================
function VariantD({ data }: { data: LevelData }) {
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (data.progressPercent / 100) * circumference;

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>D</div>
            <div className={styles.dLayout}>
                <div className={styles.dRing}>
                    <svg viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r="38" fill="none" strokeWidth="6" className={styles.dRingBg} />
                        <circle
                            cx="44" cy="44" r="38"
                            fill="none" strokeWidth="6"
                            className={styles.dRingProgress}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 44 44)"
                        />
                    </svg>
                    <div className={styles.dRingInner}>
                        <span className={styles.dLevelNum}>{data.level}</span>
                    </div>
                </div>
                <div className={styles.dContent}>
                    <div className={styles.dTitle}>{data.title}</div>
                    <div className={styles.dXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
                    <div className={styles.dStats}>
                        <span><Flame size={14} /> {data.streak}</span>
                        <span><Target size={14} /> {data.totalWords}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// E: ステータスボックス
// ============================================
function VariantE({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>E</div>
            <div className={styles.eHeader}>
                <div className={styles.eLevel}>
                    <Trophy size={16} />
                    <span>Level {data.level}</span>
                </div>
                <span className={styles.eTitle}>{data.title}</span>
            </div>
            <div className={styles.eBoxes}>
                <div className={styles.eBox}>
                    <span className={styles.eBoxValue}>{data.currentXp}</span>
                    <span className={styles.eBoxLabel}>経験値</span>
                </div>
                <div className={styles.eBox}>
                    <span className={styles.eBoxValue}>{data.streak}</span>
                    <span className={styles.eBoxLabel}>連続日数</span>
                </div>
                <div className={styles.eBox}>
                    <span className={styles.eBoxValue}>{data.totalWords}</span>
                    <span className={styles.eBoxLabel}>習得語彙</span>
                </div>
            </div>
            <div className={styles.eBarSection}>
                <div className={styles.eBar}>
                    <div className={styles.eProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.eBarLabel}>次のレベルまで {Math.ceil(data.nextLevelXp - data.currentXp)} XP</span>
            </div>
        </div>
    );
}

// ============================================
// F: コンパクト横長
// ============================================
function VariantF({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>F</div>
            <div className={styles.fRow}>
                <div className={styles.fLevelBox}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.fCenter}>
                    <div className={styles.fTop}>
                        <span className={styles.fTitle}>{data.title}</span>
                        <span className={styles.fXp}>{data.currentXp} XP</span>
                    </div>
                    <div className={styles.fBar}>
                        <div className={styles.fProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
                <div className={styles.fStreak}>
                    <Flame size={16} />
                    <span>{data.streak}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// G: ランクカード
// ============================================
function VariantG({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.gCard}`}>
            <div className={styles.variantLabel}>G</div>
            <div className={styles.gBadge}>
                <Sparkles size={20} />
            </div>
            <div className={styles.gContent}>
                <div className={styles.gRank}>{data.title}</div>
                <div className={styles.gLevel}>Level {data.level}</div>
                <div className={styles.gBarWrapper}>
                    <div className={styles.gBar}>
                        <div className={styles.gProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
                <div className={styles.gXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
            </div>
            <div className={styles.gFooter}>
                <div className={styles.gStat}><Flame size={14} /> {data.streak}日</div>
                <div className={styles.gStat}><Star size={14} /> {data.totalWords}語</div>
            </div>
        </div>
    );
}

// ============================================
// H: シンプルエレガント
// ============================================
function VariantH({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>H</div>
            <div className={styles.hHeader}>
                <span className={styles.hLevelLabel}>LEVEL</span>
                <span className={styles.hLevelNum}>{data.level}</span>
            </div>
            <div className={styles.hTitle}>{data.title}</div>
            <div className={styles.hProgress}>
                <div className={styles.hBar}>
                    <div className={styles.hFill} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.hProgressMeta}>
                    <span>{Math.floor(data.progressPercent)}%</span>
                    <span>{data.currentXp} / {data.nextLevelXp}</span>
                </div>
            </div>
            <div className={styles.hFooter}>
                <span><Flame size={14} /> {data.streak}日連続</span>
            </div>
        </div>
    );
}

// ============================================
// I: 進捗フォーカス
// ============================================
function VariantI({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>I</div>
            <div className={styles.iTop}>
                <div className={styles.iLevelBadge}>Lv.{data.level}</div>
                <div className={styles.iRight}>
                    <span className={styles.iTitle}>{data.title}</span>
                    <div className={styles.iStats}>
                        <span><Flame size={12} /> {data.streak}</span>
                        <span><Star size={12} /> {data.totalWords}</span>
                    </div>
                </div>
            </div>
            <div className={styles.iProgressSection}>
                <div className={styles.iProgressHeader}>
                    <span>次のレベルまで</span>
                    <span>{Math.ceil(data.nextLevelXp - data.currentXp)} XP</span>
                </div>
                <div className={styles.iBar}>
                    <div className={styles.iProgress} style={{ width: `${data.progressPercent}%` }}>
                        <span className={styles.iProgressText}>{data.currentXp}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// J: タイル型
// ============================================
function VariantJ({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>J</div>
            <div className={styles.jGrid}>
                <div className={styles.jTileMain}>
                    <span className={styles.jLevelNum}>{data.level}</span>
                    <span className={styles.jLevelLabel}>Level</span>
                    <span className={styles.jTitle}>{data.title}</span>
                </div>
                <div className={styles.jTile}>
                    <TrendingUp size={16} />
                    <span className={styles.jTileValue}>{data.currentXp}</span>
                    <span className={styles.jTileLabel}>XP</span>
                </div>
                <div className={styles.jTile}>
                    <Flame size={16} />
                    <span className={styles.jTileValue}>{data.streak}</span>
                    <span className={styles.jTileLabel}>日連続</span>
                </div>
            </div>
            <div className={styles.jBar}>
                <div className={styles.jProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// K: セグメント進捗
// ============================================
function VariantK({ data }: { data: LevelData }) {
    const segments = 8;
    const filled = Math.round((data.progressPercent / 100) * segments);

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>K</div>
            <div className={styles.kHeader}>
                <span className={styles.kLevel}>Level {data.level}</span>
                <span className={styles.kTitle}>{data.title}</span>
            </div>
            <div className={styles.kSegments}>
                {[...Array(segments)].map((_, i) => (
                    <div key={i} className={`${styles.kSegment} ${i < filled ? styles.kSegmentFilled : ''}`} />
                ))}
            </div>
            <div className={styles.kFooter}>
                <div className={styles.kXp}>
                    <span className={styles.kXpValue}>{data.currentXp}</span>
                    <span className={styles.kXpLabel}>/ {data.nextLevelXp} XP</span>
                </div>
                <div className={styles.kStreak}>
                    <Flame size={14} />
                    <span>{data.streak}日</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// L: アイコンヘッダー
// ============================================
function VariantL({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>L</div>
            <div className={styles.lHeader}>
                <div className={styles.lIcon}>
                    <Trophy size={20} />
                </div>
                <div className={styles.lHeaderText}>
                    <span className={styles.lLevel}>Level {data.level}</span>
                    <span className={styles.lTitle}>{data.title}</span>
                </div>
                <div className={styles.lXpBadge}>{data.currentXp} XP</div>
            </div>
            <div className={styles.lBarSection}>
                <div className={styles.lBar}>
                    <div className={styles.lProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.lBarMeta}>
                    <span>{Math.floor(data.progressPercent)}% 完了</span>
                    <span>あと {Math.ceil(data.nextLevelXp - data.currentXp)} XP</span>
                </div>
            </div>
            <div className={styles.lFooter}>
                <span><Flame size={14} /> {data.streak}日連続</span>
                <span><Star size={14} /> {data.totalWords}語</span>
            </div>
        </div>
    );
}

// ============================================
// M: ミニマル数字強調
// ============================================
function VariantM({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>M</div>
            <div className={styles.mLayout}>
                <div className={styles.mNumbers}>
                    <span className={styles.mLevel}>{data.level}</span>
                    <span className={styles.mSeparator}>/</span>
                    <span className={styles.mXp}>{data.currentXp}</span>
                </div>
                <div className={styles.mInfo}>
                    <span className={styles.mTitle}>{data.title}</span>
                    <div className={styles.mBar}>
                        <div className={styles.mProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// N: 左サイドバー進捗
// ============================================
function VariantN({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.nCard}`}>
            <div className={styles.variantLabel}>N</div>
            <div className={styles.nSidebar}>
                <div className={styles.nBarVertical}>
                    <div className={styles.nProgressVertical} style={{ height: `${data.progressPercent}%` }} />
                </div>
            </div>
            <div className={styles.nContent}>
                <div className={styles.nTop}>
                    <span className={styles.nLevel}>Lv.{data.level}</span>
                    <span className={styles.nTitle}>{data.title}</span>
                </div>
                <div className={styles.nXpRow}>
                    <span className={styles.nXpCurrent}>{data.currentXp}</span>
                    <span className={styles.nXpDivider}>/</span>
                    <span className={styles.nXpTotal}>{data.nextLevelXp} XP</span>
                </div>
                <div className={styles.nStats}>
                    <span><Flame size={12} /> {data.streak}</span>
                    <span><Star size={12} /> {data.totalWords}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// O: 大型タイトル
// ============================================
function VariantO({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>O</div>
            <div className={styles.oTitle}>{data.title}</div>
            <div className={styles.oSubtitle}>Level {data.level}</div>
            <div className={styles.oProgressArea}>
                <div className={styles.oBar}>
                    <div className={styles.oProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.oXp}>{data.currentXp} / {data.nextLevelXp}</div>
            </div>
            <div className={styles.oFooter}>
                <Flame size={14} />
                <span>{data.streak}日連続</span>
            </div>
        </div>
    );
}

// ============================================
// P: カードスタック風
// ============================================
function VariantP({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>P</div>
            <div className={styles.pStack}>
                <div className={styles.pLayer1}>
                    <span className={styles.pLevelNum}>{data.level}</span>
                </div>
                <div className={styles.pLayer2}>
                    <div className={styles.pInfo}>
                        <span className={styles.pTitle}>{data.title}</span>
                        <span className={styles.pXp}>{data.currentXp} XP</span>
                    </div>
                    <div className={styles.pBar}>
                        <div className={styles.pProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Q: インライン統計
// ============================================
function VariantQ({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>Q</div>
            <div className={styles.qHeader}>
                <div className={styles.qBadge}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.qTitleArea}>
                    <span className={styles.qTitle}>{data.title}</span>
                    <div className={styles.qBar}>
                        <div className={styles.qProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
            </div>
            <div className={styles.qStats}>
                <div className={styles.qStatItem}>
                    <span className={styles.qStatValue}>{data.currentXp}</span>
                    <span className={styles.qStatLabel}>XP</span>
                </div>
                <div className={styles.qStatDivider} />
                <div className={styles.qStatItem}>
                    <span className={styles.qStatValue}>{data.streak}</span>
                    <span className={styles.qStatLabel}>日連続</span>
                </div>
                <div className={styles.qStatDivider} />
                <div className={styles.qStatItem}>
                    <span className={styles.qStatValue}>{data.totalWords}</span>
                    <span className={styles.qStatLabel}>語</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// R: 2行レイアウト
// ============================================
function VariantR({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>R</div>
            <div className={styles.rRow1}>
                <span className={styles.rLevel}>Lv.{data.level}</span>
                <span className={styles.rTitle}>{data.title}</span>
                <span className={styles.rXp}>{data.currentXp} / {data.nextLevelXp}</span>
            </div>
            <div className={styles.rRow2}>
                <div className={styles.rBarWrapper}>
                    <div className={styles.rBar}>
                        <div className={styles.rProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
                <div className={styles.rStats}>
                    <Flame size={14} />
                    <span>{data.streak}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// S: 丸型バッジ
// ============================================
function VariantS({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>S</div>
            <div className={styles.sLayout}>
                <div className={styles.sCircle}>
                    <span className={styles.sLevelNum}>{data.level}</span>
                    <span className={styles.sLevelLabel}>LV</span>
                </div>
                <div className={styles.sContent}>
                    <div className={styles.sHeader}>
                        <span className={styles.sTitle}>{data.title}</span>
                        <span className={styles.sPercent}>{Math.floor(data.progressPercent)}%</span>
                    </div>
                    <div className={styles.sBar}>
                        <div className={styles.sProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                    <div className={styles.sMeta}>
                        <span>{data.currentXp} XP</span>
                        <span><Flame size={12} /> {data.streak}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// T: ボトムプログレス
// ============================================
function VariantT({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.tCard}`}>
            <div className={styles.variantLabel}>T</div>
            <div className={styles.tMain}>
                <div className={styles.tLeft}>
                    <span className={styles.tLevel}>Level {data.level}</span>
                    <span className={styles.tTitle}>{data.title}</span>
                </div>
                <div className={styles.tRight}>
                    <span className={styles.tXp}>{data.currentXp}</span>
                    <span className={styles.tXpLabel}>XP</span>
                </div>
            </div>
            <div className={styles.tStats}>
                <span><Flame size={12} /> {data.streak}日</span>
                <span><Star size={12} /> {data.totalWords}語</span>
            </div>
            <div className={styles.tBottomBar}>
                <div className={styles.tBottomProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// U: 縦型フォーカス
// ============================================
function VariantU({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.uCard}`}>
            <div className={styles.variantLabel}>U</div>
            <div className={styles.uLevelArea}>
                <span className={styles.uLevelNum}>{data.level}</span>
            </div>
            <div className={styles.uContent}>
                <span className={styles.uTitle}>{data.title}</span>
                <div className={styles.uBarSection}>
                    <div className={styles.uBar}>
                        <div className={styles.uProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                    <span className={styles.uXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
                </div>
                <div className={styles.uStats}>
                    <div className={styles.uStatItem}>
                        <Flame size={14} />
                        <span>{data.streak}</span>
                    </div>
                    <div className={styles.uStatItem}>
                        <Star size={14} />
                        <span>{data.totalWords}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// V: テキスト中心
// ============================================
function VariantV({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>V</div>
            <div className={styles.vCenter}>
                <span className={styles.vLabel}>LEVEL</span>
                <span className={styles.vLevelNum}>{data.level}</span>
                <span className={styles.vTitle}>{data.title}</span>
            </div>
            <div className={styles.vBar}>
                <div className={styles.vProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
            <div className={styles.vFooter}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                <span className={styles.vStreak}><Flame size={12} /> {data.streak}日</span>
            </div>
        </div>
    );
}

// ============================================
// W: フッター強調
// ============================================
function VariantW({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>W</div>
            <div className={styles.wTop}>
                <div className={styles.wLevelBadge}>{data.level}</div>
                <div className={styles.wInfo}>
                    <span className={styles.wTitle}>{data.title}</span>
                    <div className={styles.wBarWrapper}>
                        <div className={styles.wBar}>
                            <div className={styles.wProgress} style={{ width: `${data.progressPercent}%` }} />
                        </div>
                        <span className={styles.wPercent}>{Math.floor(data.progressPercent)}%</span>
                    </div>
                </div>
            </div>
            <div className={styles.wFooter}>
                <div className={styles.wFooterItem}>
                    <TrendingUp size={14} />
                    <span>{data.currentXp} XP</span>
                </div>
                <div className={styles.wFooterItem}>
                    <Flame size={14} />
                    <span>{data.streak}日</span>
                </div>
                <div className={styles.wFooterItem}>
                    <Star size={14} />
                    <span>{data.totalWords}語</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// X: 極小コンパクト
// ============================================
function VariantX({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>X</div>
            <div className={styles.xRow}>
                <span className={styles.xLevel}>{data.level}</span>
                <span className={styles.xTitle}>{data.title}</span>
                <div className={styles.xBarWrapper}>
                    <div className={styles.xBar}>
                        <div className={styles.xProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
                <span className={styles.xXp}>{data.currentXp}</span>
            </div>
        </div>
    );
}

// ============================================
// Y: 巨大レベル背景
// ============================================
function VariantY({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.yCard}`}>
            <div className={styles.variantLabel}>Y</div>
            <div className={styles.yBgNumber}>{data.level}</div>
            <div className={styles.yContent}>
                <div className={styles.yTitle}>{data.title}</div>
                <div className={styles.yXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
                <div className={styles.yBar}>
                    <div className={styles.yProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// Z: 斜めカット
// ============================================
function VariantZ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.zCard}`}>
            <div className={styles.variantLabel}>Z</div>
            <div className={styles.zLeft}>
                <span className={styles.zLevel}>{data.level}</span>
            </div>
            <div className={styles.zRight}>
                <span className={styles.zTitle}>{data.title}</span>
                <span className={styles.zXp}>{data.currentXp} XP</span>
                <div className={styles.zStats}>
                    <Flame size={12} /> {data.streak}
                </div>
            </div>
        </div>
    );
}

// ============================================
// AA: ドットマトリクス進捗
// ============================================
function VariantAA({ data }: { data: LevelData }) {
    const totalDots = 20;
    const filledDots = Math.round((data.progressPercent / 100) * totalDots);

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AA</div>
            <div className={styles.aaHeader}>
                <span className={styles.aaLevel}>Lv.{data.level}</span>
                <span className={styles.aaTitle}>{data.title}</span>
            </div>
            <div className={styles.aaDots}>
                {[...Array(totalDots)].map((_, i) => (
                    <div key={i} className={`${styles.aaDot} ${i < filledDots ? styles.aaDotFilled : ''}`} />
                ))}
            </div>
            <div className={styles.aaFooter}>
                <span>{data.currentXp} XP</span>
                <span><Flame size={12} /> {data.streak}</span>
            </div>
        </div>
    );
}

// ============================================
// AB: 浮遊バブル
// ============================================
function VariantAB({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AB</div>
            <div className={styles.abLayout}>
                <div className={styles.abBubble1}>{data.level}</div>
                <div className={styles.abBubble2}>{data.streak}</div>
                <div className={styles.abBubble3}>{Math.floor(data.progressPercent)}%</div>
            </div>
            <div className={styles.abInfo}>
                <span className={styles.abTitle}>{data.title}</span>
                <span className={styles.abXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AC: ネガティブスペース
// ============================================
function VariantAC({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.acCard}`}>
            <div className={styles.variantLabel}>AC</div>
            <div className={styles.acCutout}>
                <span className={styles.acLevel}>{data.level}</span>
            </div>
            <div className={styles.acText}>
                <span className={styles.acTitle}>{data.title}</span>
                <div className={styles.acMeta}>
                    <span>{data.currentXp} / {data.nextLevelXp}</span>
                    <span><Flame size={12} /> {data.streak}</span>
                </div>
            </div>
            <div className={styles.acBar}>
                <div className={styles.acProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// AD: 時計風アーチ
// ============================================
function VariantAD({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AD</div>
            <div className={styles.adGauge}>
                <svg viewBox="0 0 100 60" className={styles.adSvg}>
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" strokeWidth="8" className={styles.adArcBg} />
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" strokeWidth="8" className={styles.adArcProgress}
                        strokeDasharray="126"
                        strokeDashoffset={126 - (126 * data.progressPercent / 100)}
                        strokeLinecap="round"
                    />
                </svg>
                <div className={styles.adCenter}>
                    <span className={styles.adLevel}>{data.level}</span>
                </div>
            </div>
            <div className={styles.adInfo}>
                <span className={styles.adTitle}>{data.title}</span>
                <span className={styles.adXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AE: スコアボード風
// ============================================
function VariantAE({ data }: { data: LevelData }) {
    const digits = String(data.level).padStart(2, '0').split('');

    return (
        <div className={`${styles.card} ${styles.aeCard}`}>
            <div className={styles.variantLabel}>AE</div>
            <div className={styles.aeBoard}>
                <div className={styles.aeDigits}>
                    {digits.map((d, i) => (
                        <span key={i} className={styles.aeDigit}>{d}</span>
                    ))}
                </div>
                <span className={styles.aeLabel}>LEVEL</span>
            </div>
            <div className={styles.aeStats}>
                <div className={styles.aeStat}>
                    <span className={styles.aeStatNum}>{data.currentXp}</span>
                    <span className={styles.aeStatLabel}>XP</span>
                </div>
                <div className={styles.aeStat}>
                    <span className={styles.aeStatNum}>{data.streak}</span>
                    <span className={styles.aeStatLabel}>STREAK</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AF: 重なりレイヤー
// ============================================
function VariantAF({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AF</div>
            <div className={styles.afStack}>
                <div className={styles.afLayer3}></div>
                <div className={styles.afLayer2}></div>
                <div className={styles.afLayer1}>
                    <span className={styles.afLevel}>{data.level}</span>
                    <span className={styles.afTitle}>{data.title}</span>
                </div>
            </div>
            <div className={styles.afBottom}>
                <div className={styles.afBar}>
                    <div className={styles.afProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.afXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AG: 縦書き和風
// ============================================
function VariantAG({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.agCard}`}>
            <div className={styles.variantLabel}>AG</div>
            <div className={styles.agVertical}>
                <span className={styles.agTitle}>{data.title}</span>
            </div>
            <div className={styles.agMain}>
                <div className={styles.agLevelArea}>
                    <span className={styles.agLevelLabel}>第</span>
                    <span className={styles.agLevel}>{data.level}</span>
                    <span className={styles.agLevelLabel}>段</span>
                </div>
                <div className={styles.agProgress}>
                    <div className={styles.agBarVertical}>
                        <div className={styles.agFill} style={{ height: `${data.progressPercent}%` }} />
                    </div>
                </div>
            </div>
            <div className={styles.agFooter}>
                <span>{data.currentXp} 点</span>
            </div>
        </div>
    );
}

// ============================================
// AH: パス/ジャーニー
// ============================================
function VariantAH({ data }: { data: LevelData }) {
    const checkpoints = 5;
    const currentCheckpoint = Math.floor((data.progressPercent / 100) * checkpoints);

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AH</div>
            <div className={styles.ahHeader}>
                <span className={styles.ahLevel}>Lv.{data.level}</span>
                <span className={styles.ahTitle}>{data.title}</span>
            </div>
            <div className={styles.ahPath}>
                {[...Array(checkpoints)].map((_, i) => (
                    <div key={i} className={styles.ahCheckpointWrapper}>
                        <div className={`${styles.ahCheckpoint} ${i <= currentCheckpoint ? styles.ahCheckpointActive : ''}`}>
                            {i === checkpoints - 1 ? <Star size={10} /> : null}
                        </div>
                        {i < checkpoints - 1 && (
                            <div className={`${styles.ahLine} ${i < currentCheckpoint ? styles.ahLineActive : ''}`} />
                        )}
                    </div>
                ))}
            </div>
            <div className={styles.ahFooter}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AI: グリッチ風
// ============================================
function VariantAI({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.aiCard}`}>
            <div className={styles.variantLabel}>AI</div>
            <div className={styles.aiGlitch} data-text={data.level}>
                <span className={styles.aiLevel}>{data.level}</span>
            </div>
            <div className={styles.aiContent}>
                <span className={styles.aiTitle}>{data.title}</span>
                <div className={styles.aiBar}>
                    <div className={styles.aiProgress} style={{ width: `${data.progressPercent}%` }}>
                        <div className={styles.aiScanline}></div>
                    </div>
                </div>
                <div className={styles.aiMeta}>
                    <span>{data.currentXp} XP</span>
                    <span><Flame size={12} /> {data.streak}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AJ: 温度計風
// ============================================
function VariantAJ({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AJ</div>
            <div className={styles.ajLayout}>
                <div className={styles.ajThermo}>
                    <div className={styles.ajTube}>
                        <div className={styles.ajFill} style={{ height: `${data.progressPercent}%` }} />
                    </div>
                    <div className={styles.ajBulb}>
                        <span>{data.level}</span>
                    </div>
                </div>
                <div className={styles.ajInfo}>
                    <span className={styles.ajTitle}>{data.title}</span>
                    <span className={styles.ajXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
                    <div className={styles.ajStats}>
                        <Flame size={14} />
                        <span>{data.streak}日連続</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AK: 3Dキューブ
// ============================================
function VariantAK({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AK</div>
            <div className={styles.akScene}>
                <div className={styles.akCube}>
                    <div className={styles.akFace} data-face="front">
                        <span>{data.level}</span>
                    </div>
                    <div className={styles.akFace} data-face="top">
                        <span>{data.title}</span>
                    </div>
                    <div className={styles.akFace} data-face="right">
                        <span>{data.currentXp}</span>
                    </div>
                </div>
            </div>
            <div className={styles.akBar}>
                <div className={styles.akProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// AL: フラグメント/破片
// ============================================
function VariantAL({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.alCard}`}>
            <div className={styles.variantLabel}>AL</div>
            <div className={styles.alFragments}>
                <div className={styles.alFrag} style={{ transform: 'rotate(-8deg) translate(-5px, 3px)' }}>
                    <span className={styles.alLevel}>{data.level}</span>
                </div>
                <div className={styles.alFrag} style={{ transform: 'rotate(5deg) translate(10px, -2px)' }}>
                    <span className={styles.alTitle}>{data.title}</span>
                </div>
                <div className={styles.alFrag} style={{ transform: 'rotate(-3deg) translate(0, 5px)' }}>
                    <span className={styles.alXp}>{data.currentXp} XP</span>
                </div>
            </div>
            <div className={styles.alBarBroken}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={styles.alBarPiece} style={{
                        width: `${100 / 5}%`,
                        opacity: (i + 1) * 20 <= data.progressPercent ? 1 : 0.2,
                        transform: `rotate(${(i - 2) * 2}deg)`
                    }} />
                ))}
            </div>
        </div>
    );
}

// ============================================
// AM: ホログラム
// ============================================
function VariantAM({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.amCard}`}>
            <div className={styles.variantLabel}>AM</div>
            <div className={styles.amHolo}>
                <div className={styles.amGlow}></div>
                <div className={styles.amContent}>
                    <span className={styles.amLevel}>{data.level}</span>
                    <span className={styles.amTitle}>{data.title}</span>
                </div>
            </div>
            <div className={styles.amMeta}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                <span><Flame size={12} /> {data.streak}</span>
            </div>
            <div className={styles.amBar}>
                <div className={styles.amProgress} style={{ width: `${data.progressPercent}%` }}>
                    <div className={styles.amShine}></div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AN: 液体/波
// ============================================
function VariantAN({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.anCard}`}>
            <div className={styles.variantLabel}>AN</div>
            <div className={styles.anContainer}>
                <div className={styles.anWave} style={{ height: `${data.progressPercent}%` }}>
                    <div className={styles.anWaveTop}></div>
                </div>
                <div className={styles.anOverlay}>
                    <span className={styles.anLevel}>{data.level}</span>
                    <span className={styles.anTitle}>{data.title}</span>
                    <span className={styles.anXp}>{data.currentXp} XP</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AO: 折り紙/ペーパー
// ============================================
function VariantAO({ data }: { data: LevelData }) {
    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AO</div>
            <div className={styles.aoFold}>
                <div className={styles.aoCorner}></div>
                <div className={styles.aoMain}>
                    <div className={styles.aoLevel}>{data.level}</div>
                    <div className={styles.aoTitle}>{data.title}</div>
                </div>
            </div>
            <div className={styles.aoStats}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
            <div className={styles.aoBar}>
                <div className={styles.aoProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// AP: 宇宙/星座
// ============================================
function VariantAP({ data }: { data: LevelData }) {
    const stars = 12;
    const filledStars = Math.round((data.progressPercent / 100) * stars);

    return (
        <div className={`${styles.card} ${styles.apCard}`}>
            <div className={styles.variantLabel}>AP</div>
            <div className={styles.apSky}>
                {[...Array(stars)].map((_, i) => (
                    <div key={i} className={`${styles.apStar} ${i < filledStars ? styles.apStarLit : ''}`}
                        style={{
                            left: `${10 + (i % 4) * 25 + Math.random() * 10}%`,
                            top: `${15 + Math.floor(i / 4) * 30 + Math.random() * 10}%`
                        }}
                    />
                ))}
                <div className={styles.apPlanet}>
                    <span>{data.level}</span>
                </div>
            </div>
            <div className={styles.apInfo}>
                <span className={styles.apTitle}>{data.title}</span>
                <span className={styles.apXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AQ: ネオンサイン
// ============================================
function VariantAQ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.aqCard}`}>
            <div className={styles.variantLabel}>AQ</div>
            <div className={styles.aqNeon}>
                <span className={styles.aqLevel}>{data.level}</span>
            </div>
            <div className={styles.aqText}>
                <span className={styles.aqTitle}>{data.title}</span>
            </div>
            <div className={styles.aqTube}>
                <div className={styles.aqFill} style={{ width: `${data.progressPercent}%` }}></div>
            </div>
            <div className={styles.aqMeta}>
                <span>{data.currentXp} XP</span>
                <span><Flame size={12} /> {data.streak}</span>
            </div>
        </div>
    );
}

// ============================================
// AR: フィルムストリップ
// ============================================
function VariantAR({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.arCard}`}>
            <div className={styles.variantLabel}>AR</div>
            <div className={styles.arStrip}>
                <div className={styles.arHoles}>
                    {[...Array(6)].map((_, i) => <div key={i} className={styles.arHole} />)}
                </div>
                <div className={styles.arFrames}>
                    <div className={styles.arFrame}>
                        <span className={styles.arLevel}>{data.level}</span>
                    </div>
                    <div className={styles.arFrame}>
                        <span className={styles.arTitle}>{data.title}</span>
                    </div>
                    <div className={styles.arFrame}>
                        <span className={styles.arXp}>{data.currentXp}</span>
                    </div>
                </div>
                <div className={styles.arHoles}>
                    {[...Array(6)].map((_, i) => <div key={i} className={styles.arHole} />)}
                </div>
            </div>
            <div className={styles.arBar}>
                <div className={styles.arProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// AS: 階段/ステップ
// ============================================
function VariantAS({ data }: { data: LevelData }) {
    const steps = 5;
    const currentStep = Math.ceil((data.progressPercent / 100) * steps);

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AS</div>
            <div className={styles.asHeader}>
                <span className={styles.asLevel}>Lv.{data.level}</span>
                <span className={styles.asTitle}>{data.title}</span>
            </div>
            <div className={styles.asStairs}>
                {[...Array(steps)].map((_, i) => (
                    <div key={i} className={`${styles.asStep} ${i < currentStep ? styles.asStepActive : ''}`}
                        style={{ height: `${20 + i * 15}px` }}
                    >
                        {i === steps - 1 && <Star size={12} />}
                    </div>
                ))}
            </div>
            <div className={styles.asFooter}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// AT: パズルピース
// ============================================
function VariantAT({ data }: { data: LevelData }) {
    const pieces = 4;
    const filledPieces = Math.ceil((data.progressPercent / 100) * pieces);

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AT</div>
            <div className={styles.atPuzzle}>
                {[...Array(pieces)].map((_, i) => (
                    <div key={i} className={`${styles.atPiece} ${i < filledPieces ? styles.atPieceFilled : ''}`}>
                        {i === 0 && <span className={styles.atLevel}>{data.level}</span>}
                        {i === 1 && <span className={styles.atTitle}>{data.title}</span>}
                        {i === 2 && <span className={styles.atXp}>{data.currentXp}</span>}
                        {i === 3 && <span className={styles.atStreak}><Flame size={14} />{data.streak}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// AU: 波形/オーディオ
// ============================================
function VariantAU({ data }: { data: LevelData }) {
    const bars = 16;
    const heights = [40, 70, 55, 85, 60, 90, 45, 75, 95, 50, 80, 65, 88, 42, 72, 58];

    return (
        <div className={`${styles.card} ${styles.auCard}`}>
            <div className={styles.variantLabel}>AU</div>
            <div className={styles.auHeader}>
                <span className={styles.auLevel}>Lv.{data.level}</span>
                <span className={styles.auTitle}>{data.title}</span>
            </div>
            <div className={styles.auWaveform}>
                {heights.map((h, i) => (
                    <div key={i} className={styles.auBar} style={{
                        height: `${h}%`,
                        opacity: (i / bars) * 100 <= data.progressPercent ? 1 : 0.2
                    }} />
                ))}
            </div>
            <div className={styles.auFooter}>
                <span>{data.currentXp} XP</span>
                <span>{Math.floor(data.progressPercent)}%</span>
            </div>
        </div>
    );
}

// ============================================
// AV: 螺旋/DNA
// ============================================
function VariantAV({ data }: { data: LevelData }) {
    const dots = 8;

    return (
        <div className={styles.card}>
            <div className={styles.variantLabel}>AV</div>
            <div className={styles.avLayout}>
                <div className={styles.avHelix}>
                    {[...Array(dots)].map((_, i) => {
                        const isFilled = (i / dots) * 100 < data.progressPercent;
                        return (
                            <div key={i} className={styles.avPair}>
                                <div className={`${styles.avDot} ${isFilled ? styles.avDotFilled : ''}`}
                                    style={{ transform: `translateX(${Math.sin(i * 0.8) * 15}px)` }} />
                                <div className={styles.avLine}></div>
                                <div className={`${styles.avDot} ${isFilled ? styles.avDotFilled : ''}`}
                                    style={{ transform: `translateX(${-Math.sin(i * 0.8) * 15}px)` }} />
                            </div>
                        );
                    })}
                </div>
                <div className={styles.avInfo}>
                    <span className={styles.avLevel}>{data.level}</span>
                    <span className={styles.avTitle}>{data.title}</span>
                    <span className={styles.avXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AW: 呼吸するパルス
// ============================================
function VariantAW({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.awCard}`}>
            <div className={styles.variantLabel}>AW</div>
            <div className={styles.awPulseRing}>
                <div className={styles.awPulse1} />
                <div className={styles.awPulse2} />
                <div className={styles.awPulse3} />
                <div className={styles.awCenter}>
                    <span className={styles.awLevel}>{data.level}</span>
                </div>
            </div>
            <div className={styles.awInfo}>
                <div className={styles.awTitle}>{data.title}</div>
                <div className={styles.awXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
                <div className={styles.awBar}>
                    <div className={styles.awProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// AX: 回転リング
// ============================================
function VariantAX({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.axCard}`}>
            <div className={styles.variantLabel}>AX</div>
            <div className={styles.axSpinner}>
                <div className={styles.axRingOuter} />
                <div className={styles.axRingMiddle} />
                <div className={styles.axRingInner} />
                <div className={styles.axCore}>
                    <span className={styles.axLevel}>Lv.{data.level}</span>
                </div>
            </div>
            <div className={styles.axDetails}>
                <span className={styles.axTitle}>{data.title}</span>
                <span className={styles.axXp}>{data.currentXp} XP</span>
                <div className={styles.axMeta}>
                    <Flame size={14} /> {data.streak}日
                </div>
            </div>
        </div>
    );
}

// ============================================
// AY: バウンス数字
// ============================================
function VariantAY({ data }: { data: LevelData }) {
    const digits = String(data.level).split('');
    return (
        <div className={`${styles.card} ${styles.ayCard}`}>
            <div className={styles.variantLabel}>AY</div>
            <div className={styles.ayBounceNumbers}>
                {digits.map((d, i) => (
                    <span key={i} className={styles.ayDigit} style={{ animationDelay: `${i * 0.1}s` }}>{d}</span>
                ))}
            </div>
            <div className={styles.ayLabel}>LEVEL</div>
            <div className={styles.ayTitle}>{data.title}</div>
            <div className={styles.ayProgressBar}>
                <div className={styles.ayProgressFill} style={{ width: `${data.progressPercent}%` }}>
                    <span className={styles.ayProgressText}>{Math.floor(data.progressPercent)}%</span>
                </div>
            </div>
            <div className={styles.ayFooter}>
                <span>{data.currentXp} XP</span>
                <span><Flame size={12} /> {data.streak}</span>
            </div>
        </div>
    );
}

// ============================================
// AZ: スライディング進捗
// ============================================
function VariantAZ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.azCard}`}>
            <div className={styles.variantLabel}>AZ</div>
            <div className={styles.azSlider}>
                <div className={styles.azTrack}>
                    <div className={styles.azThumb} style={{ left: `${data.progressPercent}%` }}>
                        <span className={styles.azThumbLevel}>{data.level}</span>
                    </div>
                    <div className={styles.azFilled} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.azMarkers}>
                    {[0, 25, 50, 75, 100].map(m => (
                        <span key={m} className={styles.azMarker}>{m}%</span>
                    ))}
                </div>
            </div>
            <div className={styles.azInfo}>
                <div className={styles.azTitle}>{data.title}</div>
                <div className={styles.azStats}>
                    <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                    <span className={styles.azStreak}><Flame size={14} /> {data.streak}日連続</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BA: フローティングパーティクル
// ============================================
function VariantBA({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.baCard}`}>
            <div className={styles.variantLabel}>BA</div>
            <div className={styles.baParticles}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={styles.baParticle} style={{
                        animationDelay: `${i * 0.2}s`,
                        left: `${10 + (i % 4) * 25}%`,
                        top: `${10 + Math.floor(i / 4) * 30}%`
                    }} />
                ))}
            </div>
            <div className={styles.baContent}>
                <div className={styles.baLevel}>
                    <span className={styles.baLevelNum}>{data.level}</span>
                    <Sparkles size={20} className={styles.baSparkle} />
                </div>
                <div className={styles.baTitle}>{data.title}</div>
                <div className={styles.baXp}>{data.currentXp} XP</div>
            </div>
        </div>
    );
}

// ============================================
// BB: モーフィングシェイプ
// ============================================
function VariantBB({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bbCard}`}>
            <div className={styles.variantLabel}>BB</div>
            <div className={styles.bbMorphContainer}>
                <div className={styles.bbMorphShape} />
                <div className={styles.bbCenterContent}>
                    <span className={styles.bbLevel}>{data.level}</span>
                    <span className={styles.bbTitle}>{data.title}</span>
                </div>
            </div>
            <div className={styles.bbBar}>
                <div className={styles.bbProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
            <div className={styles.bbFooter}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                <span><Flame size={12} /> {data.streak}</span>
            </div>
        </div>
    );
}

// ============================================
// BC: 浮遊カード
// ============================================
function VariantBC({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bcCard}`}>
            <div className={styles.variantLabel}>BC</div>
            <div className={styles.bcFloatingCard}>
                <div className={styles.bcShadow} />
                <div className={styles.bcInner}>
                    <div className={styles.bcHeader}>
                        <Trophy size={20} className={styles.bcTrophy} />
                        <span className={styles.bcLevel}>Level {data.level}</span>
                    </div>
                    <div className={styles.bcTitle}>{data.title}</div>
                    <div className={styles.bcProgress}>
                        <div className={styles.bcProgressBar}>
                            <div className={styles.bcProgressFill} style={{ width: `${data.progressPercent}%` }} />
                        </div>
                        <span className={styles.bcXp}>{data.currentXp} XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BD: カラーサイクル
// ============================================
function VariantBD({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bdCard}`}>
            <div className={styles.variantLabel}>BD</div>
            <div className={styles.bdColorBg} />
            <div className={styles.bdContent}>
                <div className={styles.bdLevelBadge}>
                    <span className={styles.bdLevelNum}>{data.level}</span>
                </div>
                <div className={styles.bdInfo}>
                    <span className={styles.bdTitle}>{data.title}</span>
                    <div className={styles.bdStats}>
                        <span>{data.currentXp} XP</span>
                        <span><Flame size={12} /> {data.streak}</span>
                    </div>
                    <div className={styles.bdBar}>
                        <div className={styles.bdProgress} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BE: 波打つグリッド
// ============================================
function VariantBE({ data }: { data: LevelData }) {
    const filledCells = Math.floor(data.progressPercent / 10);
    return (
        <div className={`${styles.card} ${styles.beCard}`}>
            <div className={styles.variantLabel}>BE</div>
            <div className={styles.beHeader}>
                <span className={styles.beLevel}>Lv.{data.level}</span>
                <span className={styles.beTitle}>{data.title}</span>
            </div>
            <div className={styles.beGrid}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className={`${styles.beCell} ${i < filledCells ? styles.beCellFilled : ''}`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>
            <div className={styles.beFooter}>
                <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                <span className={styles.beStreak}><Flame size={12} /> {data.streak}日</span>
            </div>
        </div>
    );
}

// ============================================
// BF: タイプライター
// ============================================
function VariantBF({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bfCard}`}>
            <div className={styles.variantLabel}>BF</div>
            <div className={styles.bfTerminal}>
                <div className={styles.bfLine}>
                    <span className={styles.bfPrompt}>$</span>
                    <span className={styles.bfTyping}>level --current</span>
                </div>
                <div className={styles.bfOutput}>
                    <span className={styles.bfValue}>{data.level}</span>
                    <span className={styles.bfLabel}>{data.title}</span>
                </div>
                <div className={styles.bfLine}>
                    <span className={styles.bfPrompt}>$</span>
                    <span className={styles.bfTyping2}>xp --show</span>
                </div>
                <div className={styles.bfXpBar}>
                    <div className={styles.bfXpFill} style={{ width: `${data.progressPercent}%` }} />
                    <span className={styles.bfXpText}>{data.currentXp}/{data.nextLevelXp}</span>
                </div>
                <div className={styles.bfCursor} />
            </div>
        </div>
    );
}

// ============================================
// BG: 反射ミラー
// ============================================
function VariantBG({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bgCard}`}>
            <div className={styles.variantLabel}>BG</div>
            <div className={styles.bgMirrorContainer}>
                <div className={styles.bgMain}>
                    <div className={styles.bgLevel}>{data.level}</div>
                    <div className={styles.bgTitle}>{data.title}</div>
                    <div className={styles.bgXp}>{data.currentXp} XP</div>
                </div>
                <div className={styles.bgReflection}>
                    <div className={styles.bgLevel}>{data.level}</div>
                    <div className={styles.bgTitle}>{data.title}</div>
                    <div className={styles.bgXp}>{data.currentXp} XP</div>
                </div>
                <div className={styles.bgShine} />
            </div>
            <div className={styles.bgBar}>
                <div className={styles.bgProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// BH: 爆発スパーク
// ============================================
function VariantBH({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bhCard}`}>
            <div className={styles.variantLabel}>BH</div>
            <div className={styles.bhExplosion}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={styles.bhSpark} style={{
                        transform: `rotate(${i * 45}deg)`,
                        animationDelay: `${i * 0.1}s`
                    }} />
                ))}
                <div className={styles.bhCenter}>
                    <span className={styles.bhLevel}>{data.level}</span>
                </div>
            </div>
            <div className={styles.bhInfo}>
                <span className={styles.bhTitle}>{data.title}</span>
                <div className={styles.bhProgress}>
                    <div className={styles.bhBar}>
                        <div className={styles.bhFill} style={{ width: `${data.progressPercent}%` }} />
                    </div>
                    <span className={styles.bhXp}>{data.currentXp} XP</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BI: ネオン点滅
// ============================================
function VariantBI({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.biCard}`}>
            <div className={styles.variantLabel}>BI</div>
            <div className={styles.biNeonText}>
                <span className={styles.biLevel}>LV.{data.level}</span>
            </div>
            <div className={styles.biTitle}>{data.title}</div>
            <div className={styles.biBarContainer}>
                <div className={styles.biBar}>
                    <div className={styles.biProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
            <div className={styles.biStats}>
                <span className={styles.biXp}>{data.currentXp} XP</span>
                <span className={styles.biStreak}><Flame size={12} /> {data.streak}</span>
            </div>
        </div>
    );
}

// ============================================
// BJ: 砂時計タイマー
// ============================================
function VariantBJ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bjCard}`}>
            <div className={styles.variantLabel}>BJ</div>
            <div className={styles.bjHourglass}>
                <div className={styles.bjTop}>
                    <div className={styles.bjSandTop} style={{ height: `${100 - data.progressPercent}%` }} />
                </div>
                <div className={styles.bjNeck} />
                <div className={styles.bjBottom}>
                    <div className={styles.bjSandBottom} style={{ height: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.bjFalling} />
            </div>
            <div className={styles.bjInfo}>
                <span className={styles.bjLevel}>Level {data.level}</span>
                <span className={styles.bjTitle}>{data.title}</span>
                <span className={styles.bjXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BK: 心臓鼓動
// ============================================
function VariantBK({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bkCard}`}>
            <div className={styles.variantLabel}>BK</div>
            <div className={styles.bkHeartContainer}>
                <div className={styles.bkHeart}>
                    <span className={styles.bkLevel}>{data.level}</span>
                </div>
                <div className={styles.bkPulseRing} />
            </div>
            <div className={styles.bkInfo}>
                <div className={styles.bkTitle}>{data.title}</div>
                <div className={styles.bkBar}>
                    <div className={styles.bkProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.bkMeta}>
                    <span>{data.currentXp} XP</span>
                    <span><Flame size={12} /> {data.streak}日</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BL: 液体充填
// ============================================
function VariantBL({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.blCard}`}>
            <div className={styles.variantLabel}>BL</div>
            <div className={styles.blFlask}>
                <div className={styles.blLiquid} style={{ height: `${data.progressPercent}%` }}>
                    <div className={styles.blWave1} />
                    <div className={styles.blWave2} />
                </div>
                <div className={styles.blBubbles}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.blBubble} style={{ animationDelay: `${i * 0.3}s`, left: `${20 + i * 15}%` }} />
                    ))}
                </div>
                <span className={styles.blLevel}>{data.level}</span>
            </div>
            <div className={styles.blDetails}>
                <span className={styles.blTitle}>{data.title}</span>
                <span className={styles.blXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BM: 軌道周回
// ============================================
function VariantBM({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bmCard}`}>
            <div className={styles.variantLabel}>BM</div>
            <div className={styles.bmOrbital}>
                <div className={styles.bmOrbit1}><div className={styles.bmPlanet1} /></div>
                <div className={styles.bmOrbit2}><div className={styles.bmPlanet2} /></div>
                <div className={styles.bmOrbit3}><div className={styles.bmPlanet3} /></div>
                <div className={styles.bmSun}>
                    <span>{data.level}</span>
                </div>
            </div>
            <div className={styles.bmInfo}>
                <span className={styles.bmTitle}>{data.title}</span>
                <div className={styles.bmBar}>
                    <div className={styles.bmProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.bmXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BN: 音声波形EQ
// ============================================
function VariantBN({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bnCard}`}>
            <div className={styles.variantLabel}>BN</div>
            <div className={styles.bnHeader}>
                <span className={styles.bnLevel}>Lv.{data.level}</span>
                <span className={styles.bnTitle}>{data.title}</span>
            </div>
            <div className={styles.bnEqualizer}>
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={styles.bnBarItem} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
            </div>
            <div className={styles.bnFooter}>
                <span>{data.currentXp} XP</span>
                <span className={styles.bnProgress}>{Math.floor(data.progressPercent)}%</span>
            </div>
        </div>
    );
}

// ============================================
// BO: 折り紙展開
// ============================================
function VariantBO({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.boCard}`}>
            <div className={styles.variantLabel}>BO</div>
            <div className={styles.boOrigami}>
                <div className={styles.boFold1}>
                    <span className={styles.boLevel}>{data.level}</span>
                </div>
                <div className={styles.boFold2}>
                    <span className={styles.boTitle}>{data.title}</span>
                </div>
                <div className={styles.boFold3}>
                    <span className={styles.boXp}>{data.currentXp} XP</span>
                </div>
                <div className={styles.boFold4}>
                    <Flame size={14} /> <span>{data.streak}</span>
                </div>
            </div>
            <div className={styles.boBar}>
                <div className={styles.boProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// BP: グリッチスキャン
// ============================================
function VariantBP({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bpCard}`}>
            <div className={styles.variantLabel}>BP</div>
            <div className={styles.bpScreen}>
                <div className={styles.bpScanline} />
                <div className={styles.bpContent}>
                    <div className={styles.bpGlitchText} data-text={`LV.${data.level}`}>
                        LV.{data.level}
                    </div>
                    <div className={styles.bpTitle}>{data.title}</div>
                    <div className={styles.bpData}>
                        <span>XP: {data.currentXp}</span>
                        <span>STREAK: {data.streak}</span>
                    </div>
                </div>
                <div className={styles.bpNoise} />
            </div>
            <div className={styles.bpBar}>
                <div className={styles.bpProgress} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// BQ: 花火エフェクト
// ============================================
function VariantBQ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bqCard}`}>
            <div className={styles.variantLabel}>BQ</div>
            <div className={styles.bqFireworks}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.bqBurst} style={{ animationDelay: `${i * 0.5}s` }}>
                        {Array.from({ length: 8 }).map((_, j) => (
                            <div key={j} className={styles.bqParticle} style={{ transform: `rotate(${j * 45}deg)` }} />
                        ))}
                    </div>
                ))}
            </div>
            <div className={styles.bqContent}>
                <div className={styles.bqLevel}>
                    <Star size={16} className={styles.bqStar} />
                    <span>{data.level}</span>
                    <Star size={16} className={styles.bqStar} />
                </div>
                <div className={styles.bqTitle}>{data.title}</div>
                <div className={styles.bqXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
            </div>
        </div>
    );
}

// ============================================
// BR: マトリックス雨
// ============================================
function VariantBR({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.brCard}`}>
            <div className={styles.variantLabel}>BR</div>
            <div className={styles.brMatrix}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={styles.brColumn} style={{ animationDelay: `${i * 0.2}s` }}>
                        {Array.from({ length: 8 }).map((_, j) => (
                            <span key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</span>
                        ))}
                    </div>
                ))}
            </div>
            <div className={styles.brOverlay}>
                <span className={styles.brLevel}>{data.level}</span>
                <span className={styles.brTitle}>{data.title}</span>
                <div className={styles.brBar}>
                    <div className={styles.brProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.brXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BS: ルービックキューブ
// ============================================
function VariantBS({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bsCard}`}>
            <div className={styles.variantLabel}>BS</div>
            <div className={styles.bsCubeScene}>
                <div className={styles.bsCube}>
                    <div className={`${styles.bsFace} ${styles.bsFront}`}>{data.level}</div>
                    <div className={`${styles.bsFace} ${styles.bsBack}`}><Flame size={20} /></div>
                    <div className={`${styles.bsFace} ${styles.bsRight}`}>{data.streak}</div>
                    <div className={`${styles.bsFace} ${styles.bsLeft}`}><Trophy size={20} /></div>
                    <div className={`${styles.bsFace} ${styles.bsTop}`}><Star size={20} /></div>
                    <div className={`${styles.bsFace} ${styles.bsBottom}`}>XP</div>
                </div>
            </div>
            <div className={styles.bsInfo}>
                <span className={styles.bsTitle}>{data.title}</span>
                <span className={styles.bsXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BT: ダッシュボードメーター
// ============================================
function VariantBT({ data }: { data: LevelData }) {
    const angle = (data.progressPercent / 100) * 180 - 90;
    return (
        <div className={`${styles.card} ${styles.btCard}`}>
            <div className={styles.variantLabel}>BT</div>
            <div className={styles.btGauge}>
                <svg viewBox="0 0 100 60" className={styles.btSvg}>
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${data.progressPercent * 1.26} 126`}
                        className={styles.btArc}
                    />
                </svg>
                <div className={styles.btNeedle} style={{ transform: `rotate(${angle}deg)` }} />
                <div className={styles.btCenter}>
                    <span className={styles.btLevel}>{data.level}</span>
                </div>
            </div>
            <div className={styles.btInfo}>
                <span className={styles.btTitle}>{data.title}</span>
                <div className={styles.btStats}>
                    <span>{data.currentXp} XP</span>
                    <span><Flame size={12} /> {data.streak}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// BU: ポータル/ワームホール
// ============================================
function VariantBU({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.buCard}`}>
            <div className={styles.variantLabel}>BU</div>
            <div className={styles.buPortal}>
                <div className={styles.buVortex}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.buRing} style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
                <div className={styles.buCore}>
                    <span className={styles.buLevel}>{data.level}</span>
                </div>
                <div className={styles.buParticles}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className={styles.buParticle} style={{
                            animationDelay: `${i * 0.1}s`,
                            transform: `rotate(${i * 18}deg)`
                        }} />
                    ))}
                </div>
            </div>
            <div className={styles.buInfo}>
                <span className={styles.buTitle}>{data.title}</span>
                <span className={styles.buXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BV: 重力波エフェクト
// ============================================
function VariantBV({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bvCard}`}>
            <div className={styles.variantLabel}>BV</div>
            <div className={styles.bvSpace}>
                <div className={styles.bvGrid}>
                    {Array.from({ length: 49 }).map((_, i) => (
                        <div key={i} className={styles.bvDot} style={{ animationDelay: `${(i % 7) * 0.1 + Math.floor(i / 7) * 0.1}s` }} />
                    ))}
                </div>
                <div className={styles.bvMass}>
                    <span>{data.level}</span>
                </div>
            </div>
            <div className={styles.bvDetails}>
                <span className={styles.bvTitle}>{data.title}</span>
                <div className={styles.bvBar}>
                    <div className={styles.bvProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.bvXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BW: ホログラム投影
// ============================================
function VariantBW({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bwCard}`}>
            <div className={styles.variantLabel}>BW</div>
            <div className={styles.bwHologram}>
                <div className={styles.bwProjector} />
                <div className={styles.bwBeam} />
                <div className={styles.bwDisplay}>
                    <div className={styles.bwScanlines} />
                    <div className={styles.bwContent}>
                        <span className={styles.bwLevel}>{data.level}</span>
                        <span className={styles.bwTitle}>{data.title}</span>
                    </div>
                    <div className={styles.bwGlitch} />
                </div>
            </div>
            <div className={styles.bwFooter}>
                <div className={styles.bwBar}>
                    <div className={styles.bwProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BX: 時空歪み
// ============================================
function VariantBX({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bxCard}`}>
            <div className={styles.variantLabel}>BX</div>
            <div className={styles.bxSpacetime}>
                <div className={styles.bxWarp}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={styles.bxLine} style={{ transform: `rotate(${i * 22.5}deg)` }} />
                    ))}
                </div>
                <div className={styles.bxSingularity}>
                    <span className={styles.bxLevel}>{data.level}</span>
                </div>
                <div className={styles.bxDistortion} />
            </div>
            <div className={styles.bxMeta}>
                <span className={styles.bxTitle}>{data.title}</span>
                <span className={styles.bxXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BY: 量子トンネル
// ============================================
function VariantBY({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.byCard}`}>
            <div className={styles.variantLabel}>BY</div>
            <div className={styles.byQuantum}>
                <div className={styles.byBarrier}>
                    <div className={styles.byWall} />
                </div>
                <div className={styles.byParticleTrack}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.byElectron} style={{ animationDelay: `${i * 0.4}s` }} />
                    ))}
                </div>
                <div className={styles.byLevelDisplay}>
                    <span>{data.level}</span>
                </div>
            </div>
            <div className={styles.byInfo}>
                <span className={styles.byTitle}>{data.title}</span>
                <div className={styles.byProgress}>
                    <div className={styles.byFill} style={{ width: `${data.progressPercent}%` }} />
                </div>
                <span className={styles.byXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// BZ: オーロラ
// ============================================
function VariantBZ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.bzCard}`}>
            <div className={styles.variantLabel}>BZ</div>
            <div className={styles.bzAurora}>
                <div className={styles.bzWave1} />
                <div className={styles.bzWave2} />
                <div className={styles.bzWave3} />
                <div className={styles.bzStars}>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className={styles.bzStar} style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                        }} />
                    ))}
                </div>
            </div>
            <div className={styles.bzContent}>
                <div className={styles.bzLevel}>Lv.{data.level}</div>
                <div className={styles.bzTitle}>{data.title}</div>
                <div className={styles.bzStats}>
                    <span>{data.currentXp} XP</span>
                    <span>{Math.floor(data.progressPercent)}%</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// CA: 磁力線フィールド
// ============================================
function VariantCA({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.caCard}`}>
            <div className={styles.variantLabel}>CA</div>
            <div className={styles.caMagnetic}>
                <div className={styles.caFieldLines}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.caLine} style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
                <div className={styles.caPoleN}>N</div>
                <div className={styles.caPoleS}>S</div>
                <div className={styles.caCenter}>
                    <span className={styles.caLevel}>{data.level}</span>
                </div>
            </div>
            <div className={styles.caInfo}>
                <span className={styles.caTitle}>{data.title}</span>
                <div className={styles.caBar}>
                    <div className={styles.caProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// CB: 細胞分裂
// ============================================
function VariantCB({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cbCard}`}>
            <div className={styles.variantLabel}>CB</div>
            <div className={styles.cbMitosis}>
                <div className={styles.cbCell}>
                    <div className={styles.cbNucleus}>
                        <span>{data.level}</span>
                    </div>
                    <div className={styles.cbMembrane} />
                    <div className={styles.cbDivider} />
                </div>
                <div className={styles.cbChromosomes}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={styles.cbChromosome} style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
            </div>
            <div className={styles.cbDetails}>
                <span className={styles.cbTitle}>{data.title}</span>
                <span className={styles.cbXp}>{data.currentXp} / {data.nextLevelXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// CC: 銀河渦巻き
// ============================================
function VariantCC({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ccCard}`}>
            <div className={styles.variantLabel}>CC</div>
            <div className={styles.ccGalaxy}>
                <div className={styles.ccArm1} />
                <div className={styles.ccArm2} />
                <div className={styles.ccArm3} />
                <div className={styles.ccCore}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.ccDust}>
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className={styles.ccStar} style={{
                            animationDelay: `${i * 0.1}s`,
                            transform: `rotate(${i * 12}deg) translateX(${20 + (i % 3) * 15}px)`
                        }} />
                    ))}
                </div>
            </div>
            <div className={styles.ccInfo}>
                <span className={styles.ccTitle}>{data.title}</span>
                <span className={styles.ccXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// CD: 雷撃エフェクト
// ============================================
function VariantCD({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cdCard}`}>
            <div className={styles.variantLabel}>CD</div>
            <div className={styles.cdStorm}>
                <div className={styles.cdCloud} />
                <div className={styles.cdLightning1} />
                <div className={styles.cdLightning2} />
                <div className={styles.cdLightning3} />
                <div className={styles.cdGround}>
                    <span className={styles.cdLevel}>{data.level}</span>
                </div>
                <div className={styles.cdFlash} />
            </div>
            <div className={styles.cdMeta}>
                <span className={styles.cdTitle}>{data.title}</span>
                <div className={styles.cdBar}>
                    <div className={styles.cdProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// CE: プラズマ球
// ============================================
function VariantCE({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ceCard}`}>
            <div className={styles.variantLabel}>CE</div>
            <div className={styles.cePlasma}>
                <div className={styles.ceGlobe}>
                    <div className={styles.ceBolt1} />
                    <div className={styles.ceBolt2} />
                    <div className={styles.ceBolt3} />
                    <div className={styles.ceBolt4} />
                    <div className={styles.ceInner}>
                        <span>{data.level}</span>
                    </div>
                </div>
                <div className={styles.ceGlow} />
            </div>
            <div className={styles.ceInfo}>
                <span className={styles.ceTitle}>{data.title}</span>
                <span className={styles.ceXp}>{data.currentXp} XP</span>
                <div className={styles.ceBar}>
                    <div className={styles.ceProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// CF: 次元崩壊/折りたたみ
// ============================================
function VariantCF({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cfCard}`}>
            <div className={styles.variantLabel}>CF</div>
            <div className={styles.cfDimension}>
                <div className={styles.cfLayer1}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cfLayer2}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cfLayer3}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cfFracture}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.cfShard} style={{ transform: `rotate(${i * 60}deg)` }} />
                    ))}
                </div>
            </div>
            <div className={styles.cfMeta}>
                <span className={styles.cfTitle}>{data.title}</span>
                <div className={styles.cfStats}>
                    <span>{data.currentXp} XP</span>
                    <span><Flame size={12} /> {data.streak}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// CG: 手書きスケッチ風
// ============================================
function VariantCG({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cgCard}`}>
            <div className={styles.variantLabel}>CG</div>
            <div className={styles.cgSketch}>
                <div className={styles.cgCircle}>
                    <span className={styles.cgLevel}>{data.level}</span>
                </div>
                <div className={styles.cgArrow} />
                <div className={styles.cgNote}>
                    <span className={styles.cgTitle}>{data.title}</span>
                    <span className={styles.cgXp}>{data.currentXp}xp</span>
                </div>
            </div>
            <div className={styles.cgBar}>
                <div className={styles.cgFill} style={{ width: `${data.progressPercent}%` }} />
            </div>
            <div className={styles.cgDoodle}>〜〜〜</div>
        </div>
    );
}

// ============================================
// CH: インク滲み/水彩風
// ============================================
function VariantCH({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.chCard}`}>
            <div className={styles.variantLabel}>CH</div>
            <div className={styles.chInkBlot}>
                <div className={styles.chBlob1} />
                <div className={styles.chBlob2} />
                <div className={styles.chBlob3} />
            </div>
            <div className={styles.chContent}>
                <span className={styles.chLevel}>{data.level}</span>
                <span className={styles.chTitle}>{data.title}</span>
            </div>
            <div className={styles.chFooter}>
                <span>{data.currentXp} / {data.nextLevelXp}</span>
                <span>{data.streak}日目</span>
            </div>
        </div>
    );
}

// ============================================
// CI: 古びた看板
// ============================================
function VariantCI({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ciCard}`}>
            <div className={styles.variantLabel}>CI</div>
            <div className={styles.ciSign}>
                <div className={styles.ciBolt} />
                <div className={styles.ciBolt} style={{ right: '8px', left: 'auto' }} />
                <div className={styles.ciText}>
                    <span className={styles.ciLevel}>Lv.{data.level}</span>
                    <span className={styles.ciTitle}>{data.title}</span>
                </div>
                <div className={styles.ciRust} />
            </div>
            <div className={styles.ciMeter}>
                <div className={styles.ciNeedle} style={{ transform: `rotate(${data.progressPercent * 1.8 - 90}deg)` }} />
                <span className={styles.ciXp}>{data.currentXp}</span>
            </div>
        </div>
    );
}

// ============================================
// CJ: カセットテープ
// ============================================
function VariantCJ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cjCard}`}>
            <div className={styles.variantLabel}>CJ</div>
            <div className={styles.cjCassette}>
                <div className={styles.cjLabel}>
                    <span className={styles.cjTitle}>{data.title}</span>
                    <span className={styles.cjSide}>SIDE A</span>
                </div>
                <div className={styles.cjReels}>
                    <div className={styles.cjReel}>
                        <span>{data.level}</span>
                    </div>
                    <div className={styles.cjTape} />
                    <div className={styles.cjReel}>
                        <span>XP</span>
                    </div>
                </div>
                <div className={styles.cjWindow}>
                    <div className={styles.cjProgress} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
            <div className={styles.cjStats}>{data.currentXp} / {data.nextLevelXp}</div>
        </div>
    );
}

// ============================================
// CK: 切り絵コラージュ
// ============================================
function VariantCK({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ckCard}`}>
            <div className={styles.variantLabel}>CK</div>
            <div className={styles.ckCollage}>
                <div className={styles.ckPaper1}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.ckPaper2}>
                    <span>{data.title}</span>
                </div>
                <div className={styles.ckPaper3}>
                    <span>{data.currentXp}xp</span>
                </div>
                <div className={styles.ckTape} />
            </div>
            <div className={styles.ckBar}>
                <div className={styles.ckFill} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// CL: チョーク黒板
// ============================================
function VariantCL({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.clCard}`}>
            <div className={styles.variantLabel}>CL</div>
            <div className={styles.clBoard}>
                <div className={styles.clChalk}>
                    <span className={styles.clLevel}>Lv.{data.level}</span>
                    <span className={styles.clTitle}>{data.title}</span>
                </div>
                <div className={styles.clUnderline} />
                <div className={styles.clStats}>
                    <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                </div>
                <div className={styles.clDust} />
            </div>
        </div>
    );
}

// ============================================
// CM: ステッカー重ね
// ============================================
function VariantCM({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cmCard}`}>
            <div className={styles.variantLabel}>CM</div>
            <div className={styles.cmStickers}>
                <div className={styles.cmSticker1}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cmSticker2}>
                    <span>{data.title}</span>
                </div>
                <div className={styles.cmSticker3}>
                    <Flame size={14} />
                    <span>{data.streak}</span>
                </div>
                <div className={styles.cmSticker4}>
                    <span>{data.currentXp}xp</span>
                </div>
            </div>
            <div className={styles.cmBar}>
                <div className={styles.cmFill} style={{ width: `${data.progressPercent}%` }} />
            </div>
        </div>
    );
}

// ============================================
// CN: レシート風
// ============================================
function VariantCN({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cnCard}`}>
            <div className={styles.variantLabel}>CN</div>
            <div className={styles.cnReceipt}>
                <div className={styles.cnHeader}>*** LEVEL UP ***</div>
                <div className={styles.cnLine} />
                <div className={styles.cnRow}>
                    <span>LEVEL</span>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cnRow}>
                    <span>RANK</span>
                    <span>{data.title}</span>
                </div>
                <div className={styles.cnLine} />
                <div className={styles.cnRow}>
                    <span>XP</span>
                    <span>{data.currentXp}</span>
                </div>
                <div className={styles.cnRow}>
                    <span>NEXT</span>
                    <span>{data.nextLevelXp}</span>
                </div>
                <div className={styles.cnRow}>
                    <span>STREAK</span>
                    <span>{data.streak}日</span>
                </div>
                <div className={styles.cnLine} />
                <div className={styles.cnBarcode} />
            </div>
        </div>
    );
}

// ============================================
// CO: 付箋メモ
// ============================================
function VariantCO({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.coCard}`}>
            <div className={styles.variantLabel}>CO</div>
            <div className={styles.coNotes}>
                <div className={styles.coNote1}>
                    <span className={styles.coLevel}>{data.level}</span>
                    <span className={styles.coLabel}>level</span>
                </div>
                <div className={styles.coNote2}>
                    <span>{data.title}</span>
                    <span className={styles.coCheck}>✓</span>
                </div>
                <div className={styles.coNote3}>
                    <span>{data.currentXp}/{data.nextLevelXp}</span>
                    <span>XP</span>
                </div>
            </div>
            <div className={styles.coPen}>📝 {data.streak}日連続</div>
        </div>
    );
}

// ============================================
// CP: 破れたポスター
// ============================================
function VariantCP({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cpCard}`}>
            <div className={styles.variantLabel}>CP</div>
            <div className={styles.cpPoster}>
                <div className={styles.cpTear1} />
                <div className={styles.cpContent}>
                    <span className={styles.cpLevel}>{data.level}</span>
                    <span className={styles.cpTitle}>{data.title}</span>
                </div>
                <div className={styles.cpTear2} />
            </div>
            <div className={styles.cpFaded}>
                <span>{data.currentXp} XP</span>
                <div className={styles.cpBar}>
                    <div className={styles.cpFill} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// CQ: VHSノイズ
// ============================================
function VariantCQ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cqCard}`}>
            <div className={styles.variantLabel}>CQ</div>
            <div className={styles.cqScreen}>
                <div className={styles.cqTracking} />
                <div className={styles.cqContent}>
                    <div className={styles.cqTimecode}>REC ●</div>
                    <span className={styles.cqLevel}>LV.{data.level}</span>
                    <span className={styles.cqTitle}>{data.title}</span>
                    <div className={styles.cqCounter}>{String(data.currentXp).padStart(6, '0')}</div>
                </div>
                <div className={styles.cqNoise} />
                <div className={styles.cqLines} />
            </div>
        </div>
    );
}

// ============================================
// CR: 日めくりカレンダー
// ============================================
function VariantCR({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.crCard}`}>
            <div className={styles.variantLabel}>CR</div>
            <div className={styles.crCalendar}>
                <div className={styles.crRing}>
                    <div className={styles.crHole} />
                    <div className={styles.crHole} />
                </div>
                <div className={styles.crPage}>
                    <span className={styles.crDay}>{data.level}</span>
                    <span className={styles.crMonth}>{data.title}</span>
                </div>
                <div className={styles.crShadow} />
            </div>
            <div className={styles.crFooter}>
                <span>{data.currentXp} XP</span>
                <span>{data.streak}日連続</span>
            </div>
        </div>
    );
}

// ============================================
// CS: 新聞の切り抜き
// ============================================
function VariantCS({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.csCard}`}>
            <div className={styles.variantLabel}>CS</div>
            <div className={styles.csNewspaper}>
                <div className={styles.csHeader}>THE DAILY LEVEL</div>
                <div className={styles.csHeadline}>
                    <span className={styles.csLevel}>Lv.{data.level}</span>
                    <span className={styles.csTitle}>「{data.title}」に到達！</span>
                </div>
                <div className={styles.csBody}>
                    本日までに{data.currentXp}XPを獲得。次のレベルまであと{Math.ceil(data.nextLevelXp - data.currentXp)}XP。連続{data.streak}日目の快挙。
                </div>
                <div className={styles.csDate}>Vol.{data.level} • 本日発行</div>
            </div>
        </div>
    );
}

// ============================================
// CT: チケット/入場券
// ============================================
function VariantCT({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ctCard}`}>
            <div className={styles.variantLabel}>CT</div>
            <div className={styles.ctTicket}>
                <div className={styles.ctStub}>
                    <span className={styles.ctStubNum}>{data.level}</span>
                </div>
                <div className={styles.ctPerforation} />
                <div className={styles.ctMain}>
                    <div className={styles.ctTitle}>{data.title}</div>
                    <div className={styles.ctDetails}>
                        <span>XP: {data.currentXp}</span>
                        <span>STREAK: {data.streak}日</span>
                    </div>
                    <div className={styles.ctBarcode}>
                        ||||| || ||| || ||||| ||| ||
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// CU: 缶バッジコレクション
// ============================================
function VariantCU({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cuCard}`}>
            <div className={styles.variantLabel}>CU</div>
            <div className={styles.cuBadges}>
                <div className={styles.cuBadge1}>
                    <span>{data.level}</span>
                </div>
                <div className={styles.cuBadge2}>
                    <Flame size={16} />
                    <span>{data.streak}</span>
                </div>
                <div className={styles.cuBadge3}>
                    <span>{data.title}</span>
                </div>
            </div>
            <div className={styles.cuXp}>{data.currentXp} / {data.nextLevelXp} XP</div>
        </div>
    );
}

// ============================================
// CV: ノートの端っこ落書き
// ============================================
function VariantCV({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cvCard}`}>
            <div className={styles.variantLabel}>CV</div>
            <div className={styles.cvNotebook}>
                <div className={styles.cvMargin} />
                <div className={styles.cvContent}>
                    <div className={styles.cvDoodle}>
                        <span className={styles.cvLevel}>Lv.{data.level}</span>
                        <span className={styles.cvStar}>★★★</span>
                    </div>
                    <div className={styles.cvNote}>
                        {data.title} になった！<br />
                        <span className={styles.cvSmall}>{data.currentXp}xp /{data.streak}日目</span>
                    </div>
                    <div className={styles.cvArrow}>↑すごい！</div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// CW: 駄菓子屋の値札
// ============================================
function VariantCW({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cwCard}`}>
            <div className={styles.variantLabel}>CW</div>
            <div className={styles.cwTag}>
                <div className={styles.cwHole} />
                <div className={styles.cwPrice}>
                    <span className={styles.cwYen}>Lv.</span>
                    <span className={styles.cwNum}>{data.level}</span>
                </div>
                <div className={styles.cwName}>{data.title}</div>
                <div className={styles.cwSub}>
                    {data.currentXp}XP獲得中
                </div>
            </div>
            <div className={styles.cwString} />
        </div>
    );
}

// ============================================
// CX: スタンプカード
// ============================================
function VariantCX({ data }: { data: LevelData }) {
    const stamps = Math.min(10, Math.floor(data.progressPercent / 10));
    return (
        <div className={`${styles.card} ${styles.cxCard}`}>
            <div className={styles.variantLabel}>CX</div>
            <div className={styles.cxStampCard}>
                <div className={styles.cxHeader}>
                    <span>LEVEL {data.level}</span>
                    <span>{data.title}</span>
                </div>
                <div className={styles.cxGrid}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`${styles.cxSlot} ${i < stamps ? styles.cxStamped : ''}`}>
                            {i < stamps ? '済' : (i + 1)}
                        </div>
                    ))}
                </div>
                <div className={styles.cxFooter}>
                    {data.currentXp} XP • あと{10 - stamps}個で次のレベル
                </div>
            </div>
        </div>
    );
}

// ============================================
// CY: 温度計スタイル
// ============================================
function VariantCY({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.cyCard}`}>
            <div className={styles.variantLabel}>CY</div>
            <div className={styles.cyThermometer}>
                <div className={styles.cyTube}>
                    <div className={styles.cyMercury} style={{ height: `${data.progressPercent}%` }} />
                    <div className={styles.cyMarks}>
                        {[100, 75, 50, 25, 0].map(m => (
                            <span key={m}>{m}</span>
                        ))}
                    </div>
                </div>
                <div className={styles.cyBulb}>
                    <span>{data.level}</span>
                </div>
            </div>
            <div className={styles.cyInfo}>
                <span className={styles.cyTitle}>{data.title}</span>
                <span className={styles.cyXp}>{data.currentXp} XP</span>
            </div>
        </div>
    );
}

// ============================================
// CZ: 巻物スクロール
// ============================================
function VariantCZ({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.czCard}`}>
            <div className={styles.variantLabel}>CZ</div>
            <div className={styles.czScroll}>
                <div className={styles.czRodTop} />
                <div className={styles.czPaper}>
                    <div className={styles.czText}>
                        <span className={styles.czRank}>第{data.level}位</span>
                        <span className={styles.czTitle}>【{data.title}】</span>
                        <span className={styles.czXp}>経験値 {data.currentXp}</span>
                    </div>
                    <div className={styles.czStamp}>印</div>
                </div>
                <div className={styles.czRodBottom} />
            </div>
        </div>
    );
}

// ============================================
// DA: 駅の案内板
// ============================================
function VariantDA({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.daCard}`}>
            <div className={styles.variantLabel}>DA</div>
            <div className={styles.daSign}>
                <div className={styles.daHeader}>
                    <span className={styles.daLine}>■ {data.title}線</span>
                </div>
                <div className={styles.daStation}>
                    <div className={styles.daPrev}>Lv.{data.level - 1}</div>
                    <div className={styles.daCurrent}>
                        <span className={styles.daCircle} />
                        <span className={styles.daName}>Lv.{data.level}</span>
                    </div>
                    <div className={styles.daNext}>Lv.{data.level + 1}</div>
                </div>
                <div className={styles.daInfo}>
                    {data.currentXp} XP • 次駅まで{Math.ceil(data.nextLevelXp - data.currentXp)} XP
                </div>
            </div>
        </div>
    );
}

// ============================================
// DB: レトロゲーム風
// ============================================
function VariantDB({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dbCard}`}>
            <div className={styles.variantLabel}>DB</div>
            <div className={styles.dbScreen}>
                <div className={styles.dbHeader}>- STATUS -</div>
                <div className={styles.dbStats}>
                    <div className={styles.dbRow}>
                        <span>LV</span>
                        <span className={styles.dbValue}>{data.level}</span>
                    </div>
                    <div className={styles.dbRow}>
                        <span>CLASS</span>
                        <span className={styles.dbValue}>{data.title}</span>
                    </div>
                    <div className={styles.dbRow}>
                        <span>EXP</span>
                        <span className={styles.dbValue}>{data.currentXp}</span>
                    </div>
                    <div className={styles.dbRow}>
                        <span>NEXT</span>
                        <span className={styles.dbValue}>{Math.ceil(data.nextLevelXp - data.currentXp)}</span>
                    </div>
                </div>
                <div className={styles.dbHpBar}>
                    <div className={styles.dbHpFill} style={{ width: `${data.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// DC: 手帳の1ページ
// ============================================
function VariantDC({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dcCard}`}>
            <div className={styles.variantLabel}>DC</div>
            <div className={styles.dcPlanner}>
                <div className={styles.dcDate}>
                    <span className={styles.dcDay}>{data.streak}</span>
                    <span className={styles.dcLabel}>日目</span>
                </div>
                <div className={styles.dcContent}>
                    <div className={styles.dcGoal}>
                        <input type="checkbox" checked readOnly />
                        <span>Lv.{data.level} {data.title}に到達</span>
                    </div>
                    <div className={styles.dcMemo}>
                        <span>{data.currentXp} / {data.nextLevelXp} XP</span>
                    </div>
                    <div className={styles.dcProgress}>
                        {'█'.repeat(Math.floor(data.progressPercent / 10))}
                        {'░'.repeat(10 - Math.floor(data.progressPercent / 10))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// DD: お守り風
// ============================================
function VariantDD({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.ddCard}`}>
            <div className={styles.variantLabel}>DD</div>
            <div className={styles.ddOmamori}>
                <div className={styles.ddKnot} />
                <div className={styles.ddBody}>
                    <div className={styles.ddBorder}>
                        <span className={styles.ddMain}>第{data.level}位</span>
                        <span className={styles.ddSub}>{data.title}</span>
                        <span className={styles.ddSmall}>{data.currentXp}功徳</span>
                    </div>
                </div>
                <div className={styles.ddTassel} />
            </div>
        </div>
    );
}

// ============================================
// DE: 映画のエンドロール
// ============================================
function VariantDE({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.deCard}`}>
            <div className={styles.variantLabel}>DE</div>
            <div className={styles.deCredits}>
                <div className={styles.deScroll}>
                    <div className={styles.deRole}>LEVEL</div>
                    <div className={styles.deName}>{data.level}</div>
                    <div className={styles.deRole}>TITLE</div>
                    <div className={styles.deName}>{data.title}</div>
                    <div className={styles.deRole}>EXPERIENCE POINTS</div>
                    <div className={styles.deName}>{data.currentXp}</div>
                    <div className={styles.deRole}>STREAK</div>
                    <div className={styles.deName}>{data.streak} DAYS</div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// DF: ピザ配達追跡
// ============================================
function VariantDF({ data }: { data: LevelData }) {
    const stage = data.progressPercent < 33 ? 1 : data.progressPercent < 66 ? 2 : 3;
    return (
        <div className={`${styles.card} ${styles.dfCard}`}>
            <div className={styles.variantLabel}>DF</div>
            <div className={styles.dfTracker}>
                <div className={styles.dfHeader}>🍕 レベル{data.level} 配達中...</div>
                <div className={styles.dfSteps}>
                    <div className={`${styles.dfStep} ${stage >= 1 ? styles.dfActive : ''}`}>
                        <span className={styles.dfIcon}>📝</span>
                        <span>注文</span>
                    </div>
                    <div className={styles.dfLine} />
                    <div className={`${styles.dfStep} ${stage >= 2 ? styles.dfActive : ''}`}>
                        <span className={styles.dfIcon}>👨‍🍳</span>
                        <span>準備中</span>
                    </div>
                    <div className={styles.dfLine} />
                    <div className={`${styles.dfStep} ${stage >= 3 ? styles.dfActive : ''}`}>
                        <span className={styles.dfIcon}>🛵</span>
                        <span>配達中</span>
                    </div>
                </div>
                <div className={styles.dfInfo}>{data.currentXp} / {data.nextLevelXp} XP</div>
            </div>
        </div>
    );
}

// ============================================
// DG: 植物の成長記録
// ============================================
function VariantDG({ data }: { data: LevelData }) {
    const height = Math.floor(data.progressPercent / 20);
    return (
        <div className={`${styles.card} ${styles.dgCard}`}>
            <div className={styles.variantLabel}>DG</div>
            <div className={styles.dgPlant}>
                <div className={styles.dgStem}>
                    {Array.from({ length: height }).map((_, i) => (
                        <div key={i} className={styles.dgLeaf} style={{ bottom: `${i * 15 + 10}px` }}>🌿</div>
                    ))}
                    <div className={styles.dgFlower}>{data.level}</div>
                </div>
                <div className={styles.dgPot}>
                    <div className={styles.dgSoil} />
                </div>
            </div>
            <div className={styles.dgLabel}>
                <span>{data.title}</span>
                <span>{data.streak}日目</span>
            </div>
        </div>
    );
}

// ============================================
// DH: 天気予報
// ============================================
function VariantDH({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dhCard}`}>
            <div className={styles.variantLabel}>DH</div>
            <div className={styles.dhWeather}>
                <div className={styles.dhMain}>
                    <span className={styles.dhIcon}>☀️</span>
                    <span className={styles.dhTemp}>{data.level}°</span>
                </div>
                <div className={styles.dhLocation}>{data.title}地方</div>
                <div className={styles.dhDetails}>
                    <div className={styles.dhDetail}>
                        <span>経験値</span>
                        <span>{data.currentXp}</span>
                    </div>
                    <div className={styles.dhDetail}>
                        <span>連続日</span>
                        <span>{data.streak}</span>
                    </div>
                    <div className={styles.dhDetail}>
                        <span>進捗</span>
                        <span>{Math.floor(data.progressPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// DI: 処方箋/薬袋
// ============================================
function VariantDI({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.diCard}`}>
            <div className={styles.variantLabel}>DI</div>
            <div className={styles.diPrescription}>
                <div className={styles.diHeader}>
                    <span>💊 処方箋</span>
                    <span>No.{String(data.level).padStart(4, '0')}</span>
                </div>
                <div className={styles.diBody}>
                    <div className={styles.diRow}>
                        <span>薬名</span>
                        <span>{data.title}エキス</span>
                    </div>
                    <div className={styles.diRow}>
                        <span>用量</span>
                        <span>{data.currentXp}XP / 日</span>
                    </div>
                    <div className={styles.diRow}>
                        <span>日数</span>
                        <span>{data.streak}日分</span>
                    </div>
                </div>
                <div className={styles.diFooter}>毎日継続してください</div>
            </div>
        </div>
    );
}

// ============================================
// DJ: ボードゲームのマス
// ============================================
function VariantDJ({ data }: { data: LevelData }) {
    const pos = Math.floor(data.progressPercent / 10);
    return (
        <div className={`${styles.card} ${styles.djCard}`}>
            <div className={styles.variantLabel}>DJ</div>
            <div className={styles.djBoard}>
                <div className={styles.djPath}>
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className={`${styles.djSquare} ${i === pos ? styles.djCurrent : ''} ${i < pos ? styles.djPassed : ''}`}>
                            {i === pos ? '🎯' : i === 10 ? '🏆' : i + 1}
                        </div>
                    ))}
                </div>
                <div className={styles.djInfo}>
                    <span>Lv.{data.level} {data.title}</span>
                    <span>{data.currentXp} XP</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// DK: 試験の採点
// ============================================
function VariantDK({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dkCard}`}>
            <div className={styles.variantLabel}>DK</div>
            <div className={styles.dkPaper}>
                <div className={styles.dkHeader}>
                    <span>成績表</span>
                    <span>Lv.{data.level}</span>
                </div>
                <div className={styles.dkScore}>
                    <span className={styles.dkGrade}>{Math.floor(data.progressPercent)}</span>
                    <span className={styles.dkMax}>/100</span>
                </div>
                <div className={styles.dkRank}>{data.title}</div>
                <div className={styles.dkComment}>
                    {data.progressPercent >= 80 ? '大変よくできました' :
                     data.progressPercent >= 60 ? 'よくできました' : 'がんばりましょう'}
                </div>
                <div className={styles.dkStamp}>
                    {data.progressPercent >= 80 ? '💮' : data.progressPercent >= 60 ? '⭕' : '△'}
                </div>
            </div>
        </div>
    );
}

// ============================================
// DL: 宝の地図
// ============================================
function VariantDL({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dlCard}`}>
            <div className={styles.variantLabel}>DL</div>
            <div className={styles.dlMap}>
                <div className={styles.dlPath}>
                    <span className={styles.dlStart}>🚩</span>
                    <span className={styles.dlDots}>- - - -</span>
                    <span className={styles.dlX}>✖</span>
                    <span className={styles.dlDots}>- - - -</span>
                    <span className={styles.dlTreasure}>💎</span>
                </div>
                <div className={styles.dlYou} style={{ left: `${data.progressPercent}%` }}>📍</div>
                <div className={styles.dlCompass}>🧭</div>
            </div>
            <div className={styles.dlLegend}>
                <span>Lv.{data.level} {data.title}</span>
                <span>残り{Math.ceil(data.nextLevelXp - data.currentXp)}歩</span>
            </div>
        </div>
    );
}

// ============================================
// DM: ラジオの周波数
// ============================================
function VariantDM({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dmCard}`}>
            <div className={styles.variantLabel}>DM</div>
            <div className={styles.dmRadio}>
                <div className={styles.dmDisplay}>
                    <span className={styles.dmFreq}>{data.level}.{Math.floor(data.progressPercent / 10)}</span>
                    <span className={styles.dmUnit}>MHz</span>
                </div>
                <div className={styles.dmDial}>
                    <div className={styles.dmScale}>
                        {Array.from({ length: 11 }).map((_, i) => (
                            <span key={i}>{i}</span>
                        ))}
                    </div>
                    <div className={styles.dmNeedle} style={{ left: `${data.progressPercent}%` }} />
                </div>
                <div className={styles.dmStation}>{data.title} FM</div>
            </div>
        </div>
    );
}

// ============================================
// DN: 郵便切手
// ============================================
function VariantDN({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dnCard}`}>
            <div className={styles.variantLabel}>DN</div>
            <div className={styles.dnStamp}>
                <div className={styles.dnPerf} />
                <div className={styles.dnInner}>
                    <div className={styles.dnValue}>{data.level}</div>
                    <div className={styles.dnCountry}>LEVEL</div>
                    <div className={styles.dnTitle}>{data.title}</div>
                    <div className={styles.dnXp}>{data.currentXp}XP</div>
                </div>
                <div className={styles.dnPostmark}>〠</div>
            </div>
        </div>
    );
}

// ============================================
// DO: アーケードハイスコア
// ============================================
function VariantDO({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.doCard}`}>
            <div className={styles.variantLabel}>DO</div>
            <div className={styles.doArcade}>
                <div className={styles.doTitle}>HIGH SCORE</div>
                <div className={styles.doScoreBoard}>
                    <div className={styles.doEntry}>
                        <span className={styles.doRank}>1ST</span>
                        <span className={styles.doName}>{data.title.slice(0, 3).toUpperCase()}</span>
                        <span className={styles.doScore}>{String(data.currentXp).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.doEntry}>
                        <span className={styles.doRank}>LV</span>
                        <span className={styles.doName}>---</span>
                        <span className={styles.doScore}>{String(data.level).padStart(6, '0')}</span>
                    </div>
                </div>
                <div className={styles.doInsert}>INSERT COIN</div>
            </div>
        </div>
    );
}

// ============================================
// DP: 料理レシピカード
// ============================================
function VariantDP({ data }: { data: LevelData }) {
    return (
        <div className={`${styles.card} ${styles.dpCard}`}>
            <div className={styles.variantLabel}>DP</div>
            <div className={styles.dpRecipe}>
                <div className={styles.dpTitle}>🍳 {data.title}のレシピ</div>
                <div className={styles.dpIngredients}>
                    <div className={styles.dpItem}>
                        <span>レベル</span>
                        <span>{data.level}</span>
                    </div>
                    <div className={styles.dpItem}>
                        <span>経験値</span>
                        <span>{data.currentXp}g</span>
                    </div>
                    <div className={styles.dpItem}>
                        <span>継続日数</span>
                        <span>{data.streak}日</span>
                    </div>
                </div>
                <div className={styles.dpProgress}>
                    焼き加減: {'🔥'.repeat(Math.floor(data.progressPercent / 20))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// メインコンポーネント
// ============================================
export default function LevelDisplayVariants() {
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

    const variants = [
        { id: "A", component: VariantA },
        { id: "B", component: VariantB },
        { id: "C", component: VariantC },
        { id: "D", component: VariantD },
        { id: "E", component: VariantE },
        { id: "F", component: VariantF },
        { id: "G", component: VariantG },
        { id: "H", component: VariantH },
        { id: "I", component: VariantI },
        { id: "J", component: VariantJ },
        { id: "K", component: VariantK },
        { id: "L", component: VariantL },
        { id: "M", component: VariantM },
        { id: "N", component: VariantN },
        { id: "O", component: VariantO },
        { id: "P", component: VariantP },
        { id: "Q", component: VariantQ },
        { id: "R", component: VariantR },
        { id: "S", component: VariantS },
        { id: "T", component: VariantT },
        { id: "U", component: VariantU },
        { id: "V", component: VariantV },
        { id: "W", component: VariantW },
        { id: "X", component: VariantX },
        { id: "Y", component: VariantY },
        { id: "Z", component: VariantZ },
        { id: "AA", component: VariantAA },
        { id: "AB", component: VariantAB },
        { id: "AC", component: VariantAC },
        { id: "AD", component: VariantAD },
        { id: "AE", component: VariantAE },
        { id: "AF", component: VariantAF },
        { id: "AG", component: VariantAG },
        { id: "AH", component: VariantAH },
        { id: "AI", component: VariantAI },
        { id: "AJ", component: VariantAJ },
        { id: "AK", component: VariantAK },
        { id: "AL", component: VariantAL },
        { id: "AM", component: VariantAM },
        { id: "AN", component: VariantAN },
        { id: "AO", component: VariantAO },
        { id: "AP", component: VariantAP },
        { id: "AQ", component: VariantAQ },
        { id: "AR", component: VariantAR },
        { id: "AS", component: VariantAS },
        { id: "AT", component: VariantAT },
        { id: "AU", component: VariantAU },
        { id: "AV", component: VariantAV },
        { id: "AW", component: VariantAW },
        { id: "AX", component: VariantAX },
        { id: "AY", component: VariantAY },
        { id: "AZ", component: VariantAZ },
        { id: "BA", component: VariantBA },
        { id: "BB", component: VariantBB },
        { id: "BC", component: VariantBC },
        { id: "BD", component: VariantBD },
        { id: "BE", component: VariantBE },
        { id: "BF", component: VariantBF },
        { id: "BG", component: VariantBG },
        { id: "BH", component: VariantBH },
        { id: "BI", component: VariantBI },
        { id: "BJ", component: VariantBJ },
        { id: "BK", component: VariantBK },
        { id: "BL", component: VariantBL },
        { id: "BM", component: VariantBM },
        { id: "BN", component: VariantBN },
        { id: "BO", component: VariantBO },
        { id: "BP", component: VariantBP },
        { id: "BQ", component: VariantBQ },
        { id: "BR", component: VariantBR },
        { id: "BS", component: VariantBS },
        { id: "BT", component: VariantBT },
        { id: "BU", component: VariantBU },
        { id: "BV", component: VariantBV },
        { id: "BW", component: VariantBW },
        { id: "BX", component: VariantBX },
        { id: "BY", component: VariantBY },
        { id: "BZ", component: VariantBZ },
        { id: "CA", component: VariantCA },
        { id: "CB", component: VariantCB },
        { id: "CC", component: VariantCC },
        { id: "CD", component: VariantCD },
        { id: "CE", component: VariantCE },
        { id: "CF", component: VariantCF },
        { id: "CG", component: VariantCG },
        { id: "CH", component: VariantCH },
        { id: "CI", component: VariantCI },
        { id: "CJ", component: VariantCJ },
        { id: "CK", component: VariantCK },
        { id: "CL", component: VariantCL },
        { id: "CM", component: VariantCM },
        { id: "CN", component: VariantCN },
        { id: "CO", component: VariantCO },
        { id: "CP", component: VariantCP },
        { id: "CQ", component: VariantCQ },
        { id: "CR", component: VariantCR },
        { id: "CS", component: VariantCS },
        { id: "CT", component: VariantCT },
        { id: "CU", component: VariantCU },
        { id: "CV", component: VariantCV },
        { id: "CW", component: VariantCW },
        { id: "CX", component: VariantCX },
        { id: "CY", component: VariantCY },
        { id: "CZ", component: VariantCZ },
        { id: "DA", component: VariantDA },
        { id: "DB", component: VariantDB },
        { id: "DC", component: VariantDC },
        { id: "DD", component: VariantDD },
        { id: "DE", component: VariantDE },
        { id: "DF", component: VariantDF },
        { id: "DG", component: VariantDG },
        { id: "DH", component: VariantDH },
        { id: "DI", component: VariantDI },
        { id: "DJ", component: VariantDJ },
        { id: "DK", component: VariantDK },
        { id: "DL", component: VariantDL },
        { id: "DM", component: VariantDM },
        { id: "DN", component: VariantDN },
        { id: "DO", component: VariantDO },
        { id: "DP", component: VariantDP },
    ];

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>レベル表示</h2>
            <p className={styles.description}>選択してください</p>

            <div className={styles.grid}>
                {variants.map((v) => {
                    const Component = v.component;
                    const isSelected = selectedVariant === v.id;
                    return (
                        <div
                            key={v.id}
                            className={`${styles.gridItem} ${isSelected ? styles.gridItemSelected : ''}`}
                            onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                        >
                            <Component data={mockData} />
                        </div>
                    );
                })}
            </div>

            {selectedVariant && (
                <div className={styles.selectionInfo}>
                    {selectedVariant} を選択
                </div>
            )}
        </div>
    );
}
