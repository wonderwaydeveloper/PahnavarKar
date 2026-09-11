import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { calculateArticle87WorkPermitFee } from '@/utils/salary-calculation';

const FIXED_RATE_PER_SQUARE_METER = 55000;

export default function Article87Screen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [area, setArea] = useState('1');
    const [result, setResult] = useState<number | null>(null);

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const latinDigits = '0123456789';

    const normalizeDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)]);
    const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
    const filterNumericInput = (value: string) => {
        const normalized = normalizeDigits(value);
        const sanitized = normalized.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');

        if (parts.length > 2) {
            return toPersianDigits(`${parts[0]}.${parts.slice(1).join('')}`);
        }

        return toPersianDigits(sanitized === '' ? '0' : sanitized);
    };
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;

    const changeArea = (delta: number) => {
        setArea((currentValue) => {
            const numericValue = Number(normalizeDigits((currentValue || '0').trim())) || 0;
            const nextValue = Math.max(0, numericValue + delta);
            return toPersianDigits(String(nextValue));
        });
    };

    const handleCalculate = () => {
        const numericValue = Number(normalizeDigits(area.trim()));

        if (!Number.isFinite(numericValue) || numericValue < 0) {
            setResult(null);
            return;
        }

        setResult(calculateArticle87WorkPermitFee(numericValue));
    };

    const handleReset = () => {
        setArea('1');
        setResult(null);
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: insets.top + Spacing.three,
                        paddingBottom: insets.bottom + Spacing.four,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>
                                    مبلغ اعمال ماده ۸۷ قانون کار
                                </ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                    موضوع فرآیند صدور پروانه کسب یا پروانه بهره برداری
                                </ThemedText>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="smallBold" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول محاسبه
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.text }]}>
                                    {toPersianDigits(FIXED_RATE_PER_SQUARE_METER)} × میزان مترمربع زیربنای ساختمان کارگاه
                                </ThemedText>
                            </View>

                            <View style={styles.yearFieldsGroup}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                    میزان مترمربع زیربنای ساختمان کارگاه
                                </ThemedText>
                                <View style={[styles.stepper, { backgroundColor: theme.surface, borderColor: theme.border, direction: 'ltr' }]}>
                                    <Pressable
                                        onPress={() => changeArea(-1)}
                                        disabled={Number(normalizeDigits(area || '0')) <= 0}
                                        style={({ pressed }) => [
                                            styles.stepperButton,
                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                            Number(normalizeDigits(area || '0')) <= 0 && styles.stepperButtonDisabled,
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityLabel="کاهش متراژ زیربنا"
                                    >
                                        <MaterialCommunityIcons name="minus" size={20} color={theme.primary} />
                                    </Pressable>

                                    <TextInput
                                        value={area}
                                        onChangeText={(value) => setArea(filterNumericInput(value))}
                                        keyboardType="decimal-pad"
                                        inputMode="decimal"
                                        placeholder="۰"
                                        placeholderTextColor={theme.textSecondary}
                                        style={[styles.textInput, { color: theme.text, direction: 'ltr' }]}
                                        textAlign="center"
                                        accessibilityLabel="متراژ زیربنای ساختمان کارگاه"
                                    />

                                    <Pressable
                                        onPress={() => changeArea(1)}
                                        style={({ pressed }) => [
                                            styles.stepperButton,
                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityLabel="افزایش متراژ زیربنا"
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="calculator"
                                    buttonColor={theme.primary}
                                    textColor={theme.surface}
                                    style={styles.actionButton}
                                    labelStyle={styles.actionLabel}
                                >
                                    محاسبه
                                </Button>

                                <Button
                                    mode="outlined"
                                    onPress={handleReset}
                                    icon="refresh"
                                    textColor={theme.primary}
                                    style={styles.actionButton}
                                    labelStyle={styles.actionLabel}
                                >
                                    بازنشانی
                                </Button>
                            </View>

                            {result !== null ? (
                                <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.resultContent}>
                                        <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                                مبلغ نهایی
                                            </ThemedText>
                                            <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>
                                                {toPersianDigits(formatCurrency(result))}
                                            </ThemedText>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ) : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerText: { gap: Spacing.one },
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { fontSize: 12, lineHeight: 20 },
    formulaBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    formulaLabel: { fontSize: 11 },
    formulaText: { fontSize: 12, lineHeight: 21 },
    yearFieldsGroup: { gap: Spacing.two },
    metricBox: { borderRadius: 14, padding: Spacing.two, gap: Spacing.one },
    sectionLabel: { fontSize: 11 },
    stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.one, gap: Spacing.one },
    stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    stepperButtonDisabled: { opacity: 0.4 },
    textInput: { flex: 1, minHeight: 42, fontFamily: 'Vazirmatn-Bold', fontSize: 14, paddingVertical: 0 },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 10 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' },
    resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBox: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.one,
        padding: Spacing.two,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryLabel: { fontSize: 11 },
    amountValue: { fontSize: 18 },
});
