import type { WordEntry } from '../types';

export const groupWordsByDate = (words: WordEntry[]) => {
    const groups: Record<string, WordEntry[]> = {};

    words.forEach(word => {
        // Convert timestamp to readable date key "YYYY-MM-DD"
        // Using en-CA ensures YYYY-MM-DD format which sorts correctly lexicographically
        const dateKey = new Date(word.createdAt).toLocaleDateString('en-CA');

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(word);
    });

    // Sort keys so newest dates are first
    // Object.entries returns [key, value] pairs
    return Object.entries(groups).sort((a, b) =>
        new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
};
