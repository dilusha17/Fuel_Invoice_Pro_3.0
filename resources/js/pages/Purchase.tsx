import { useState, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    ShoppingCart,
    Loader2,
    Check,
    Save,
    RotateCcw,
    FileText,
    Hash,
    Layers,
    Droplets,
    Tag,
    Calculator,
    BadgeMinus,
    Percent,
    Receipt,
    Plus,
    Trash2,
} from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';

interface FuelTypeOption {
    value: string;
    label: string;
    price: number;
}

interface SupplierOption {
    value: string;
    label: string;
}

interface LubricantTypeOption {
    value: string;
    label: string;
}

interface PurchaseProps {
    fuelCategories: { value: string; label: string }[];
    fuelSuppliers: SupplierOption[];
    lubricantSuppliers: SupplierOption[];
    lubricantTypes: LubricantTypeOption[];
    currentVat: { percentage: number };
}

interface LubricantItem {
    key: string;
    lubricantTypeId: string;
    quantity: string;
    unitPrice: string;
}

const emptyLubricantItem = (): LubricantItem => ({
    key: Math.random().toString(36).slice(2),
    lubricantTypeId: '',
    quantity: '',
    unitPrice: '',
});

export default function Purchase({
    fuelCategories,
    fuelSuppliers,
    lubricantSuppliers,
    lubricantTypes,
    currentVat,
}: PurchaseProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();

    const vatRate = currentVat.percentage;

    // Purchase type toggle
    const [purchaseType, setPurchaseType] = useState<'fuel' | 'lubricant'>('fuel');

    // ---- Fuel Purchase form state ----
    const [fuelSupplierId, setFuelSupplierId] = useState(fuelSuppliers[0]?.value || '');
    const [taxInvoiceNo, setTaxInvoiceNo] = useState('');
    const [date, setDate] = useState<Date>(new Date());
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedFuelTypeId, setSelectedFuelTypeId] = useState('');
    const [fuelTypeOptions, setFuelTypeOptions] = useState<FuelTypeOption[]>([]);
    const [volume, setVolume] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [discountDisplay, setDiscountDisplay] = useState('');
    const [evaAllowance, setEvaAllowance] = useState('');
    const [evaAllowanceDisplay, setEvaAllowanceDisplay] = useState('');

    const [isLoadingFuelTypes, setIsLoadingFuelTypes] = useState(false);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const amount = useMemo(() => {
        const v = parseFloat(volume) || 0;
        const u = parseFloat(unitPrice) || 0;
        return v * u;
    }, [volume, unitPrice]);

    const invoiceAmount = useMemo(() => {
        const d = parseFloat(discount) || 0;
        const eva = parseFloat(evaAllowance) || 0;
        return Math.max(0, amount - d - eva);
    }, [amount, discount, evaAllowance]);

    const vatAmount = useMemo(() => {
        if (vatRate <= 0) return 0;
        return (invoiceAmount * vatRate) / (100 + vatRate);
    }, [invoiceAmount, vatRate]);

    const netAmount = useMemo(() => {
        if (vatRate <= 0) return invoiceAmount;
        return (invoiceAmount * 100) / (100 + vatRate);
    }, [invoiceAmount, vatRate]);

    // ---- Lubricant Purchase form state ----
    const [lubricantSupplierId, setLubricantSupplierId] = useState(
        lubricantSuppliers[0]?.value || '',
    );
    const [lubricantTaxInvoiceNo, setLubricantTaxInvoiceNo] = useState('');
    const [lubricantDate, setLubricantDate] = useState<Date>(new Date());
    const [lubricantItems, setLubricantItems] = useState<LubricantItem[]>([
        emptyLubricantItem(),
    ]);
    const [isSubmittingLubricant, setIsSubmittingLubricant] = useState(false);
    const [lubricantSubmitSuccess, setLubricantSubmitSuccess] = useState(false);

    const lubricantItemAmounts = useMemo(
        () =>
            lubricantItems.map((item) => {
                const q = parseFloat(item.quantity) || 0;
                const u = parseFloat(item.unitPrice) || 0;
                return q * u;
            }),
        [lubricantItems],
    );

    const lubricantNetAmount = useMemo(
        () => lubricantItemAmounts.reduce((sum, a) => sum + a, 0),
        [lubricantItemAmounts],
    );

    // VAT Amount and Total are manually editable, but auto-suggested whenever
    // the net amount (or VAT rate) changes.
    const [lubricantVatAmount, setLubricantVatAmount] = useState('');
    const [lubricantTotalAmount, setLubricantTotalAmount] = useState('');

    useEffect(() => {
        const computedVat = vatRate > 0 ? (lubricantNetAmount * vatRate) / 100 : 0;
        const computedTotal = lubricantNetAmount + computedVat;
        setLubricantVatAmount(computedVat > 0 ? computedVat.toFixed(2) : '');
        setLubricantTotalAmount(computedTotal > 0 ? computedTotal.toFixed(2) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lubricantNetAmount, vatRate]);

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

    const handleEvaAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        setEvaAllowance(raw);
        setEvaAllowanceDisplay(raw);
    };

    const handleEvaAllowanceBlur = () => {
        const val = parseFloat(evaAllowance) || 0;
        setEvaAllowanceDisplay(val > 0 ? fmt(val) : '');
    };

    const handleEvaAllowanceFocus = () => {
        setEvaAllowanceDisplay(evaAllowance);
    };

    const resetForm = () => {
        setFuelSupplierId(fuelSuppliers[0]?.value || '');
        setTaxInvoiceNo('');
        setDate(new Date());
        setSelectedCategoryId('');
        setSelectedFuelTypeId('');
        setFuelTypeOptions([]);
        setVolume('');
        setUnitPrice('');
        setDiscount('');
        setDiscountDisplay('');
        setEvaAllowance('');
        setEvaAllowanceDisplay('');
    };

    const handleSubmit = async () => {
        if (!fuelSupplierId || !date || !selectedCategoryId || !selectedFuelTypeId || !volume || !unitPrice) {
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
                    supplier_id: parseInt(fuelSupplierId),
                    tax_invoice_no: taxInvoiceNo,
                    date: formatDateLocal(date),
                    fuel_category_id: parseInt(selectedCategoryId),
                    fuel_type_id: parseInt(selectedFuelTypeId),
                    volume: Math.round(parseFloat(volume) * 100) / 100,
                    unit_price: Math.round(parseFloat(unitPrice) * 100) / 100,
                    amount: Math.round(amount * 100) / 100,
                    discount: Math.round((parseFloat(discount) || 0) * 100) / 100,
                    eva_allowance: Math.round((parseFloat(evaAllowance) || 0) * 100) / 100,
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

    // ---- Lubricant item handlers ----
    const handleAddLubricantItem = () => {
        setLubricantItems((prev) => [...prev, emptyLubricantItem()]);
    };

    const handleRemoveLubricantItem = (key: string) => {
        setLubricantItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
    };

    const handleLubricantItemChange = (
        key: string,
        field: 'lubricantTypeId' | 'quantity' | 'unitPrice',
        value: string,
    ) => {
        setLubricantItems((prev) =>
            prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
        );
    };

    const resetLubricantForm = () => {
        setLubricantSupplierId(lubricantSuppliers[0]?.value || '');
        setLubricantTaxInvoiceNo('');
        setLubricantDate(new Date());
        setLubricantItems([emptyLubricantItem()]);
    };

    const isLubricantFormValid =
        !!lubricantSupplierId &&
        !!lubricantDate &&
        lubricantItems.length > 0 &&
        lubricantItems.every(
            (item) => item.lubricantTypeId && parseFloat(item.quantity) > 0 && parseFloat(item.unitPrice) >= 0,
        );

    const handleSubmitLubricant = async () => {
        if (!isLubricantFormValid) {
            toast({
                title: 'Validation Error',
                description: 'Please fill all required fields for every lubricant item',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmittingLubricant(true);

        try {
            const response = await fetch('/api/purchase/store-lubricant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    supplier_id: parseInt(lubricantSupplierId),
                    tax_invoice_no: lubricantTaxInvoiceNo,
                    date: formatDateLocal(lubricantDate),
                    vat_percentage: Math.round(vatRate * 100) / 100,
                    vat_amount: Math.round((parseFloat(lubricantVatAmount) || 0) * 100) / 100,
                    total_amount: Math.round((parseFloat(lubricantTotalAmount) || 0) * 100) / 100,
                    items: lubricantItems.map((item) => ({
                        lubricant_type_id: parseInt(item.lubricantTypeId),
                        quantity: Math.round(parseFloat(item.quantity) * 1000) / 1000,
                        unit_price: Math.round(parseFloat(item.unitPrice) * 100) / 100,
                    })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({ title: 'Purchase Saved', description: 'Lubricant purchase record saved successfully' });
                setLubricantSubmitSuccess(true);
                setTimeout(() => setLubricantSubmitSuccess(false), 2000);
                resetLubricantForm();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to save lubricant purchase record',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save lubricant purchase record',
                variant: 'destructive',
            });
        } finally {
            setIsSubmittingLubricant(false);
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
                        <p className="text-muted-foreground mt-1">Enter fuel or lubricant purchase details</p>
                    </div>
                </div>
            </div>

            {/* Purchase Type Toggle */}
            <div className="card-neumorphic p-4 animate-fade-slide-up" style={{ animationDelay: '0.05s' }}>
                <ToggleGroup
                    type="single"
                    value={purchaseType}
                    onValueChange={(value: 'fuel' | 'lubricant') => {
                        if (value) setPurchaseType(value);
                    }}
                    className="justify-start"
                >
                    <ToggleGroupItem
                        value="fuel"
                        className="px-6 py-2.5 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                    >
                        Fuel Purchase
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="lubricant"
                        className="px-6 py-2.5 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                    >
                        Lubricant Purchase
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {purchaseType === 'fuel' ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div
                        className="xl:col-span-2 card-neumorphic p-6 animate-fade-slide-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <h2 className="text-lg font-semibold text-foreground mb-6">Fuel Purchase Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Supplier */}
                            <div className="md:col-span-2">
                                <SearchableSelect
                                    label="Supplier Name"
                                    options={fuelSuppliers}
                                    value={fuelSupplierId}
                                    onChange={setFuelSupplierId}
                                    placeholder="Select supplier"
                                />
                            </div>

                            {/* Tax Invoice Number */}
                            <FloatingInput
                                label="Tax Invoice Number"
                                type="text"
                                value={taxInvoiceNo}
                                onChange={(e) => setTaxInvoiceNo(e.target.value)}
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

                            {/* EVA. Allowance */}
                            <FloatingInput
                                label="EVA. Allowance (LKR)"
                                type="text"
                                inputMode="decimal"
                                value={evaAllowanceDisplay}
                                onChange={handleEvaAllowanceChange}
                                onFocus={handleEvaAllowanceFocus}
                                onBlur={handleEvaAllowanceBlur}
                                icon={<BadgeMinus className="h-4 w-4" />}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !fuelSupplierId || !selectedCategoryId || !selectedFuelTypeId || !volume || !unitPrice}
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
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">EVA. Allowance</span>
                                    <span className="font-medium text-destructive">
                                        - LKR {fmt(parseFloat(evaAllowance) || 0)}
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
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div
                        className="xl:col-span-2 card-neumorphic p-6 animate-fade-slide-up space-y-6"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-6">
                                Lubricant Purchase Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <SearchableSelect
                                        label="Supplier Name"
                                        options={lubricantSuppliers}
                                        value={lubricantSupplierId}
                                        onChange={setLubricantSupplierId}
                                        placeholder="Select supplier"
                                    />
                                </div>

                                <FloatingInput
                                    label="Tax Invoice Number"
                                    type="text"
                                    value={lubricantTaxInvoiceNo}
                                    onChange={(e) => setLubricantTaxInvoiceNo(e.target.value)}
                                    icon={<Hash className="h-4 w-4" />}
                                />

                                <DatePickerField
                                    label="Date"
                                    value={lubricantDate}
                                    onChange={(d) => d && setLubricantDate(d)}
                                    placeholder="Select date"
                                />
                            </div>
                        </div>

                        {/* Lubricant Items */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-foreground">Lubricant Items</h3>
                                <button
                                    type="button"
                                    onClick={handleAddLubricantItem}
                                    className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {lubricantItems.map((item, index) => (
                                    <div
                                        key={item.key}
                                        className="bg-secondary/30 rounded-xl p-4 border border-border/50"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Item {index + 1}
                                            </span>
                                            {lubricantItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLubricantItem(item.key)}
                                                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="md:col-span-2">
                                                <SearchableSelect
                                                    label="Lubricant Type"
                                                    options={lubricantTypes}
                                                    value={item.lubricantTypeId}
                                                    onChange={(value) =>
                                                        handleLubricantItemChange(item.key, 'lubricantTypeId', value)
                                                    }
                                                    placeholder="Select lubricant"
                                                />
                                            </div>

                                            <FloatingInput
                                                label="Quantity"
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleLubricantItemChange(item.key, 'quantity', e.target.value)
                                                }
                                                icon={<Droplets className="h-4 w-4" />}
                                            />

                                            <FloatingInput
                                                label="Unit Price (Net) (LKR)"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unitPrice}
                                                onChange={(e) =>
                                                    handleLubricantItemChange(item.key, 'unitPrice', e.target.value)
                                                }
                                                icon={<Tag className="h-4 w-4" />}
                                            />

                                            <div className="md:col-span-2">
                                                <FloatingInput
                                                    label="Amount (LKR)"
                                                    type="text"
                                                    value={
                                                        lubricantItemAmounts[index] > 0
                                                            ? fmt(lubricantItemAmounts[index])
                                                            : ''
                                                    }
                                                    disabled
                                                    icon={<Calculator className="h-4 w-4" />}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSubmitLubricant}
                                disabled={isSubmittingLubricant || !isLubricantFormValid}
                                className="btn-success-glow flex-1 flex items-center justify-center gap-2"
                            >
                                {isSubmittingLubricant ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : lubricantSubmitSuccess ? (
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
                                onClick={resetLubricantForm}
                                disabled={isSubmittingLubricant}
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
                            <div className="bg-secondary/50 rounded-xl p-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">VAT Rate</span>
                                    <span className="font-semibold">{vatRate}%</span>
                                </div>
                            </div>

                            <div className="bg-warning/10 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Net Amount</span>
                                    <span className="font-semibold text-foreground">
                                        LKR {fmt(lubricantNetAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <FloatingInput
                                    label="Net Amount (LKR)"
                                    type="text"
                                    value={lubricantNetAmount > 0 ? fmt(lubricantNetAmount) : ''}
                                    disabled
                                    icon={<Layers className="h-4 w-4" />}
                                />
                                <FloatingInput
                                    label={`VAT Amount (${vatRate}%) (LKR)`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={lubricantVatAmount}
                                    onChange={(e) => setLubricantVatAmount(e.target.value)}
                                    icon={<Percent className="h-4 w-4" />}
                                />
                                <FloatingInput
                                    label="Total (LKR)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={lubricantTotalAmount}
                                    onChange={(e) => setLubricantTotalAmount(e.target.value)}
                                    icon={<FileText className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
