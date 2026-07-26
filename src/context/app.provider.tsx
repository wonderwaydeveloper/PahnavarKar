import { Colors } from '@/constants/theme';
import { darkTheme, lightTheme } from '@/constants/themes';
import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AppContext, type AppContextType, type ThemeType } from './app.context';

interface AppProviderProps {
    children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const colorScheme = useColorScheme();
    const [userTheme, setUserTheme] = useState<ThemeType | null>(null);
    const [isRTL] = useState(() => I18nManager.isRTL);

    const resolvedTheme = useMemo<ThemeType>(() => {
        if (userTheme) {
            return userTheme;
        }

        return colorScheme === 'dark' ? 'dark' : 'light';
    }, [colorScheme, userTheme]);

    const handleSetTheme = useCallback((nextTheme: ThemeType) => {
        setUserTheme(nextTheme);
    }, []);

    const colors = useMemo(() => Colors[resolvedTheme], [resolvedTheme]);
    const paperTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

    const value: AppContextType = {
        theme: resolvedTheme,
        colors,
        isRTL,
        setTheme: handleSetTheme,
    };

    return (
        <AppContext.Provider value={value}>
            <PaperProvider theme={paperTheme}>{children}</PaperProvider>
        </AppContext.Provider>
    );
}
