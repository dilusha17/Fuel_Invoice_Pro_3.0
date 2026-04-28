import { useState, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    ShoppingCart,
    Loader2,
    Check,
    Save,
    RotateCcw,
    Truck,
    FileText,
    Hash,
    Layers,
    Droplets,
    Tag,
    Calculator,
    BadgeMinus,
    Percent,
    Receipt,
} from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';

interface FuelTypeOption {
    value: string;
    label: string;
    price: number;
}

interface PurchaseProps {
    supplierName: string;
    fuelCategories: { value: string; label: string }[];
    currentVat: { percentage: number };
}

const initialFormState = (supplierName: string) => ({
    invoiceNumber: '',
    date: new Date(),
    selectedCategoryId: '',
    selectedFuelTypeId: '',
    volume: '',
    unitPrice: '',
    discount: '',
});

export default function Purchase({
    supplierName,
    fuelCategories,
    currentVat,
}: PurchaseProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();

    // Form state
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState<Date>(new Date());
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedFuelTypeId, setSelectedFuelTypeId] = useState('');
    const [fuelTypeOptions, setFuelTypeOptions] = useState<FuelTypeOption[]>([]);
    const [volume, setVolume] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [discountDisplay, setDiscountDisplay] = useState('');

    // Loading / success states
    const [isLoadingFuelTypes, setIsLoadingFuelTypes] = useState(false);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Computed values
    const vatRate = currentVat.percentage;

    const amount = useMemo(() => {
        const v = parseFloat(volume) || 0;
        const u = parseFloat(unitPrice) || 0;
        return v * u;
    }, [volume, unitPrice]);

    const invoiceAmount = useMemo(() => {
        const d = parseFloat(discount) || 0;
        return Math.max(0, amount - d);
    }, [amount, discount]);

    const vatAmount = useMemo(() => {
        if (vatRate <= 0) return 0;
        return (invoiceAmount * vatRate) / (100 + vatRate);
    }, [invoiceAmount, vatRate]);

    const netAmount = useMemo(() => {
        if (vatRate <= 0) return invoiceAmount;
        return (invoiceAmount * 100) / (100 + vatRate);
    }, [invoiceAmount, vatRate]);

    const fmt = (v: number) =>
        v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDateLocal = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Load fuel types when category changes
    useEffect(() => {
        if (!selectedCategoryId) {
            setFuelTypeOptions([]);
            setSelectedFuelTypeId('');
            setUnitPrice('');
            return;
        }

        setIsLoadingFuelTypes(true);
        setSelectedFuelTypeId('');
        setUnitPrice('');

        fetch(`/api/purchase/fuel-types/${selectedCategoryId}`)
            .then((r) => r.json())
            .then((data: FuelTypeOption[]) => {
                setFuelTypeOptions(data);
            })
            .catch(() => {
                toast({ title: 'Error', description: 'Failed to load fuel types', variant: 'destructive' });
                setFuelTypeOptions([]);
            })
            .finally(() => setIsLoadingFuelTypes(false));
    }, [selectedCategoryId]);

    // Fetch fuel price from fuel_price_history when fuel type or date changes
    useEffect(() => {
        if (!selectedFuelTypeId || !date) {
            setUnitPrice('');
            return;
        }

        setIsLoadingPrice(true);
        setUnitPrice('');

        fetch(`/api/purchase/fuel-price/${selectedFuelTypeId}?purchase_date=${formatDateLocal(date)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.price !== undefined) {
                    setUnitPrice(String(data.price));
                } else {
                    toast({
                        title: 'No Price Found',
                        description: 'No fuel price is configured for this fuel type on the selected date.',
                        variant: 'destructive',
                    });
                }
            })
            .catch(() => {
                toast({ title: 'Error', description: 'Failed to load fuel price', variant: 'destructive' });
            })
            .finally(() => setIsLoadingPrice(false));
    }, [selectedFuelTypeId, date]);

    const handleFuelTypeChange = (value: string) => {
        setSelectedFuelTypeId(value);
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        setDiscount(raw);
        setDiscountDisplay(raw);
    };

    const handleDiscountBlur = () => {
        const val = parseFloat(discount) || 0;
        setDiscountDisplay(val > 0 ? fmt(val) : '');
    };

    const handleDiscountFocus = () => {
        setDiscountDisplay(discount);
    };

    const resetForm = () => {
        setInvoiceNumber('');
        setDate(new Date());
        setSelectedCategoryId('');
        setSelectedFuelTypeId('');
        setFuelTypeOptions([]);
        setVolume('');
        setUnitPrice('');
        setDiscount('');
        setDiscountDisplay('');
    };

    const handleSubmit = async () => {
        if (!date || !selectedCategoryId || !selectedFuelTypeId || !volume || !unitPrice) {
            toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/purchase/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    supplier_name: supplierName,
                    invoice_number: invoiceNumber,
                    date: formatDateLocal(date),
                    fuel_category_id: parseInt(selectedCategoryId),
                    fuel_type_id: parseInt(selectedFuelTypeId),
                    volume: Math.round(parseFloat(volume) * 100) / 100,
                    unit_price: Math.round(parseFloat(unitPrice) * 100) / 100,
                    amount: Math.round(amount * 100) / 100,
                    discount: Math.round((parseFloat(discount) || 0) * 100) / 100,
                    invoice_amount: Math.round(invoiceAmount * 100) / 100,
                    vat_percentage: Math.round(vatRate * 100) / 100,
                    vat_amount: Math.round(vatAmount * 100) / 100,
                    net_amount: Math.round(netAmount * 100) / 100,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({ title: 'Purchase Saved', description: 'Purchase record saved successfully' });
                setSubmitSuccess(true);
                setTimeout(() => setSubmitSuccess(false), 2000);
                resetForm();
            } else {
                toast({ title: 'Error', description: data.message || 'Failed to save purchase record', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to save purchase record', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Purchase</h1>
                        <p className="text-muted-foreground mt-1">Enter fuel purchase details</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Form */}
                <div
                    className="xl:col-span-2 card-neumorphic p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.1s' }}
                >
                    <h2 className="text-lg font-semibold text-foreground mb-6">Purchase Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Supplier Name — disabled */}
                        <div className="md:col-span-2">
                            <FloatingInput
                                label="Supplier Name"
                                type="text"
                                value={supplierName}
                                disabled
                                icon={<Truck className="h-4 w-4" />}
                            />
                        </div>

                        {/* Invoice Number */}
                        <FloatingInput
                            label="Invoice Number"
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            icon={<Hash className="h-4 w-4" />}
                        />

                        {/* Date */}
                        <DatePickerField
                            label="Date"
                            value={date}
                            onChange={(d) => d && setDate(d)}
                            placeholder="Select date"
                        />

                        {/* Fuel Category */}
                        <SearchableSelect
                            label="Fuel Category"
                            options={fuelCategories}
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                            placeholder="Select fuel category"
                        />

                        {/* Fuel Type */}
                        <SearchableSelect
                            label={isLoadingFuelTypes ? 'Loading...' : 'Fuel Type'}
                            options={fuelTypeOptions}
                            value={selectedFuelTypeId}
                            onChange={handleFuelTypeChange}
                            placeholder="Select fuel type"
                            disabled={!selectedCategoryId || isLoadingFuelTypes}
                        />

                        {/* Volume */}
                        <FloatingInput
                            label="Volume (Liters)"
                            type="number"
                            step="0.001"
                            min="0"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            icon={<Droplets className="h-4 w-4" />}
                        />

                        {/* Unit Price */}
                        <FloatingInput
                            label={isLoadingPrice ? 'Loading price...' : 'Unit Price (LKR)'}
                            type="number"
                            step="0.01"
                            min="0"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            disabled={isLoadingPrice}
                            icon={isLoadingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                        />

                        {/* Amount — computed */}
                        <div className="md:col-span-2">
                            <FloatingInput
                                label="Amount (LKR)"
                                type="text"
                                value={amount > 0 ? fmt(amount) : ''}
                                disabled
                                icon={<Calculator className="h-4 w-4" />}
                            />
                        </div>

                        {/* Discount */}
                        <div className="md:col-span-2">
                            <FloatingInput
                                label="Discount (LKR)"
                                type="text"
                                inputMode="decimal"
                                value={discountDisplay}
                                onChange={handleDiscountChange}
                                onFocus={handleDiscountFocus}
                                onBlur={handleDiscountBlur}
                                icon={<BadgeMinus className="h-4 w-4" />}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedCategoryId || !selectedFuelTypeId || !volume || !unitPrice}
                            className="btn-success-glow flex-1 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : submitSuccess ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Save Purchase
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="btn-secondary flex items-center justify-center gap-2 px-4"
                        >
                            <RotateCcw className="h-5 w-5" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Summary Card */}
                <div
                    className="card-neumorphic-elevated p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.2s' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">VAT Summary</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Current VAT Rate */}
                        <div className="bg-secondary/50 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">VAT Rate</span>
                                <span className="font-semibold">{vatRate}%</span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-medium">LKR {fmt(amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="font-medium text-destructive">
                                    - LKR {fmt(parseFloat(discount) || 0)}
                                </span>
                            </div>

                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between text-sm font-semibold mb-2">
                                    <span className="text-foreground">Invoice Amount</span>
                                    <span>LKR {fmt(invoiceAmount)}</span>
                                </div>
                            </div>

                            <div className="bg-warning/10 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Net Amount</span>
                                    <span className="font-semibold text-foreground">
                                        LKR {fmt(netAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">VAT Amount ({vatRate}%)</span>
                                    <span className="font-medium text-warning">
                                        LKR {fmt(vatAmount)}
                                    </span>
                                </div>
                            </div>

                            {/* Computed Fields (read-only display) */}
                            <div className="space-y-2 pt-2">
                                <FloatingInput
                                    label="Invoice Amount (LKR)"
                                    type="text"
                                    value={invoiceAmount > 0 ? fmt(invoiceAmount) : ''}
                                    disabled
                                    icon={<FileText className="h-4 w-4" />}
                                />
                                <FloatingInput
                                    label="VAT Amount (LKR)"
                                    type="text"
                                    value={vatAmount > 0 ? fmt(vatAmount) : ''}
                                    disabled
                                    icon={<Percent className="h-4 w-4" />}
                                />
                                <FloatingInput
                                    label="Net Amount (LKR)"
                                    type="text"
                                    value={netAmount > 0 ? fmt(netAmount) : ''}
                                    disabled
                                    icon={<Layers className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
