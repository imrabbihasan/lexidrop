export interface WordEntry {
    id: number;
    originalText: string;
    translatedText: string | null;
    secondaryTranslation: string | null;
    pinyin: string | null;
    explanation: string | null;
    language: string | null;
    status: string;
    createdAt: string;
}
