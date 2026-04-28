import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Scale,
    Loader2,
    Printer,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Banknote,
    Calculator,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useToast } from '@/hooks/use-toast';

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
        const year = currentYear - i;
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};

const years = generateYears();

const months = [
    { value: '1',  label: 'January' },
    { value: '2',  label: 'February' },
    { value: '3',  label: 'March' },
    { value: '4',  label: 'April' },
    { value: '5',  label: 'May' },
    { value: '6',  label: 'June' },
    { value: '7',  label: 'July' },
    { value: '8',  label: 'August' },
    { value: '9',  label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface VatBalanceData {
    total_purchase_amount: number;
    purchase_net_amount: number;
    purchase_vat_amount: number;
    total_sale: number;
    sale_net_amount: number;
    sale_vat_amount: number;
    balance: number;
}

export default function VatBalance() {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<VatBalanceData | null>(null);

    const currentYear  = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1);

    const [filters, setFilters] = useState({
        from_year:  currentYear,
        from_month: '1',
        to_year:    currentYear,
        to_month:   currentMonth,
    });

    const formatCurrency = (value: number): string =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/vat-balance/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    from_year:  parseInt(filters.from_year),
                    from_month: parseInt(filters.from_month),
                    to_year:    parseInt(filters.to_year),
                    to_month:   parseInt(filters.to_month),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setReportData(data.data);
            } else {
                toast({ title: 'Error', description: data.message || 'Failed to generate report', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to generate VAT balance report', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!reportData) return;

        const response = await fetch('/api/vat-balance/print', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': props.csrf_token,
            },
            body: JSON.stringify({
                from_year:  parseInt(filters.from_year),
                from_month: parseInt(filters.from_month),
                to_year:    parseInt(filters.to_year),
                to_month:   parseInt(filters.to_month),
            }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url  = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
        }
    };

    const fromMonthLabel = months.find((m) => m.value === filters.from_month)?.label;
    const toMonthLabel   = months.find((m) => m.value === filters.to_month)?.label;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Scale className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">VAT Balance</h1>
                        <p className="text-muted-foreground mt-1">
                            Generate a VAT balance report for a selected month range
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="card-neumorphic p-6 space-y-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-base font-semibold text-foreground">Select Period</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SearchableSelect
                        label="From Year"
                        options={years}
                        value={filters.from_year}
                        onChange={(value) => setFilters({ ...filters, from_year: value })}
                    />
                    <SearchableSelect
                        label="From Month"
                        options={months}
                        value={filters.from_month}
                        onChange={(value) => setFilters({ ...filters, from_month: value })}
                    />
                    <SearchableSelect
                        label="To Year"
                        options={years}
                        value={filters.to_year}
                        onChange={(value) => setFilters({ ...filters, to_year: value })}
                    />
                    <SearchableSelect
                        label="To Month"
                        options={months}
                        value={filters.to_month}
                        onChange={(value) => setFilters({ ...filters, to_month: value })}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    {reportData && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-success-glow flex items-center gap-2"
                        >
                            <Printer className="h-5 w-5" />
                            Print PDF
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calculator className="h-5 w-5" />}
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* Report Result */}
            {reportData && (
                <div className="space-y-4 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                    {/* Period Label */}
                    <p className="text-sm text-muted-foreground">
                        Period: <span className="font-semibold text-foreground">{fromMonthLabel} {filters.from_year}</span>
                        {' '}—{' '}
                        <span className="font-semibold text-foreground">{toMonthLabel} {filters.to_year}</span>
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Purchase Section */}
                        <div className="card-neumorphic p-6 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-foreground">Purchase Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Purchase Amount</span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(reportData.total_purchase_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Purchase Net Amount</span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(reportData.purchase_net_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <span className="font-semibold text-foreground">Purchase VAT Amount</span>
                                    <span className="text-lg font-bold text-primary">
                                        LKR {formatCurrency(reportData.purchase_vat_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sale Section */}
                        <div className="card-neumorphic p-6 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <Banknote className="h-5 w-5 text-success" />
                                <h3 className="font-semibold text-foreground">Sale Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Sale</span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(reportData.total_sale)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Sale Net Amount</span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(reportData.sale_net_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 bg-success/5 rounded-xl border border-success/20">
                                    <span className="font-semibold text-foreground">Sale VAT Amount</span>
                                    <span className="text-lg font-bold text-success">
                                        LKR {formatCurrency(reportData.sale_vat_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div
                        className={`card-neumorphic p-6 border-2 ${
                            reportData.balance >= 0 ? 'border-destructive/40' : 'border-success/40'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {reportData.balance >= 0 ? (
                                    <TrendingUp className="h-8 w-8 text-destructive" />
                                ) : (
                                    <TrendingDown className="h-8 w-8 text-success" />
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        VAT Balance (Sale VAT − Purchase VAT)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {reportData.balance >= 0
                                            ? 'Payable — VAT must be paid to the IRD'
                                            : 'Claimable — VAT refund can be claimed from IRD'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-3xl font-bold ${
                                        reportData.balance >= 0 ? 'text-destructive' : 'text-success'
                                    }`}
                                >
                                    {reportData.balance < 0 ? '-' : ''}LKR{' '}
                                    {formatCurrency(Math.abs(reportData.balance))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
