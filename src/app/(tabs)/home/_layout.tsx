import { Stack } from 'expo-router';

import { AppHeader } from '@/components/app-header';

export default function HomeLayout() {
    return (
        <Stack
            screenOptions={({ route }) => ({
                header: () => <AppHeader route={route} />,
                headerShown: true,
            })}
        >
            <Stack.Screen name="index" options={{ title: 'خانه' }} />
            <Stack.Screen name="yearly-info" options={{ title: 'اطلاعات سال کارکرد' }} />
            <Stack.Screen name="base-salary" options={{ title: 'محاسبه حقوق پایه' }} />
            <Stack.Screen name="family-allowance" options={{ title: 'محاسبه حق عائله مندی' }} />
        </Stack>
    );
}
