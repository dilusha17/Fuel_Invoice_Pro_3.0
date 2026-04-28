import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Users,
    Loader2,
    Plus,
    RotateCcw,
    Car,
    Building2,
    FileX,
    Trash2,
    Pencil,
} from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DataGrid } from '@/components/ui/DataGrid';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

const vehicleTypes = [
    { value: 'bike', label: 'Bike' },
    { value: 'three_wheel', label: 'Three Wheel' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'bus', label: 'Bus' },
    { value: 'truck', label: 'Truck' },
    { value: 'lorry', label: 'Lorry' },
];

interface Client {
    id: string;
    clientName: string;
    companyName: string;
    nickName: string;
    address: string;
    contact: string;
    vatNo: string;
}

interface Vehicle {
    id: string;
    clientId: string;
    vehicleNo: string;
    type: string;
    fuelCategory: string;
}

interface FuelCategory {
    id: number;
    name: string;
}

interface ClientDetailsProps {
    clients: Client[];
    fuelCategories: FuelCategory[];
}

const emptyClientForm = {
    clientName: '',
    companyName: '',
    nickName: '',
    address: '',
    contact: '',
    vatNo: '',
};

const emptyVehicleForm = {
    vehicleNo: '',
    type: '',
    fuelCategory: '',
};

export default function ClientDetails({
    clients: initialClients,
    fuelCategories,
}: ClientDetailsProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [isLoading, setIsLoading] = useState(false);
    // Ensure all client IDs are strings
    const [clients, setClients] = useState(
        initialClients.map(c => ({ ...c, id: String(c.id) }))
    );
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Convert fuel categories to options
    const fuelCategoryOptions = fuelCategories.map((fc) => ({
        value: String(fc.id),
        label: fc.name,
    }));

    // Selection state
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    // Modal states
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);

    // Form states
    const [clientForm, setClientForm] = useState(emptyClientForm);
    const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

    // Delete states
    const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
    const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);

    const clientOptions = clients.map((c) => ({
        value: String(c.id),
        label: c.clientName,
    }));
    const vehicleOptions = vehicles
        .filter((v) => String(v.clientId) === String(selectedClientId))
        .map((v) => ({ value: v.id, label: v.vehicleNo }));

    console.log('All vehicles:', vehicles.length);
    console.log('Selected client ID:', selectedClientId);
    console.log('Filtered vehicle options:', vehicleOptions.length, vehicleOptions);

    // Get vehicles for selected client
    const clientVehicles = vehicles.filter(
        (v) => String(v.clientId) === String(selectedClientId),
    );

    const handleSaveClient = async () => {
        if (!clientForm.clientName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Client name is required.',
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/clients/store-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    client_name: clientForm.clientName,
                    c_name: clientForm.companyName,
                    nick_name: clientForm.nickName,
                    address: clientForm.address,
                    contact_number: clientForm.contact,
                    vat_no: clientForm.vatNo,
                }),
            });

            const data = await response.json();

                if (data.success) {
                const newClient: Client = {
                    id: String(data.client.id),
                    clientName: data.client.clientName,
                    companyName: data.client.companyName,
                    nickName: data.client.nickName,
                    address: data.client.address,
                    contact: data.client.contact,
                    vatNo: data.client.vatNo,
                };

                setClients([...clients, newClient]);
                toast({
                    title: 'Client Saved',
                    description: `${clientForm.clientName} has been added successfully.`,
                });
                setClientForm(emptyClientForm);
                setShowAddClientModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to save client.',
                });
            }
        } catch (error) {
            console.error('Error saving client:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save client. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClient = (clientId: string) => {
        const client = clients.find((c) => c.id === clientId);
        if (client) {
            setEditingClientId(clientId);
            setClientForm({
                clientName: client.clientName,
                companyName: client.companyName,
                nickName: client.nickName,
                address: client.address,
                contact: client.contact,
                vatNo: client.vatNo,
            });
            setShowEditClientModal(true);
        }
    };

    const handleUpdateClient = async () => {
        if (!clientForm.clientName.trim() || !editingClientId) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Client name is required.',
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/clients/update-client/${editingClientId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        client_name: clientForm.clientName,
                        c_name: clientForm.companyName,
                        nick_name: clientForm.nickName,
                        address: clientForm.address,
                        contact_number: clientForm.contact,
                        vat_no: clientForm.vatNo,
                    }),
                }
            );

            const data = await response.json();

                if (data.success) {
                const updatedClient: Client = {
                    id: String(data.client.id),
                    clientName: data.client.clientName,
                    companyName: data.client.companyName,
                    nickName: data.client.nickName,
                    address: data.client.address,
                    contact: data.client.contact,
                    vatNo: data.client.vatNo,
                };

                setClients(
                    clients.map((c) =>
                        c.id === editingClientId ? updatedClient : c
                    )
                );
                toast({
                    title: 'Client Updated',
                    description: `${clientForm.clientName} has been updated successfully.`,
                });
                setClientForm(emptyClientForm);
                setEditingClientId(null);
                setShowEditClientModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to update client.',
                });
            }
        } catch (error) {
            console.error('Error updating client:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update client. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveVehicle = async () => {
        if (!selectedClientId) {
            toast({
                title: 'Select Client',
                description: 'Please select a client first.',
                variant: 'destructive',
            });
            return;
        }

        if (
            !vehicleForm.vehicleNo.trim() ||
            !vehicleForm.type ||
            !vehicleForm.fuelCategory
        ) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'All fields are required.',
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('/api/clients/store-vehicle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    client_id: selectedClientId,
                    vehicle_no: vehicleForm.vehicleNo,
                    type: vehicleForm.type,
                    fuel_category_id: vehicleForm.fuelCategory,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newVehicle: Vehicle = {
                    id: String(data.vehicle.id),
                    clientId: String(data.vehicle.clientId),
                    vehicleNo: data.vehicle.vehicleNo,
                    type: data.vehicle.type,
                    fuelCategory: data.vehicle.fuelCategory,
                };

                setVehicles([...vehicles, newVehicle]);
                toast({
                    title: 'Vehicle Saved',
                    description: `${vehicleForm.vehicleNo} has been added successfully.`,
                });
                setVehicleForm(emptyVehicleForm);
                setShowAddVehicleModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to save vehicle.',
                });
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditVehicle = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (vehicle) {
            setEditingVehicleId(vehicleId);
            // Find the matching vehicle type value by comparing labels (case-insensitive)
            const matchingType = vehicleTypes.find(
                (vt) => vt.label.toLowerCase() === vehicle.type.toLowerCase()
            );
            setVehicleForm({
                vehicleNo: vehicle.vehicleNo,
                type: matchingType?.value || vehicle.type.toLowerCase().replace(/\s+/g, '_'),
                fuelCategory: String(
                    fuelCategories.find((fc) => fc.name === vehicle.fuelCategory)?.id || ''
                ),
            });
            // Store the original client ID for editing
            setSelectedClientId(vehicle.clientId);
            setShowEditVehicleModal(true);
        }
    };

    const handleUpdateVehicle = async () => {
        if (
            !vehicleForm.vehicleNo.trim() ||
            !vehicleForm.type ||
            !vehicleForm.fuelCategory ||
            !editingVehicleId ||
            !selectedClientId
        ) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'All fields are required.',
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/update-vehicle/${editingVehicleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        client_id: selectedClientId,
                        vehicle_no: vehicleForm.vehicleNo,
                        type: vehicleForm.type,
                        fuel_category_id: vehicleForm.fuelCategory,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                const updatedVehicle: Vehicle = {
                    id: String(data.vehicle.id),
                    clientId: String(data.vehicle.clientId),
                    vehicleNo: data.vehicle.vehicleNo,
                    type: data.vehicle.type,
                    fuelCategory: data.vehicle.fuelCategory,
                };

                setVehicles(
                    vehicles.map((v) =>
                        v.id === editingVehicleId ? updatedVehicle : v
                    )
                );
                toast({
                    title: 'Vehicle Updated',
                    description: `${vehicleForm.vehicleNo} has been updated successfully.`,
                });
                setVehicleForm(emptyVehicleForm);
                setEditingVehicleId(null);
                setShowEditVehicleModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to update vehicle.',
                });
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearClient = () => {
        setSelectedClientId('');
        setSelectedVehicle('');
        setVehicles([]);
    };

    // Fetch vehicles when client is selected
    useEffect(() => {
        const loadVehicles = async () => {
            if (!selectedClientId) {
                setVehicles([]);
                return;
            }

            try {
                setIsLoading(true);
                console.log('Fetching vehicles for client:', selectedClientId, 'Type:', typeof selectedClientId);

                const response = await fetch('/api/clients/vehicles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({ client_id: selectedClientId }),
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('API Response:', result);

                if (result.success && Array.isArray(result.vehicles)) {
                    interface VehicleResponse {
                        id: number | string;
                        clientId: number | string;
                        vehicleNo: string;
                        type: string;
                        fuelCategory: string;
                    }
                    const vehicleList: Vehicle[] = result.vehicles.map((v: VehicleResponse) => ({
                        id: String(v.id),
                        clientId: String(v.clientId),
                        vehicleNo: v.vehicleNo,
                        type: v.type,
                        fuelCategory: v.fuelCategory,
                    }));

                    console.log('Mapped vehicles:', vehicleList);
                    console.log('Selected client ID:', selectedClientId, 'Type:', typeof selectedClientId);
                    console.log('First vehicle clientId:', vehicleList[0]?.clientId, 'Type:', typeof vehicleList[0]?.clientId);
                    console.log('Comparison result:', vehicleList[0] && String(vehicleList[0].clientId) === String(selectedClientId));
                    setVehicles(vehicleList);
                } else {
                    console.error('Invalid response format:', result);
                    setVehicles([]);
                }
            } catch (error) {
                console.error('Error loading vehicles:', error);
                setVehicles([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadVehicles();
    }, [selectedClientId, props.csrf_token, toast]);

    const handleDeleteClient = async () => {
        if (!deleteClientId) return;

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/delete-client/${deleteClientId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                setClients(clients.filter((c) => String(c.id) !== String(deleteClientId)));
                setVehicles(
                    vehicles.filter((v) => String(v.clientId) !== String(deleteClientId)),
                );

                if (String(selectedClientId) === String(deleteClientId)) {
                    setSelectedClientId('');
                    setSelectedVehicle('');
                }

                toast({
                    title: 'Client Deleted',
                    description:
                        'The client and its vehicles have been successfully deleted.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to delete client.',
                });
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete client. Please try again.',
            });
        } finally {
            setIsLoading(false);
            setDeleteClientId(null);
        }
    };

    const handleDeleteVehicle = async () => {
        if (!deleteVehicleId) return;

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/delete-vehicle/${deleteVehicleId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                setVehicles(vehicles.filter((v) => String(v.id) !== String(deleteVehicleId)));

                if (String(selectedVehicle) === String(deleteVehicleId)) {
                    setSelectedVehicle('');
                }

                toast({
                    title: 'Vehicle Deleted',
                    description: 'The vehicle has been successfully deleted.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to delete vehicle.',
                });
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
            setDeleteVehicleId(null);
        }
    };

    const vehicleColumns = [
        { key: 'vehicleNo', header: 'Vehicle No', sortable: true },
        { key: 'type', header: 'Type' },
        { key: 'fuelCategory', header: 'Fuel Category' },
        {
            key: 'actions',
            header: 'Actions',
            align: 'center' as const,
            render: (row: Vehicle) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditVehicle(row.id);
                        }}
                        title="Edit Vehicle"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVehicleId(row.id);
                        }}
                        title="Delete Vehicle"
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
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Client Details
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage client and vehicle master data
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Section */}
                <div className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                Client
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setClientForm(emptyClientForm);
                                setShowAddClientModal(true);
                            }}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Add New Client"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <SearchableSelect
                        label="Client Name"
                        options={clientOptions}
                        value={selectedClientId}
                        onChange={(value) => {
                            setSelectedClientId(value);
                            setSelectedVehicle('');
                        }}
                        placeholder="Select a client"
                    />
                    {selectedClientId &&
                        (() => {
                            const client = clients.find(
                                (c) => c.id === selectedClientId,
                            );
                            return client ? (
                                <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Company Name
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {client.companyName || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Nick Name
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {client.nickName || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Address
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {client.address}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Contact
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {client.contact}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            VAT No
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {client.vatNo}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}

                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={handleClearClient}
                            className="btn-ghost flex items-center justify-center gap-2 flex-1"
                            disabled={!selectedClientId}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => handleEditClient(selectedClientId)}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                            disabled={!selectedClientId}
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setDeleteClientId(selectedClientId)
                            }
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                            disabled={!selectedClientId}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Vehicle Section */}
                <div
                    className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance"
                    style={{ animationDelay: '0.1s' }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                Vehicle
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedClientId) {
                                    toast({
                                        title: 'Select Client',
                                        description:
                                            'Please select a client first to add a vehicle.',
                                        variant: 'destructive',
                                    });
                                    return;
                                }
                                setVehicleForm(emptyVehicleForm);
                                setShowAddVehicleModal(true);
                            }}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Add New Vehicle"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <SearchableSelect
                        label="Vehicle No"
                        options={vehicleOptions}
                        value={selectedVehicle}
                        onChange={setSelectedVehicle}
                        placeholder={
                            selectedClientId
                                ? 'Select a vehicle'
                                : 'Select client first'
                        }
                    />

                    {selectedVehicle &&
                        (() => {
                            const vehicle = vehicles.find(
                                (v) => v.id === selectedVehicle,
                            );
                            return vehicle ? (
                                <div className="bg-accent/10 rounded-xl p-4 space-y-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Type
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {vehicle.type}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Fuel Category
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {vehicle.fuelCategory}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                </div>
            </div>

            {/* Vehicle List */}
            <div
                className="animate-fade-slide-up"
                style={{ animationDelay: '0.2s' }}
            >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Vehicle List
                </h2>
                {!selectedClientId ? (
                    <div className="card-neumorphic p-12 text-center">
                        <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Select a Client
                        </h3>
                        <p className="text-muted-foreground">
                            Select a client to view its vehicles.
                        </p>
                    </div>
                ) : clientVehicles.length === 0 ? (
                    <div className="card-neumorphic p-12 text-center">
                        <Car className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Vehicles
                        </h3>
                        <p className="text-muted-foreground">
                            This client has no vehicles. Add one to get
                            started.
                        </p>
                    </div>
                ) : (
                    <DataGrid
                        columns={vehicleColumns}
                        data={clientVehicles}
                        pageSize={15}
                    />
                )}
            </div>

            {/* Add Client Modal */}
            <Dialog
                open={showAddClientModal}
                onOpenChange={setShowAddClientModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Add New Client
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Client Name"
                            value={clientForm.clientName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    clientName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Company Name"
                            value={clientForm.companyName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    companyName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Nick Name"
                            value={clientForm.nickName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    nickName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Address"
                            value={clientForm.address}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    address: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Contact Number"
                            type="tel"
                            value={clientForm.contact}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    contact: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="VAT No"
                            value={clientForm.vatNo}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    vatNo: e.target.value,
                                })
                            }
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddClientModal(false);
                                    setClientForm(emptyClientForm);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveClient}
                                disabled={isLoading || !clientForm.clientName}
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Add Client
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Vehicle Modal */}
            <Dialog
                open={showAddVehicleModal}
                onOpenChange={setShowAddVehicleModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-accent" />
                            Add New Vehicle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Vehicle No"
                            value={vehicleForm.vehicleNo}
                            onChange={(e) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    vehicleNo: e.target.value,
                                })
                            }
                        />
                        <SearchableSelect
                            label="Type"
                            options={vehicleTypes}
                            value={vehicleForm.type}
                            onChange={(value) =>
                                setVehicleForm({ ...vehicleForm, type: value })
                            }
                            placeholder="Select vehicle type"
                        />
                        <SearchableSelect
                            label="Fuel Category"
                            options={fuelCategoryOptions}
                            value={vehicleForm.fuelCategory}
                            onChange={(value) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    fuelCategory: value,
                                })
                            }
                            placeholder="Select fuel category"
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddVehicleModal(false);
                                    setVehicleForm(emptyVehicleForm);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveVehicle}
                                disabled={
                                    isLoading ||
                                    !vehicleForm.vehicleNo ||
                                    !vehicleForm.type ||
                                    !vehicleForm.fuelCategory
                                }
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Add Vehicle
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Client Modal */}
            <Dialog
                open={showEditClientModal}
                onOpenChange={setShowEditClientModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            Edit Client
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Client Name"
                            value={clientForm.clientName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    clientName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Company Name"
                            value={clientForm.companyName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    companyName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Nick Name"
                            value={clientForm.nickName}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    nickName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Address"
                            value={clientForm.address}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    address: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Contact Number"
                            type="tel"
                            value={clientForm.contact}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    contact: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="VAT No"
                            value={clientForm.vatNo}
                            onChange={(e) =>
                                setClientForm({
                                    ...clientForm,
                                    vatNo: e.target.value,
                                })
                            }
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditClientModal(false);
                                    setClientForm(emptyClientForm);
                                    setEditingClientId(null);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateClient}
                                disabled={isLoading || !clientForm.clientName}
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Pencil className="h-4 w-4" />
                                )}
                                Update Client
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Vehicle Modal */}
            <Dialog
                open={showEditVehicleModal}
                onOpenChange={setShowEditVehicleModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-accent" />
                            Edit Vehicle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <SearchableSelect
                            label="Client"
                            options={clientOptions}
                            value={selectedClientId}
                            onChange={(value) => setSelectedClientId(value)}
                            placeholder="Select client"
                        />
                        <FloatingInput
                            label="Vehicle No"
                            value={vehicleForm.vehicleNo}
                            onChange={(e) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    vehicleNo: e.target.value,
                                })
                            }
                        />
                        <SearchableSelect
                            label="Type"
                            options={vehicleTypes}
                            value={vehicleForm.type}
                            onChange={(value) =>
                                setVehicleForm({ ...vehicleForm, type: value })
                            }
                            placeholder="Select vehicle type"
                        />
                        <SearchableSelect
                            label="Fuel Category"
                            options={fuelCategoryOptions}
                            value={vehicleForm.fuelCategory}
                            onChange={(value) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    fuelCategory: value,
                                })
                            }
                            placeholder="Select fuel category"
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditVehicleModal(false);
                                    setVehicleForm(emptyVehicleForm);
                                    setEditingVehicleId(null);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateVehicle}
                                disabled={
                                    isLoading ||
                                    !vehicleForm.vehicleNo ||
                                    !vehicleForm.type ||
                                    !vehicleForm.fuelCategory
                                }
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Pencil className="h-4 w-4" />
                                )}
                                Update Vehicle
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Client Confirmation */}
            <AlertDialog
                open={!!deleteClientId}
                onOpenChange={() => setDeleteClientId(null)}
            >
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this client? This
                            will also delete all associated vehicles. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteClient}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Vehicle Confirmation */}
            <AlertDialog
                open={!!deleteVehicleId}
                onOpenChange={() => setDeleteVehicleId(null)}
            >
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this vehicle? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVehicle}
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
