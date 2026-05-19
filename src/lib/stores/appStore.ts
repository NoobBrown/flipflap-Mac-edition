import { writable } from 'svelte/store';
import type { AppData } from '../types';
import { loadData, saveData } from '../persistence';

const defaultData: AppData = {
    decks: [],
    folders: [],
    settings: {
        name: '',
        themeIndex: 0,
        studyOrder: 'random',
        studyStreak: 0,
        lastStudyDate: '',
        reviewedToday: 0,
        todayDate: '',
    },
};

export const appData = writable<AppData>(defaultData);

export async function initStore() {
    const data = await loadData();
    appData.set(data);
}

export async function persistStore(data: AppData): Promise<void> {
    await saveData(data);
}

export function recordStudySession(gotItCount: number): void {
    appData.update((data) => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastStudyDate, studyStreak, reviewedToday, todayDate } = data.settings;
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

        let newStreak = studyStreak;
        if (lastStudyDate !== today) {
            newStreak = lastStudyDate === yesterday ? studyStreak + 1 : 1;
        }

        const newReviewedToday = todayDate === today ? reviewedToday + gotItCount : gotItCount;

        return {
            ...data,
            settings: {
                ...data.settings,
                studyStreak: newStreak,
                lastStudyDate: today,
                reviewedToday: newReviewedToday,
                todayDate: today,
            },
        };
    });
}
