import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';

interface Client {
    value: string;
    label: string;
}

interface Vehicle {
    value: string;
    label: string;
    fuel_category_fuel_category_id: number;
}

interface FuelTypeOption {
    value: string;
    label: string;
    price: number;
}

interface IndexProps {
    clients: Client[];
    initialVatPercentage: number;
}

export default function Index({ clients, initialVatPercentage }: IndexProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [fuelTypes, setFuelTypes] = useState<FuelTypeOption[]>([]);
    const [fuelPrice, setFuelPrice] = useState(0);
    const [vatPercentage, setVatPercentage] = useState(initialVatPercentage);

    const [inputMode, setInputMode] = useState<'volume' | 'totalPrice'>(
        'volume',
    );
    const [formData, setFormData] = useState({
        serialNo: '',
        date: new Date(),
        client: '',
        vehicle: '',
        fuelType: '',
        volume: '',
        totalPrice: '',
    });

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

    // Fetch vehicles when client changes
    useEffect(() => {
        if (formData.client) {
            fetchVehicles(formData.client);
            // Reset dependent fields
            setFormData((prev) => ({ ...prev, vehicle: '', fuelType: '' }));
            setVehicles([]);
            setFuelTypes([]);
            setFuelPrice(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.client]);

    // Fetch fuel types when vehicle changes
    useEffect(() => {
        if (formData.vehicle) {
            fetchFuelTypes(formData.vehicle);
            // Reset fuel type
            setFormData((prev) => ({ ...prev, fuelType: '' }));
            setFuelTypes([]);
            setFuelPrice(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.vehicle]);

    // Fetch fuel price when fuel type changes
    useEffect(() => {
        if (formData.fuelType) {
            fetchFuelPrice(formData.fuelType);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.fuelType]);

    // Fetch VAT and fuel price when date changes
    useEffect(() => {
        if (formData.date) {
            fetchVatForDate(formData.date);
            // Re-fetch fuel price if fuel type is selected
            if (formData.fuelType) {
                fetchFuelPrice(formData.fuelType);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.date]);

    const fetchVehicles = async (clientId: string) => {
        try {
            const response = await fetch(`/api/invoice/vehicles/${clientId}`);
            const data = await response.json();
            setVehicles(data.vehicles);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch vehicles',
                variant: 'destructive',
            });
        }
    };

    const fetchFuelTypes = async (vehicleId: string) => {
        try {
            const response = await fetch(
                `/api/invoice/fuel-types/${vehicleId}`,
            );
            const data = await response.json();
            setFuelTypes(data.fuelTypes);
        } catch (error) {
            console.error('Error fetching fuel types:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch fuel types',
                variant: 'destructive',
            });
        }
    };

    const fetchFuelPrice = async (fuelTypeId: string) => {
        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const invoiceDate = formatDateLocal(formData.date);
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

    const FuelNetPrice = Math.round(((fuelPrice / (100 + vatPercentage)) * 100) * 100) / 100;
    const vatAmountPerLiter = Math.round(((fuelPrice / (100 + vatPercentage)) * vatPercentage) * 100) / 100;

    // Calculation values
    let volume = 0;
    let total = 0;
    let subTotal = 0;
    let vatAmount = 0;

    if (inputMode === 'volume') {
        volume = parseFloat(formData.volume) || 0;
        total = Math.round(fuelPrice * volume * 100) / 100;
        subTotal = Math.round(FuelNetPrice * volume * 100) / 100;
        vatAmount = Math.round(vatAmountPerLiter * volume * 100) / 100;
    } else {
        // When inputMode is 'totalPrice', calculate volume from total price
        total = parseFloat(formData.totalPrice) || 0;
        volume = fuelPrice > 0 ? Math.round((total / fuelPrice) * 1000) / 1000 : 0;
        subTotal = Math.round((FuelNetPrice * volume) * 100) / 100;
        vatAmount = Math.round((vatAmountPerLiter * volume) * 100) / 100;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const invoiceData = {
                serial_no: formData.serialNo,
                date_added: formatDateLocal(formData.date),
                vehicle_id: formData.vehicle,
                fuel_type_id: formData.fuelType,
                volume: Math.round(volume * 1000) / 1000, // Round to 3 decimal places
                fuel_net_price: FuelNetPrice,
                sub_total: subTotal,
                vat_percentage: vatPercentage,
                vat_amount: vatAmount,
                total: total,
            };

            const response = await fetch('/api/invoice/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                    Accept: 'application/json',
                },
                body: JSON.stringify(invoiceData),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ message: 'Failed to save invoice' }));
                throw new Error(
                    errorData.message || `Server error: ${response.status}`,
                );
            }

            await response.json();

            toast({
                title: 'Invoice Saved Successfully',
                description: `Invoice ${formData.serialNo} has been saved.`,
            });

            // Reset form
            setFormData({
                serialNo: '',
                date: new Date(),
                client: '',
                vehicle: '',
                fuelType: '',
                volume: '',
                totalPrice: '',
            });
            setInputMode('volume');
            setVehicles([]);
            setFuelTypes([]);
            setFuelPrice(0);
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while saving the invoice',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 animate-fade-slide-up">
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                    Invoice Form{' '}
                    <span className="text-muted-foreground font-normal">
                        (Daily)
                    </span>
                </h1>
            </div>

            {/* Invoice Card */}
            <div className="card-neumorphic-elevated p-6 lg:p-8 animate-card-entrance">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primary Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                        <FloatingInput
                            label="Serial No"
                            value={formData.serialNo}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    serialNo: e.target.value,
                                })
                            }
                            placeholder=""
                        />
                        <DatePickerField
                            label="Date"
                            value={formData.date}
                            onChange={(date) =>
                                setFormData({
                                    ...formData,
                                    date: date || new Date(),
                                })
                            }
                        />
                    </div>

                    {/* Selection Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                        <SearchableSelect
                            label="Client Name"
                            options={clients}
                            value={formData.client}
                            onChange={(value) =>
                                setFormData({ ...formData, client: value })
                            }
                            placeholder="Select client"
                        />
                        <SearchableSelect
                            label="Vehicle No"
                            options={vehicles}
                            value={formData.vehicle}
                            onChange={(value) =>
                                setFormData({ ...formData, vehicle: value })
                            }
                            placeholder="Select vehicle"
                            disabled={!formData.client || vehicles.length === 0}
                        />
                    </div>

                    {/* Fuel Type Selection */}
                    <div className="stagger-children">
                        <SearchableSelect
                            label="Fuel Type"
                            options={fuelTypes}
                            value={formData.fuelType}
                            onChange={(value) =>
                                setFormData({ ...formData, fuelType: value })
                            }
                            placeholder="Select fuel type"
                            disabled={
                                !formData.vehicle || fuelTypes.length === 0
                            }
                            searchable={false}
                        />
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="stagger-children">
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
                                        // Clear both fields when switching
                                        setFormData({
                                            ...formData,
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                        <FloatingInput
                            label="Volume (Liters)"
                            type="number"
                            step="0.001"
                            value={formData.volume}
                            onChange={(e) => {
                                let value = e.target.value;
                                // Only allow up to 3 decimal places
                                if (value.includes('.')) {
                                    const [intPart, decPart] = value.split('.');
                                    value = intPart + '.' + decPart.slice(0, 3);
                                }
                                setFormData({
                                    ...formData,
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
                            value={formData.totalPrice}
                            onChange={(e) => {
                                let value = e.target.value;
                                // Only allow up to 2 decimal places
                                if (value.includes('.')) {
                                    const [intPart, decPart] = value.split('.');
                                    value = intPart + '.' + decPart.slice(0, 2);
                                }
                                setFormData({
                                    ...formData,
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
                    <div className="bg-secondary/30 rounded-xl p-6 space-y-3 border border-border/50">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Financial Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    Volume
                                </span>
                                <span className="font-medium">
                                    {formatVolume(volume)} L
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    Fuel Net Price
                                </span>
                                <span className="font-medium">
                                    LKR {formatCurrency(FuelNetPrice)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    Sub Total
                                </span>
                                <span className="font-medium">
                                    LKR {formatCurrency(subTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    VAT ({vatPercentage}%)
                                </span>
                                <span className="font-medium">
                                    LKR {formatCurrency(vatAmount)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-foreground text-sm">
                                        Total
                                    </span>
                                    <span className="text-lg font-bold text-foreground">
                                        LKR {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={
                            isLoading ||
                            !formData.client ||
                            !formData.vehicle ||
                            (inputMode === 'volume' && !formData.volume) ||
                            (inputMode === 'totalPrice' &&
                                !formData.totalPrice) ||
                            !formData.serialNo
                        }
                        className="btn-primary-glow w-full flex items-center justify-center gap-2 py-2.5"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Invoice'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
