import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PersianTimePickerModal } from '@/components/persian-time-picker-modal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FULL_TIME_DAILY_MINUTES, parseDailyWorkTime } from '@/utils/daily-work-ratio';
import { ThemedText } from './themed-text';

interface DailyWorkTimeFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function DailyWorkTimeField({ value, onChange }: DailyWorkTimeFieldProps) {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const isFullTime = parseDailyWorkTime(value) === FULL_TIME_DAILY_MINUTES;

    return (
        <>
            <View style={{ backgroundColor: theme.surfaceVariant, borderRadius: 14, padding: Spacing.two, gap: Spacing.one }}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {isFullTime ? 'ساعات کارکرد روزانه بر اساس ماده ۵۱ قانون کار' : 'ساعات کارکرد روزانه بر اساس ماده ۳۹ قانون کار'}
                </ThemedText>
                <Pressable
                    onPress={() => setVisible(true)}
                    style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}
                >
                    <ThemedText type="smallBold" style={{ color: theme.text }}>{value.replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])}</ThemedText>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primary} />
                </Pressable>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>مبنای تمام‌وقت: ۷ ساعت و ۲۰ دقیقه در روز</ThemedText>
            </View>
            <PersianTimePickerModal
                visible={visible}
                value={value}
                title="انتخاب ساعات کارکرد روزانه"
                maxHours={7}
                maxMinutesAtMaxHour={20}
                onClose={() => setVisible(false)}
                onSelect={(nextValue) => {
                    onChange(nextValue);
                    setVisible(false);
                }}
            />
        </>
    );
}

export function getDailyWorkMinutes(value: string): number {
    return parseDailyWorkTime(value);
}