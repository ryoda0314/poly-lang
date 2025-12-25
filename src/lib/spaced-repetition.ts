export type Confidence = "high" | "medium" | "low";

// Intervals in minutes
// 0: 10m, 1: 1d, 2: 3d, 3: 7d, 4: 14d, 5: 30d
const BASE_INTERVALS_MINUTES = [
    10,             // Strength 0
    24 * 60,        // Strength 1 (1 day)
    3 * 24 * 60,    // Strength 2 (3 days)
    7 * 24 * 60,    // Strength 3 (7 days)
    14 * 24 * 60,   // Strength 4 (14 days)
    30 * 24 * 60    // Strength 5 (30 days)
];

const CONFIDENCE_COEFFICIENTS: Record<string, number> = {
    low: 0.7,
    medium: 1.0,
    high: 1.2
};

export function calculateNextReview(
    currentStrength: number,
    confidence: string | null = "medium"
): Date {
    // Clamp strength 0-5
    const strength = Math.max(0, Math.min(currentStrength, 5));

    // Get base interval
    const baseMinutes = BASE_INTERVALS_MINUTES[strength] || BASE_INTERVALS_MINUTES[BASE_INTERVALS_MINUTES.length - 1];

    // Get coefficient (default to medium if null or invalid)
    const coef = CONFIDENCE_COEFFICIENTS[confidence?.toLowerCase() || "medium"] || 1.0;

    // Calculate total minutes
    const totalMinutes = baseMinutes * coef;

    // Add to current time
    const nextDate = new Date();
    nextDate.setMinutes(nextDate.getMinutes() + totalMinutes);

    return nextDate;
}

export function getNextStrength(currentStrength: number, wasUsedInOutput: boolean): number {
    if (wasUsedInOutput) {
        return Math.min(currentStrength + 1, 5);
    }
    // "Fail" concept doesn't exist, just stay same if Reviewed but not Used? 
    // Spec says: "strengthは据え置き（進行なし）" if not used.
    return currentStrength;
}
