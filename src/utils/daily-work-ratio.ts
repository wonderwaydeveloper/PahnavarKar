export const FULL_TIME_DAILY_MINUTES = 440;

export function parseDailyWorkTime(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return FULL_TIME_DAILY_MINUTES;
    }

    return Math.min(FULL_TIME_DAILY_MINUTES, hours * 60 + minutes);
}

export function getDailyWorkRatio(dailyWorkMinutes: number): number {
    const normalizedMinutes = Math.min(FULL_TIME_DAILY_MINUTES, Math.max(0, Number(dailyWorkMinutes) || 0));
    return normalizedMinutes / FULL_TIME_DAILY_MINUTES;
}

type WageCalculationResult = {
    dailyWage?: number;
    dailyMinimumWage?: number;
    dailySeniority?: number;
    dailyHousingAllowance?: number;
    dailyChildAllowance?: number;
    dailyMonthlyAllowance?: number;
    dailyMaritalAllowance?: number;
    totalAmount?: number;
    totalCalculatedAmount?: number;
    totalMinimumAmount?: number;
    totalMaximumAmount?: number;
    totalEntitlementAmount?: number;
    finalEntitlement?: number;
    breakdown?: Record<string, unknown>[];
};

export function scaleWageCalculationResult<T extends object>(result: T, ratio: number): T {
    const scale = (value: unknown) => typeof value === 'number' ? value * ratio : value;
    const sourceResult = result as T & WageCalculationResult;
    const scaledResult = { ...result } as T & WageCalculationResult;

    for (const key of [
        'totalAmount',
        'totalCalculatedAmount',
        'totalMinimumAmount',
        'totalMaximumAmount',
        'totalEntitlementAmount',
        'finalEntitlement',
        'dailyWage',
        'dailyMinimumWage',
        'dailySeniority',
        'dailyHousingAllowance',
        'dailyChildAllowance',
        'dailyMonthlyAllowance',
        'dailyMaritalAllowance',
    ] as const) {
        if (key in sourceResult) {
            scaledResult[key] = scale(sourceResult[key]) as never;
        }
    }

    if (sourceResult.breakdown) {
        const amountKeys = ['amount', 'calculatedAmount', 'minimumAmount', 'maximumAmount', 'entitlementAmount', 'entitlement'];
        scaledResult.breakdown = sourceResult.breakdown.map((item) => {
            const scaledItem = { ...item };
            for (const key of amountKeys) {
                if (key in scaledItem) {
                    scaledItem[key] = scale(scaledItem[key]);
                }
            }
            return scaledItem;
        });
    }

    return scaledResult;
}