export interface PdfHtmlPreviewProps {
    visible: boolean;
    html: string | null;
    action: 'preview' | 'share' | 'save' | null;
    onClose: () => void;
    onShare: () => void;
    onSave: () => void;
}
