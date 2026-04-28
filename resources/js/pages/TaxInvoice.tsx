import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, Printer, FileX, Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { DataGrid } from '@/components/ui/DataGrid';
import { useToast } from '@/hooks/use-toast';

interface SelectOption {
    value: string;
    label: string;
}

interface PageProps {
    csrf_token: string;
    clients: SelectOption[];
    [key: string]: unknown;
}

interface TaxRecord {
    id: number;
    refNo: string;
    client: string;
    vehicle: string;
    date: string;
    fuelType: string;
    unitPrice: number;
    vatPercent: number;
    volume: number;
    total: number;
}

export default function TaxInvoice() {
    const { toast } = useToast();
    const { props } = usePage<PageProps>();
    const clients = props.clients || [];
    const [vehicles, setVehicles] = useState<SelectOption[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<SelectOption[]>([]);
    const [filters, setFilters] = useState({
        client: '',
        vehicle: 'all',
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
    });
    const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [records, setRecords] = useState<TaxRecord[]>([]);
    const [searched, setSearched] = useState(false);
    const [taxInvoiceNumber, setTaxInvoiceNumber] = useState<string>('');
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Number formatter for currency
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Number formatter for volume (3 decimal places)
    const formatVolume = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        });
    };

    // Pagination state
    interface PaginationData {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    // Fetch payment methods on component mount
    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    // Fetch vehicles when client changes
    useEffect(() => {
        if (filters.client) {
            fetchVehicles(filters.client);
            fetchNextTaxInvoiceNumber(filters.client);
        } else {
            setVehicles([]);
            setFilters((prev) => ({ ...prev, vehicle: 'all' }));
            setTaxInvoiceNumber('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.client]);

    // Re-fetch tax invoice number when invoice date changes
    useEffect(() => {
        if (filters.client) {
            fetchNextTaxInvoiceNumber(filters.client);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceDate]);

    const fetchVehicles = async (clientId: string) => {
        setIsLoadingVehicles(true);
        try {
            const response = await fetch(`/api/invoice/vehicles/${clientId}`);
            const data = await response.json();
            setVehicles([
                { value: 'all', label: 'All Vehicles' },
                ...data.vehicles.map((v: { value: string | number; label: string }) => ({
                    value: String(v.value),
                    label: v.label,
                })),
            ]);
            setFilters((prev) => ({ ...prev, vehicle: 'all' }));
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch vehicles',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/invoice/payment-methods');
            const data = await response.json();
            if (data.success) {
                setPaymentMethods(data.payment_methods);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    const fetchNextTaxInvoiceNumber = async (clientId: string) => {
        try {
            const response = await fetch(
                `/api/invoice/next-tax-invoice-number/${clientId}?invoice_date=${formatDateLocal(invoiceDate)}`,
            );
            const data = await response.json();
            if (data.success) {
                setTaxInvoiceNumber(data.tax_invoice_number);
            }
        } catch (error) {
            console.error('Error fetching tax invoice number:', error);
        }
    };

    // Helper function to format date in local timezone (YYYY-MM-DD)
    const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch paginated tax records
    const fetchTaxRecords = async (page = 1, showToast = false) => {
        // Validate filters
        if (!filters.client) {
            toast({
                title: 'Validation Error',
                description: 'Please select a client',
                variant: 'destructive',
            });
            return;
        }
        if (!filters.fromDate || !filters.toDate) {
            toast({
                title: 'Validation Error',
                description: 'Please select both From Date and To Date',
                variant: 'destructive',
            });
            return;
        }
        setIsLoadingRecords(true);
        try {
            const response = await fetch(
                `/api/invoice/tax-records?page=${page}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        client_id: filters.client,
                        vehicle_id: filters.vehicle,
                        from_date: formatDateLocal(filters.fromDate),
                        to_date: formatDateLocal(filters.toDate),
                    }),
                },
            );
            const data = await response.json();
            if (data.success) {
                setRecords(data.data || data.records || []);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                });
                setGrandTotal(data.grand_total || 0);
                setSearched(true);
                if (showToast) {
                    toast({
                        title: 'Search Complete',
                        description: `Found ${data.total || data.count || 0} records`,
                    });
                }
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch records',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching tax records:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch records',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingRecords(false);
        }
    };

    // Handler for search button
    const handleSearch = () => {
        fetchTaxRecords(1, true);
    };

    const handlePrint = async () => {
        // Validate all required fields
        if (!filters.client) {
            toast({
                title: 'Validation Error',
                description: 'Please select a client',
                variant: 'destructive',
            });
            return;
        }

        if (!filters.fromDate || !filters.toDate) {
            toast({
                title: 'Validation Error',
                description: 'Please select both From Date and To Date',
                variant: 'destructive',
            });
            return;
        }

        if (!invoiceDate) {
            toast({
                title: 'Validation Error',
                description: 'Please select an Invoice Date',
                variant: 'destructive',
            });
            return;
        }

        if (!paymentMethod) {
            toast({
                title: 'Validation Error',
                description: 'Please select a Payment Method',
                variant: 'destructive',
            });
            return;
        }

        if (!taxInvoiceNumber) {
            toast({
                title: 'Validation Error',
                description: 'Tax Invoice Number is missing',
                variant: 'destructive',
            });
            return;
        }

        if (records.length === 0) {
            toast({
                title: 'No Data',
                description: 'Please search for records before printing',
                variant: 'destructive',
            });
            return;
        }

        // First, check for duplicate invoice number via API
        setIsGeneratingPDF(true);
        try {
            const response = await fetch(
                '/api/invoice/generate-tax-invoice-pdf',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        client_id: filters.client,
                        vehicle_id: filters.vehicle,
                        from_date: formatDateLocal(filters.fromDate),
                        to_date: formatDateLocal(filters.toDate),
                        tax_invoice_number: taxInvoiceNumber,
                        invoice_date: formatDateLocal(invoiceDate),
                        payment_method: paymentMethod || '',
                    }),
                },
            );

            // Check if response is JSON (error) or PDF (success)
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                // It's an error response
                const data = await response.json();

                if (data.should_refresh) {
                    toast({
                        title: 'Duplicate Invoice Number',
                        description: data.message,
                        variant: 'destructive',
                    });
                    // Refresh the page after showing the toast
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    toast({
                        title: 'Error',
                        description: data.message || 'Failed to generate PDF',
                        variant: 'destructive',
                    });
                }
            } else {
                // It's a PDF, open it in new tab
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');

                toast({
                    title: 'PDF Generated',
                    description: 'Tax invoice PDF is opening in a new tab',
                });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate PDF. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const columns = [
        { key: 'refNo', header: 'Ref No', sortable: true },
        { key: 'client', header: 'Client', sortable: true },
        { key: 'vehicle', header: 'Vehicle' },
        { key: 'date', header: 'Date', sortable: true },
        {
            key: 'fuelType',
            header: 'Fuel',
            render: (row: TaxRecord) => (
                <span className="text-sm font-medium">{row.fuelType}</span>
            ),
        },
        {
            key: 'unitPrice',
            header: 'Unit Price',
            align: 'right' as const,
            render: (row: TaxRecord) => `LKR ${row.unitPrice}`,
        },
        {
            key: 'vatPercent',
            header: 'VAT %',
            align: 'right' as const,
            render: (row: TaxRecord) => `${row.vatPercent}%`,
        },
        {
            key: 'volume',
            header: 'Volume',
            align: 'right' as const,
            render: (row: TaxRecord) => `${formatVolume(row.volume)} L`,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right' as const,
            render: (row: TaxRecord) => (
                <span className="font-semibold text-primary">
                    LKR {formatCurrency(row.total)}
                </span>
            ),
        },
    ];

    // Pagination handlers and helpers (copied/adapted from ManageInvoices.tsx)
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchTaxRecords(newPage);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Tax Invoice
                </h1>
                <p className="text-muted-foreground mt-1">
                    Generate Rax Reports and Print Tax Invoices
                </p>
            </div>

            {/* Filter Panel */}
            <div
                className="card-neumorphic p-6 space-y-6 animate-fade-slide-up"
                style={{ animationDelay: '0.1s' }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <SearchableSelect
                            label="Client Name"
                            options={clients}
                            value={filters.client}
                            onChange={(value) =>
                                setFilters({ ...filters, client: value })
                            }
                        />
                    </div>
                    <SearchableSelect
                        label="Vehicle No"
                        options={vehicles}
                        value={filters.vehicle}
                        onChange={(value) =>
                            setFilters({ ...filters, vehicle: value })
                        }
                        disabled={isLoadingVehicles || !filters.client}
                    />
                    <DatePickerField
                        label="From Date"
                        value={filters.fromDate}
                        onChange={(date) =>
                            setFilters({ ...filters, fromDate: date })
                        }
                    />
                    <DatePickerField
                        label="To Date"
                        value={filters.toDate}
                        onChange={(date) =>
                            setFilters({ ...filters, toDate: date })
                        }
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isLoadingRecords}
                        className="btn-primary-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingRecords ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        {isLoadingRecords ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {searched && (
                <div
                    className="animate-fade-slide-up"
                    style={{ animationDelay: '0.2s' }}
                >
                    {records.length === 0 ? (
                        <div className="card-neumorphic p-12 text-center">
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No Records Found
                            </h3>
                            <p className="text-muted-foreground">
                                Please adjust your filters and try again.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <DataGrid
                                columns={columns}
                                data={records}
                                disablePagination={true}
                            />

                            {/* Pagination Bar */}
                            {pagination.total > 0 && (
                                <div
                                    className="card-neumorphic p-4 animate-fade-slide-up"
                                    style={{ animationDelay: '0.3s' }}
                                >
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                            Showing{' '}
                                            {(pagination.current_page - 1) *
                                                pagination.per_page +
                                                1}{' '}
                                            to{' '}
                                            {Math.min(
                                                pagination.current_page *
                                                    pagination.per_page,
                                                pagination.total,
                                            )}{' '}
                                            of {pagination.total} records
                                        </div>
                                        <div className="flex items-center gap-2 order-1 sm:order-2">
                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.current_page -
                                                            1,
                                                    )
                                                }
                                                disabled={
                                                    pagination.current_page ===
                                                    1
                                                }
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="sr-only">
                                                    Previous
                                                </span>
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 19l-7-7 7-7"
                                                    />
                                                </svg>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {getPageNumbers().map(
                                                    (page, index) =>
                                                        typeof page ===
                                                        'number' ? (
                                                            <button
                                                                key={page}
                                                                onClick={() =>
                                                                    handlePageChange(
                                                                        page,
                                                                    )
                                                                }
                                                                className={`min-w-[2.5rem] h-10 px-3 rounded-lg transition-colors ${
                                                                    page ===
                                                                    pagination.current_page
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'border border-border hover:bg-secondary'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ) : (
                                                            <span
                                                                key={`ellipsis-${index}`}
                                                                className="px-2 text-muted-foreground"
                                                            >
                                                                {page}
                                                            </span>
                                                        ),
                                                )}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.current_page +
                                                            1,
                                                    )
                                                }
                                                disabled={
                                                    pagination.current_page ===
                                                    pagination.last_page
                                                }
                                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="sr-only">
                                                    Next
                                                </span>
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Print Bar */}
                            <div className="card-neumorphic p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">
                                            Invoice No:{' '}
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {taxInvoiceNumber || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="w-48">
                                        <DatePickerField
                                            label="Invoice Date"
                                            value={invoiceDate}
                                            onChange={(date) =>
                                                setInvoiceDate(
                                                    date || new Date(),
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="w-48">
                                        <SearchableSelect
                                            label="Payment Method"
                                            options={paymentMethods}
                                            value={paymentMethod}
                                            onChange={(value) =>
                                                setPaymentMethod(value)
                                            }
                                            searchable={false}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            Grand Total:{' '}
                                        </span>
                                        <span className="font-bold text-primary text-xl">
                                            LKR {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        disabled={isGeneratingPDF}
                                        className="btn-success-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingPDF ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Printer className="h-5 w-5" />
                                        )}
                                        {isGeneratingPDF ? 'Generating...' : 'Print'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
