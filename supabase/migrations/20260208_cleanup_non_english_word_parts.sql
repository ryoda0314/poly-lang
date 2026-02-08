-- 1. Remove word parts from non-English lookups (Japanese, Korean, Chinese, Vietnamese)
DELETE FROM etymology_word_parts
WHERE origin_language IN (
    'Japanese', 'OJ', 'MJ',
    'Chinese', 'MC', 'OC',
    'Korean', 'MK', 'PKor',
    'Vietnamese', 'PViet'
)
OR origin_language LIKE '%漢語%'
OR origin_language LIKE '%漢字%'
OR origin_language LIKE 'Sino-%'
OR origin_language LIKE 'Proto-Japonic%'
OR origin_language LIKE 'Proto-Koreanic%'
OR origin_language LIKE 'Proto-Vietic%';

-- 2. Normalize duplicate origin_language names to standard abbreviations
UPDATE etymology_word_parts SET origin_language = 'Gk'  WHERE origin_language IN ('greek', 'Greek', 'Ancient Greek');
UPDATE etymology_word_parts SET origin_language = 'Lat' WHERE origin_language IN ('latin', 'Latin');
UPDATE etymology_word_parts SET origin_language = 'OE'  WHERE origin_language IN ('old_english', 'Old English', 'Old_English');
UPDATE etymology_word_parts SET origin_language = 'ME'  WHERE origin_language IN ('middle_english', 'Middle English', 'Middle_English');
UPDATE etymology_word_parts SET origin_language = 'OF'  WHERE origin_language IN ('old_french', 'Old French', 'Old_French');
UPDATE etymology_word_parts SET origin_language = 'MF'  WHERE origin_language IN ('middle_french', 'Middle French', 'Middle_French');
UPDATE etymology_word_parts SET origin_language = 'It'  WHERE origin_language IN ('italian', 'Italian');
UPDATE etymology_word_parts SET origin_language = 'French' WHERE origin_language IN ('french');
