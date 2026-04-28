import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Pencil,
    Loader2,
} from 'lucide-react';
import { DataGrid } from '@/components/ui/DataGrid';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Link, usePage } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Invoice {
    id: number;
    serialNo: string;
    date: string;
    client: string;
    vehicle: string;
    fuelType: string;
    volume: number;
    total: number;
    deletedAt?: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function ManageInvoices() {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleted, setShowDeleted] = useState(false);
    const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
    const [isEditLoading, setIsEditLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const [clients, setClients] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [vehicles, setVehicles] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [fuelTypes, setFuelTypes] = useState<
        Array<{ value: string; label: string; price: number }>
    >([]);
    const [vatPercentage, setVatPercentage] = useState(0);
    const [fuelPrice, setFuelPrice] = useState(0);
    const [inputMode, setInputMode] = useState<'volume' | 'totalPrice'>(
        'volume',
    );
    const [editFormData, setEditFormData] = useState({
        serialNo: '',
        date: new Date(),
        client: '',
        vehicle: '',
        fuelType: '',
        volume: '',
        totalPrice: '',
    });
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    useEffect(() => {
        fetchInvoices(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showDeleted]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices(1);
        }, 300); // Debounce search
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchInvoices = async (page: number) => {
        setIsLoading(true);
        try {
            const searchParam = search
                ? `&search=${encodeURIComponent(search)}`
                : '';
            const endpoint = showDeleted
                ? `/api/invoice/deleted-list?page=${page}${searchParam}`
                : `/api/invoice/list?page=${page}${searchParam}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            setInvoices(data.data);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
            });
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch invoices',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                const response = await fetch(
                    `/api/invoice/delete/${deleteId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': props.csrf_token,
                        },
                    },
                );

                if (response.ok) {
                    toast({
                        title: 'Invoice Deleted',
                        description:
                            'The invoice has been successfully deleted.',
                    });
                    // Refresh the current page to show updated data
                    fetchInvoices(pagination.current_page);
                } else {
                    toast({
                        title: 'Error',
                        description: 'Failed to delete invoice',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error deleting invoice:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete invoice',
                    variant: 'destructive',
                });
            } finally {
                setDeleteId(null);
            }
        }
    };

    const handleRecover = async (id: number) => {
        try {
            const response = await fetch(`/api/invoice/recover/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
            });

            if (response.ok) {
                toast({
                    title: 'Invoice Recovered',
                    description: 'The invoice has been successfully recovered.',
                });
                // Refresh the current page to show updated data
                fetchInvoices(pagination.current_page);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to recover invoice',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error recovering invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to recover invoice',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = async (id: number) => {
        setEditInvoiceId(id);
        setIsEditLoading(true);
        setIsInitialLoad(true);
        try {
            const response = await fetch(`/api/invoice/details/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
            });

            const data = await response.json();
            if (data.success) {
                console.log('Invoice data received:', data);

                // Ensure data is in array format with string values
                const clientsData = data.clients.map(
                    (c: { value: string | number; label: string }) => ({
                        value: String(c.value),
                        label: c.label,
                    }),
                );
                const vehiclesData = data.vehicles.map(
                    (v: { value: string | number; label: string }) => ({
                        value: String(v.value),
                        label: v.label,
                    }),
                );
                const fuelTypesData = data.fuelTypes.map(
                    (f: {
                        value: string | number;
                        label: string;
                        price: number;
                    }) => ({
                        value: String(f.value),
                        label: f.label,
                        price: f.price,
                    }),
                );

                setClients(clientsData);
                setVehicles(vehiclesData);
                setFuelTypes(fuelTypesData);

                const formData = {
                    serialNo: data.invoice.serialNo,
                    date: new Date(data.invoice.date),
                    client: String(data.invoice.clientId),
                    vehicle: String(data.invoice.vehicleId),
                    fuelType: String(data.invoice.fuelTypeId),
                    volume: data.invoice.volume.toString(),
                    totalPrice: '',
                };

                console.log('Setting form data:', formData);
                console.log('Clients:', clientsData);
                console.log('Vehicles:', vehiclesData);
                console.log('Fuel types:', fuelTypesData);

                setEditFormData(formData);
                setInputMode('volume');

                // Fetch VAT and fuel price for the invoice date
                fetchVatForDate(formData.date);
                fetchFuelPrice(String(data.invoice.fuelTypeId), formData.date);

                // Reset flag after a short delay to allow state to update
                setTimeout(() => setIsInitialLoad(false), 100);
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch invoice details',
                variant: 'destructive',
            });
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editInvoiceId) return;

        setIsEditLoading(true);
        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Calculate all values using centralized function
            const calculatedValues = calculateInvoiceValues({
                inputMode,
                volume: editFormData.volume,
                totalPrice: editFormData.totalPrice,
                fuelPrice,
                vatPercentage,
            });

            const response = await fetch(
                `/api/invoice/update/${editInvoiceId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        serial_no: editFormData.serialNo,
                        date_added: formatDateLocal(editFormData.date),
                        vehicle_id: editFormData.vehicle,
                        fuel_type_id: editFormData.fuelType,
                        volume: calculatedValues.volume,
                        fuel_net_price: calculatedValues.fuelNetPrice,
                        sub_total: calculatedValues.subTotal,
                        vat_percentage: vatPercentage,
                        vat_amount: calculatedValues.vatAmount,
                        total: calculatedValues.total,
                    }),
                },
            );

            const data = await response.json();
            if (data.success) {
                toast({
                    title: 'Invoice Updated',
                    description: 'The invoice has been successfully updated.',
                });
                setEditInvoiceId(null);
                fetchInvoices(pagination.current_page);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update invoice',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to update invoice',
                variant: 'destructive',
            });
        } finally {
            setIsEditLoading(false);
        }
    };

    useEffect(() => {
        if (editFormData.client && editInvoiceId && !isInitialLoad) {
            fetchVehicles(editFormData.client);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editFormData.client]);

    useEffect(() => {
        if (editFormData.vehicle && editInvoiceId && !isInitialLoad) {
            fetchFuelTypes(editFormData.vehicle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editFormData.vehicle]);

    useEffect(() => {
        if (editFormData.fuelType && editInvoiceId && !isInitialLoad) {
            fetchFuelPrice(editFormData.fuelType, editFormData.date);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editFormData.fuelType]);

    // Fetch VAT and fuel price when date changes
    useEffect(() => {
        if (editFormData.date && editInvoiceId && !isInitialLoad) {
            fetchVatForDate(editFormData.date);
            // Re-fetch fuel price if fuel type is selected
            if (editFormData.fuelType) {
                fetchFuelPrice(editFormData.fuelType, editFormData.date);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editFormData.date]);

    const fetchVehicles = async (clientId: string) => {
        try {
            const response = await fetch(`/api/invoice/vehicles/${clientId}`);
            const data = await response.json();
            setVehicles(
                data.vehicles.map(
                    (v: { value: string | number; label: string }) => ({
                        value: String(v.value),
                        label: v.label,
                    }),
                ),
            );
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchFuelTypes = async (vehicleId: string) => {
        try {
            const response = await fetch(
                `/api/invoice/fuel-types/${vehicleId}`,
            );
            const data = await response.json();
            setFuelTypes(
                data.fuelTypes.map(
                    (f: {
                        value: string | number;
                        label: string;
                        price: number;
                    }) => ({
                        value: String(f.value),
                        label: f.label,
                        price: f.price,
                    }),
                ),
            );
        } catch (error) {
            console.error('Error fetching fuel types:', error);
        }
    };

    const fetchFuelPrice = async (fuelTypeId: string, date: Date) => {
        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const invoiceDate = formatDateLocal(date);
            const response = await fetch(
                `/api/invoice/fuel-price/${fuelTypeId}?invoice_date=${invoiceDate}`,
            );
            const data = await response.json();

            if (data.error) {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
                setFuelPrice(0);
            } else {
                setFuelPrice(data.price);
            }
        } catch (error) {
            console.error('Error fetching fuel price:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch fuel price',
                variant: 'destructive',
            });
        }
    };

    const fetchVatForDate = async (date: Date) => {
        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const invoiceDate = formatDateLocal(date);
            const response = await fetch(
                `/api/invoice/vat?invoice_date=${invoiceDate}`,
            );
            const data = await response.json();

            if (data.error) {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
                setVatPercentage(0);
            } else {
                setVatPercentage(data.vatPercentage);
            }
        } catch (error) {
            console.error('Error fetching VAT:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch VAT percentage',
                variant: 'destructive',
            });
        }
    };

    // Centralized calculation function
    const calculateInvoiceValues = (params: {
        inputMode: 'volume' | 'totalPrice';
        volume: string;
        totalPrice: string;
        fuelPrice: number;
        vatPercentage: number;
    }) => {
        const { inputMode, volume, totalPrice, fuelPrice, vatPercentage } = params;

        // Calculate and round base prices (2 decimal places)
        const fuelNetPrice = Math.round((fuelPrice / (100 + vatPercentage) * 100) * 100) / 100;
        const vatAmountPerLiter = Math.round((fuelPrice / (100 + vatPercentage) * vatPercentage) * 100) / 100;

        let calculatedVolume = 0;
        let calculatedTotal = 0;
        let calculatedSubTotal = 0;
        let calculatedVatAmount = 0;

        if (inputMode === 'volume') {
            // Calculate from volume
            calculatedVolume = parseFloat(volume) || 0;
            calculatedTotal = Math.round(fuelPrice * calculatedVolume * 100) / 100;
            calculatedSubTotal = Math.round(fuelNetPrice * calculatedVolume * 100) / 100;
            calculatedVatAmount = Math.round(vatAmountPerLiter * calculatedVolume * 100) / 100;
        } else {
            // Calculate from total price
            calculatedTotal = parseFloat(totalPrice) || 0;
            calculatedVolume = fuelPrice > 0 ? Math.round((calculatedTotal / fuelPrice) * 1000) / 1000 : 0;
            calculatedSubTotal = Math.round((fuelNetPrice * calculatedVolume) * 100) / 100;
            calculatedVatAmount = Math.round((vatAmountPerLiter * calculatedVolume) * 100) / 100;
        }

        // Return rounded values
        return {
            volume: calculatedVolume,        // Already rounded to 3 decimal places
            total: calculatedTotal,          // Already rounded to 2 decimal places
            subTotal: calculatedSubTotal,    // Already rounded to 2 decimal places
            vatAmount: calculatedVatAmount,  // Already rounded to 2 decimal places
            fuelNetPrice: fuelNetPrice,      // Already rounded to 2 decimal places
        };
    };

    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatVolume = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchInvoices(newPage);
        }
    };

    // Generate page numbers with ellipsis for responsive display
    const getPageNumbers = () => {
        const { current_page, last_page } = pagination;
        const pages: (number | string)[] = [];

        if (last_page <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (current_page > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, current_page - 1);
            const end = Math.min(last_page - 1, current_page + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current_page < last_page - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(last_page);
        }

        return pages;
    };

    const columns = [
        { key: 'serialNo', header: 'Serial No', sortable: true },
        { key: 'date', header: 'Date', sortable: true },
        { key: 'client', header: 'Client', sortable: true },
        { key: 'vehicle', header: 'Vehicle', sortable: true },
        {
            key: 'fuelType',
            header: 'Fuel',
            render: (row: Invoice) => (
                <span className="text-sm font-medium">{row.fuelType}</span>
            ),
        },
        {
            key: 'volume',
            header: 'Volume (L)',
            align: 'right' as const,
            sortable: true,
            render: (row: Invoice) => formatVolume(row.volume),
        },
        {
            key: 'total',
            header: 'Total (LKR)',
            align: 'right' as const,
            sortable: true,
            render: (row: Invoice) => (
                <span className="font-semibold text-primary">
                    {formatCurrency(row.total)}
                </span>
            ),
        },
        ...(showDeleted
            ? [
                {
                    key: 'deletedAt',
                    header: 'Deleted At',
                    sortable: true,
                    render: (row: Invoice) => row.deletedAt || 'N/A',
                },
            ]
            : []),
        {
            key: 'actions',
            header: 'Actions',
            align: 'center' as const,
            render: (row: Invoice) =>
                showDeleted ? (
                    <button
                        type="button"
                        className="p-2 rounded-lg text-green-600 hover:bg-green-600/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRecover(row.id);
                        }}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row.id);
                            }}
                            title="Edit Invoice"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(row.id);
                            }}
                            title="Delete Invoice"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-slide-up">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                        {showDeleted
                            ? 'Deleted Invoices'
                            : 'Manage Daily Invoice'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {showDeleted
                            ? 'View and Recover Deleted Daily Invoices'
                            : 'View, Edit and Delete Daily Invoices'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowDeleted(!showDeleted)}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-white active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${showDeleted
                            ? 'btn-primary-glow flex items-center gap-2 w-fit'
                            : 'btn-danger-glow flex items-center gap-2 w-fit'
                            }`}
                    >
                        {showDeleted ? 'Show Active' : 'Show Deleted'}
                    </button>
                    {!showDeleted && (
                        <Link
                            href="/"
                            className="btn-primary-glow flex items-center gap-2 w-fit"
                        >
                            <Plus className="h-5 w-5" />
                            Create New Invoice
                        </Link>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div
                className="card-neumorphic p-4 animate-fade-slide-up"
                style={{ animationDelay: '0.1s' }}
            >
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by serial no, client, or vehicle..."
                        className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Grid */}
            <div
                className="animate-fade-slide-up"
                style={{ animationDelay: '0.2s' }}
            >
                <DataGrid
                    columns={columns}
                    data={invoices}
                    emptyMessage={
                        isLoading
                            ? 'Loading invoices...'
                            : showDeleted
                                ? 'No deleted invoices found'
                                : 'No invoices found — try adjusting your search.'
                    }
                    disablePagination={true}
                />
            </div>

            {/* Pagination */}
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
                                pagination.current_page * pagination.per_page,
                                pagination.total,
                            )}{' '}
                            of {pagination.total} invoices
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
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) =>
                                    typeof page === 'number' ? (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            className={`min-w-[2.5rem] h-10 px-3 rounded-lg transition-colors ${page === pagination.current_page
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
                                        pagination.current_page + 1,
                                    )
                                }
                                disabled={
                                    pagination.current_page ===
                                    pagination.last_page
                                }
                                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            <Dialog
                open={!!editInvoiceId}
                onOpenChange={() => {
                    setEditInvoiceId(null);
                    setIsInitialLoad(false);
                    setInputMode('volume');
                }}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Edit Daily Invoice
                        </DialogTitle>
                    </DialogHeader>
                    {isEditLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {/* Primary Identity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingInput
                                    label="Serial No"
                                    value={editFormData.serialNo}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            serialNo: e.target.value,
                                        })
                                    }
                                    placeholder=""
                                />
                                <DatePickerField
                                    label="Date"
                                    value={editFormData.date}
                                    onChange={(date) =>
                                        setEditFormData({
                                            ...editFormData,
                                            date: date || new Date(),
                                        })
                                    }
                                />
                            </div>

                            {/* Selection Group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableSelect
                                    label="Client Name"
                                    options={clients}
                                    value={editFormData.client}
                                    onChange={(value) =>
                                        setEditFormData({
                                            ...editFormData,
                                            client: value,
                                            vehicle: '',
                                            fuelType: '',
                                        })
                                    }
                                    placeholder="Select client"
                                />
                                <SearchableSelect
                                    label="Vehicle No"
                                    options={vehicles}
                                    value={editFormData.vehicle}
                                    onChange={(value) =>
                                        setEditFormData({
                                            ...editFormData,
                                            vehicle: value,
                                            fuelType: '',
                                        })
                                    }
                                    placeholder="Select vehicle"
                                    disabled={
                                        !editFormData.client ||
                                        vehicles.length === 0
                                    }
                                />
                            </div>

                            {/* Fuel Type Selection */}
                            <SearchableSelect
                                label="Fuel Type"
                                options={fuelTypes}
                                value={editFormData.fuelType}
                                onChange={(value) =>
                                    setEditFormData({
                                        ...editFormData,
                                        fuelType: value,
                                    })
                                }
                                placeholder="Select fuel type"
                                disabled={
                                    !editFormData.vehicle ||
                                    fuelTypes.length === 0
                                }
                                searchable={false}
                            />

                            {/* Input Mode Toggle */}
                            <div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Input Method
                                    </label>
                                    <ToggleGroup
                                        type="single"
                                        value={inputMode}
                                        onValueChange={(
                                            value: 'volume' | 'totalPrice',
                                        ) => {
                                            if (value) {
                                                setInputMode(value);
                                                setEditFormData({
                                                    ...editFormData,
                                                    volume: '',
                                                    totalPrice: '',
                                                });
                                            }
                                        }}
                                        className="justify-start"
                                    >
                                        <ToggleGroupItem
                                            value="volume"
                                            className="px-4 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                                        >
                                            Volume
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="totalPrice"
                                            className="px-4 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                                        >
                                            Total Price
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </div>
                            </div>

                            {/* Volume and Total Price Inputs - Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingInput
                                    label="Volume (Liters)"
                                    type="number"
                                    step="0.001"
                                    value={editFormData.volume}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        if (value.includes('.')) {
                                            const [intPart, decPart] =
                                                value.split('.');
                                            value =
                                                intPart +
                                                '.' +
                                                decPart.slice(0, 3);
                                        }
                                        setEditFormData({
                                            ...editFormData,
                                            volume: value,
                                        });
                                    }}
                                    disabled={inputMode === 'totalPrice'}
                                    className={
                                        inputMode === 'volume'
                                            ? 'border-2 border-primary/30 focus:border-primary'
                                            : ''
                                    }
                                />
                                <FloatingInput
                                    label="Total Price (LKR)"
                                    type="number"
                                    step="0.01"
                                    value={editFormData.totalPrice}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        if (value.includes('.')) {
                                            const [intPart, decPart] =
                                                value.split('.');
                                            value =
                                                intPart +
                                                '.' +
                                                decPart.slice(0, 2);
                                        }
                                        setEditFormData({
                                            ...editFormData,
                                            totalPrice: value,
                                        });
                                    }}
                                    disabled={inputMode === 'volume'}
                                    className={
                                        inputMode === 'totalPrice'
                                            ? 'border-2 border-primary/30 focus:border-primary'
                                            : ''
                                    }
                                />
                            </div>

                            {/* Financial Summary */}
                            {((inputMode === 'volume' && editFormData.volume) ||
                                (inputMode === 'totalPrice' &&
                                    editFormData.totalPrice)) &&
                                (() => {
                                    // Use centralized calculation function
                                    const calculatedValues = calculateInvoiceValues({
                                        inputMode,
                                        volume: editFormData.volume,
                                        totalPrice: editFormData.totalPrice,
                                        fuelPrice,
                                        vatPercentage,
                                    });

                                    return (
                                        <div className="bg-secondary/30 rounded-xl p-4 space-y-2 border border-border/50">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Financial Summary
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">
                                                        Volume
                                                    </span>
                                                    <span className="font-medium">
                                                        {formatVolume(calculatedValues.volume)} L
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">
                                                        Fuel Net Price
                                                    </span>
                                                    <span className="font-medium">
                                                        LKR{' '}
                                                        {formatCurrency(
                                                            calculatedValues.fuelNetPrice,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">
                                                        Sub Total
                                                    </span>
                                                    <span className="font-medium">
                                                        LKR{' '}
                                                        {formatCurrency(
                                                            calculatedValues.subTotal,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">
                                                        VAT (
                                                        {Number(
                                                            vatPercentage,
                                                        ).toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                        %)
                                                    </span>
                                                    <span className="font-medium">
                                                        LKR{' '}
                                                        {formatCurrency(
                                                            calculatedValues.vatAmount,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="pt-2 border-t border-border">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-foreground text-sm">
                                                            Total
                                                        </span>
                                                        <span className="text-lg font-bold text-foreground">
                                                            LKR{' '}
                                                            {formatCurrency(
                                                                calculatedValues.total,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditInvoiceId(null)}
                                    className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={
                                        isEditLoading ||
                                        !editFormData.client ||
                                        !editFormData.vehicle ||
                                        (inputMode === 'volume' &&
                                            !editFormData.volume) ||
                                        (inputMode === 'totalPrice' &&
                                            !editFormData.totalPrice) ||
                                        !editFormData.serialNo
                                    }
                                    className="btn-primary-glow flex items-center gap-2"
                                >
                                    {isEditLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Invoice'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
            >
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this invoice? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
