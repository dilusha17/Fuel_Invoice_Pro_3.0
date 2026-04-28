<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>cash-sale-{{ $monthName }}-{{ $year }}.pdf</title>
    <style>
        @page {
            margin: 30px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.4;
            font-size: 10pt;
        }

        .container {
            border: 1px solid #ddd;
            padding: 30px;
        }

        /* Header Layout */
        .header-table {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }

        .company-name {
            font-size: 20pt;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .company-details {
            font-size: 9pt;
            color: #666;
        }

        /* Title */
        .page-title {
            text-align: center;
            margin: 40px 0;
        }

        .title-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            display: inline-block;
            padding: 10px 40px;
            font-size: 14pt;
            font-weight: bold;
            color: #2d3748;
            letter-spacing: 1px;
            border-radius: 4px;
        }

        /* Period Info */
        .period-info {
            margin-bottom: 20px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #4a5568;
        }

        .period-table {
            width: 100%;
        }

        .period-label {
            font-weight: bold;
            color: #4a5568;
            width: 80px;
        }

        /* Amounts Table */
        .amounts-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .amounts-table td {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }

        .amounts-table tr:first-child td {
            border-top: 1px solid #eee;
        }

        .amounts-table .label-col {
            font-weight: 600;
            color: #4a5568;
            width: 70%;
        }

        .amounts-table .amount-col {
            text-align: right;
            width: 30%;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 11pt;
        }

        .amounts-table tr:hover {
            background-color: #f8f9fa;
        }

        .total-row td {
            background-color: #f8f9fa;
            border-top: 2px solid #ddd;
            border-bottom: 2px solid #ddd;
            font-size: 12pt;
            color: #2d3748;
        }

        /* Signatures */
        .signatures {
            margin-top: 60px;
            page-break-inside: avoid;
        }

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell {
            width: 50%;
            vertical-align: top;
            padding: 0 40px;
        }

        .sig-box {
            margin-top: 40px;
        }

        .sig-line {
            border-top: 1px solid #ccc;
            margin-bottom: 8px;
        }

        .sig-title {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #718096;
            text-align: center;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: -20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #a0aec0;
            padding: 10px 0;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
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
                    <table style="width: auto; margin-left: auto; margin-top: 5px;">
                        <tr>
                            <td style="text-align: right; padding-right: 15px; font-size: 9pt; color: #555; font-weight: bold;">Date:</td>
                            <td style="text-align: left; font-size: 9pt; color: #333;">{{ $printedDate }}</td>
                        </tr>
                        <tr>
                            <td style="text-align: right; padding-right: 15px; font-size: 9pt; color: #555; font-weight: bold;">VAT Reg No:</td>
                            <td style="text-align: left; font-size: 9pt; color: #333;">{{ $vatRegNo }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Title -->
        <div class="page-title">
            <div class="title-box">INCOME STATEMENT</div>
        </div>

        <!-- Period Info -->
        <div class="period-info">
            <table class="period-table">
                <tr>
                    <td width="50%">
                        <span class="period-label">Year:</span>
                        <span style="font-size: 11pt; font-weight: bold;">{{ $year }}</span>
                    </td>
                    <td width="50%" style="text-align: right;">
                        <span class="period-label">Month:</span>
                        <span style="font-size: 11pt; font-weight: bold;">{{ $monthName }}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Amounts Table -->
        <table class="amounts-table">
            <tr class="total-row">
                <td class="label-col">Total Income</td>
                <td class="amount-col">{{ number_format($totalIncome, 0) }}</td>
            </tr>
            <tr>
                <td class="label-col">VAT Sale</td>
                <td class="amount-col">{{ number_format($vatAmount, 0) }}</td>
            </tr>
            <tr>
                <td class="label-col">Cash Sale</td>
                <td class="amount-col">{{ number_format($cashSale, 0) }}</td>
            </tr>
        </table>

        <!-- Signatures -->
        <div class="signatures">
            <table class="sig-table">
                <tr>
                    <td class="sig-cell">
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-title">Prepared By</div>
                        </div>
                    </td>
                    <td class="sig-cell">
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-title">Authorised By</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>Powered By: DE CREATIONS<sup>&reg;</sup> | 070 300 4483 | decreations.lk</div>
    </div>
</body>
</html>
