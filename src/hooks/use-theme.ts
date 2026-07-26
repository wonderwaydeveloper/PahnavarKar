/**
 * Hook برای دسترسی به رنگ‌های فعلی theme
 */

import { useAppContext } from './use-app-context';

export function useTheme() {
  const { colors } = useAppContext();
  return colors;
}
