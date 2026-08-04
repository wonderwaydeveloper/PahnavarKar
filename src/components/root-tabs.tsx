import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// متدهای جداگانه برای screenOptions
function getTabBarIcon(name: 'index' | 'explore' | 'calculations' | 'family-allowance', color: ColorValue, theme: { text: string }, size: number) {
    const iconColor = typeof color === 'string' ? color : theme.text;

    switch (name) {
        case 'index':
            return <MaterialCommunityIcons name="home" color={iconColor} size={size} />;
        case 'explore':
            return <MaterialCommunityIcons name="compass-outline" color={iconColor} size={size} />;
        case 'calculations':
            return <MaterialCommunityIcons name="calculator" color={iconColor} size={size} />;
        case 'family-allowance':
            return <MaterialCommunityIcons name="account-group-outline" color={iconColor} size={size} />;
        default:
            return null;
    }
}

function getTabBarLabel(name: 'index' | 'explore' | 'calculations' | 'family-allowance') {
    switch (name) {
        case 'index':
            return 'خانه';
        case 'explore':
            return 'کاوش';
        case 'calculations':
            return 'محاسبات';
        case 'family-allowance':
            return 'عائله‌مندی';
        default:
            return '';
    }
}

export function RootTabs() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                header: (props) => <AppHeader route={route} />,
                headerShown: true,
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
                    getTabBarIcon(route.name as 'index' | 'explore' | 'calculations', color, theme, size),
                tabBarLabel: getTabBarLabel(route.name as 'index' | 'explore' | 'calculations'),
            })}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="calculations" />
            <Tabs.Screen name="family-allowance" />
        </Tabs>
    );
}
