import { Modal, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { FontAwareButton as Button, FontAwareAppbarContent } from '@/components/font-aware-paper';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/hooks/use-app-context';

import type { PdfHtmlPreviewProps } from './pdf-html-preview.types';

export function PdfHtmlPreview({
    visible,
    html,
    action,
    onClose,
    onShare,
    onSave,
}: PdfHtmlPreviewProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <SafeAreaProvider style={styles.container}>
                <PdfHtmlPreviewContent
                    html={html}
                    action={action}
                    onClose={onClose}
                    onShare={onShare}
                    onSave={onSave}
                />
            </SafeAreaProvider>
        </Modal>
    );
}

function PdfHtmlPreviewContent({
    html,
    action,
    onClose,
    onShare,
    onSave,
}: Omit<PdfHtmlPreviewProps, 'visible'>) {
    const { colors, theme } = useAppContext();
    const insets = useSafeAreaInsets();
    const isLightTheme = theme === 'light';
    const headerBackgroundColor = isLightTheme ? colors.primary : colors.surface;
    const headerTextColor = isLightTheme ? colors.surface : colors.text;
    const previewHtml = html?.replace(
        '</head>',
        '<style>body { padding: 12px; }</style></head>',
    );

    return (
        <>
            <StatusBar
                hidden={false}
                barStyle={isLightTheme ? 'dark-content' : 'light-content'}
                backgroundColor={headerBackgroundColor}
            />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Appbar.Header
                    style={[
                        styles.appBar,
                        {
                            backgroundColor: headerBackgroundColor,
                            shadowColor: colors.text,
                            shadowOpacity: isLightTheme ? 0.16 : 0.08,
                        },
                    ]}
                >
                    <Appbar.Action
                        icon="chevron-right"
                        color={headerTextColor}
                        onPress={onClose}
                        size={24}
                        style={styles.appBarAction}
                        accessibilityLabel="بازگشت از پیش‌نمایش"
                    />
                    <FontAwareAppbarContent
                        title="پیش‌نمایش فیش PDF"
                        color={headerTextColor}
                        titleStyle={styles.appBarTitle}
                        titleMaxFontSizeMultiplier={1.2}
                    />
                    <Appbar.Action
                        icon="close"
                        color={headerTextColor}
                        onPress={onClose}
                        size={22}
                        style={styles.appBarAction}
                        accessibilityLabel="بستن پیش‌نمایش"
                    />
                </Appbar.Header>
                <View
                    style={[
                        styles.content,
                        {
                            paddingTop: Spacing.two,
                            paddingBottom: insets.bottom + Spacing.two,
                        },
                    ]}
                >
                    <View style={[styles.previewFrame, { borderColor: colors.border }]}>
                        {html ? (
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: previewHtml ?? '' }}
                                style={styles.webView}
                                backgroundColor="#FFFFFF"
                                javaScriptEnabled={false}
                                domStorageEnabled={false}
                                setSupportMultipleWindows={false}
                                showsVerticalScrollIndicator
                            />
                        ) : null}
                    </View>
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            icon="share-variant"
                            onPress={onShare}
                            loading={action === 'share'}
                            disabled={action !== null}
                            buttonColor={colors.primary}
                            textColor={colors.surface}
                            style={styles.actionButton}
                            contentStyle={styles.actionButtonContent}
                            labelStyle={styles.actionButtonLabel}
                        >
                            اشتراک‌گذاری
                        </Button>
                        <Button
                            mode="outlined"
                            icon="download"
                            onPress={onSave}
                            loading={action === 'save'}
                            disabled={action !== null}
                            textColor={colors.primary}
                            style={[styles.actionButton, { borderColor: colors.borderStrong }]}
                            contentStyle={styles.actionButtonContent}
                            labelStyle={styles.actionButtonLabel}
                        >
                            {Platform.OS === 'ios' ? 'ذخیره در Files' : 'ذخیره در Downloads'}
                        </Button>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    appBar: {
        elevation: 4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    appBarAction: { width: 40, marginHorizontal: 0 },
    appBarTitle: { fontFamily: 'AppFont-Bold', fontSize: 14, lineHeight: 22 },
    content: { flex: 1, paddingHorizontal: Spacing.three, gap: Spacing.two },
    previewFrame: { flex: 1, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10 },
    webView: { flex: 1, backgroundColor: '#FFFFFF' },
    actions: { gap: Spacing.two },
    actionButton: { borderRadius: 10 },
    actionButtonContent: { minHeight: 48 },
    actionButtonLabel: { fontFamily: 'AppFont-Medium', fontSize: 13 },
});
