import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// مهم:
// این باید در global scope باشد تا Native Splash قبل از mount شدن React
// خودکار مخفی نشود.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FONT_MAP = {
  'Vazirmatn-Regular': require('@/assets/fonts/Vazirmatn-Regular.ttf'),
  'Vazirmatn-Medium': require('@/assets/fonts/Vazirmatn-Medium.ttf'),
  'Vazirmatn-SemiBold': require('@/assets/fonts/Vazirmatn-SemiBold.ttf'),
  'Vazirmatn-Bold': require('@/assets/fonts/Vazirmatn-Bold.ttf'),
};

export function useFontLoading() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);

  return {
    fontsLoaded,
    fontError,
    ready: fontsLoaded || !!fontError,
  };
}