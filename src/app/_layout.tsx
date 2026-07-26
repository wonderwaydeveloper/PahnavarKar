import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { RootTabs } from '@/components/root-tabs';
import { AppProvider } from '@/context';
import { useFontLoading } from '@/hooks/use-font-loading';

// ✅ فعال کردن RTL برای فارسی
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const fontsReady = useFontLoading();

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AnimatedSplashOverlay />
        <RootTabs />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
