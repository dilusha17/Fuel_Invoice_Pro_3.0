<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {{ $taxInvoiceNumber }}</title>
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

        /* Layout Grids */
        .w-50 {
            width: 50%;
        }

        .w-100 {
            width: 100%;
        }

        .row-table td {
            vertical-align: top;
        }

        /* Title Section */
        .title-container {
            margin-bottom: 10px;
            position: relative;
            text-align: center;
        }

        .title-box {
            display: inline-block;
            border: 2px solid #000;
            padding: 10px 40px;
            font-size: 16pt;
            font-weight: bold;
        }

        .original-doc {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 9pt;
            font-weight: normal;
        }

        /* Header Info Boxes */
        .info-header-table {
            margin-bottom: 6px;
        }

        .info-header-table td {
            padding: 0;
            vertical-align: top;
        }

        /* Spacing between the two top boxes */
        .spacer-col {
            width: 10px;
        }

        .header-field-box {
            border: 1px solid #000;
            padding: 8px;
            height: 35px;
            /* Fixed height visually */
        }

        /* Party Info Boxes */
        .party-info-table {
            margin-bottom: 6px;
        }

        .party-box {
            border: 1px solid #000;
            padding: 10px;
            height: 140px;
            /* Fixed height for consistency */
            vertical-align: top;
        }

        .party-label {
            display: block;
            margin-bottom: 2px;
        }

        /* Invoice Items Table */
        .items-table {
            width: 100%;
            margin-bottom: 0;
            /* Connects with totals if needed, or separate */
            border: 1px solid #000;
        }

        .items-table th {
            border: 1px solid #000;
            padding: 8px 4px;
            background-color: #fff;
            font-weight: bold;
            text-align: center;
            font-size: 9pt;
        }

        .items-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 9pt;
        }

        /* Totals Section */
        .totals-table {
            width: 100%;
            border: 1px solid #000;
            /* Outer border */
            border-top: none;
            /* Merge with table above */
        }

        .totals-table td {
            padding: 6px 8px;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
        }

        .totals-label {
            text-align: left;
            font-weight: normal;
        }

        .totals-value {
            text-align: right;
            width: 150px;
        }

        /* Bottom Sections */
        .bottom-box {
            border: 1px solid #000;
            padding: 8px;
            margin-top: 5px;
            min-height: 25px;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 8pt;
            border-top: 1px solid #000;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-left {
            flex: 1;
            text-align: left;
        }

        .footer-right {
            text-align: right;
        }

        /* Utilities */
        .no-border-top {
            border-top: none !important;
        }

        .no-border-bottom {
            border-bottom: none !important;
        }
    </style>
</head>

<body>

    <!-- Title -->
    <div class="title-container">
        <div class="original-doc">Copy of Original Document</div>
        <div class="title-box">Tax Invoice</div>
    </div>

    <!-- Date and Invoice No Row -->
    <table class="info-header-table">
        <tr>
            <td style="width: 49%;">
                <div class="header-field-box">
                    Date of Invoice: <strong>{{ \Carbon\Carbon::parse($printedDateTime)->format('m/d/Y') }}</strong>
                </div>
            </td>
            <td style="width: 2%;"></td> <!-- Spacer -->
            <td style="width: 49%;">
                <div class="header-field-box">
                    Tax Invoice No.: <strong>{{ $taxInvoiceNumber }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- Supplier and Purchaser Info -->
    <table class="party-info-table">
        <tr>
            <!-- Supplier -->
            <td style="width: 49%;" class="party-box">
                <div class="party-label">Supplier's TIN: {{ $companyVatNo }}</div>
                <div class="party-label">Supplier's Name: {{ $companyName }}</div>
                <div class="party-label">Address: {!! $companyAddress !!}</div>
                <div style="margin-top: 15px;">Telephone No: {{ $companyPhone }}</div>
            </td>

            <td style="width: 2%;"></td> <!-- Spacer -->

            <!-- Purchaser -->
            <td style="width: 49%;" class="party-box">
                <div class="party-label">Purchaser's TIN: {{ $clientVatNo }}</div>
                <div class="party-label">Purchaser's Name: {{ $clientName }}</div>
                <div class="party-label">Address: {{ $clientAddress }}</div>
                <div style="margin-top: 15px;">Telephone No: {{ $clientPhone }}</div>
            </td>
        </tr>
    </table>

    <!-- Date of Delivery and Place of Supply -->
    <table class="info-header-table">
        <tr>
            <td style="width: 49%;">
                <div class="header-field-box">
                    Date of Delivery: <strong>{{ \Carbon\Carbon::parse($printedDateTime)->format('m/d/Y') }}</strong>
                </div>
            </td>
            <td style="width: 2%;"></td> <!-- Spacer -->
            <td style="width: 49%;">
                <div class="header-field-box">
                    Place of Supply: <strong>{{ $placeOfSupply }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%;">Reference</th>
                <th style="width: 15%;">Vehicle<br>No.</th>
                <th style="width: 15%;">Fuel Type</th>
                <th style="width: 15%;">Volume<br>(Liters)</th>
                <th style="width: 15%;">Unit Price<br>(Rs.)</th>
                <th style="width: 20%;">Amount<br>Excluding VAT<br>(Rs.)</th>
            </tr>
        </thead>
        <tbody>
            @php
                $firstPageLimit = 20;
                $isFirstPage = true;
                $recordCount = 0;
            @endphp

            @foreach ($records as $index => $record)
                @php
                    $recordCount++;
                    // Check if we need to break to next page
                    if ($isFirstPage && $recordCount > $firstPageLimit) {
                        $isFirstPage = false;
                        echo '</tbody></table>';
                        echo '<div style="page-break-after: always;"></div>';
                        echo '<table class="items-table"><thead><tr>';
                        echo '<th style="width: 10%;">Reference</th>';
                        echo '<th style="width: 15%;">Vehicle<br>No.</th>';
                        echo '<th style="width: 15%;">Fuel Type</th>';
                        echo '<th style="width: 15%;">Volume<br>(Liters)</th>';
                        echo '<th style="width: 15%;">Unit Price<br>(Rs.)</th>';
                        echo '<th style="width: 20%;">Amount<br>Excluding VAT<br>(Rs.)</th>';
                        echo '</tr></thead><tbody>';
                    }
                @endphp
                <tr>
                    <td class="text-center">{{ $record['refNo'] }}</td>
                    <td class="text-center">{{ $record['vehicle'] }}</td>
                    <td class="text-center">{{ $record['fuelType'] }}</td>
                    <td class="text-center">{{ number_format($record['volume'], 3) }}</td>
                    <td class="text-center">{{ number_format($record['unitPrice'], 2) }}</td>
                    <td class="text-right">{{ number_format($record['amountExclVat'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Section -->
    <table class="totals-table">
        <tr>
            <td class="text-left" style="border-right: 1px solid #000; width: 70%;">Total Value of Supply</td>
            <td class="totals-value" style="width: 20%;">{{ number_format($subtotal, 0) }}</td>
        </tr>
        <tr>
            <td class="text-left" style="width: 70%;">Vat Amount (Total Value of Supply @ {{ $vatPercentage }}%)</td>
            <td class="totals-value" style="width: 20%;">{{ number_format($vatAmount, 0) }}</td>
        </tr>
        <tr>
            <td class="text-left" style="width: 70%;">Total Amount including VAT</td>
            <td class="totals-value bold" style="width: 20%;">{{ number_format($grandTotal, 0) }}</td>
        </tr>
    </table>

    <!-- Amount In Words -->
    <div class="bottom-box">
        Total Amount in Words: <strong>{{ $totalInWords }}</strong>
    </div>

    <!-- Mode of Payment -->
    <div class="bottom-box">
        Mode of Payment: <strong>{{ $paymentMode }}</strong>
    </div>

    <!-- Footer -->
    <div class="footer">
        <table>
            <tr>
                <td class="text-left" width="70%" style="vertical-align:middle;">POWERED BY: DE CREATIONS<sup>&reg;</sup> | +94 70 300 4483 | decreations.lk
                </td>
                <td class="text-right" width="30%" style="vertical-align:middle;">
                </td>
            </tr>
        </table>

    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $x = $pdf->get_width() - 74;
            $y = $pdf->get_height() - 40;
            $text = "Page {PAGE_NUM} of {PAGE_COUNT}";
            $font = $fontMetrics->getFont('Arial', 'normal');
            $size = 8;
            $color = array(0, 0, 0);
            $pdf->page_text($x, $y, $text, $font, $size, $color);
        }
    </script>



</body>

</html>
