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
            <Stack.Screen name="yearly-info" options={{ title: 'اطلاعات جامع مزدی از سال ۱۳۶۹ تاکنون' }} />
            <Stack.Screen name="base-salary" options={{ title: 'حقوق پایه' }} />
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
            <Stack.Screen name="unemployment-insurance-entitlement" options={{ title: 'مدت زمان پرداخت مقرری بیمه بیکاری' }} />
            <Stack.Screen name="unemployment-insurance-allowance" options={{ title: 'مبلغ مقرری بیمه بیکاری' }} />
            <Stack.Screen name="unused-leave-entitlement" options={{ title: 'میزان مرخصی ذخیره شده کارگر' }} />
            <Stack.Screen name="unused-leave-wage" options={{ title: 'مزد مرخصی ذخیره شده کارگر' }} />
            <Stack.Screen name="end-of-service-years" options={{ title: 'سنوات پایان کار' }} />
            <Stack.Screen name="entitled-seniority" options={{ title: 'پایه سنوات استحقاقی' }} />
            <Stack.Screen name="friday-work" options={{ title: 'جمعه کاری' }} />
            <Stack.Screen name="official-holiday-work" options={{ title: 'مبلغ تعطیل کاری استحقاقی' }} />
            <Stack.Screen name="illegal-foreign-worker-penalty" options={{ title: 'مبلغ جریمه به‌کارگیری اتباع بیگانه غیرمجاز' }} />
            <Stack.Screen name="article-87" options={{ title: 'مبلغ اعمال ماده ۸۷ قانون کار' }} />
            <Stack.Screen name="social-security-premium-ceiling" options={{ title: 'سقف حق بیمه تامین اجتماعی' }} />
            <Stack.Screen name="suspension-wage" options={{ title: 'محاسبه حق‌السعی ایام تعلیق' }} />
            <Stack.Screen name="ordinary-work-hours" options={{ title: 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی' }} />
            <Stack.Screen name="hazardous-work-hours" options={{ title: 'ساعات کارکرد موظفی کارگر در مشاغل سخت' }} />
            <Stack.Screen name="young-worker-work-hours" options={{ title: 'میزان ساعات کارکرد موظفی کارگر نوجوان' }} />
        </Stack>
    );
}
