import { Stack } from 'expo-router';

import { AppHeader } from '@/components/app-header';

export default function ToolsLayout() {
    return (
        <Stack
            screenOptions={({ route }) => ({
                header: () => <AppHeader route={route} />,
                headerShown: true,
            })}
        />
    );
}
