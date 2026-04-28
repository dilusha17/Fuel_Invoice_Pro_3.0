import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, FileX, Trash2, StickyNote, Search } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DataGrid } from '@/components/ui/DataGrid';
import { FuelBadge, FuelType } from '@/components/ui/FuelBadge';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface Client {
    value: string;
    label: string;
}

interface InvoiceHistoryProps {
    clients: Client[];
}

// Generate years dynamically from current year back to 10 years
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
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface HistoryRecord {
    id: string;
    refNo: string;
    client: string;
    vehicle: string;
    date: string;
    fuelType: FuelType;
    unitPrice: number;
    vatPercent: number;
    volume: number;
    total: number;
}

interface InvoiceOption {
    value: string;
    label: string;
    invoiceDate: string;
    fromDate: string;
    toDate: string;
    records: HistoryRecord[];
}

interface DeletedRecord {
    id: number;
    taxInvoiceNo: string;
    clientName: string;
    deletedAt: string;
    reasonForDelete: string;
}

const REASON_MAX_LENGTH = 500;
const DELETED_PER_PAGE = 10;

export default function InvoiceHistory({ clients }: InvoiceHistoryProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();

    // Tab: 'active' | 'deleted'
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

    const [filters, setFilters] = useState({
        client: '',
        year: '2026',
        month: '01',
    });
    const [availableInvoices, setAvailableInvoices] = useState<InvoiceOption[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [metadata, setMetadata] = useState<{
        invoiceNo: string;
        invoiceDate: string;
        fromDate: string;
        toDate: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [paymentMethod, setPaymentMethod] = useState('');

    // Delete modal state
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCheckingLast, setIsCheckingLast] = useState(false);

    // Deleted invoices tab
    const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
    const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
    const [deletedSearch, setDeletedSearch] = useState('');
    const [deletedPage, setDeletedPage] = useState(1);
    const [noteModal, setNoteModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });

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

    // Fetch payment methods on component mount
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

    // Fetch payment methods on mount
    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchDeletedInvoices = async () => {
        setIsLoadingDeleted(true);
        try {
            const response = await fetch('/api/tax-invoice-history/deleted');
            const data = await response.json();
            if (data.success) {
                setDeletedRecords(data.records);
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to load deleted invoices.', variant: 'destructive' });
        } finally {
            setIsLoadingDeleted(false);
        }
    };

    // Load deleted invoices when switching to that tab
    useEffect(() => {
        if (activeTab === 'deleted') {
            setDeletedSearch('');
            fetchDeletedInvoices();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const filteredDeletedRecords = deletedRecords.filter((row) => {
        const q = deletedSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            row.taxInvoiceNo.toLowerCase().includes(q) ||
            row.clientName.toLowerCase().includes(q)
        );
    });

    const deletedLastPage = Math.max(1, Math.ceil(filteredDeletedRecords.length / DELETED_PER_PAGE));
    const pagedDeletedRecords = filteredDeletedRecords.slice(
        (deletedPage - 1) * DELETED_PER_PAGE,
        deletedPage * DELETED_PER_PAGE,
    );

    const handleDeleteClick = async () => {
        if (!selectedInvoice || !metadata) {
            toast({ title: 'No Invoice Selected', description: 'Please select an invoice to delete.', variant: 'destructive' });
            return;
        }

        setIsCheckingLast(true);
        try {
            const response = await fetch('/api/tax-invoice-history/check-last', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({ tax_invoice_id: selectedInvoice }),
            });

            const data = await response.json();

            if (!data.success) {
                toast({ title: 'Error', description: data.message || 'Failed to check invoice.', variant: 'destructive' });
                return;
            }

            if (data.is_last) {
                setDeleteReason('');
                setShowConfirmDeleteModal(true);
            } else {
                setErrorModalMessage('This is not the last invoice for this client. Only the last invoice can be deleted.');
                setShowErrorModal(true);
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to check invoice status.', variant: 'destructive' });
        } finally {
            setIsCheckingLast(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteReason.trim()) return;

        setIsDeleting(true);
        try {
            const response = await fetch('/api/tax-invoice-history/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    tax_invoice_id: selectedInvoice,
                    reason_for_delete: deleteReason.trim(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowConfirmDeleteModal(false);
                setDeleteReason('');
                // Reset UI state
                setSelectedInvoice('');
                setRecords([]);
                setMetadata(null);
                setGrandTotal(0);
                setAvailableInvoices([]);
                toast({ title: 'Invoice Deleted', description: 'The invoice has been deleted successfully.' });
            } else {
                toast({ title: 'Error', description: data.message || 'Failed to delete invoice.', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to delete invoice.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleView = async () => {
        if (!filters.client) {
            toast({
                title: 'Select Client',
                description: 'Please select a client to view invoices.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Get selected client name
            const selectedClient = clients.find(
                (c) => c.value === filters.client,
            );
            if (!selectedClient) {
                toast({
                    title: 'Error',
                    description: 'Selected client not found.',
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/history/tax-invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    client_name: selectedClient.label,
                    year: filters.year,
                    month: filters.month,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setAvailableInvoices(data.invoices || []);
                setSelectedInvoice('');
                setRecords([]);
                setMetadata(null);
                setGrandTotal(0);
                setPaymentMethod('');
                setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: 20,
                    total: 0,
                });

                if (!data.invoices || data.invoices.length === 0) {
                    toast({
                        title: 'No Invoices Found',
                        description:
                            'No invoices found for the selected period.',
                    });
                } else {
                    toast({
                        title: 'Invoices Loaded',
                        description: `Found ${data.invoices.length} invoice(s) for the selected period.`,
                    });
                }
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to load invoices.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to load invoices.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInvoiceRecords = async (invoiceId: string, page: number = 1) => {
        try {
            const response = await fetch(
                `/api/history/tax-invoice-records?page=${page}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        tax_invoice_id: invoiceId,
                    }),
                },
            );

            const data = await response.json();

            if (data.success) {
                setRecords(data.records);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                });
                setGrandTotal(data.grand_total || 0);
                setPaymentMethod(data.payment_method_id || '');
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load invoice records.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to load invoice records.',
                variant: 'destructive',
            });
        }
    };

    const handlePageChange = (page: number) => {
        if (selectedInvoice && page >= 1 && page <= pagination.last_page) {
            fetchInvoiceRecords(selectedInvoice, page);
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

    const handleInvoiceSelect = async (invoiceValue: string) => {
        setSelectedInvoice(invoiceValue);
        const invoice = availableInvoices.find(
            (inv) => inv.value === invoiceValue,
        );
        if (invoice) {
            setMetadata({
                invoiceNo: invoice.label,
                invoiceDate: invoice.invoiceDate,
                fromDate: invoice.fromDate,
                toDate: invoice.toDate,
            });
            fetchInvoiceRecords(invoiceValue, 1);
        }
    };

    const handlePrint = async () => {
        if (!selectedInvoice || !metadata) {
            toast({
                title: 'No Invoice Selected',
                description: 'Please select an invoice to print.',
                variant: 'destructive',
            });
            return;
        }

        setIsGeneratingPdf(true);

        try {
            const response = await fetch(
                '/api/history/generate-tax-invoice-pdf',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        tax_invoice_id: selectedInvoice,
                        payment_method_id: paymentMethod || null,
                    }),
                },
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                window.URL.revokeObjectURL(url);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to generate PDF.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to generate PDF.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const columns = [
        { key: 'refNo', header: 'Ref No', sortable: true },
        { key: 'client', header: 'Client' },
        { key: 'vehicle', header: 'Vehicle' },
        { key: 'date', header: 'Date', sortable: true },
        {
            key: 'fuelType',
            header: 'Fuel',
            render: (row: HistoryRecord) => <FuelBadge type={row.fuelType} />,
        },
        {
            key: 'unitPrice',
            header: 'Unit Price',
            align: 'right' as const,
            render: (row: HistoryRecord) => `LKR ${row.unitPrice}`,
        },
        {
            key: 'vatPercent',
            header: 'VAT %',
            align: 'right' as const,
            render: (row: HistoryRecord) => `${row.vatPercent}%`,
        },
        {
            key: 'volume',
            header: 'Volume',
            align: 'right' as const,
            render: (row: HistoryRecord) => `${formatVolume(row.volume)} L`,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right' as const,
            render: (row: HistoryRecord) => (
                <span className="font-semibold text-primary">
                    LKR {formatCurrency(row.total)}
                </span>
            ),
        },
    ];

    const invoiceOptions = availableInvoices.map((inv) => ({
        value: inv.value,
        label: inv.label,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                        Invoice History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Access archived invoices and historical data
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border animate-fade-slide-up">
                <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                        activeTab === 'active'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Invoices
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('deleted')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                        activeTab === 'deleted'
                            ? 'bg-destructive text-destructive-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Deleted Invoices
                </button>
            </div>

            {/* ── ACTIVE TAB ── */}
            {activeTab === 'active' && (
                <>
                    {/* Search Controls */}
                    <div
                        className="card-neumorphic p-6 space-y-6 animate-fade-slide-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SearchableSelect
                                label="Client Name"
                                options={clients}
                                value={filters.client}
                                onChange={(value) =>
                                    setFilters({ ...filters, client: value })
                                }
                            />
                            <SearchableSelect
                                label="Year"
                                options={years}
                                value={filters.year}
                                onChange={(value) =>
                                    setFilters({ ...filters, year: value })
                                }
                            />
                            <SearchableSelect
                                label="Month"
                                options={months}
                                value={filters.month}
                                onChange={(value) =>
                                    setFilters({ ...filters, month: value })
                                }
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleView}
                                className="btn-primary-glow"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'View'}
                            </button>
                        </div>
                    </div>

                    {/* Invoice Selection */}
                    {availableInvoices.length > 0 && (
                        <div
                            className="card-neumorphic p-6 animate-fade-slide-up"
                            style={{ animationDelay: '0.15s' }}
                        >
                            <SearchableSelect
                                label="Select Invoice"
                                options={invoiceOptions}
                                value={selectedInvoice}
                                onChange={handleInvoiceSelect}
                                placeholder="Select an invoice to view details"
                            />
                        </div>
                    )}

                    {/* Metadata Context Bar */}
                    {metadata && (
                        <div
                            className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-wrap items-center gap-6 animate-fade-slide-up"
                            style={{ animationDelay: '0.2s' }}
                        >
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Invoice No
                                </span>
                                <p className="font-semibold text-foreground">
                                    {metadata.invoiceNo}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Invoice Date
                                </span>
                                <p className="font-semibold text-foreground">
                                    {metadata.invoiceDate}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    From Date
                                </span>
                                <p className="font-semibold text-foreground">
                                    {metadata.fromDate}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    To Date
                                </span>
                                <p className="font-semibold text-foreground">
                                    {metadata.toDate}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Historical Data Grid */}
                    {records.length > 0 ? (
                        <div
                            className="space-y-4 animate-fade-slide-up"
                            style={{ animationDelay: '0.25s' }}
                        >
                            <DataGrid
                                columns={columns}
                                data={records}
                                disablePagination={true}
                            />

                            {/* Pagination Bar */}
                            {pagination.total > 0 && (
                                <div className="card-neumorphic p-4">
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
                                                        pagination.current_page - 1,
                                                    )
                                                }
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
                                                    ),
                                                )}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.current_page + 1,
                                                    )
                                                }
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

                            {/* Actions Bar */}
                            <div className="card-neumorphic p-4 flex items-center justify-between gap-4 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    disabled={isCheckingLast}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCheckingLast ? (
                                        <div className="h-4 w-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    {isCheckingLast ? 'Checking…' : 'Delete Invoice'}
                                </button>

                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="w-48">
                                        <SearchableSelect
                                            label="Payment Method"
                                            options={paymentMethods}
                                            value={paymentMethod}
                                            onChange={(value) => setPaymentMethod(value)}
                                            searchable={false}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-medium">
                                            Grand Total:
                                        </span>
                                        <span className="text-2xl font-bold text-primary">
                                            LKR {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        disabled={isGeneratingPdf}
                                        className="btn-success-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingPdf ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Printer className="h-5 w-5" />
                                        )}
                                        {isGeneratingPdf ? 'Generating...' : 'Print'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : availableInvoices.length > 0 && !selectedInvoice ? (
                        <div
                            className="card-neumorphic p-12 text-center animate-fade-slide-up"
                            style={{ animationDelay: '0.25s' }}
                        >
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Select an Invoice
                            </h3>
                            <p className="text-muted-foreground">
                                Choose an invoice from the dropdown above to view its details.
                            </p>
                        </div>
                    ) : null}
                </>
            )}

            {/* ── DELETED TAB ── */}
            {activeTab === 'deleted' && (
                <div className="space-y-4 animate-fade-slide-up">
                    {/* Search Bar */}
                    <div
                        className="card-neumorphic p-4 animate-fade-slide-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by Invoice No or Client…"
                                className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                value={deletedSearch}
                                onChange={(e) => { setDeletedSearch(e.target.value); setDeletedPage(1); }}
                            />
                        </div>
                    </div>

                    {isLoadingDeleted ? (
                        <div className="card-neumorphic p-12 text-center">
                            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-muted-foreground">Loading deleted invoices…</p>
                        </div>
                    ) : filteredDeletedRecords.length === 0 ? (
                        <div className="card-neumorphic p-12 text-center">
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {deletedSearch.trim() ? 'No Results Found' : 'No Deleted Invoices'}
                            </h3>
                            <p className="text-muted-foreground">
                                {deletedSearch.trim() ? 'No deleted invoices match your search.' : 'There are no deleted invoices on record.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card-neumorphic overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-secondary/50">
                                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Invoice No</th>
                                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Client</th>
                                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Deleted At</th>
                                            <th className="px-4 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedDeletedRecords.map((row, i) => (
                                            <tr
                                                key={row.id}
                                                className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${i % 2 === 1 ? 'bg-secondary/10' : ''}`}
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground">{row.taxInvoiceNo}</td>
                                                <td className="px-4 py-3 text-foreground">{row.clientName}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.deletedAt}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        title="View reason"
                                                        onClick={() => setNoteModal({ open: true, reason: row.reasonForDelete })}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                                    >
                                                        <StickyNote className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Deleted Invoices Pagination */}
                    {!isLoadingDeleted && deletedLastPage > 1 && (
                        <div className="card-neumorphic p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                    Showing{' '}
                                    {(deletedPage - 1) * DELETED_PER_PAGE + 1} to{' '}
                                    {Math.min(deletedPage * DELETED_PER_PAGE, filteredDeletedRecords.length)}{' '}
                                    of {filteredDeletedRecords.length} records
                                </div>
                                <div className="flex items-center gap-2 order-1 sm:order-2">
                                    <button
                                        onClick={() => setDeletedPage((p) => Math.max(1, p - 1))}
                                        disabled={deletedPage === 1}
                                        className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: deletedLastPage }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setDeletedPage(page)}
                                                className={`min-w-[2.5rem] h-10 px-3 rounded-lg transition-colors ${
                                                    page === deletedPage
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'border border-border hover:bg-secondary'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setDeletedPage((p) => Math.min(deletedLastPage, p + 1))}
                                        disabled={deletedPage === deletedLastPage}
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

            {/* ── ERROR MODAL (not the last invoice) ── */}
            <AlertDialog open={showErrorModal} onOpenChange={setShowErrorModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Cannot Delete Invoice</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>{errorModalMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorModal(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── CONFIRM DELETE MODAL ── */}
            <AlertDialog
                open={showConfirmDeleteModal}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setShowConfirmDeleteModal(false);
                        setDeleteReason('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            You are about to permanently delete invoice{' '}
                            <span className="font-semibold text-foreground">{metadata?.invoiceNo}</span>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Reason for Deletion <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            maxLength={REASON_MAX_LENGTH}
                            rows={3}
                            placeholder="Enter reason for deletion…"
                            className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                        <p className={`text-xs text-right ${deleteReason.length >= REASON_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {deleteReason.length}/{REASON_MAX_LENGTH}
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isDeleting}
                            onClick={() => setDeleteReason('')}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={!deleteReason.trim() || isDeleting}
                            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── NOTE MODAL (view reason) ── */}
            <AlertDialog
                open={noteModal.open}
                onOpenChange={(open) => { if (!open) setNoteModal({ open: false, reason: '' }); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <StickyNote className="h-5 w-5 text-amber-600" />
                            </div>
                            <AlertDialogTitle>Reason for Deletion</AlertDialogTitle>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogDescription asChild>
                        <p className="text-sm text-foreground bg-secondary/30 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
                            {noteModal.reason}
                        </p>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setNoteModal({ open: false, reason: '' })}>
                            Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
