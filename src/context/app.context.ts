import { Colors } from '@/constants/theme';
import { createContext } from 'react';

export type ThemeType = keyof typeof Colors;
export type ThemePreference = ThemeType | 'system';
export type FontPreference = 'iransans' | 'vazir' | 'shabnam' | 'system';
export type CurrencyPreference = 'rial' | 'toman';

export interface AppContextType {
    theme: ThemeType;
    themePreference: ThemePreference;
    fontPreference: FontPreference;
    fontError: string | null;
    currencyPreference: CurrencyPreference;
    currencyError: string | null;
    themeReady: boolean;
    colors: typeof Colors.light | typeof Colors.dark;
    isRTL: boolean;
    setTheme: (theme: ThemePreference) => void;
    setFontPreference: (font: FontPreference) => Promise<void>;
    setCurrencyPreference: (currency: CurrencyPreference) => Promise<void>;
    clearFontError: () => void;
    clearCurrencyError: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
