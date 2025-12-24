// Manual type definitions as supabase.ts is outdated
export interface Level {
    id: string;
    level: number;
    title: string;
    xp_threshold: number;
    created_at: string;
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition_type: string;
    condition_value: number;
    created_at: string;
    earned?: boolean;
    earned_at?: string;
}

export interface Quest {
    id: string;
    title: string;
    xp_reward: number;
    category: string; // 'daily', 'weekly' etc
    created_at: string;
    progress: number;
    completed: boolean;
}

export interface DashboardResponse {
    profile: {
        displayName: string | null;
        avatarUrl: string | null;
    };
    level: {
        current: Level;
        next: Level | null;
        currentXp: number;
        nextLevelXp: number;
        progressPercent: number;
    };
    quests: Quest[];
    badges: Badge[];
    streak: {
        current: number;
        days: number[]; // mock for now
    };
    stats: {
        totalWords: number;
        learningDays: number;
    };
}
