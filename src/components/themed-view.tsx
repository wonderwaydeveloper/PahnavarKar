import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useAppContext } from '@/hooks/use-app-context';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const { theme, colors } = useAppContext();

  const backgroundColor = lightColor && darkColor
    ? theme === 'dark'
      ? darkColor
      : lightColor
    : colors[type ?? 'background'];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
