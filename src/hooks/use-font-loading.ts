import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// درخواست نگه‌داشتن splash screen تا فونت‌ها بارگیری شوند
SplashScreen.preventAutoHideAsync();

export function useFontLoading() {
    const [fontsLoaded, fontError] = useFonts({
        'Vazirmatn-Thin': require('@/assets/fonts/Vazirmatn-Thin.ttf'),
        'Vazirmatn-ExtraLight': require('@/assets/fonts/Vazirmatn-ExtraLight.ttf'),
        'Vazirmatn-Light': require('@/assets/fonts/Vazirmatn-Light.ttf'),
        'Vazirmatn-Regular': require('@/assets/fonts/Vazirmatn-Regular.ttf'),
        'Vazirmatn-Medium': require('@/assets/fonts/Vazirmatn-Medium.ttf'),
        'Vazirmatn-SemiBold': require('@/assets/fonts/Vazirmatn-SemiBold.ttf'),
        'Vazirmatn-Bold': require('@/assets/fonts/Vazirmatn-Bold.ttf'),
        'Vazirmatn-ExtraBold': require('@/assets/fonts/Vazirmatn-ExtraBold.ttf'),
        'Vazirmatn-Black': require('@/assets/fonts/Vazirmatn-Black.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    return fontsLoaded && !fontError;
}
