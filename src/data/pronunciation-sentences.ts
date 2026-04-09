import type { PracticeSentence } from '@/types/pronunciation';

export const sentences: PracticeSentence[] = [
    {
        id: 'sent-001',
        text: 'The quick brown fox jumps over the lazy dog.',
        difficulty: 'easy',
        category: 'pangram',
        phonemes: ['θ', 'ð', 'dʒ'],
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
];

export const getSentenceById = (id: string): PracticeSentence | undefined => {
    return sentences.find((s) => s.id === id);
};

export const getSentencesByDifficulty = (difficulty: PracticeSentence['difficulty']): PracticeSentence[] => {
    return sentences.filter((s) => s.difficulty === difficulty);
};

export const getCategories = (): string[] => {
    return [...new Set(sentences.map((s) => s.category))];
};
