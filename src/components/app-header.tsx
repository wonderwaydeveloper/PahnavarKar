import { useAppContext } from '@/hooks/use-app-context';
import { usePathname, useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { Appbar } from 'react-native-paper';

interface AppHeaderProps {
  route?: { name?: string };
  formatYear?: (value: number | string | null | undefined) => string;
  selectedYear?: { year: number | string } | null;
}

export function AppHeader({ route, formatYear, selectedYear }: AppHeaderProps) {
  const { colors, theme: appTheme } = useAppContext();
  const pathname = usePathname();
  const isLightTheme = appTheme === 'light';
  const headerBackgroundColor = isLightTheme ? colors.primary : colors.surface;
  const titleColor = isLightTheme ? colors.surface : colors.text;

  const normalizeRoute = (input?: string) => {
    const value = input ?? pathname ?? route?.name ?? 'home';
    const cleaned = value.replace(/^\/+|\/+$/g, '');
    const segments = cleaned ? cleaned.split('/') : ['home'];
    return segments[segments.length - 1] || 'home';
  };

  const getHeaderConfig = (routeName: string) => {
    const normalized = normalizeRoute(routeName);

    switch (normalized) {
      case 'account':
        return { title: 'حساب کاربری' };
      case 'edit-profile':
        return { title: 'ویرایش پروفایل' };
      case 'settings':
        return { title: 'تنظیمات' };
      case 'support':
        return { title: 'پشتیبانی' };
      case 'about-us':
        return { title: 'درباره ما' };
      case 'app-info':
        return { title: 'اطلاعات برنامه' };
      case 'yearly-info':
        return { title: 'اطلاعات سال کارکرد' };
      case 'base-salary':
        return { title: 'حقوق پایه' };
      case 'seniority-entitlement':
        return { title: 'پایه سنوات استحقاقی' };
      case 'family-allowance':
        return { title: 'حق عائله مندی' };
      case 'housing-allowance':
        return { title: 'حق مسکن ماهیانه' };
      case 'monthly-allowance':
        return { title: 'بن کارگری ماهیانه' };
      case 'minimum-bonus':
        return { title: 'حداقل عیدی و پاداش استحقاقی' };
      case 'maximum-bonus':
        return { title: 'حداکثر عیدی و پاداش استحقاقی' };
      case 'spousal-allowance':
        return { title: 'حق تاهل استحقاقی' };
      case 'monthly-shift-work':
        return { title: 'نوبت کاری ماهیانه' };
      case 'overtime-entitlement':
        return { title: 'اضافه کاری استحقاقی' };
      case 'night-shift-entitlement':
        return { title: 'شب کاری استحقاقی' };
      case 'insurance-days-entitlement':
        return { title: 'تعداد روزهای بیمه استحقاقی' };
      case 'unused-leave-entitlement':
        return { title: 'تعداد روزهای مرخصی ذخیره شده کارگر' };
      case 'unused-leave-wage':
        return { title: 'مزد مرخصی استفاده نشده' };
      case 'end-of-service-years':
        return { title: 'سنوات پایان کار' };
      case 'friday-work':
        return { title: 'جمعه کاری' };
      case 'suspension-wage':
        return { title: 'محاسبه حق‌السعی ایام تعلیق' };
      case 'ordinary-work-hours':
        return { title: 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی' };
      case 'hazardous-work-hours':
        return { title: 'ساعات کارکرد موظفی کارگر در مشاغل سخت' };
      case 'young-worker-work-hours':
        return { title: 'میزان ساعات کارکرد موظفی کارگر نوجوان' };
      case 'home':
      case 'index':
      default:
        return { title: 'خانه' };
    }
  };

  const router = useRouter();
  const actualRouteName = normalizeRoute(pathname || route?.name);
  const { title } = getHeaderConfig(actualRouteName);
  const showBackButton = ['edit-profile', 'settings', 'support', 'about-us', 'app-info', 'yearly-info', 'base-salary', 'seniority-entitlement', 'family-allowance', 'housing-allowance', 'monthly-allowance', 'minimum-bonus', 'maximum-bonus', 'spousal-allowance', 'monthly-shift-work', 'overtime-entitlement', 'night-shift-entitlement', 'insurance-days-entitlement', 'unused-leave-entitlement', 'unused-leave-wage', 'end-of-service-years', 'friday-work', 'suspension-wage', 'ordinary-work-hours', 'hazardous-work-hours', 'young-worker-work-hours'].includes(actualRouteName);

  const { width } = useWindowDimensions();
  const titleFontSize = width >= 420 ? 18 : 16;

  return (
    <Appbar.Header
      style={{
        backgroundColor: headerBackgroundColor,
        elevation: 4,
        shadowColor: colors.text,
        shadowOpacity: isLightTheme ? 0.16 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {showBackButton ? (
        <Appbar.Action
          icon={'chevron-right'}
          color={titleColor}
          onPress={() => router.back()}
          size={24}
        />
      ) : null}
      <Appbar.Content
        title={title}
        titleStyle={{
          fontSize: titleFontSize,
          fontFamily: 'Vazirmatn-Bold',
          color: titleColor,
        }}
      />
    </Appbar.Header>
  );
}
