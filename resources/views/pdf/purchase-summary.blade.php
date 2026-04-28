<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Summary</title>
    <style>
        @page {
            margin: 10mm;
            size: A4 portrait;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            color: #000;
            line-height: 1.3;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        .text-center { text-align: center; }
        .text-right  { text-align: right; }
        .text-left   { text-align: left; }
        .bold        { font-weight: bold; }

        /* Header */
        .header-table {
            width: 100%;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 8px;
        }

        .company-name {
            font-size: 14pt;
            font-weight: 700;
            color: #1a1a1a;
            text-transform: uppercase;
        }

        .company-details {
            font-size: 8pt;
            color: #555;
            margin-top: 3px;
        }

        /* Title */
        .title-container {
            margin: 10px 0;
            text-align: center;
        }

        .title-box {
            display: inline-block;
            border: 2px solid #000;
            padding: 6px 30px;
            font-size: 13pt;
            font-weight: bold;
        }

        /* Summary header */
        .summary-header {
            margin-bottom: 10px;
        }

        .summary-header td {
            font-size: 8pt;
            padding: 2px 4px;
        }

        /* Invoice Table */
        .invoice-table {
            margin-top: 8px;
            font-size: 7.5pt;
        }

        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000;
            padding: 3px 5px;
        }

        .invoice-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .totals-row td {
            font-weight: bold;
            background-color: #f0f0f0;
        }

        .footer {
            position: fixed;
            bottom: -5mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #999;
            padding: 4px 0;
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
                    {!! nl2br(e($companyAddress)) !!} &nbsp;|&nbsp; Phone: {{ $companyPhone }}
                </div>
            </td>
            <td width="40%" style="vertical-align: top; text-align: right; font-size: 8pt;">
                <div><strong>VAT Reg No:</strong> {{ $vatRegNo }}</div>
                <div><strong>Printed:</strong> {{ $printedDate }}</div>
            </td>
        </tr>
    </table>

    <!-- Title -->
    <div class="title-container">
        <div class="title-box">PURCHASE SUMMARY</div>
    </div>

    <!-- Info Section -->
    <table class="w-100 summary-header">
        <tr>
            <td class="bold">Date Range:</td>
            <td>{{ $fromDate->format('Y-m-d') }} to {{ $toDate->format('Y-m-d') }}</td>
            <td class="text-right bold">Total Records:</td>
            <td class="text-right">{{ count($records) }}</td>
        </tr>
    </table>

    <!-- Table -->
    <table class="invoice-table">
        <thead>
            <tr>
                <th style="width:13%">Date</th>
                <th style="width:17%">Invoice No</th>
                <th style="width:22%">Supplier</th>
                <th style="width:8%" class="text-center">VAT%</th>
                <th style="width:13%" class="text-right">Invoice Amt</th>
                <th style="width:13%" class="text-right">VAT Amt</th>
                <th style="width:14%" class="text-right">Net Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $record)
            <tr>
                <td class="text-center">{{ \Carbon\Carbon::parse($record->date)->format('Y-m-d') }}</td>
                <td class="text-center">{{ $record->invoice_number ?? '-' }}</td>
                <td>{{ $record->supplier_name ?? '-' }}</td>
                <td class="text-center">{{ number_format($record->vat_percentage, 2) }}</td>
                <td class="text-right">{{ number_format($record->invoice_amount, 2) }}</td>
                <td class="text-right">{{ number_format($record->vat_amount, 2) }}</td>
                <td class="text-right">{{ number_format($record->net_amount, 2) }}</td>
            </tr>
            @endforeach

            <!-- Totals -->
            <tr class="totals-row">
                <td colspan="4" class="text-right" style="padding-right: 5px;">GRAND TOTAL</td>
                <td class="text-right">{{ number_format($totals['sum_invoice_amount'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['sum_vat'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['sum_net'], 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Powered By: DE CREATIONS&reg; | 070 300 4483 | decreations.lk
    </div>
</body>
</html>
