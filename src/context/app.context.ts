import { Colors } from '@/constants/theme';
import { createContext } from 'react';

export type ThemeType = keyof typeof Colors;

export interface AppContextType {
    theme: ThemeType;
    colors: typeof Colors.light | typeof Colors.dark;
    isRTL: boolean;
    setTheme: (theme: ThemeType) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
