/**
 * Bible books data
 * Maps USFM book IDs to file names, English names, and localized names
 */

export type BibleLanguage = 'en' | 'ko' | 'de' | 'es' | 'fr' | 'zh' | 'ru' | 'vi';

// File suffix and directory for each Bible language
export const BIBLE_LANGUAGE_CONFIG: Record<BibleLanguage, { suffix: string; directory: string }> = {
    en: { suffix: 'eng-web', directory: 'eng-web_usfm' },
    ko: { suffix: 'kor', directory: 'kor_usfm' },
    de: { suffix: 'deu1912', directory: 'deu1912_usfm' },
    es: { suffix: 'spablm', directory: 'spablm_usfm' },
    fr: { suffix: 'fraLSG', directory: 'fraLSG_usfm' },
    zh: { suffix: 'cmn-cu89s', directory: 'cmn-cu89s_usfm' },
    ru: { suffix: 'russyn', directory: 'russyn_usfm' },
    vi: { suffix: 'vie1934', directory: 'vie1934_usfm' },
};

export interface BibleBook {
    id: string;           // USFM book ID (e.g., "GEN")
    filePrefix: string;   // File prefix (e.g., "02-GEN")
    nameEn: string;       // English name
    nameJa: string;       // Japanese name
    nameKo: string;       // Korean name
    nameDe: string;       // German name
    nameEs: string;       // Spanish name
    nameFr: string;       // French name
    nameZh: string;       // Chinese name
    nameRu: string;       // Russian name
    nameVi: string;       // Vietnamese name
    testament: 'old' | 'new';
    order: number;        // Canonical order
    chapters: number;     // Number of chapters
}

export const BIBLE_BOOKS: BibleBook[] = [
    // Old Testament (39 books)
    { id: 'GEN', filePrefix: '02-GEN', nameEn: 'Genesis', nameJa: '創世記', nameKo: '창세기', nameDe: '1. Mose', nameEs: 'Génesis', nameFr: 'Genèse', nameZh: '创世记', nameRu: 'Бытие', nameVi: 'Sáng Thế Ký', testament: 'old', order: 1, chapters: 50 },
    { id: 'EXO', filePrefix: '03-EXO', nameEn: 'Exodus', nameJa: '出エジプト記', nameKo: '출애굽기', nameDe: '2. Mose', nameEs: 'Éxodo', nameFr: 'Exode', nameZh: '出埃及记', nameRu: 'Исход', nameVi: 'Xuất Ê-díp-tô Ký', testament: 'old', order: 2, chapters: 40 },
    { id: 'LEV', filePrefix: '04-LEV', nameEn: 'Leviticus', nameJa: 'レビ記', nameKo: '레위기', nameDe: '3. Mose', nameEs: 'Levítico', nameFr: 'Lévitique', nameZh: '利未记', nameRu: 'Левит', nameVi: 'Lê-vi Ký', testament: 'old', order: 3, chapters: 27 },
    { id: 'NUM', filePrefix: '05-NUM', nameEn: 'Numbers', nameJa: '民数記', nameKo: '민수기', nameDe: '4. Mose', nameEs: 'Números', nameFr: 'Nombres', nameZh: '民数记', nameRu: 'Числа', nameVi: 'Dân Số Ký', testament: 'old', order: 4, chapters: 36 },
    { id: 'DEU', filePrefix: '06-DEU', nameEn: 'Deuteronomy', nameJa: '申命記', nameKo: '신명기', nameDe: '5. Mose', nameEs: 'Deuteronomio', nameFr: 'Deutéronome', nameZh: '申命记', nameRu: 'Второзаконие', nameVi: 'Phục Truyền Luật Lệ Ký', testament: 'old', order: 5, chapters: 34 },
    { id: 'JOS', filePrefix: '07-JOS', nameEn: 'Joshua', nameJa: 'ヨシュア記', nameKo: '여호수아', nameDe: 'Josua', nameEs: 'Josué', nameFr: 'Josué', nameZh: '约书亚记', nameRu: 'Иисус Навин', nameVi: 'Giô-suê', testament: 'old', order: 6, chapters: 24 },
    { id: 'JDG', filePrefix: '08-JDG', nameEn: 'Judges', nameJa: '士師記', nameKo: '사사기', nameDe: 'Richter', nameEs: 'Jueces', nameFr: 'Juges', nameZh: '士师记', nameRu: 'Судьи', nameVi: 'Các Quan Xét', testament: 'old', order: 7, chapters: 21 },
    { id: 'RUT', filePrefix: '09-RUT', nameEn: 'Ruth', nameJa: 'ルツ記', nameKo: '룻기', nameDe: 'Ruth', nameEs: 'Rut', nameFr: 'Ruth', nameZh: '路得记', nameRu: 'Руфь', nameVi: 'Ru-tơ', testament: 'old', order: 8, chapters: 4 },
    { id: '1SA', filePrefix: '10-1SA', nameEn: '1 Samuel', nameJa: 'サムエル記上', nameKo: '사무엘상', nameDe: '1. Samuel', nameEs: '1 Samuel', nameFr: '1 Samuel', nameZh: '撒母耳记上', nameRu: '1-я Царств', nameVi: '1 Sa-mu-ên', testament: 'old', order: 9, chapters: 31 },
    { id: '2SA', filePrefix: '11-2SA', nameEn: '2 Samuel', nameJa: 'サムエル記下', nameKo: '사무엘하', nameDe: '2. Samuel', nameEs: '2 Samuel', nameFr: '2 Samuel', nameZh: '撒母耳记下', nameRu: '2-я Царств', nameVi: '2 Sa-mu-ên', testament: 'old', order: 10, chapters: 24 },
    { id: '1KI', filePrefix: '12-1KI', nameEn: '1 Kings', nameJa: '列王記上', nameKo: '열왕기상', nameDe: '1. Könige', nameEs: '1 Reyes', nameFr: '1 Rois', nameZh: '列王纪上', nameRu: '3-я Царств', nameVi: '1 Các Vua', testament: 'old', order: 11, chapters: 22 },
    { id: '2KI', filePrefix: '13-2KI', nameEn: '2 Kings', nameJa: '列王記下', nameKo: '열왕기하', nameDe: '2. Könige', nameEs: '2 Reyes', nameFr: '2 Rois', nameZh: '列王纪下', nameRu: '4-я Царств', nameVi: '2 Các Vua', testament: 'old', order: 12, chapters: 25 },
    { id: '1CH', filePrefix: '14-1CH', nameEn: '1 Chronicles', nameJa: '歴代誌上', nameKo: '역대상', nameDe: '1. Chronik', nameEs: '1 Crónicas', nameFr: '1 Chroniques', nameZh: '历代志上', nameRu: '1-я Паралипоменон', nameVi: '1 Sử Ký', testament: 'old', order: 13, chapters: 29 },
    { id: '2CH', filePrefix: '15-2CH', nameEn: '2 Chronicles', nameJa: '歴代誌下', nameKo: '역대하', nameDe: '2. Chronik', nameEs: '2 Crónicas', nameFr: '2 Chroniques', nameZh: '历代志下', nameRu: '2-я Паралипоменон', nameVi: '2 Sử Ký', testament: 'old', order: 14, chapters: 36 },
    { id: 'EZR', filePrefix: '16-EZR', nameEn: 'Ezra', nameJa: 'エズラ記', nameKo: '에스라', nameDe: 'Esra', nameEs: 'Esdras', nameFr: 'Esdras', nameZh: '以斯拉记', nameRu: 'Ездра', nameVi: 'E-xơ-ra', testament: 'old', order: 15, chapters: 10 },
    { id: 'NEH', filePrefix: '17-NEH', nameEn: 'Nehemiah', nameJa: 'ネヘミヤ記', nameKo: '느헤미야', nameDe: 'Nehemia', nameEs: 'Nehemías', nameFr: 'Néhémie', nameZh: '尼希米记', nameRu: 'Неемия', nameVi: 'Nê-hê-mi', testament: 'old', order: 16, chapters: 13 },
    { id: 'EST', filePrefix: '18-EST', nameEn: 'Esther', nameJa: 'エステル記', nameKo: '에스더', nameDe: 'Esther', nameEs: 'Ester', nameFr: 'Esther', nameZh: '以斯帖记', nameRu: 'Есфирь', nameVi: 'Ê-xơ-tê', testament: 'old', order: 17, chapters: 10 },
    { id: 'JOB', filePrefix: '19-JOB', nameEn: 'Job', nameJa: 'ヨブ記', nameKo: '욥기', nameDe: 'Hiob', nameEs: 'Job', nameFr: 'Job', nameZh: '约伯记', nameRu: 'Иов', nameVi: 'Gióp', testament: 'old', order: 18, chapters: 42 },
    { id: 'PSA', filePrefix: '20-PSA', nameEn: 'Psalms', nameJa: '詩篇', nameKo: '시편', nameDe: 'Psalmen', nameEs: 'Salmos', nameFr: 'Psaumes', nameZh: '诗篇', nameRu: 'Псалтирь', nameVi: 'Thi Thiên', testament: 'old', order: 19, chapters: 150 },
    { id: 'PRO', filePrefix: '21-PRO', nameEn: 'Proverbs', nameJa: '箴言', nameKo: '잠언', nameDe: 'Sprüche', nameEs: 'Proverbios', nameFr: 'Proverbes', nameZh: '箴言', nameRu: 'Притчи', nameVi: 'Châm Ngôn', testament: 'old', order: 20, chapters: 31 },
    { id: 'ECC', filePrefix: '22-ECC', nameEn: 'Ecclesiastes', nameJa: '伝道者の書', nameKo: '전도서', nameDe: 'Prediger', nameEs: 'Eclesiastés', nameFr: 'Ecclésiaste', nameZh: '传道书', nameRu: 'Екклесиаст', nameVi: 'Truyền Đạo', testament: 'old', order: 21, chapters: 12 },
    { id: 'SNG', filePrefix: '23-SNG', nameEn: 'Song of Solomon', nameJa: '雅歌', nameKo: '아가', nameDe: 'Hohelied', nameEs: 'Cantares', nameFr: 'Cantique', nameZh: '雅歌', nameRu: 'Песнь Песней', nameVi: 'Nhã Ca', testament: 'old', order: 22, chapters: 8 },
    { id: 'ISA', filePrefix: '24-ISA', nameEn: 'Isaiah', nameJa: 'イザヤ書', nameKo: '이사야', nameDe: 'Jesaja', nameEs: 'Isaías', nameFr: 'Ésaïe', nameZh: '以赛亚书', nameRu: 'Исаия', nameVi: 'Ê-sai', testament: 'old', order: 23, chapters: 66 },
    { id: 'JER', filePrefix: '25-JER', nameEn: 'Jeremiah', nameJa: 'エレミヤ書', nameKo: '예레미야', nameDe: 'Jeremia', nameEs: 'Jeremías', nameFr: 'Jérémie', nameZh: '耶利米书', nameRu: 'Иеремия', nameVi: 'Giê-rê-mi', testament: 'old', order: 24, chapters: 52 },
    { id: 'LAM', filePrefix: '26-LAM', nameEn: 'Lamentations', nameJa: '哀歌', nameKo: '예레미야애가', nameDe: 'Klagelieder', nameEs: 'Lamentaciones', nameFr: 'Lamentations', nameZh: '耶利米哀歌', nameRu: 'Плач Иеремии', nameVi: 'Ca Thương', testament: 'old', order: 25, chapters: 5 },
    { id: 'EZK', filePrefix: '27-EZK', nameEn: 'Ezekiel', nameJa: 'エゼキエル書', nameKo: '에스겔', nameDe: 'Hesekiel', nameEs: 'Ezequiel', nameFr: 'Ézéchiel', nameZh: '以西结书', nameRu: 'Иезекииль', nameVi: 'Ê-xê-chi-ên', testament: 'old', order: 26, chapters: 48 },
    { id: 'DAN', filePrefix: '28-DAN', nameEn: 'Daniel', nameJa: 'ダニエル書', nameKo: '다니엘', nameDe: 'Daniel', nameEs: 'Daniel', nameFr: 'Daniel', nameZh: '但以理书', nameRu: 'Даниил', nameVi: 'Đa-ni-ên', testament: 'old', order: 27, chapters: 12 },
    { id: 'HOS', filePrefix: '29-HOS', nameEn: 'Hosea', nameJa: 'ホセア書', nameKo: '호세아', nameDe: 'Hosea', nameEs: 'Oseas', nameFr: 'Osée', nameZh: '何西阿书', nameRu: 'Осия', nameVi: 'Ô-sê', testament: 'old', order: 28, chapters: 14 },
    { id: 'JOL', filePrefix: '30-JOL', nameEn: 'Joel', nameJa: 'ヨエル書', nameKo: '요엘', nameDe: 'Joel', nameEs: 'Joel', nameFr: 'Joël', nameZh: '约珥书', nameRu: 'Иоиль', nameVi: 'Giô-ên', testament: 'old', order: 29, chapters: 3 },
    { id: 'AMO', filePrefix: '31-AMO', nameEn: 'Amos', nameJa: 'アモス書', nameKo: '아모스', nameDe: 'Amos', nameEs: 'Amós', nameFr: 'Amos', nameZh: '阿摩司书', nameRu: 'Амос', nameVi: 'A-mốt', testament: 'old', order: 30, chapters: 9 },
    { id: 'OBA', filePrefix: '32-OBA', nameEn: 'Obadiah', nameJa: 'オバデヤ書', nameKo: '오바댜', nameDe: 'Obadja', nameEs: 'Abdías', nameFr: 'Abdias', nameZh: '俄巴底亚书', nameRu: 'Авдий', nameVi: 'Áp-đia', testament: 'old', order: 31, chapters: 1 },
    { id: 'JON', filePrefix: '33-JON', nameEn: 'Jonah', nameJa: 'ヨナ書', nameKo: '요나', nameDe: 'Jona', nameEs: 'Jonás', nameFr: 'Jonas', nameZh: '约拿书', nameRu: 'Иона', nameVi: 'Giô-na', testament: 'old', order: 32, chapters: 4 },
    { id: 'MIC', filePrefix: '34-MIC', nameEn: 'Micah', nameJa: 'ミカ書', nameKo: '미가', nameDe: 'Micha', nameEs: 'Miqueas', nameFr: 'Michée', nameZh: '弥迦书', nameRu: 'Михей', nameVi: 'Mi-chê', testament: 'old', order: 33, chapters: 7 },
    { id: 'NAM', filePrefix: '35-NAM', nameEn: 'Nahum', nameJa: 'ナホム書', nameKo: '나훔', nameDe: 'Nahum', nameEs: 'Nahúm', nameFr: 'Nahum', nameZh: '那鸿书', nameRu: 'Наум', nameVi: 'Na-hum', testament: 'old', order: 34, chapters: 3 },
    { id: 'HAB', filePrefix: '36-HAB', nameEn: 'Habakkuk', nameJa: 'ハバクク書', nameKo: '하박국', nameDe: 'Habakuk', nameEs: 'Habacuc', nameFr: 'Habacuc', nameZh: '哈巴谷书', nameRu: 'Аввакум', nameVi: 'Ha-ba-cúc', testament: 'old', order: 35, chapters: 3 },
    { id: 'ZEP', filePrefix: '37-ZEP', nameEn: 'Zephaniah', nameJa: 'ゼパニヤ書', nameKo: '스바냐', nameDe: 'Zefanja', nameEs: 'Sofonías', nameFr: 'Sophonie', nameZh: '西番雅书', nameRu: 'Софония', nameVi: 'Sô-phô-ni', testament: 'old', order: 36, chapters: 3 },
    { id: 'HAG', filePrefix: '38-HAG', nameEn: 'Haggai', nameJa: 'ハガイ書', nameKo: '학개', nameDe: 'Haggai', nameEs: 'Hageo', nameFr: 'Aggée', nameZh: '哈该书', nameRu: 'Аггей', nameVi: 'A-ghê', testament: 'old', order: 37, chapters: 2 },
    { id: 'ZEC', filePrefix: '39-ZEC', nameEn: 'Zechariah', nameJa: 'ゼカリヤ書', nameKo: '스가랴', nameDe: 'Sacharja', nameEs: 'Zacarías', nameFr: 'Zacharie', nameZh: '撒迦利亚书', nameRu: 'Захария', nameVi: 'Xa-cha-ri', testament: 'old', order: 38, chapters: 14 },
    { id: 'MAL', filePrefix: '40-MAL', nameEn: 'Malachi', nameJa: 'マラキ書', nameKo: '말라기', nameDe: 'Maleachi', nameEs: 'Malaquías', nameFr: 'Malachie', nameZh: '玛拉基书', nameRu: 'Малахия', nameVi: 'Ma-la-chi', testament: 'old', order: 39, chapters: 4 },

    // New Testament (27 books)
    { id: 'MAT', filePrefix: '70-MAT', nameEn: 'Matthew', nameJa: 'マタイの福音書', nameKo: '마태복음', nameDe: 'Matthäus', nameEs: 'Mateo', nameFr: 'Matthieu', nameZh: '马太福音', nameRu: 'От Матфея', nameVi: 'Ma-thi-ơ', testament: 'new', order: 40, chapters: 28 },
    { id: 'MRK', filePrefix: '71-MRK', nameEn: 'Mark', nameJa: 'マルコの福音書', nameKo: '마가복음', nameDe: 'Markus', nameEs: 'Marcos', nameFr: 'Marc', nameZh: '马可福音', nameRu: 'От Марка', nameVi: 'Mác', testament: 'new', order: 41, chapters: 16 },
    { id: 'LUK', filePrefix: '72-LUK', nameEn: 'Luke', nameJa: 'ルカの福音書', nameKo: '누가복음', nameDe: 'Lukas', nameEs: 'Lucas', nameFr: 'Luc', nameZh: '路加福音', nameRu: 'От Луки', nameVi: 'Lu-ca', testament: 'new', order: 42, chapters: 24 },
    { id: 'JHN', filePrefix: '73-JHN', nameEn: 'John', nameJa: 'ヨハネの福音書', nameKo: '요한복음', nameDe: 'Johannes', nameEs: 'Juan', nameFr: 'Jean', nameZh: '约翰福音', nameRu: 'От Иоанна', nameVi: 'Giăng', testament: 'new', order: 43, chapters: 21 },
    { id: 'ACT', filePrefix: '74-ACT', nameEn: 'Acts', nameJa: '使徒の働き', nameKo: '사도행전', nameDe: 'Apostelgeschichte', nameEs: 'Hechos', nameFr: 'Actes', nameZh: '使徒行传', nameRu: 'Деяния', nameVi: 'Công Vụ', testament: 'new', order: 44, chapters: 28 },
    { id: 'ROM', filePrefix: '75-ROM', nameEn: 'Romans', nameJa: 'ローマ人への手紙', nameKo: '로마서', nameDe: 'Römer', nameEs: 'Romanos', nameFr: 'Romains', nameZh: '罗马书', nameRu: 'К Римлянам', nameVi: 'Rô-ma', testament: 'new', order: 45, chapters: 16 },
    { id: '1CO', filePrefix: '76-1CO', nameEn: '1 Corinthians', nameJa: 'コリント人への手紙第一', nameKo: '고린도전서', nameDe: '1. Korinther', nameEs: '1 Corintios', nameFr: '1 Corinthiens', nameZh: '哥林多前书', nameRu: '1-е Коринфянам', nameVi: '1 Cô-rinh-tô', testament: 'new', order: 46, chapters: 16 },
    { id: '2CO', filePrefix: '77-2CO', nameEn: '2 Corinthians', nameJa: 'コリント人への手紙第二', nameKo: '고린도후서', nameDe: '2. Korinther', nameEs: '2 Corintios', nameFr: '2 Corinthiens', nameZh: '哥林多后书', nameRu: '2-е Коринфянам', nameVi: '2 Cô-rinh-tô', testament: 'new', order: 47, chapters: 13 },
    { id: 'GAL', filePrefix: '78-GAL', nameEn: 'Galatians', nameJa: 'ガラテヤ人への手紙', nameKo: '갈라디아서', nameDe: 'Galater', nameEs: 'Gálatas', nameFr: 'Galates', nameZh: '加拉太书', nameRu: 'К Галатам', nameVi: 'Ga-la-ti', testament: 'new', order: 48, chapters: 6 },
    { id: 'EPH', filePrefix: '79-EPH', nameEn: 'Ephesians', nameJa: 'エペソ人への手紙', nameKo: '에베소서', nameDe: 'Epheser', nameEs: 'Efesios', nameFr: 'Éphésiens', nameZh: '以弗所书', nameRu: 'К Ефесянам', nameVi: 'Ê-phê-sô', testament: 'new', order: 49, chapters: 6 },
    { id: 'PHP', filePrefix: '80-PHP', nameEn: 'Philippians', nameJa: 'ピリピ人への手紙', nameKo: '빌립보서', nameDe: 'Philipper', nameEs: 'Filipenses', nameFr: 'Philippiens', nameZh: '腓立比书', nameRu: 'К Филиппийцам', nameVi: 'Phi-líp', testament: 'new', order: 50, chapters: 4 },
    { id: 'COL', filePrefix: '81-COL', nameEn: 'Colossians', nameJa: 'コロサイ人への手紙', nameKo: '골로새서', nameDe: 'Kolosser', nameEs: 'Colosenses', nameFr: 'Colossiens', nameZh: '歌罗西书', nameRu: 'К Колоссянам', nameVi: 'Cô-lô-se', testament: 'new', order: 51, chapters: 4 },
    { id: '1TH', filePrefix: '82-1TH', nameEn: '1 Thessalonians', nameJa: 'テサロニケ人への手紙第一', nameKo: '데살로니가전서', nameDe: '1. Thessalonicher', nameEs: '1 Tesalonicenses', nameFr: '1 Thessaloniciens', nameZh: '帖撒罗尼迦前书', nameRu: '1-е Фессалоникийцам', nameVi: '1 Tê-sa-lô-ni-ca', testament: 'new', order: 52, chapters: 5 },
    { id: '2TH', filePrefix: '83-2TH', nameEn: '2 Thessalonians', nameJa: 'テサロニケ人への手紙第二', nameKo: '데살로니가후서', nameDe: '2. Thessalonicher', nameEs: '2 Tesalonicenses', nameFr: '2 Thessaloniciens', nameZh: '帖撒罗尼迦后书', nameRu: '2-е Фессалоникийцам', nameVi: '2 Tê-sa-lô-ni-ca', testament: 'new', order: 53, chapters: 3 },
    { id: '1TI', filePrefix: '84-1TI', nameEn: '1 Timothy', nameJa: 'テモテへの手紙第一', nameKo: '디모데전서', nameDe: '1. Timotheus', nameEs: '1 Timoteo', nameFr: '1 Timothée', nameZh: '提摩太前书', nameRu: '1-е Тимофею', nameVi: '1 Ti-mô-thê', testament: 'new', order: 54, chapters: 6 },
    { id: '2TI', filePrefix: '85-2TI', nameEn: '2 Timothy', nameJa: 'テモテへの手紙第二', nameKo: '디모데후서', nameDe: '2. Timotheus', nameEs: '2 Timoteo', nameFr: '2 Timothée', nameZh: '提摩太后书', nameRu: '2-е Тимофею', nameVi: '2 Ti-mô-thê', testament: 'new', order: 55, chapters: 4 },
    { id: 'TIT', filePrefix: '86-TIT', nameEn: 'Titus', nameJa: 'テトスへの手紙', nameKo: '디도서', nameDe: 'Titus', nameEs: 'Tito', nameFr: 'Tite', nameZh: '提多书', nameRu: 'К Титу', nameVi: 'Tít', testament: 'new', order: 56, chapters: 3 },
    { id: 'PHM', filePrefix: '87-PHM', nameEn: 'Philemon', nameJa: 'ピレモンへの手紙', nameKo: '빌레몬서', nameDe: 'Philemon', nameEs: 'Filemón', nameFr: 'Philémon', nameZh: '腓利门书', nameRu: 'К Филимону', nameVi: 'Phi-lê-môn', testament: 'new', order: 57, chapters: 1 },
    { id: 'HEB', filePrefix: '88-HEB', nameEn: 'Hebrews', nameJa: 'ヘブル人への手紙', nameKo: '히브리서', nameDe: 'Hebräer', nameEs: 'Hebreos', nameFr: 'Hébreux', nameZh: '希伯来书', nameRu: 'К Евреям', nameVi: 'Hê-bơ-rơ', testament: 'new', order: 58, chapters: 13 },
    { id: 'JAS', filePrefix: '89-JAS', nameEn: 'James', nameJa: 'ヤコブの手紙', nameKo: '야고보서', nameDe: 'Jakobus', nameEs: 'Santiago', nameFr: 'Jacques', nameZh: '雅各书', nameRu: 'Иакова', nameVi: 'Gia-cơ', testament: 'new', order: 59, chapters: 5 },
    { id: '1PE', filePrefix: '90-1PE', nameEn: '1 Peter', nameJa: 'ペテロの手紙第一', nameKo: '베드로전서', nameDe: '1. Petrus', nameEs: '1 Pedro', nameFr: '1 Pierre', nameZh: '彼得前书', nameRu: '1-е Петра', nameVi: '1 Phi-e-rơ', testament: 'new', order: 60, chapters: 5 },
    { id: '2PE', filePrefix: '91-2PE', nameEn: '2 Peter', nameJa: 'ペテロの手紙第二', nameKo: '베드로후서', nameDe: '2. Petrus', nameEs: '2 Pedro', nameFr: '2 Pierre', nameZh: '彼得后书', nameRu: '2-е Петра', nameVi: '2 Phi-e-rơ', testament: 'new', order: 61, chapters: 3 },
    { id: '1JN', filePrefix: '92-1JN', nameEn: '1 John', nameJa: 'ヨハネの手紙第一', nameKo: '요한1서', nameDe: '1. Johannes', nameEs: '1 Juan', nameFr: '1 Jean', nameZh: '约翰一书', nameRu: '1-е Иоанна', nameVi: '1 Giăng', testament: 'new', order: 62, chapters: 5 },
    { id: '2JN', filePrefix: '93-2JN', nameEn: '2 John', nameJa: 'ヨハネの手紙第二', nameKo: '요한2서', nameDe: '2. Johannes', nameEs: '2 Juan', nameFr: '2 Jean', nameZh: '约翰二书', nameRu: '2-е Иоанна', nameVi: '2 Giăng', testament: 'new', order: 63, chapters: 1 },
    { id: '3JN', filePrefix: '94-3JN', nameEn: '3 John', nameJa: 'ヨハネの手紙第三', nameKo: '요한3서', nameDe: '3. Johannes', nameEs: '3 Juan', nameFr: '3 Jean', nameZh: '约翰三书', nameRu: '3-е Иоанна', nameVi: '3 Giăng', testament: 'new', order: 64, chapters: 1 },
    { id: 'JUD', filePrefix: '95-JUD', nameEn: 'Jude', nameJa: 'ユダの手紙', nameKo: '유다서', nameDe: 'Judas', nameEs: 'Judas', nameFr: 'Jude', nameZh: '犹大书', nameRu: 'Иуды', nameVi: 'Giu-đe', testament: 'new', order: 65, chapters: 1 },
    { id: 'REV', filePrefix: '96-REV', nameEn: 'Revelation', nameJa: 'ヨハネの黙示録', nameKo: '요한계시록', nameDe: 'Offenbarung', nameEs: 'Apocalipsis', nameFr: 'Apocalypse', nameZh: '启示录', nameRu: 'Откровение', nameVi: 'Khải Huyền', testament: 'new', order: 66, chapters: 22 },
];

export const OLD_TESTAMENT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'old');
export const NEW_TESTAMENT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'new');

export function getBookById(id: string): BibleBook | undefined {
    return BIBLE_BOOKS.find(b => b.id === id);
}

export function getBookFileName(book: BibleBook, language: BibleLanguage): string {
    const config = BIBLE_LANGUAGE_CONFIG[language];
    return `${book.filePrefix}${config.suffix}.usfm`;
}

export function getBookDisplayName(book: Omit<BibleBook, 'chapters'>, language: BibleLanguage): string {
    switch (language) {
        case 'ko': return book.nameKo;
        case 'de': return book.nameDe;
        case 'es': return book.nameEs;
        case 'fr': return book.nameFr;
        case 'zh': return book.nameZh;
        case 'ru': return book.nameRu;
        case 'vi': return book.nameVi;
        default: return book.nameEn;
    }
}

export function getDirectory(language: BibleLanguage): string {
    return BIBLE_LANGUAGE_CONFIG[language].directory;
}
