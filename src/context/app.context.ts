import { Colors } from '@/constants/theme';
import { createContext } from 'react';

export type ThemeType = keyof typeof Colors;
export type ThemePreference = ThemeType | 'system';
export type FontPreference = 'iransans' | 'vazir' | 'shabnam' | 'system';

export interface AppContextType {
    theme: ThemeType;
    themePreference: ThemePreference;
    fontPreference: FontPreference;
    fontError: string | null;
    themeReady: boolean;
    colors: typeof Colors.light | typeof Colors.dark;
    isRTL: boolean;
    setTheme: (theme: ThemePreference) => void;
    setFontPreference: (font: FontPreference) => Promise<void>;
    clearFontError: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
