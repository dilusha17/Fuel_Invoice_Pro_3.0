import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Building2,
    Receipt,
    Fuel,
    MapPin,
    Phone,
    FileText,
    Loader2,
    Check,
    Edit,
    X,
    Save,
    Settings as SettingsIcon,
    Truck,
    Droplets,
    Plus,
    Trash2,
    Pencil,
} from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';

interface CompanyDetails {
    name: string;
    address: string;
    contact: string;
    vatNo: string;
    place_of_supply?: string;
    supplierName?: string;
    supplierVatNo?: string;
}

interface CurrentVat {
    percentage: number;
    fromDate: string | null;
    toDate: string | null;
}

interface FuelType {
    id: number;
    name: string;
    price: number;
    netPrice: number;
    vatAmount: number;
}

interface LubricantType {
    id: number;
    name: string;
    price: number;
    netPrice: number;
    vatAmount: number;
}

interface SettingsProps {
    companyDetails: CompanyDetails;
    currentVat: CurrentVat;
    fuelTypes: FuelType[];
    lubricantTypes: LubricantType[];
}

export default function Settings({
    companyDetails,
    currentVat,
    fuelTypes,
    lubricantTypes,
}: SettingsProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [newVatPercent, setNewVatPercent] = useState('');
    const [vatFromDate, setVatFromDate] = useState<Date>(new Date());
    const [isUpdatingVat, setIsUpdatingVat] = useState(false);
    const [vatSuccess, setVatSuccess] = useState(false);

    // Number formatter for currency
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const [selectedFuelId, setSelectedFuelId] = useState(
        fuelTypes[0]?.id.toString() || '',
    );
    const [newFuelPrice, setNewFuelPrice] = useState('');
    const [fuelPriceFromDate, setFuelPriceFromDate] = useState<Date>(new Date());
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
    const [priceSuccess, setPriceSuccess] = useState(false);

    const [fuelTypesData, setFuelTypesData] = useState(fuelTypes);

    // Historical price lookup
    const [historicalDate, setHistoricalDate] = useState<Date>(new Date());
    const [historicalFuelData, setHistoricalFuelData] = useState<FuelType | null>(null);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

    // Company Profile Edit State
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
    const [companySuccess, setCompanySuccess] = useState(false);
    const [companyForm, setCompanyForm] = useState({
        name: companyDetails.name,
        address: companyDetails.address,
        contact: companyDetails.contact,
        vatNo: companyDetails.vatNo,
        place_of_supply: companyDetails.place_of_supply || '',
        supplierName: companyDetails.supplierName || '',
        supplierVatNo: companyDetails.supplierVatNo || '',
    });

    // Lubricant Types Management State
    const [lubricantTypesData, setLubricantTypesData] = useState<LubricantType[]>(lubricantTypes || []);
    const [newLubricantName, setNewLubricantName] = useState('');
    const [newLubricantPrice, setNewLubricantPrice] = useState('');
    const [isAddingLubricant, setIsAddingLubricant] = useState(false);
    const [editingLubricantId, setEditingLubricantId] = useState<number | null>(null);
    const [editingLubricantName, setEditingLubricantName] = useState('');
    const [isDeletingLubricant, setIsDeletingLubricant] = useState<number | null>(null);

    // Lubricant Pricing State
    const [selectedLubricantId, setSelectedLubricantId] = useState(
        (lubricantTypes || [])[0]?.id.toString() || '',
    );
    const [newLubricantPriceUpdate, setNewLubricantPriceUpdate] = useState('');
    const [lubricantPriceFromDate, setLubricantPriceFromDate] = useState<Date>(new Date());
    const [isUpdatingLubricantPrice, setIsUpdatingLubricantPrice] = useState(false);
    const [lubricantPriceSuccess, setLubricantPriceSuccess] = useState(false);

    // Historical lubricant price lookup
    const [historicalLubricantDate, setHistoricalLubricantDate] = useState<Date>(new Date());
    const [historicalLubricantData, setHistoricalLubricantData] = useState<LubricantType | null>(null);
    const [isLoadingHistoricalLubricant, setIsLoadingHistoricalLubricant] = useState(false);

    const lubricantTypeOptions = lubricantTypesData.map((lt) => ({
        value: lt.id.toString(),
        label: lt.name,
    }));

    const currentLubricantData = lubricantTypesData.find(
        (lt) => lt.id.toString() === selectedLubricantId,
    );

    const fetchHistoricalLubricantPrice = async (lubricantTypeId: string, date: Date) => {
        if (!lubricantTypeId) return;
        setIsLoadingHistoricalLubricant(true);
        try {
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const dateStr = formatDateLocal(date);
            const response = await fetch(
                `/api/lubricants/price/${lubricantTypeId}?invoice_date=${dateStr}`,
            );
            const data = await response.json();

            if (data.error) {
                toast({
                    title: 'No Historical Data',
                    description: data.error,
                    variant: 'destructive',
                });
                setHistoricalLubricantData(null);
            } else {
                const vatResponse = await fetch(`/api/invoice/vat?invoice_date=${dateStr}`);
                const vatData = await vatResponse.json();

                const vatPercentage = vatData.vatPercentage || 0;
                const price = data.price || 0;

                const netPrice = Math.round((price / (100 + vatPercentage) * 100) * 100) / 100;
                const vatAmount = Math.round((price / (100 + vatPercentage) * vatPercentage) * 100) / 100;

                const lubricant = lubricantTypesData.find((lt) => lt.id.toString() === lubricantTypeId);

                setHistoricalLubricantData({
                    id: parseInt(lubricantTypeId),
                    name: lubricant?.name || '',
                    price: price,
                    netPrice: netPrice,
                    vatAmount: vatAmount,
                });
            }
        } catch (error) {
            console.error('Error fetching historical lubricant price:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch historical lubricant price',
                variant: 'destructive',
            });
            setHistoricalLubricantData(null);
        } finally {
            setIsLoadingHistoricalLubricant(false);
        }
    };

    const handleHistoricalLubricantDateChange = (date: Date | undefined) => {
        if (date) {
            setHistoricalLubricantDate(date);
            fetchHistoricalLubricantPrice(selectedLubricantId, date);
        }
    };

    const handleLubricantTypeChange = (lubricantId: string) => {
        setSelectedLubricantId(lubricantId);
        fetchHistoricalLubricantPrice(lubricantId, historicalLubricantDate);
    };

    useEffect(() => {
        if (selectedLubricantId) {
            fetchHistoricalLubricantPrice(selectedLubricantId, historicalLubricantDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddLubricant = async () => {
        if (!newLubricantName || !newLubricantPrice) return;
        setIsAddingLubricant(true);

        try {
            const response = await fetch('/api/lubricants/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    name: newLubricantName,
                    price: parseFloat(newLubricantPrice),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setLubricantTypesData((prev) => [...prev, data.lubricantType]);
                if (!selectedLubricantId) {
                    setSelectedLubricantId(data.lubricantType.id.toString());
                }
                setNewLubricantName('');
                setNewLubricantPrice('');
                toast({
                    title: 'Lubricant Added',
                    description: `${data.lubricantType.name} has been added successfully`,
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to add lubricant type',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to add lubricant type',
                variant: 'destructive',
            });
        } finally {
            setIsAddingLubricant(false);
        }
    };

    const handleEditLubricant = async (id: number) => {
        if (!editingLubricantName) return;

        try {
            const response = await fetch(`/api/lubricants/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({ name: editingLubricantName }),
            });

            const data = await response.json();

            if (data.success) {
                setLubricantTypesData((prev) =>
                    prev.map((lt) => (lt.id === id ? data.lubricantType : lt)),
                );
                setEditingLubricantId(null);
                setEditingLubricantName('');
                toast({
                    title: 'Lubricant Updated',
                    description: 'Lubricant name updated successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update lubricant',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update lubricant',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteLubricant = async (id: number) => {
        setIsDeletingLubricant(id);

        try {
            const response = await fetch(`/api/lubricants/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': props.csrf_token,
                },
            });

            const data = await response.json();

            if (data.success) {
                setLubricantTypesData((prev) => prev.filter((lt) => lt.id !== id));
                if (selectedLubricantId === id.toString()) {
                    const remaining = lubricantTypesData.filter((lt) => lt.id !== id);
                    setSelectedLubricantId(remaining[0]?.id.toString() || '');
                }
                toast({
                    title: 'Lubricant Deleted',
                    description: 'Lubricant type deleted successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to delete lubricant',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete lubricant',
                variant: 'destructive',
            });
        } finally {
            setIsDeletingLubricant(null);
        }
    };

    const handleUpdateLubricantPrice = async () => {
        if (!currentLubricantData || !newLubricantPriceUpdate) return;
        setIsUpdatingLubricantPrice(true);

        try {
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const response = await fetch('/api/lubricants/update-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    lubricant_type_id: currentLubricantData.id,
                    price: parseFloat(newLubricantPriceUpdate),
                    from_date: formatDateLocal(lubricantPriceFromDate),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setLubricantTypesData((prev) =>
                    prev.map((lt) =>
                        lt.id === data.lubricantType.id ? data.lubricantType : lt,
                    ),
                );
                toast({
                    title: 'Price Updated',
                    description: data.message || `${currentLubricantData.name} price updated to LKR ${newLubricantPriceUpdate}`,
                });
                setNewLubricantPriceUpdate('');
                setLubricantPriceFromDate(new Date());
                setLubricantPriceSuccess(true);
                setTimeout(() => setLubricantPriceSuccess(false), 2000);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update lubricant price',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update lubricant price',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingLubricantPrice(false);
        }
    };

    // Create options for fuel types dropdown
    const fuelTypeOptions = fuelTypesData.map((ft) => ({
        value: ft.id.toString(),
        label: ft.name,
    }));

    const currentFuelData = fuelTypesData.find(
        (ft) => ft.id.toString() === selectedFuelId,
    );

    const [currentVatData, setCurrentVatData] = useState(currentVat);

    // Fetch historical fuel price
    const fetchHistoricalFuelPrice = async (fuelTypeId: string, date: Date) => {
        setIsLoadingHistorical(true);
        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const dateStr = formatDateLocal(date);
            const response = await fetch(
                `/api/invoice/fuel-price/${fuelTypeId}?invoice_date=${dateStr}`,
            );
            const data = await response.json();

            if (data.error) {
                toast({
                    title: 'No Historical Data',
                    description: data.error,
                    variant: 'destructive',
                });
                setHistoricalFuelData(null);
            } else {
                // Fetch VAT for the same date
                const vatResponse = await fetch(`/api/invoice/vat?invoice_date=${dateStr}`);
                const vatData = await vatResponse.json();

                const vatPercentage = vatData.vatPercentage || 0;
                const price = data.price || 0;

                // Calculate net price and VAT amount
                const netPrice = Math.round((price / (100 + vatPercentage) * 100) * 100) / 100;
                const vatAmount = Math.round((price / (100 + vatPercentage) * vatPercentage) * 100) / 100;

                setHistoricalFuelData({
                    id: parseInt(fuelTypeId),
                    name: currentFuelData?.name || '',
                    price: price,
                    netPrice: netPrice,
                    vatAmount: vatAmount,
                });
            }
        } catch (error) {
            console.error('Error fetching historical fuel price:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch historical fuel price',
                variant: 'destructive',
            });
            setHistoricalFuelData(null);
        } finally {
            setIsLoadingHistorical(false);
        }
    };

    // Fetch historical data when date or fuel type changes
    const handleHistoricalDateChange = (date: Date | undefined) => {
        if (date) {
            setHistoricalDate(date);
            fetchHistoricalFuelPrice(selectedFuelId, date);
        }
    };

    const handleFuelTypeChange = (fuelId: string) => {
        setSelectedFuelId(fuelId);
        fetchHistoricalFuelPrice(fuelId, historicalDate);
    };

    // Load historical data on component mount
    useEffect(() => {
        if (selectedFuelId) {
            fetchHistoricalFuelPrice(selectedFuelId, historicalDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateCompany = async () => {
        setIsUpdatingCompany(true);

        try {
            const response = await fetch('/api/settings/update-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    company_name: companyForm.name,
                    company_address: companyForm.address,
                    company_contact: companyForm.contact,
                    company_vat_no: companyForm.vatNo,
                    place_of_supply: companyForm.place_of_supply,
                    supplier_name: companyForm.supplierName,
                    supplier_vat_no: companyForm.supplierVatNo,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Company Details Updated',
                    description:
                        'Company profile has been updated successfully',
                });
                setCompanySuccess(true);
                setIsEditingCompany(false);
                setTimeout(() => setCompanySuccess(false), 2000);
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update company details',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingCompany(false);
        }
    };

    const handleCancelEdit = () => {
        setCompanyForm({
            name: companyDetails.name,
            address: companyDetails.address,
            contact: companyDetails.contact,
            vatNo: companyDetails.vatNo,
            place_of_supply: companyDetails.place_of_supply || '',
            supplierName: companyDetails.supplierName || '',
            supplierVatNo: companyDetails.supplierVatNo || '',
        });
        setIsEditingCompany(false);
    };

    const handleUpdateVat = async () => {
        setIsUpdatingVat(true);

        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const response = await fetch('/api/settings/update-vat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    vat_percentage: parseFloat(newVatPercent),
                    from_date: formatDateLocal(vatFromDate),
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update local state with new data
                setCurrentVatData(data.vat);

                toast({
                    title: 'VAT Updated',
                    description: data.message || `VAT percentage has been set to ${newVatPercent}%`,
                });
                setNewVatPercent('');
                setVatFromDate(new Date());
                setVatSuccess(true);
                setTimeout(() => setVatSuccess(false), 2000);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update VAT percentage',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update VAT percentage',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingVat(false);
        }
    };

    const handleUpdatePrice = async () => {
        if (!currentFuelData) return;

        setIsUpdatingPrice(true);

        try {
            // Format date in local timezone (YYYY-MM-DD)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const response = await fetch('/api/settings/update-fuel-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    fuel_type_id: currentFuelData.id,
                    price: parseFloat(newFuelPrice),
                    from_date: formatDateLocal(fuelPriceFromDate),
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update local state with new data
                setFuelTypesData((prev) =>
                    prev.map((ft) =>
                        ft.id === data.fuelType.id ? data.fuelType : ft,
                    ),
                );

                toast({
                    title: 'Price Updated',
                    description: data.message || `${currentFuelData.name} price updated to LKR ${newFuelPrice}`,
                });
                setNewFuelPrice('');
                setFuelPriceFromDate(new Date());
                setPriceSuccess(true);
                setTimeout(() => setPriceSuccess(false), 2000);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update fuel price',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update fuel price',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingPrice(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <SettingsIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Settings
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage company profile, VAT, and fuel pricing
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Profile Card */}
                <div
                    className="card-neumorphic p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.1s' }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Company Profile
                            </h2>
                        </div>
                        {!isEditingCompany && (
                            <button
                                type="button"
                                onClick={() => setIsEditingCompany(true)}
                                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                title="Edit Company Profile"
                            >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {isEditingCompany ? (
                        <div className="space-y-4">
                            <FloatingInput
                                label="Company Name"
                                type="text"
                                value={companyForm.name}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        name: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="Address"
                                type="text"
                                value={companyForm.address}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        address: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="Contact Number"
                                type="text"
                                value={companyForm.contact}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        contact: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="VAT Number"
                                type="text"
                                value={companyForm.vatNo}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        vatNo: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="Place of Supply"
                                type="text"
                                value={companyForm.place_of_supply}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        place_of_supply: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="Supplier Name"
                                type="text"
                                value={companyForm.supplierName}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        supplierName: e.target.value,
                                    })
                                }
                            />
                            <FloatingInput
                                label="Supplier VAT No"
                                type="text"
                                value={companyForm.supplierVatNo}
                                onChange={(e) =>
                                    setCompanyForm({
                                        ...companyForm,
                                        supplierVatNo: e.target.value,
                                    })
                                }
                            />
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleUpdateCompany}
                                    disabled={
                                        isUpdatingCompany || !companyForm.name
                                    }
                                    className="btn-success-glow flex-1 flex items-center justify-center gap-2"
                                >
                                    {isUpdatingCompany ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : companySuccess ? (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdatingCompany}
                                    className="btn-secondary flex items-center justify-center gap-2 px-4"
                                >
                                    <X className="h-5 w-5" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl font-bold text-foreground">
                                    {companyForm.name}
                                </p>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-muted-foreground">
                                    {companyForm.address}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {companyForm.contact}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {companyForm.vatNo}
                                </p>
                            </div>
                            {companyForm.place_of_supply && (
                                <div className="flex items-start gap-3 text-sm mt-5">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-muted-foreground">
                                        {companyForm.place_of_supply}
                                    </p>
                                </div>
                            )}
                            {companyForm.supplierName && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <p className="text-muted-foreground">
                                        {companyForm.supplierName}
                                    </p>
                                </div>
                            )}
                            {companyForm.supplierVatNo && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <p className="text-muted-foreground">
                                        {companyForm.supplierVatNo}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* VAT Percentage Card */}
                <div
                    className="card-neumorphic-elevated p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.2s' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-warning/10">
                            <Receipt className="h-5 w-5 text-warning" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            VAT Percentage
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Current VAT Data */}
                        {currentVatData && (
                            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Current VAT Percentage
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(currentVatData.percentage)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <DatePickerField
                            label="Effective From Date"
                            value={vatFromDate}
                            onChange={(date) => date && setVatFromDate(date)}
                            placeholder="Select effective date"
                        />

                        <FloatingInput
                            label="New VAT Percentage (%)"
                            type="number"
                            step="0.10"
                            value={newVatPercent}
                            onChange={(e) => setNewVatPercent(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={handleUpdateVat}
                            disabled={isUpdatingVat || !newVatPercent}
                            className="btn-success-glow w-full flex items-center justify-center gap-2"
                        >
                            {isUpdatingVat ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Updating...
                                </>
                            ) : vatSuccess ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    Updated!
                                </>
                            ) : (
                                'Update VAT'
                            )}
                        </button>
                    </div>
                </div>

                {/* Fuel Pricing Calculator Card */}
                <div
                    className="card-neumorphic-elevated p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.3s' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-warning/10">
                            <Fuel className="h-5 w-5 text-warning" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Fuel Pricing
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <SearchableSelect
                            label="Fuel Type"
                            options={fuelTypeOptions}
                            value={selectedFuelId}
                            onChange={handleFuelTypeChange}
                        />

                        <DatePickerField
                            label="Date"
                            value={historicalDate}
                            onChange={handleHistoricalDateChange}
                            placeholder="Select Date"
                        />

                        {/* Historical Pricing Display */}
                        {isLoadingHistorical ? (
                            <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Loading historical data...
                                </span>
                            </div>
                        ) : historicalFuelData ? (
                            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Price
                                    </span>
                                    <span className="font-semibold">
                                        LKR {formatCurrency(historicalFuelData.price)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Net Price
                                    </span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(historicalFuelData.netPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        VAT Amount
                                    </span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(historicalFuelData.vatAmount)}
                                    </span>
                                </div>
                            </div>
                        ) : currentFuelData ? (
                            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Current Price
                                    </span>
                                    <span className="font-semibold">
                                        LKR {formatCurrency(currentFuelData.price)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Net Price
                                    </span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(currentFuelData.netPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        VAT Amount
                                    </span>
                                    <span className="font-medium">
                                        LKR {formatCurrency(currentFuelData.vatAmount)}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <DatePickerField
                            label="Effective From Date"
                            value={fuelPriceFromDate}
                            onChange={(date) => date && setFuelPriceFromDate(date)}
                            placeholder="Select effective date"
                        />

                        <FloatingInput
                            label="New Fuel Price (LKR)"
                            type="number"
                            step="1"
                            value={newFuelPrice}
                            onChange={(e) => setNewFuelPrice(e.target.value)}
                            className="border-2 border-warning/30 focus:border-warning"
                        />

                        <button
                            type="button"
                            onClick={handleUpdatePrice}
                            disabled={isUpdatingPrice || !newFuelPrice}
                            className="btn-success-glow w-full flex items-center justify-center gap-2"
                        >
                            {isUpdatingPrice ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Updating...
                                </>
                            ) : priceSuccess ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    Updated!
                                </>
                            ) : (
                                'Update Price'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lubricants Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lubricant Types Management Card */}
                <div
                    className="card-neumorphic p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.4s' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <Droplets className="h-5 w-5 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Lubricant Types
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Add New Lubricant Form */}
                        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Add New Lubricant</p>
                            <div className="bg-blue-500/10 rounded-lg p-3 text-xs text-blue-600 dark:text-blue-400">
                                Please enter 1L price (ex: if 5L lubricant can price = 1000, Create lubricant name = "Lubricant Can", 1L Price = 200)
                            </div>
                            <FloatingInput
                                label="Lubricant Name"
                                type="text"
                                value={newLubricantName}
                                onChange={(e) => setNewLubricantName(e.target.value)}
                            />
                            <FloatingInput
                                label="1L Price (LKR)"
                                type="number"
                                step="1"
                                value={newLubricantPrice}
                                onChange={(e) => setNewLubricantPrice(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleAddLubricant}
                                disabled={isAddingLubricant || !newLubricantName || !newLubricantPrice}
                                className="btn-success-glow w-full flex items-center justify-center gap-2"
                            >
                                {isAddingLubricant ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Add Lubricant
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Lubricant Types List */}
                        {lubricantTypesData.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Existing Lubricants</p>
                                {lubricantTypesData.map((lt) => (
                                    <div
                                        key={lt.id}
                                        className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between"
                                    >
                                        {editingLubricantId === lt.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-2">
                                                <input
                                                    type="text"
                                                    value={editingLubricantName}
                                                    onChange={(e) => setEditingLubricantName(e.target.value)}
                                                    className="floating-input text-sm py-1.5 px-3 flex-1"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditLubricant(lt.id);
                                                        if (e.key === 'Escape') {
                                                            setEditingLubricantId(null);
                                                            setEditingLubricantName('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditLubricant(lt.id)}
                                                    className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                                                >
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingLubricantId(null);
                                                        setEditingLubricantName('');
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                                >
                                                    <X className="h-4 w-4 text-destructive" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {lt.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        LKR {formatCurrency(lt.price)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingLubricantId(lt.id);
                                                            setEditingLubricantName(lt.name);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLubricant(lt.id)}
                                                        disabled={isDeletingLubricant === lt.id}
                                                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                                    >
                                                        {isDeletingLubricant === lt.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                                                        ) : (
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lubricant Pricing Card */}
                <div
                    className="card-neumorphic-elevated p-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.5s' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <Droplets className="h-5 w-5 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Lubricant Pricing
                        </h2>
                    </div>

                    {lubricantTypesData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No lubricant types added yet</p>
                            <p className="text-xs mt-1">Add lubricant types first to manage pricing</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <SearchableSelect
                                label="Lubricant Type"
                                options={lubricantTypeOptions}
                                value={selectedLubricantId}
                                onChange={handleLubricantTypeChange}
                            />

                            <DatePickerField
                                label="Date"
                                value={historicalLubricantDate}
                                onChange={handleHistoricalLubricantDateChange}
                                placeholder="Select Date"
                            />

                            {/* Historical / Current Pricing Display */}
                            {isLoadingHistoricalLubricant ? (
                                <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Loading historical data...
                                    </span>
                                </div>
                            ) : historicalLubricantData ? (
                                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Price
                                        </span>
                                        <span className="font-semibold">
                                            LKR {formatCurrency(historicalLubricantData.price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Net Price
                                        </span>
                                        <span className="font-medium">
                                            LKR {formatCurrency(historicalLubricantData.netPrice)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            VAT Amount
                                        </span>
                                        <span className="font-medium">
                                            LKR {formatCurrency(historicalLubricantData.vatAmount)}
                                        </span>
                                    </div>
                                </div>
                            ) : currentLubricantData ? (
                                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Current Price
                                        </span>
                                        <span className="font-semibold">
                                            LKR {formatCurrency(currentLubricantData.price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Net Price
                                        </span>
                                        <span className="font-medium">
                                            LKR {formatCurrency(currentLubricantData.netPrice)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            VAT Amount
                                        </span>
                                        <span className="font-medium">
                                            LKR {formatCurrency(currentLubricantData.vatAmount)}
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            <DatePickerField
                                label="Effective From Date"
                                value={lubricantPriceFromDate}
                                onChange={(date) => date && setLubricantPriceFromDate(date)}
                                placeholder="Select effective date"
                            />

                            <div className="bg-blue-500/10 rounded-lg p-3 text-xs text-blue-600 dark:text-blue-400">
                                Please enter 1L price (ex: if 5L lubricant can price = 1000, 1L Price = 200)
                            </div>

                            <FloatingInput
                                label="New 1L Price (LKR)"
                                type="number"
                                step="1"
                                value={newLubricantPriceUpdate}
                                onChange={(e) => setNewLubricantPriceUpdate(e.target.value)}
                                className="border-2 border-blue-500/30 focus:border-blue-500"
                            />

                            <button
                                type="button"
                                onClick={handleUpdateLubricantPrice}
                                disabled={isUpdatingLubricantPrice || !newLubricantPriceUpdate}
                                className="btn-success-glow w-full flex items-center justify-center gap-2"
                            >
                                {isUpdatingLubricantPrice ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Updating...
                                    </>
                                ) : lubricantPriceSuccess ? (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Updated!
                                    </>
                                ) : (
                                    'Update Price'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
