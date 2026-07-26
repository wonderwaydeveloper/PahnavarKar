import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { Colors } from './theme';

const lightPalette = Colors.light;
const darkPalette = Colors.dark;

/**
 * Light Theme - Material Design 3
 * با فارسی (Vazirmatn) و رنگ‌های custom
 */
export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: lightPalette.primary,
        onPrimary: '#00363F',
        primaryContainer: lightPalette.primaryContainer,
        onPrimaryContainer: '#002528',
        secondary: lightPalette.secondary,
        onSecondary: '#ffffff',
        secondaryContainer: '#B2EDF5',
        onSecondaryContainer: '#00363F',
        background: lightPalette.background,
        surface: lightPalette.surface,
        surfaceVariant: lightPalette.surfaceVariant,
        surfaceContainer: lightPalette.surfaceElevated,
        outline: lightPalette.borderStrong,
        outlineVariant: lightPalette.border,
        error: lightPalette.error,
    },
    fonts: {
        ...MD3LightTheme.fonts,
        displayLarge: {
            ...MD3LightTheme.fonts.displayLarge,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 57,
        },
        displayMedium: {
            ...MD3LightTheme.fonts.displayMedium,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 45,
        },
        displaySmall: {
            ...MD3LightTheme.fonts.displaySmall,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 36,
        },
        headlineLarge: {
            ...MD3LightTheme.fonts.headlineLarge,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 32,
        },
        headlineMedium: {
            ...MD3LightTheme.fonts.headlineMedium,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 28,
        },
        headlineSmall: {
            ...MD3LightTheme.fonts.headlineSmall,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 24,
        },
        titleLarge: {
            ...MD3LightTheme.fonts.titleLarge,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 22,
        },
        titleMedium: {
            ...MD3LightTheme.fonts.titleMedium,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 16,
        },
        titleSmall: {
            ...MD3LightTheme.fonts.titleSmall,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 14,
        },
        bodyLarge: {
            ...MD3LightTheme.fonts.bodyLarge,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 16,
        },
        bodyMedium: {
            ...MD3LightTheme.fonts.bodyMedium,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 14,
        },
        bodySmall: {
            ...MD3LightTheme.fonts.bodySmall,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 12,
        },
        labelLarge: {
            ...MD3LightTheme.fonts.labelLarge,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 14,
        },
        labelMedium: {
            ...MD3LightTheme.fonts.labelMedium,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 12,
        },
        labelSmall: {
            ...MD3LightTheme.fonts.labelSmall,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 11,
        },
    },
};

/**
 * Dark Theme - Material Design 3
 * با فارسی (Vazirmatn) و رنگ‌های custom
 */
export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: darkPalette.primary,
        onPrimary: '#00363F',
        primaryContainer: darkPalette.primaryContainer,
        onPrimaryContainer: '#E0F7FA',
        secondary: darkPalette.secondary,
        onSecondary: '#07212A',
        secondaryContainer: '#154A5A',
        onSecondaryContainer: '#D3F2FB',
        background: darkPalette.background,
        surface: darkPalette.surface,
        surfaceVariant: darkPalette.surfaceVariant,
        surfaceContainer: darkPalette.surfaceElevated,
        outline: darkPalette.borderStrong,
        outlineVariant: darkPalette.border,
        error: darkPalette.error,
    },
    fonts: {
        ...MD3DarkTheme.fonts,
        displayLarge: {
            ...MD3DarkTheme.fonts.displayLarge,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 57,
        },
        displayMedium: {
            ...MD3DarkTheme.fonts.displayMedium,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 45,
        },
        displaySmall: {
            ...MD3DarkTheme.fonts.displaySmall,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 36,
        },
        headlineLarge: {
            ...MD3DarkTheme.fonts.headlineLarge,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 32,
        },
        headlineMedium: {
            ...MD3DarkTheme.fonts.headlineMedium,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 28,
        },
        headlineSmall: {
            ...MD3DarkTheme.fonts.headlineSmall,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 24,
        },
        titleLarge: {
            ...MD3DarkTheme.fonts.titleLarge,
            fontFamily: 'Vazirmatn-Bold',
            fontSize: 22,
        },
        titleMedium: {
            ...MD3DarkTheme.fonts.titleMedium,
            fontFamily: 'Vazirmatn-SemiBold',
            fontSize: 16,
        },
        titleSmall: {
            ...MD3DarkTheme.fonts.titleSmall,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 14,
        },
        bodyLarge: {
            ...MD3DarkTheme.fonts.bodyLarge,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 16,
        },
        bodyMedium: {
            ...MD3DarkTheme.fonts.bodyMedium,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 14,
        },
        bodySmall: {
            ...MD3DarkTheme.fonts.bodySmall,
            fontFamily: 'Vazirmatn-Regular',
            fontSize: 12,
        },
        labelLarge: {
            ...MD3DarkTheme.fonts.labelLarge,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 14,
        },
        labelMedium: {
            ...MD3DarkTheme.fonts.labelMedium,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 12,
        },
        labelSmall: {
            ...MD3DarkTheme.fonts.labelSmall,
            fontFamily: 'Vazirmatn-Medium',
            fontSize: 11,
        },
    },
};
