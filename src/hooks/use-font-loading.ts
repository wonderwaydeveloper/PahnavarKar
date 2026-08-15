import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// فعال‌سازی امن splash native فقط در زمانی که واقعاً لازم است
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

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
        if (!fontsLoaded && !fontError) {
            return;
        }

        const hideSplash = async () => {
            try {
                await SplashScreen.hideAsync();
            } catch {
                // در build native بعضی محیط‌ها این فراخوانی ممکن است قبل از آماده‌سازی کامل رخ دهد
            }
        };

        void hideSplash();
    }, [fontsLoaded, fontError]);

    return Boolean(fontsLoaded || fontError);
}
