import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, Printer, FileX, Loader2, ShoppingBag } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SelectOption {
    value: string;
    label: string;
}

interface PageProps {
    fuelCategories: SelectOption[];
}

interface PurchaseRecord {
    id: number;
    date: string;
    invoice_number: string | null;
    supplier_name: string | null;
    fuel_category_name: string;
    fuel_type_name: string;
    volume: number;
    unit_price: number;
    amount: number;
    discount: number;
    invoice_amount: number;
    vat_percentage: number;
    vat_amount: number;
    net_amount: number;
}

interface PurchaseTotals {
    sum_amount: number;
    sum_discount: number;
    sum_invoice_amount: number;
    sum_vat: number;
    sum_net: number;
}

export default function PurchaseSummary({ fuelCategories }: PageProps) {
    const { toast } = useToast();
    const [filters, setFilters] = useState({
        fuelCategoryId: '',
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
    });
    const [records, setRecords] = useState<PurchaseRecord[]>([]);
    const [totals, setTotals] = useState<PurchaseTotals | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const formatCurrency = (value: number): string =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        ...fuelCategories,
    ];

    const handleSearch = async (page: number = 1) => {
        if (!filters.fromDate || !filters.toDate) {
            toast({
                title: 'Validation Error',
                description: 'Please select both From Date and To Date',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                from_date:        format(filters.fromDate, 'yyyy-MM-dd'),
                to_date:          format(filters.toDate, 'yyyy-MM-dd'),
                fuel_category_id: filters.fuelCategoryId || '',
                page:             page.toString(),
            });

            const response = await fetch(`/api/purchase-summary/search?${queryParams}`);
            const data = await response.json();

            if (data.records && typeof data.records === 'object' && 'data' in data.records) {
                setRecords(data.records.data);
                setPagination({
                    current_page: data.records.current_page,
                    last_page:    data.records.last_page,
                    per_page:     data.records.per_page,
                    total:        data.records.total,
                });
            } else {
                setRecords(data.records || []);
                setPagination({ current_page: 1, last_page: 1, per_page: 20, total: (data.records || []).length });
            }

            setTotals(data.totals);
            setHasSearched(true);
        } catch {
            toast({ title: 'Error', description: 'Failed to fetch purchase summary', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.last_page) handleSearch(page);
    };

    const getPageNumbers = () => {
        const { current_page, last_page } = pagination;
        const pages: (number | string)[] = [];
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current_page > 3) pages.push('...');
            const start = Math.max(2, current_page - 1);
            const end   = Math.min(last_page - 1, current_page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current_page < last_page - 2) pages.push('...');
            pages.push(last_page);
        }
        return pages;
    };

    const handlePrint = () => {
        if (!filters.fromDate || !filters.toDate) return;
        const queryParams = new URLSearchParams({
            from_date:        format(filters.fromDate, 'yyyy-MM-dd'),
            to_date:          format(filters.toDate, 'yyyy-MM-dd'),
            fuel_category_id: filters.fuelCategoryId || '',
        });
        window.open(`/api/purchase-summary/print?${queryParams}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Purchase Summary
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View and print a summary of purchase records
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="card-neumorphic p-6 space-y-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DatePickerField
                        label="From Date"
                        value={filters.fromDate}
                        onChange={(date) => setFilters({ ...filters, fromDate: date })}
                    />
                    <DatePickerField
                        label="To Date"
                        value={filters.toDate}
                        onChange={(date) => setFilters({ ...filters, toDate: date })}
                    />
                    <SearchableSelect
                        label="Fuel Category"
                        options={categoryOptions}
                        value={filters.fuelCategoryId}
                        onChange={(value) => setFilters({ ...filters, fuelCategoryId: value })}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    {hasSearched && records.length > 0 && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-success-glow flex items-center gap-2"
                        >
                            <Printer className="h-5 w-5" />
                            Print Summary
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleSearch(1)}
                        disabled={isLoading}
                        className="btn-primary-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {hasSearched && (
                <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                    {records.length === 0 ? (
                        <div className="card-neumorphic p-12 text-center">
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                            <p className="text-muted-foreground">Adjust your filters to see results.</p>
                        </div>
                    ) : (
                        <div className="card-neumorphic overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Date</th>
                                            <th className="px-4 py-3 font-semibold">Invoice No</th>
                                            <th className="px-4 py-3 font-semibold">Supplier</th>
                                            <th className="px-4 py-3 font-semibold text-center">VAT%</th>
                                            <th className="px-4 py-3 font-semibold text-right">Invoice Amt</th>
                                            <th className="px-4 py-3 font-semibold text-right">VAT Amt</th>
                                            <th className="px-4 py-3 font-semibold text-right">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {records.map((record) => (
                                            <tr key={record.id} className="bg-card hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {format(new Date(record.date), 'yyyy-MM-dd')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-primary">
                                                    {record.invoice_number || '-'}
                                                </td>
                                                <td className="px-4 py-3">{record.supplier_name || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {Number(record.vat_percentage).toFixed(2)}%
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {formatCurrency(Number(record.invoice_amount))}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {formatCurrency(Number(record.vat_amount))}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                    {formatCurrency(Number(record.net_amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {totals && (
                                        <tfoot className="bg-muted/50 font-bold border-t-2 border-border">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-4 text-right uppercase text-muted-foreground">
                                                    Grand Total
                                                </td>
                                                <td></td>
                                                <td className="px-4 py-4 text-right">
                                                    {formatCurrency(Number(totals.sum_invoice_amount))}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {formatCurrency(Number(totals.sum_vat))}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {formatCurrency(Number(totals.sum_net))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.total > 0 && (
                                <div className="p-4 border-t border-border">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                            {pagination.total} records
                                        </div>
                                        <div className="flex items-center gap-2 order-1 sm:order-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                                disabled={pagination.current_page === 1}
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {getPageNumbers().map((page, index) =>
                                                    typeof page === 'number' ? (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`min-w-[2.5rem] h-10 px-3 rounded-lg transition-colors ${
                                                                page === pagination.current_page
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'border border-border hover:bg-secondary'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ) : (
                                                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                                            ...
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                                disabled={pagination.current_page === pagination.last_page}
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
