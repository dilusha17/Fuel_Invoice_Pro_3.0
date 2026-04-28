<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Tax Invoice Summary</title>
    <style>
        /* Global & Page Setup */
        @page {
            margin: 10mm;
            size: A4;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.3;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        .box {
            border: 1px solid #000;
            padding: 5px;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        .w-100 {
            width: 100%;
        }

        /* Title Section */
        .title-container {
            margin-bottom: 20px;
            text-align: center;
        }

        .title-box {
            display: inline-block;
            border: 2px solid #000;
            padding: 10px 40px;
            font-size: 16pt;
            font-weight: bold;
        }

        /* Invoice Table */
        .invoice-table {
            margin-top: 10px;
            font-size: 9pt;
        }

        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000;
            padding: 4px;
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

        .summary-header {
            margin-bottom: 15px;
        }

    </style>
</head>

<body>

    <!-- Title -->
    <div class="title-container">
        <div class="title-box">
            TAX INVOICE SUMMARY
        </div>
    </div>

    <!-- Info Section -->
    <table class="w-100 summary-header">
        <tr>
            <td class="bold">Client:</td>
            <td>{{ $clientName }}</td>
            <td class="bold text-right">Date Range:</td>
            <td class="text-right">
                {{ $fromDate->format('Y-m-d') }} to {{ $toDate->format('Y-m-d') }}
            </td>
        </tr>
    </table>

    <!-- Table -->
    <table class="invoice-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Payment Method</th>
                <th>Net Value</th>
                <th>VAT</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoices as $invoice)
            <tr>
                <td class="text-center">{{ $invoice->invoice_date->format('Y-m-d') }}</td>
                <td class="text-center">{{ $invoice->tax_invoice_no }}</td>
                <td class="text-center">{{ $invoice->paymentMethod->name ?? '' }}</td>
                <td class="text-right">{{ number_format($invoice->subtotal, 0) }}</td>
                <td class="text-right">{{ number_format($invoice->vat_amount, 0) }}</td>
                <td class="text-right">{{ number_format($invoice->total_amount, 0) }}</td>
            </tr>
            @endforeach

            <!-- Totals -->
            <tr class="totals-row">
                <td colspan="3" class="text-right" style="padding-right: 2%">GRAND TOTAL</td>
                <td class="text-right">{{ number_format($totals['sum_net'], 0) }}</td>
                <td class="text-right">{{ number_format($totals['sum_vat'], 0) }}</td>
                <td class="text-right">{{ number_format($totals['sum_total'], 0) }}</td>
            </tr>
        </tbody>
    </table>

</body>

</html>
