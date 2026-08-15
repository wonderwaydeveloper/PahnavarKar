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
            <Stack.Screen name="housing-allowance" options={{ title: 'محاسبه حق مسکن ماهیانه' }} />
            <Stack.Screen name="monthly-allowance" options={{ title: 'محاسبه بن ماهیانه' }} />
            <Stack.Screen name="minimum-bonus" options={{ title: 'محاسبه حداقل عیدی و پاداش استحقاقی' }} />
            <Stack.Screen name="maximum-bonus" options={{ title: 'محاسبه حداکثر عیدی و پاداش استحقاقی' }} />
            <Stack.Screen name="spousal-allowance" options={{ title: 'محاسبه حق تاهل استحقاقی' }} />
            <Stack.Screen name="monthly-shift-work" options={{ title: 'محاسبه نوبت کاری ماهیانه' }} />
            <Stack.Screen name="overtime-entitlement" options={{ title: 'محاسبه اضافه کاری استحقاقی' }} />
            <Stack.Screen name="night-shift-entitlement" options={{ title: 'محاسبه شب کاری استحقاقی' }} />
            <Stack.Screen name="insurance-days-entitlement" options={{ title: 'تعیین تعداد روزهای بیمه استحقاقی' }} />
            <Stack.Screen name="unused-leave-entitlement" options={{ title: 'محاسبه تعداد روزهای مرخصی استفاده نشده' }} />
            <Stack.Screen name="end-of-service-years" options={{ title: 'محاسبه سنوات پایان کار' }} />
        </Stack>
    );
}
