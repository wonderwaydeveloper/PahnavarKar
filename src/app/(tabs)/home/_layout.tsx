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
            <Stack.Screen name="base-salary" options={{ title: 'حقوق پایه' }} />
            <Stack.Screen name="seniority-entitlement" options={{ title: 'پایه سنوات استحقاقی' }} />
            <Stack.Screen name="family-allowance" options={{ title: 'حق عائله مندی' }} />
            <Stack.Screen name="housing-allowance" options={{ title: 'حق مسکن ماهیانه' }} />
            <Stack.Screen name="monthly-allowance" options={{ title: 'بن کارگری ماهیانه' }} />
            <Stack.Screen name="minimum-bonus" options={{ title: 'حداقل عیدی و پاداش استحقاقی' }} />
            <Stack.Screen name="maximum-bonus" options={{ title: 'حداکثر عیدی و پاداش استحقاقی' }} />
            <Stack.Screen name="spousal-allowance" options={{ title: 'حق تاهل استحقاقی' }} />
            <Stack.Screen name="monthly-shift-work" options={{ title: 'نوبت کاری ماهیانه' }} />
            <Stack.Screen name="overtime-entitlement" options={{ title: 'اضافه کاری استحقاقی' }} />
            <Stack.Screen name="night-shift-entitlement" options={{ title: 'شب کاری استحقاقی' }} />
            <Stack.Screen name="insurance-days-entitlement" options={{ title: 'تعیین تعداد روزهای بیمه استحقاقی' }} />
            <Stack.Screen name="unused-leave-entitlement" options={{ title: 'تعداد روزهای مرخصی ذخیره شده کارگر' }} />
            <Stack.Screen name="unused-leave-wage" options={{ title: 'مزد مرخصی استفاده نشده' }} />
            <Stack.Screen name="end-of-service-years" options={{ title: 'سنوات پایان کار' }} />
            <Stack.Screen name="friday-work" options={{ title: 'جمعه کاری' }} />
            <Stack.Screen name="suspension-wage" options={{ title: 'محاسبه حق‌السعی ایام تعلیق' }} />
            <Stack.Screen name="ordinary-work-hours" options={{ title: 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی' }} />
            <Stack.Screen name="hazardous-work-hours" options={{ title: 'ساعات کارکرد موظفی کارگر در مشاغل سخت' }} />
            <Stack.Screen name="young-worker-work-hours" options={{ title: 'میزان ساعات کارکرد موظفی کارگر نوجوان' }} />
        </Stack>
    );
}
