export interface Card {
    id: string;
    front: {
        text: string;
        imagePath?: string;
    };
    back: {
        text: string;
        imagePath?: string;
    };
    createdAt: string;
}

export interface Deck {
    id: string;
    name: string;
    /** Tauri icon name (e.g. "book") or empty string for no icon */
    emoji: string;
    cards: Card[];
    createdAt: string;
    lastStudiedAt?: string;
    streak: number;
    folderId?: string;
}

export interface Folder {
    id: string;
    name: string;
    /** Tauri icon name or empty string */
    icon: string;
    createdAt: string;
}

export interface AppSettings {
    name: string;
    themeIndex: number;
    studyOrder: 'random' | 'sequential';
    studyStreak: number;
    lastStudyDate: string;
    reviewedToday: number;
    todayDate: string;
}

export interface AppData {
    decks: Deck[];
    folders: Folder[];
    settings: AppSettings;
}
