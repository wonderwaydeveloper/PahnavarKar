import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider } from '@/context';
import { useAppContext } from '@/hooks/use-app-context';
import { useFontLoading } from '@/hooks/use-font-loading';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function AppContent() {
  const { theme, colors } = useAppContext();
  const isLightTheme = theme === 'light';
  const headerBackgroundColor = isLightTheme ? colors.primary : colors.surface;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(headerBackgroundColor);
  }, [headerBackgroundColor]);

  return (
    <>
      <StatusBar style="light" />
      <NavigationBar style={theme == 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const { ready } = useFontLoading();

  if (!ready) {
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
