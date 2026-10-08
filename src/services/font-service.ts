import { loadAsync } from 'expo-font';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import type { FontPreference, ThemeType } from '@/context/app.context';
import { darkTheme, lightTheme } from '@/constants/themes';

export type AppFontWeight = 'Light' | 'Regular' | 'Medium' | 'SemiBold' | 'Bold';

const FONT_WEIGHTS: AppFontWeight[] = ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'];

const FONT_ASSETS = {
    iransans: {
        Light: require('../../assets/fonts/iransans/IRANSansX-Light.ttf'),
        Regular: require('../../assets/fonts/iransans/IRANSansX-Regular.ttf'),
        Medium: require('../../assets/fonts/iransans/IRANSansX-Medium.ttf'),
        SemiBold: require('../../assets/fonts/iransans/IRANSansX-DemiBold.ttf'),
        Bold: require('../../assets/fonts/iransans/IRANSansX-Bold.ttf'),
    },
    vazir: {
        Light: require('../../assets/fonts/vazir/Vazirmatn-Light.ttf'),
        Regular: require('../../assets/fonts/vazir/Vazirmatn-Regular.ttf'),
        Medium: require('../../assets/fonts/vazir/Vazirmatn-Medium.ttf'),
        SemiBold: require('../../assets/fonts/vazir/Vazirmatn-SemiBold.ttf'),
        Bold: require('../../assets/fonts/vazir/Vazirmatn-Bold.ttf'),
    },
} satisfies Record<FontPreference, Record<AppFontWeight, number>>;

const loadedFonts = new Set<FontPreference>();
const loadingFonts = new Map<FontPreference, Promise<void>>();

export function getAppFontFamily(preference: FontPreference, weight: AppFontWeight): string {
    const family = preference === 'iransans' ? 'IRANSansX' : 'Vazirmatn';
    return `Pahnavar-${family}-${weight}`;
}

export function getAppFontWeight(fontFamily?: string): AppFontWeight | undefined {
    if (!fontFamily) return undefined;

    const match = /AppFont-(Light|Regular|Medium|SemiBold|Bold)$/.exec(fontFamily);
    return FONT_WEIGHTS.find((weight) => weight === match?.[1]);
}

export async function loadAppFonts(preference: FontPreference): Promise<void> {
    if (loadedFonts.has(preference)) return;

    const pendingLoad = loadingFonts.get(preference);
    if (pendingLoad) {
        await pendingLoad;
        return;
    }

    const fontMap = Object.fromEntries(
        FONT_WEIGHTS.map((weight) => [getAppFontFamily(preference, weight), FONT_ASSETS[preference][weight]])
    );
    const load = loadAsync(fontMap).then(() => {
        loadedFonts.add(preference);
    }).finally(() => {
        loadingFonts.delete(preference);
    });

    loadingFonts.set(preference, load);
    await load;
}

export function getAppFontStyle(
    style: StyleProp<TextStyle>,
    preference: FontPreference,
    fallbackWeight?: AppFontWeight
): StyleProp<TextStyle> {
    const flattenedStyle = StyleSheet.flatten(style);
    const currentWeight = getAppFontWeight(flattenedStyle?.fontFamily);
    const declaredWeight = Number(flattenedStyle?.fontWeight);
    const weightFromFontWeight = declaredWeight >= 700
        ? 'Bold'
        : declaredWeight >= 600
            ? 'SemiBold'
            : declaredWeight >= 500
                ? 'Medium'
                : declaredWeight > 0 && declaredWeight <= 300
                    ? 'Light'
                    : undefined;
    const fontWeight = currentWeight ?? weightFromFontWeight ?? fallbackWeight;

    if (!fontWeight) return style;

    return {
        ...flattenedStyle,
        fontFamily: getAppFontFamily(preference, fontWeight),
        fontWeight: 'normal',
    };
}

export function getAppPaperTheme(theme: ThemeType, preference: FontPreference) {
    const baseTheme = theme === 'dark' ? darkTheme : lightTheme;
    const fonts = Object.fromEntries(
        Object.entries(baseTheme.fonts).map(([variant, font]) => {
            const weight = getAppFontWeight(font.fontFamily);
            return [
                variant,
                weight ? { ...font, fontFamily: getAppFontFamily(preference, weight) } : font,
            ];
        })
    ) as typeof baseTheme.fonts;

    return { ...baseTheme, fonts };
}
