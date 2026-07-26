/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * This palette now exposes semantic tokens for surfaces, borders, and state colors to keep the UI more consistent.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#102A39',
    textSecondary: '#4B6275',
    textMuted: '#708797',
    background: '#F3F7F9',
    surface: '#FFFFFF',
    surfaceVariant: '#E3F0F4',
    surfaceElevated: '#F8FCFD',
    border: '#C8DDE3',
    borderStrong: '#95B5C0',
    primary: '#26C6DA',
    primaryContainer: '#E0F7FA',
    secondary: '#4B8BAE',
    success: '#2E8B57',
    warning: '#D98C00',
    error: '#D9534F',
    info: '#2E86DE',
    overlay: 'rgba(7, 24, 33, 0.16)',
    backgroundElement: '#E3F0F4',
    backgroundSelected: '#D1E6EB',
  },
  dark: {
    text: '#F4FAFF',
    textSecondary: '#B7D4E1',
    textMuted: '#8CB2C2',
    background: '#041E28',
    surface: '#082933',
    surfaceVariant: '#0D2E3F',
    surfaceElevated: '#103C4A',
    border: '#244A57',
    borderStrong: '#35697A',
    primary: '#4BD1E0',
    primaryContainer: '#005763',
    secondary: '#82C6E4',
    success: '#4CD964',
    warning: '#FFB84D',
    error: '#FF6B6B',
    info: '#63B3FF',
    overlay: 'rgba(2, 12, 19, 0.45)',
    backgroundElement: '#0D2E3F',
    backgroundSelected: '#164655',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** Vazirmatn فونت‌ها */
    sans: 'Vazirmatn-Regular',
    serif: 'Vazirmatn-Light',
    rounded: 'Vazirmatn-Medium',
    mono: 'Vazirmatn-SemiBold',
  },
  android: {
    /** Vazirmatn فونت‌ها */
    sans: 'Vazirmatn-Regular',
    serif: 'Vazirmatn-Light',
    rounded: 'Vazirmatn-Medium',
    mono: 'Vazirmatn-SemiBold',
  },
  web: {
    sans: 'Vazirmatn-Regular',
    serif: 'Vazirmatn-Light',
    rounded: 'Vazirmatn-Medium',
    mono: 'Vazirmatn-SemiBold',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
