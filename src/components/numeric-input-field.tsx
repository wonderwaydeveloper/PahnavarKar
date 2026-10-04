import { TextInput, type TextInputProps } from 'react-native';

export type NumericInputMode = 'integer' | 'decimal';

type NumericInputFieldProps = Omit<
    TextInputProps,
    'defaultValue' | 'inputMode' | 'keyboardType' | 'onChangeText' | 'value'
> & {
    mode?: NumericInputMode;
    onChangeText: (value: string) => void;
    value: string;
};

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const latinDigits = '0123456789';
const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';

function sanitizeNumericInput(value: string, mode: NumericInputMode): string {
    const normalized = value
        .replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)])
        .replace(/[٠-٩]/g, (digit) => latinDigits[arabicIndicDigits.indexOf(digit)])
        .replace(/٫/g, '.');
    const allowedCharacters = mode === 'decimal' ? /[^0-9.]/g : /[^0-9]/g;
    let sanitized = normalized.replace(allowedCharacters, '');

    if (mode === 'decimal') {
        const decimalIndex = sanitized.indexOf('.');
        if (decimalIndex >= 0) {
            sanitized = `${sanitized.slice(0, decimalIndex + 1)}${sanitized.slice(decimalIndex + 1).replace(/\./g, '')}`;
        }
    }

    return sanitized.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

export function NumericInputField({ mode = 'integer', onChangeText, ...props }: NumericInputFieldProps) {
    return (
        <TextInput
            {...props}
            keyboardType={mode === 'decimal' ? 'decimal-pad' : 'number-pad'}
            inputMode={mode === 'decimal' ? 'decimal' : 'numeric'}
            onChangeText={(value) => onChangeText(sanitizeNumericInput(value, mode))}
        />
    );
}