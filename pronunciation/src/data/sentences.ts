import type { Sentence } from '@/types/pronunciation';

export const sentences: Sentence[] = [
    {
        id: 'sent-001',
        text: 'The quick brown fox jumps over the lazy dog.',
        difficulty: 'easy',
        category: 'pangram',
        phonemes: ['θ', 'ð', 'dʒ'],
    },
    {
        id: 'sent-002',
        text: 'She sells seashells by the seashore.',
        difficulty: 'medium',
        category: 'tongue-twister',
        phonemes: ['ʃ', 's'],
    },
    {
        id: 'sent-003',
        text: 'Peter Piper picked a peck of pickled peppers.',
        difficulty: 'hard',
        category: 'tongue-twister',
        phonemes: ['p'],
    },
    {
        id: 'sent-004',
        text: 'How much wood would a woodchuck chuck?',
        difficulty: 'medium',
        category: 'tongue-twister',
        phonemes: ['w', 'tʃ'],
    },
    {
        id: 'sent-005',
        text: 'The weather is wonderful today.',
        difficulty: 'easy',
        category: 'everyday',
        phonemes: ['ð', 'w'],
    },
    {
        id: 'sent-006',
        text: 'I would like to make a reservation for two.',
        difficulty: 'easy',
        category: 'travel',
        phonemes: ['w', 'r'],
    },
    {
        id: 'sent-007',
        text: 'Could you please speak a little slower?',
        difficulty: 'easy',
        category: 'everyday',
        phonemes: ['l', 'r'],
    },
    {
        id: 'sent-008',
        text: 'The thick thistle thorns pricked the thumb.',
        difficulty: 'hard',
        category: 'tongue-twister',
        phonemes: ['θ', 'ð'],
    },
    {
        id: 'sent-009',
        text: 'Red lorry, yellow lorry, red lorry, yellow lorry.',
        difficulty: 'hard',
        category: 'tongue-twister',
        phonemes: ['r', 'l'],
    },
    {
        id: 'sent-010',
        text: 'I appreciate your thoughtful consideration.',
        difficulty: 'medium',
        category: 'business',
        phonemes: ['θ', 'ʃ'],
    },
    {
        id: 'sent-011',
        text: 'The entrepreneur achieved extraordinary success.',
        difficulty: 'hard',
        category: 'business',
        phonemes: ['ʒ', 'r'],
    },
    {
        id: 'sent-012',
        text: 'Excuse me, where is the nearest station?',
        difficulty: 'easy',
        category: 'travel',
        phonemes: ['ks', 'ʃ'],
    },
    {
        id: 'sent-013',
        text: 'This is a particularly challenging pronunciation.',
        difficulty: 'medium',
        category: 'practice',
        phonemes: ['tʃ', 'ʃ'],
    },
    {
        id: 'sent-014',
        text: 'The rhythm of the music was absolutely mesmerizing.',
        difficulty: 'medium',
        category: 'everyday',
        phonemes: ['ð', 'z'],
    },
    {
        id: 'sent-015',
        text: 'Vocabulary development requires consistent practice.',
        difficulty: 'medium',
        category: 'education',
        phonemes: ['v', 'r'],
    },
    {
        id: 'sent-016',
        text: 'The judge rejected the jurisdiction objection.',
        difficulty: 'hard',
        category: 'legal',
        phonemes: ['dʒ', 'ʃ'],
    },
    {
        id: 'sent-017',
        text: 'Fresh French fried fish are fabulous.',
        difficulty: 'medium',
        category: 'tongue-twister',
        phonemes: ['f', 'ʃ'],
    },
    {
        id: 'sent-018',
        text: 'Environmental sustainability is increasingly important.',
        difficulty: 'hard',
        category: 'academic',
        phonemes: ['aɪ', 'ɪ'],
    },
    {
        id: 'sent-019',
        text: 'Three free throws for the championship.',
        difficulty: 'medium',
        category: 'sports',
        phonemes: ['θ', 'r'],
    },
    {
        id: 'sent-020',
        text: 'Unique New York, unique New York, you know you need unique New York.',
        difficulty: 'hard',
        category: 'tongue-twister',
        phonemes: ['j', 'n'],
    },
];

export const getSentenceById = (id: string): Sentence | undefined => {
    return sentences.find((s) => s.id === id);
};

export const getSentencesByDifficulty = (difficulty: Sentence['difficulty']): Sentence[] => {
    return sentences.filter((s) => s.difficulty === difficulty);
};

export const getSentencesByCategory = (category: string): Sentence[] => {
    return sentences.filter((s) => s.category === category);
};

export const getCategories = (): string[] => {
    return [...new Set(sentences.map((s) => s.category))];
};
