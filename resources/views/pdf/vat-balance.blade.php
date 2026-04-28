<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VAT Balance Report</title>
    <style>
        @page {
            margin: 15mm;
            size: A4 portrait;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.4;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        .text-center { text-align: center; }
        .text-right  { text-align: right; }
        .bold        { font-weight: bold; }

        /* Header */
        .header-table {
            width: 100%;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }

        .company-name {
            font-size: 16pt;
            font-weight: 700;
            color: #1a1a1a;
            text-transform: uppercase;
        }

        .company-details {
            font-size: 9pt;
            color: #555;
            margin-top: 4px;
        }

        /* Title */
        .title-container {
            text-align: center;
            margin: 15px 0;
        }

        .title-box {
            display: inline-block;
            border: 2px solid #000;
            padding: 8px 40px;
            font-size: 14pt;
            font-weight: bold;
        }

        /* Period */
        .period-box {
            background-color: #f5f5f5;
            border-left: 4px solid #333;
            padding: 8px 12px;
            margin: 10px 0 20px 0;
            font-size: 10pt;
        }

        /* Section Title */
        .section-title {
            background-color: #333;
            color: #fff;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 10pt;
            margin-top: 15px;
            margin-bottom: 0;
        }

        /* Data Table */
        .data-table {
            font-size: 10pt;
        }

        .data-table td {
            border: 1px solid #ccc;
            padding: 8px 12px;
        }

        .data-table .label-col {
            background-color: #fafafa;
            font-weight: 600;
            width: 60%;
        }

        .data-table .value-col {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            width: 40%;
        }

        /* Balance Box */
        .balance-section {
            margin-top: 20px;
            border: 2px solid #000;
        }

        .balance-header {
            background-color: #000;
            color: #fff;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 11pt;
        }

        .balance-row td {
            border: 1px solid #666;
            padding: 10px 12px;
        }

        .balance-label {
            font-weight: bold;
            font-size: 11pt;
            width: 60%;
        }

        .balance-amount {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-size: 14pt;
            font-weight: bold;
            width: 40%;
        }

        .positive { color: #b91c1c; }
        .negative { color: #0a6e0a; }

        /* Signatures */
        .sig-table {
            margin-top: 50px;
            width: 100%;
        }

        .sig-cell {
            width: 50%;
            padding: 0 30px;
            vertical-align: top;
        }

        .sig-line {
            border-top: 1px solid #555;
            margin-top: 40px;
            margin-bottom: 6px;
        }

        .sig-title {
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #666;
            text-align: center;
        }

        .footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #aaa;
            padding: 6px 0;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td width="60%" style="vertical-align: top;">
                <div class="company-name">{{ $companyName }}</div>
                <div class="company-details">
                    {!! nl2br(e($companyAddress)) !!}<br>
                    Phone: {{ $companyPhone }}
                </div>
            </td>
            <td width="40%" style="vertical-align: top; text-align: right;">
                <div style="font-size: 9pt;"><strong>VAT Reg No:</strong> {{ $vatRegNo }}</div>
                <div style="font-size: 9pt; margin-top: 4px;"><strong>Printed:</strong> {{ $printedDate }}</div>
            </td>
        </tr>
    </table>

    <!-- Title -->
    <div class="title-container">
        <div class="title-box">VAT BALANCE REPORT</div>
    </div>

    <!-- Period -->
    <div class="period-box">
        <strong>Period:</strong> {{ $fromPeriod }} &mdash; {{ $toPeriod }}
    </div>

    <!-- Purchase Section -->
    <div class="section-title">PURCHASE DETAILS</div>
    <table class="data-table">
        <tr>
            <td class="label-col">Total Purchase Amount (Invoice Amount)</td>
            <td class="value-col">{{ number_format($totalPurchaseAmount, 2) }}</td>
        </tr>
        <tr>
            <td class="label-col">Purchase Net Amount (Excl. VAT)</td>
            <td class="value-col">{{ number_format($purchaseNetAmount, 2) }}</td>
        </tr>
        <tr style="background-color: #fff3cd;">
            <td class="label-col bold">Purchase VAT Amount</td>
            <td class="value-col bold">{{ number_format($purchaseVatAmount, 2) }}</td>
        </tr>
    </table>

    <!-- Sale Section -->
    <div class="section-title" style="margin-top: 20px;">SALE DETAILS</div>
    <table class="data-table">
        <tr>
            <td class="label-col">Total Sale (Monthly Income)</td>
            <td class="value-col">{{ number_format($totalSale, 2) }}</td>
        </tr>
        <tr>
            <td class="label-col">Sale Net Amount (Excl. VAT)</td>
            <td class="value-col">{{ number_format($saleNetAmount, 2) }}</td>
        </tr>
        <tr style="background-color: #d1fae5;">
            <td class="label-col bold">Sale VAT Amount</td>
            <td class="value-col bold">{{ number_format($saleVatAmount, 2) }}</td>
        </tr>
    </table>

    <!-- Balance Section -->
    <div class="balance-section" style="margin-top: 25px;">
        <div class="balance-header">VAT BALANCE</div>
        <table>
            <tr class="balance-row">
                <td class="balance-label">Balance (Sale VAT - Purchase VAT)</td>
                <td class="balance-amount {{ $balance >= 0 ? 'positive' : 'negative' }}">
                    {{ $balance >= 0 ? '' : '-' }}{{ number_format(abs($balance), 2) }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Signatures -->
    <table class="sig-table">
        <tr>
            <td class="sig-cell">
                <div class="sig-line"></div>
                <div class="sig-title">Prepared By</div>
            </td>
            <td class="sig-cell">
                <div class="sig-line"></div>
                <div class="sig-title">Authorised By</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Powered By: DE CREATIONS&reg; | 070 300 4483 | decreations.lk
    </div>

</body>
</html>
