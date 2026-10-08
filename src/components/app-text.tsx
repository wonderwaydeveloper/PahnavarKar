import { forwardRef } from 'react';
import {
    Text,
    TextInput,
    type TextInputProps,
    type TextProps,
} from 'react-native';

import { useAppContext } from '@/hooks/use-app-context';
import { getAppFontStyle } from '@/services/font-service';

export const AppText = forwardRef<Text, TextProps>(function AppText({ style, ...props }, ref) {
    const { fontPreference } = useAppContext();

    return <Text ref={ref} {...props} style={getAppFontStyle(style, fontPreference, 'Regular')} />;
});

export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
    { style, ...props },
    ref
) {
    const { fontPreference } = useAppContext();

    return (
        <TextInput
            ref={ref}
            {...props}
            style={getAppFontStyle(style, fontPreference, 'Regular')}
        />
    );
});
