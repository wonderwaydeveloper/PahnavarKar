import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getTabBarIcon(
    name: 'home' | 'account',
    color: ColorValue,
    theme: { text: string },
    size: number,
) {
    const iconColor = typeof color === 'string' ? color : theme.text;

    switch (name) {
        case 'home':
            return <MaterialCommunityIcons name="home" color={iconColor} size={size} />;
        case 'account':
            return <MaterialCommunityIcons name="account" color={iconColor} size={size} />;
        default:
            return null;
    }
}

function getTabBarLabel(name: 'home' | 'account') {
    switch (name) {
        case 'home':
            return 'خانه';
        case 'account':
            return 'حساب';
        default:
            return '';
    }
}

export default function TabsLayout() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                    height: 64 + insets.bottom,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: 'Vazirmatn-Medium',
                    fontSize: 12,
                },
                tabBarIcon: ({ color, size }) =>
                    getTabBarIcon(route.name as 'home' | 'account', color, theme, size),
                tabBarLabel: getTabBarLabel(route.name as 'home' | 'account'),
            })}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="account" />
        </Tabs>
    );
}
