import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Search, Download, FileX, Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SelectOption {
    value: string;
    label: string;
}

interface PageProps {
    clients: SelectOption[];
    paymentMethods: SelectOption[];
}

interface Invoice {
    id: number;
    serial_no: number;
    invoice_date: string;
    tax_invoice_no: string;
    tin: string;
    purchaser_name: string;
    description: string;
    subtotal: number;
    vat_amount: number;
}

interface InvoiceTotals {
    sum_net: number;
    sum_vat: number;
    sum_total: number;
}

export default function InvoiceSummary({ clients, paymentMethods }: PageProps) {
    const { toast } = useToast();
    const [filters, setFilters] = useState({
        clientId: '',
        paymentMethodId: '',
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [totals, setTotals] = useState<InvoiceTotals | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Number formatter for currency
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Pagination state
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

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
                from_date: format(filters.fromDate, 'yyyy-MM-dd'),
                to_date: format(filters.toDate, 'yyyy-MM-dd'),
                client_id: filters.clientId || '',
                payment_method_id: filters.paymentMethodId || '',
                page: page.toString(),
            });

            const response = await fetch(`/api/invoice-summary/search?${queryParams}`);
            const data = await response.json();

            // Handle paginated response structure
            if (data.invoices && typeof data.invoices === 'object' && 'data' in data.invoices) {
                setInvoices(data.invoices.data);
                setPagination({
                    current_page: data.invoices.current_page,
                    last_page: data.invoices.last_page,
                    per_page: data.invoices.per_page,
                    total: data.invoices.total,
                });
            } else {
                 setInvoices(data.invoices || []);
                 setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: 20,
                    total: data.invoices ? data.invoices.length : 0,
                 });
            }

            setTotals(data.totals);
            setHasSearched(true);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch invoice summary',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.last_page) {
            handleSearch(page);
        }
    };

    const getPageNumbers = () => {
        const { current_page, last_page } = pagination;
        const pages: (number | string)[] = [];
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (current_page > 3) {
                pages.push('...');
            }
            const start = Math.max(2, current_page - 1);
            const end = Math.min(last_page - 1, current_page + 1);
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (current_page < last_page - 2) {
                pages.push('...');
            }
            pages.push(last_page);
        }
        return pages;
    };

    const handleExportCsv = () => {
        if (!filters.fromDate || !filters.toDate) return;

        const queryParams = new URLSearchParams({
            from_date: format(filters.fromDate, 'yyyy-MM-dd'),
            to_date: format(filters.toDate, 'yyyy-MM-dd'),
            client_id: filters.clientId || '',
            payment_method_id: filters.paymentMethodId || '',
        });

        window.open(`/api/invoice-summary/export-csv?${queryParams}`, '_blank');
    };

    // Add "All Clients" and "All Methods" option to the list
    const clientOptions = [
        { value: '', label: 'All Clients' },
        ...clients
    ];

    const paymentMethodOptions = [
        { value: '', label: 'All Methods' },
        ...paymentMethods
    ];

    return (
        <div className="space-y-6">
            <Head title="Invoice Summary" />

            {/* Header */}
            <div className="animate-fade-slide-up">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Invoice Summary
                </h1>
                <p className="text-muted-foreground mt-1">
                    View and print summary of tax invoices
                </p>
            </div>

            {/* Filter Panel */}
            <div className="card-neumorphic p-6 space-y-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SearchableSelect
                        label="Client"
                        options={clientOptions}
                        value={filters.clientId}
                        onChange={(value) => setFilters({ ...filters, clientId: value })}
                    />
                    <SearchableSelect
                        label="Payment Method"
                        options={paymentMethodOptions}
                        value={filters.paymentMethodId}
                        onChange={(value) => setFilters({ ...filters, paymentMethodId: value })}
                    />
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
                </div>
                <div className="flex justify-end gap-2">
                     {hasSearched && invoices.length > 0 && (
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="btn-success-glow flex items-center gap-2"
                        >
                            <Download className="h-5 w-5" />
                            Download CSV
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleSearch(1)}
                        disabled={isLoading}
                        className="btn-primary-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {hasSearched && (
                <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                    {invoices.length === 0 ? (
                        <div className="card-neumorphic p-12 text-center">
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No Invoices Found
                            </h3>
                            <p className="text-muted-foreground">
                                Adjust your filters to see results.
                            </p>
                        </div>
                    ) : (
                        <div className="card-neumorphic overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-center w-12">#</th>
                                            <th className="px-4 py-3 font-semibold">Invoice Date</th>
                                            <th className="px-4 py-3 font-semibold">Tax Invoice No</th>
                                            <th className="px-4 py-3 font-semibold">Purchaser's TIN</th>
                                            <th className="px-4 py-3 font-semibold">Name of the Purchaser</th>
                                            <th className="px-4 py-3 font-semibold">Description</th>
                                            <th className="px-4 py-3 font-semibold text-right">Value of Supply</th>
                                            <th className="px-4 py-3 font-semibold text-right">VAT Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="bg-card hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-4 text-center text-muted-foreground">
                                                    {invoice.serial_no}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {invoice.invoice_date}
                                                </td>
                                                <td className="px-4 py-4 font-medium text-primary whitespace-nowrap">
                                                    {invoice.tax_invoice_no}
                                                </td>
                                                <td className="px-4 py-4">{invoice.tin}</td>
                                                <td className="px-4 py-4">{invoice.purchaser_name}</td>
                                                <td className="px-4 py-4">{invoice.description}</td>
                                                <td className="px-4 py-4 text-right whitespace-nowrap">
                                                    {formatCurrency(Number(invoice.subtotal))}
                                                </td>
                                                <td className="px-4 py-4 text-right whitespace-nowrap">
                                                    {formatCurrency(Number(invoice.vat_amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {totals && (
                                        <tfoot className="bg-muted/50 font-bold border-t-2 border-border">
                                            <tr>
                                                <td colSpan={6} className="px-4 py-4 text-right uppercase text-muted-foreground">
                                                    Grand Total
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {formatCurrency(Number(totals.sum_net))}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {formatCurrency(Number(totals.sum_vat))}
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
                                            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
                                        </div>
                                        <div className="flex items-center gap-2 order-1 sm:order-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                                disabled={pagination.current_page === 1}
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="sr-only">Previous</span>
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
                                                            {page}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                                disabled={pagination.current_page === pagination.last_page}
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="sr-only">Next</span>
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
