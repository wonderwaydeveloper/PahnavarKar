import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { getAppPaperTheme, loadAppFonts } from '@/services/font-service';
import {
    AppContext,
    type AppContextType,
    type FontPreference,
    type ThemePreference,
    type ThemeType,
} from './app.context';

interface AppProviderProps {
    children: React.ReactNode;
}

const THEME_PREFERENCE_STORAGE_KEY = '@pahnavarkar/theme-preference';
const FONT_PREFERENCE_STORAGE_KEY = '@pahnavarkar/font-preference';

function isThemePreference(value: string | null): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
}

function isFontPreference(value: string | null): value is FontPreference {
    return value === 'iransans' || value === 'vazir';
}

export function AppProvider({ children }: AppProviderProps) {
    const colorScheme = useColorScheme();
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');
    const [fontPreference, setFontPreference] = useState<FontPreference>('iransans');
    const [fontError, setFontError] = useState<string | null>(null);
    const [themeReady, setThemeReady] = useState(false);
    const [isRTL] = useState(() => I18nManager.isRTL);

    useEffect(() => {
        let isMounted = true;

        const loadAppPreferences = async () => {
            let storedFontPreference: FontPreference = 'iransans';

            try {
                const [storedTheme, storedFont] = await Promise.all([
                    AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY),
                    AsyncStorage.getItem(FONT_PREFERENCE_STORAGE_KEY),
                ]);
                if (isMounted && isThemePreference(storedTheme)) {
                    setThemePreference(storedTheme);
                }
                if (isMounted && isFontPreference(storedFont)) {
                    storedFontPreference = storedFont;
                }
            } catch (error) {
                console.error('Unable to load saved app preferences', error);
                if (isMounted) {
                    setFontError('ذخیرهٔ تنظیمات برنامه خوانده نشد؛ فونت پیش‌فرض بارگذاری می‌شود.');
                }
            }

            let resolvedFontPreference = storedFontPreference;
            try {
                await loadAppFonts(storedFontPreference);
            } catch (error) {
                console.error('Unable to load the selected app font', error);
                resolvedFontPreference = 'iransans';

                if (storedFontPreference !== 'iransans') {
                    try {
                        await loadAppFonts('iransans');
                        if (isMounted) {
                            setFontError('فونت ذخیره‌شده بارگذاری نشد؛ فونت پیش‌فرض جایگزین شد.');
                        }
                    } catch (fallbackError) {
                        console.error('Unable to load the default app font', fallbackError);
                        if (isMounted) {
                            setFontError('بارگذاری فونت‌ها انجام نشد؛ لطفاً برنامه را دوباره اجرا کنید.');
                        }
                    }
                } else if (isMounted) {
                    setFontError('بارگذاری فونت‌ها انجام نشد؛ لطفاً برنامه را دوباره اجرا کنید.');
                }
            } finally {
                if (isMounted) {
                    setFontPreference(resolvedFontPreference);
                    setThemeReady(true);
                }
            }
        };

        void loadAppPreferences();

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
        setThemePreference(nextTheme);
        void AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextTheme).catch(() => undefined);
    }, []);

    const handleSetFontPreference = useCallback(async (nextFont: FontPreference) => {
        await loadAppFonts(nextFont);
        await AsyncStorage.setItem(FONT_PREFERENCE_STORAGE_KEY, nextFont);
        setFontPreference(nextFont);
        setFontError(null);
    }, []);

    const colors = useMemo(() => Colors[resolvedTheme], [resolvedTheme]);
    const paperTheme = useMemo(
        () => getAppPaperTheme(resolvedTheme, fontPreference),
        [resolvedTheme, fontPreference]
    );
    const clearFontError = useCallback(() => setFontError(null), []);

    const value: AppContextType = {
        theme: resolvedTheme,
        themePreference,
        fontPreference,
        fontError,
        themeReady,
        colors,
        isRTL,
        setTheme: handleSetTheme,
        setFontPreference: handleSetFontPreference,
        clearFontError,
    };

    return (
        <AppContext.Provider value={value}>
            <PaperProvider theme={paperTheme}>{children}</PaperProvider>
        </AppContext.Provider>
    );
}
