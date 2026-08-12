import { useAppContext } from '@/hooks/use-app-context';
import { usePathname, useRouter } from 'expo-router';
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
        return { title: 'محاسبه حقوق پایه' };
      case 'family-allowance':
        return { title: 'محاسبه حق عائله مندی' };
      case 'home':
      case 'index':
      default:
        return { title: 'خانه' };
    }
  };

  const router = useRouter();
  const actualRouteName = normalizeRoute(pathname || route?.name);
  const { title } = getHeaderConfig(actualRouteName);
  const showBackButton = ['edit-profile', 'settings', 'support', 'about-us', 'app-info', 'yearly-info', 'base-salary', 'family-allowance'].includes(actualRouteName);

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
          fontSize: 18,
          fontFamily: 'Vazirmatn-Bold',
          color: titleColor,
        }}
      />
    </Appbar.Header>
  );
}
