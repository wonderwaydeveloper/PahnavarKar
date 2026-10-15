import { useCallback } from 'react';

import { useAppContext } from '@/hooks/use-app-context';
import { formatCurrencyAmount } from '@/utils/currency';

export function useCurrencyFormatter() {
    const { currencyPreference } = useAppContext();
    const formatCurrency = useCallback(
        (value: number) => formatCurrencyAmount(value, currencyPreference),
        [currencyPreference],
    );

    return { currencyPreference, formatCurrency };
}
