export interface GroupCalculationPdfDetail {
    title: string;
    rows: { label: string; value: string }[];
}

export interface GroupCalculationPdfSection {
    title: string;
    summaryLabel: string;
    amount: string;
    error?: string;
    detailsTitle: string;
    details: GroupCalculationPdfDetail[];
}

export interface GroupCalculationPdfMetadata {
    label: string;
    value: string;
}

export interface GroupCalculationPdfAssets {
    logo: string;
    regularFont: string;
    mediumFont: string;
    semiBoldFont: string;
    boldFont: string;
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return entities[character];
    });
}

export function buildGroupCalculationPdfHtml(
    sections: GroupCalculationPdfSection[],
    metadata: GroupCalculationPdfMetadata[],
    includeDetails: boolean,
    assets: GroupCalculationPdfAssets,
) {
    const summaryRows = sections.map((section) => `
        <tr>
            <td>${escapeHtml(section.title)}</td>
            <td class="${section.error ? 'error-text' : 'amount'}">${escapeHtml(section.error ?? section.amount)}</td>
        </tr>
    `).join('');
    const sectionDetails = includeDetails ? sections.map((section) => {
        const detailCards = section.details.map((detail) => `
            <div class="detail-card">
                <h3>${escapeHtml(detail.title)}</h3>
                <table class="detail-table">
                    <tbody>
                        ${detail.rows.map((row) => `
                            <tr>
                                ${row.label
                                    ? `<th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td>`
                                    : `<td colspan="2">${escapeHtml(row.value)}</td>`}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');

        return `
            <section class="calculation-section">
                <div class="calculation-heading">
                    <h2>${escapeHtml(section.title)}</h2>
                    <div class="calculation-amount ${section.error ? 'error-text' : ''}">
                        <span>${escapeHtml(section.summaryLabel)}</span>
                        <strong>${escapeHtml(section.error ?? section.amount)}</strong>
                    </div>
                </div>
                ${section.details.length > 0 ? `<h3 class="details-title">${escapeHtml(section.detailsTitle)}</h3>` : ''}
                ${detailCards}
            </section>
        `;
    }).join('') : '';
    const metadataItems = metadata.map((item) => `
        <div class="metadata-item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
        </div>
    `).join('');

    return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>پهناور کار - فیش حقوقی</title>
    <style>
        @font-face {
            font-family: "Vazirmatn";
            src: url("${escapeHtml(assets.regularFont)}") format("truetype");
            font-style: normal;
            font-weight: 400;
        }
        @font-face {
            font-family: "Vazirmatn";
            src: url("${escapeHtml(assets.mediumFont)}") format("truetype");
            font-style: normal;
            font-weight: 500;
        }
        @font-face {
            font-family: "Vazirmatn";
            src: url("${escapeHtml(assets.semiBoldFont)}") format("truetype");
            font-style: normal;
            font-weight: 600;
        }
        @font-face {
            font-family: "Vazirmatn";
            src: url("${escapeHtml(assets.boldFont)}") format("truetype");
            font-style: normal;
            font-weight: 700;
        }
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #172b35;
            background: #fff;
            font-family: "Vazirmatn", sans-serif;
            font-size: 11px;
            line-height: 1.9;
        }
        .watermark {
            position: fixed;
            z-index: 0;
            top: 50%;
            left: 50%;
            width: 320px;
            height: 320px;
            transform: translate(-50%, -50%);
            background-color: #26C6DA;
            background-image: url("${escapeHtml(assets.logo)}");
            background-position: center;
            background-size: contain;
            background-repeat: no-repeat;
            border-radius: 24px;
            opacity: 0.09;
            pointer-events: none;
        }
        main { position: relative; z-index: 1; }
        header {
            position: relative;
            text-align: center;
            padding: 0 0 16px;
            border-bottom: 3px solid #087e8b;
        }
        .header-brand { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .header-logo-wrap {
            display: flex;
            width: 38px;
            height: 38px;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 10px;
            background-color: #26C6DA;
        }
        .header-logo { width: 100%; height: 100%; object-fit: contain; }
        .brand { color: #087e8b; font-size: 21px; font-weight: bold; }
        h1 { margin: 2px 0 0; font-size: 18px; }
        .generated { position: absolute; top: 0; left: 0; color: #5b6d75; text-align: left; font-size: 9px; }
        .metadata {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin: 18px 0;
        }
        .metadata-item {
            padding: 8px 10px;
            border: 1px solid #d9e3e6;
            border-radius: 7px;
            background: #f5f9fa;
        }
        .metadata-item span { display: block; color: #5b6d75; font-size: 10px; }
        .metadata-item strong { display: block; margin-top: 2px; }
        .summary { width: 100%; border-collapse: collapse; margin: 12px 0 22px; }
        .summary th, .summary td {
            padding: 8px 10px;
            border: 1px solid #d9e3e6;
            text-align: right;
            vertical-align: top;
        }
        .summary thead { display: table-header-group; }
        .summary th { color: #fff; background: #087e8b; }
        .summary tbody tr:nth-child(even) { background: #f5f9fa; }
        .summary td:last-child { width: 42%; }
        .amount { color: #087e8b; font-weight: bold; }
        .error-text { color: #b42318; }
        .calculation-section { margin: 18px 0; page-break-inside: avoid; }
        .calculation-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 9px 11px;
            border-right: 4px solid #087e8b;
            background: #edf6f7;
        }
        h2 { margin: 0; font-size: 14px; }
        .calculation-amount { text-align: left; }
        .calculation-amount span { display: block; color: #5b6d75; font-size: 9px; }
        .calculation-amount strong { display: block; font-size: 12px; }
        .details-title { margin: 9px 0 0; font-size: 11px; }
        .detail-card { margin-top: 9px; border: 1px solid #d9e3e6; border-radius: 6px; overflow: hidden; }
        .detail-card h3 { margin: 0; padding: 6px 9px; background: #f5f9fa; font-size: 11px; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table th, .detail-table td { width: 50%; padding: 5px 9px; border-top: 1px solid #e8eef0; text-align: right; }
        .detail-table th { color: #5b6d75; font-weight: normal; }
        .note {
            margin-top: 22px;
            padding: 10px 12px;
            border: 1px solid #e4d6ac;
            border-radius: 6px;
            color: #66521b;
            background: #fff9e9;
        }
        .about-section {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 2px solid #087e8b;
        }
        .about-section h2 { margin-bottom: 6px; color: #087e8b; }
        .about-intro { margin: 0 0 12px; color: #4b6275; }
        .about-item { margin-top: 10px; page-break-inside: avoid; }
        .about-item h3 { margin: 0; font-size: 12px; }
        .about-item p { margin: 3px 0 0; color: #4b6275; }
        footer { margin-top: 16px; color: #697a81; font-size: 9px; text-align: center; }
    </style>
</head>
<body>
    <div class="watermark" aria-hidden="true"></div>
    <main>
    <header>
        <div class="header-brand">
            <span class="header-logo-wrap">
                <img class="header-logo" src="${escapeHtml(assets.logo)}" alt="لوگوی پهناور کار">
            </span>
            <div>
                <div class="brand">پهناور کار</div>
                <h1>فیش محاسبات حقوق و مزایا</h1>
            </div>
        </div>
        <div class="generated">تاریخ تهیه<br><strong>${escapeHtml(metadata.find((item) => item.label === 'تاریخ تهیه')?.value ?? '')}</strong></div>
    </header>
    <div class="metadata">${metadataItems}</div>
    <table class="summary">
        <thead><tr><th>عنوان محاسبه</th><th>نتیجه نهایی</th></tr></thead>
        <tbody>${summaryRows}</tbody>
    </table>
    ${sectionDetails}
    <div class="note">
        این سند گزارش محاسبات گروهی است و جایگزین فیش صادرشده از سوی کارفرما نیست.
        مبالغ هر محاسبه جداگانه گزارش شده‌اند و با یکدیگر جمع نشده‌اند؛ ممکن است برخی اقلام هم‌پوشانی داشته باشند.
    </div>
    <footer>این گزارش به‌صورت خودکار از نتایج محاسبه‌شده در پهناور کار تهیه شده است.</footer>
    <section class="about-section">
        <h2>درباره پهناور کار</h2>
        <p class="about-intro">
            ما با هدف ساده‌سازی محاسبات حقوق و دستمزد، ابزارهایی کاربردی و قابل اعتماد برای کاربران فراهم کرده‌ایم.
        </p>
        <div class="about-item">
            <h3>ماموریت ما</h3>
            <p>ایجاد یک تجربه ساده، دقیق و قابل اعتماد برای محاسبه حقوق و مزایای کارکنان در مسیر مدیریت منابع انسانی و برنامه‌ریزی.</p>
        </div>
        <div class="about-item">
            <h3>چرا ما</h3>
            <p>با تمرکز بر دقت، رابط کاربری روان و سازگاری با نیازهای ایرانی، ابزارهایی طراحی کرده‌ایم که محاسبات را سریع‌تر و شفاف‌تر می‌کنند.</p>
        </div>
        <div class="about-item">
            <h3>ارزش‌های ما</h3>
            <p>شفافیت، دقت در داده‌ها، سادگی استفاده و پشتیبانی از تجربه‌ی فارسی برای کاربران ایرانی.</p>
        </div>
    </section>
    </main>
</body>
</html>`;
}
