import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { AppData } from './types';

const FILE_NAME = 'flipflap-data.json';

function mergeWithDefaults(raw: unknown): AppData {
    const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const s = (src.settings && typeof src.settings === 'object'
        ? src.settings
        : {}) as Record<string, unknown>;

    return {
        decks: Array.isArray(src.decks) ? src.decks : [],
        folders: Array.isArray(src.folders) ? src.folders : [],
        settings: {
            name:           typeof s.name === 'string'   ? s.name           : '',
            themeIndex:     typeof s.themeIndex === 'number' ? s.themeIndex : 0,
            studyOrder:     s.studyOrder === 'sequential' ? 'sequential'     : 'random',
            studyStreak:    typeof s.studyStreak === 'number'  ? s.studyStreak   : 0,
            lastStudyDate:  typeof s.lastStudyDate === 'string' ? s.lastStudyDate : '',
            reviewedToday:  typeof s.reviewedToday === 'number' ? s.reviewedToday : 0,
            todayDate:      typeof s.todayDate === 'string' ? s.todayDate     : '',
        },
    };
}

export async function loadData(): Promise<AppData> {
    try {
        const text = await readTextFile(FILE_NAME, { baseDir: BaseDirectory.AppLocalData });
        return mergeWithDefaults(JSON.parse(text));
    } catch {
        return mergeWithDefaults({});
    }
}

export async function saveData(data: AppData): Promise<void> {
    await writeTextFile(FILE_NAME, JSON.stringify(data, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
    });
}
