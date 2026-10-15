import type { CurrencyPreference } from '@/context/app.context';

export function getCurrencyLabel(currency: CurrencyPreference) {
    return currency === 'toman' ? 'تومان' : 'ریال';
}

export function formatCurrencyAmount(value: number, currency: CurrencyPreference) {
    const roundedRialAmount = Math.round(value);
    const displayedAmount = currency === 'toman' ? roundedRialAmount / 10 : roundedRialAmount;
    const formattedAmount = new Intl.NumberFormat('fa-IR', {
        maximumFractionDigits: currency === 'toman' ? 1 : 0,
    }).format(displayedAmount);

    return `${formattedAmount} ${getCurrencyLabel(currency)}`;
}

export function rialToDisplayCurrency(value: number, currency: CurrencyPreference) {
    const roundedRialAmount = Math.round(value);
    return currency === 'toman' ? roundedRialAmount / 10 : roundedRialAmount;
}

export function displayCurrencyToRial(value: number, currency: CurrencyPreference) {
    return Math.round(currency === 'toman' ? value * 10 : value);
}
