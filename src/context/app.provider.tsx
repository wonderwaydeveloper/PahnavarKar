import { Colors } from '@/constants/theme';
import { darkTheme, lightTheme } from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AppContext, type AppContextType, type ThemePreference, type ThemeType } from './app.context';

interface AppProviderProps {
    children: React.ReactNode;
}

const THEME_PREFERENCE_STORAGE_KEY = '@pahnavarkar/theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
}

export function AppProvider({ children }: AppProviderProps) {
    const colorScheme = useColorScheme();
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');
    const [themeReady, setThemeReady] = useState(false);
    const preferenceChangedRef = useRef(false);
    const [isRTL] = useState(() => I18nManager.isRTL);

    useEffect(() => {
        let isMounted = true;

        const loadThemePreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
                if (isMounted && !preferenceChangedRef.current && isThemePreference(storedPreference)) {
                    setThemePreference(storedPreference);
                }
            } catch {
                // Use the system preference when local storage is unavailable.
            } finally {
                if (isMounted) {
                    setThemeReady(true);
                }
            }
        };

        void loadThemePreference();

        return () => {
            isMounted = false;
        };
    }, []);

    const resolvedTheme = useMemo<ThemeType>(() => {
        if (themePreference !== 'system') {
            return themePreference;
        }

        return colorScheme === 'dark' ? 'dark' : 'light';
    }, [colorScheme, themePreference]);

    const handleSetTheme = useCallback((nextTheme: ThemePreference) => {
        preferenceChangedRef.current = true;
        setThemePreference(nextTheme);
        void AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextTheme).catch(() => undefined);
    }, []);

    const colors = useMemo(() => Colors[resolvedTheme], [resolvedTheme]);
    const paperTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

    const value: AppContextType = {
        theme: resolvedTheme,
        themePreference,
        themeReady,
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
