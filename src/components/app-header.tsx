import { useTheme } from '@/hooks/use-theme';
import { Appbar } from 'react-native-paper';

interface AppHeaderProps {
  route: { name: string };
  formatYear?: (value: number | string | null | undefined) => string;
  selectedYear?: { year: number | string } | null;
}

export function AppHeader({ route, formatYear, selectedYear }: AppHeaderProps) {
  const theme = useTheme();

  const getHeaderConfig = (routeName: string) => {
    switch (routeName) {
      case 'explore':
        return { title: 'کاوش' };
      case 'calculations':
        return { title: 'محاسبات' };
      case 'index':
      default:
        return { title: 'خانه' };
    }
  };

  const { title } = getHeaderConfig(route.name);

  return (
    <Appbar.Header
      style={{
        backgroundColor: theme.surface,
        elevation: 4,
        shadowColor: theme.text,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Appbar.Content
        title={title}
        titleStyle={{
          fontSize: 18,
          fontFamily: 'Vazirmatn-Bold',
          color: theme.text,
        }}
      />
    </Appbar.Header>
  );
}
