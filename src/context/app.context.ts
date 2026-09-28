import { Colors } from '@/constants/theme';
import { createContext } from 'react';

export type ThemeType = keyof typeof Colors;
export type ThemePreference = ThemeType | 'system';

export interface AppContextType {
    theme: ThemeType;
    themePreference: ThemePreference;
    themeReady: boolean;
    colors: typeof Colors.light | typeof Colors.dark;
    isRTL: boolean;
    setTheme: (theme: ThemePreference) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
