import { useAppContext } from '@/hooks/use-app-context';
import { Appbar } from 'react-native-paper';

interface AppHeaderProps {
  route: { name: string };
  formatYear?: (value: number | string | null | undefined) => string;
  selectedYear?: { year: number | string } | null;
}

export function AppHeader({ route, formatYear, selectedYear }: AppHeaderProps) {
  const { colors, theme: appTheme } = useAppContext();
  const isLightTheme = appTheme === 'light';
  const headerBackgroundColor = isLightTheme ? colors.primary : colors.surface;
  const titleColor = isLightTheme ? colors.surface : colors.text;

  const getHeaderConfig = (routeName: string) => {
    switch (routeName) {
      case 'explore':
        return { title: 'کاوش' };
      case 'calculations':
        return { title: 'محاسبات' };
      case 'family-allowance':
        return { title: 'حق عائله‌مندی' };
      case 'index':
      default:
        return { title: 'خانه' };
    }
  };

  const { title } = getHeaderConfig(route.name);

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
