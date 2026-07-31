import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { RootTabs } from '@/components/root-tabs';
import { AppProvider } from '@/context';
import { useAppContext } from '@/hooks/use-app-context';
import { useFontLoading } from '@/hooks/use-font-loading';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ✅ فعال کردن RTL برای فارسی
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function AppContent() {
  const { theme } = useAppContext();
  return (
    <>
      <StatusBar style={'light'} />
      <NavigationBar style={theme == 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <RootTabs />
    </>
  );
}

export default function RootLayout() {
  const fontsReady = useFontLoading();

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
