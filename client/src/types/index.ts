export interface WordEntry {
    id: number;
    originalText: string;
    translatedText: string | null;
    explanation: string | null;
    status: string;
    createdAt: string;
}
