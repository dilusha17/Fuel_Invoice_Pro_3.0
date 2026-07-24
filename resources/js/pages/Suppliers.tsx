import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Truck, Loader2, Plus, Trash2, Pencil } from 'lucide-react';
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

const supplierTypeOptions = [
    { value: 'fuel', label: 'Fuel Supplier' },
    { value: 'lubricant', label: 'Lubricant Supplier' },
];

interface Supplier {
    id: number;
    name: string;
    vatNo: string | null;
    type: 'fuel' | 'lubricant';
}

interface SuppliersProps {
    suppliers: Supplier[];
}

const emptySupplierForm = {
    name: '',
    vatNo: '',
    type: '',
};

export default function Suppliers({ suppliers: initialSuppliers }: SuppliersProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();

    const [suppliers, setSuppliers] = useState<Supplier[]>(
        initialSuppliers.map((s) => ({ ...s, id: Number(s.id) })),
    );

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => setSupplierForm(emptySupplierForm);

    const handleAddSupplier = async () => {
        if (!supplierForm.name || !supplierForm.type) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/suppliers/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    name: supplierForm.name,
                    vat_no: supplierForm.vatNo,
                    type: supplierForm.type,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuppliers((prev) => [...prev, data.supplier]);
                toast({
                    title: 'Supplier Added',
                    description: `${data.supplier.name} has been added successfully`,
                });
                resetForm();
                setShowAddModal(false);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to add supplier',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to add supplier',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setEditingSupplierId(supplier.id);
        setSupplierForm({
            name: supplier.name,
            vatNo: supplier.vatNo || '',
            type: supplier.type,
        });
        setShowEditModal(true);
    };

    const handleUpdateSupplier = async () => {
        if (!editingSupplierId || !supplierForm.name || !supplierForm.type) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/suppliers/update/${editingSupplierId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    name: supplierForm.name,
                    vat_no: supplierForm.vatNo,
                    type: supplierForm.type,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuppliers((prev) =>
                    prev.map((s) => (s.id === editingSupplierId ? data.supplier : s)),
                );
                toast({
                    title: 'Supplier Updated',
                    description: `${data.supplier.name} has been updated successfully`,
                });
                resetForm();
                setShowEditModal(false);
                setEditingSupplierId(null);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update supplier',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update supplier',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`/api/suppliers/delete/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSuppliers((prev) => prev.filter((s) => s.id !== deleteId));
                toast({
                    title: 'Supplier Deleted',
                    description: 'The supplier has been deleted successfully.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to delete supplier',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete supplier',
                variant: 'destructive',
            });
        } finally {
            setDeleteId(null);
        }
    };

    const columns = [
        { key: 'name', header: 'Supplier Name', sortable: true },
        {
            key: 'vatNo',
            header: 'VAT No',
            render: (row: Supplier) => row.vatNo || 'N/A',
        },
        {
            key: 'type',
            header: 'Type',
            render: (row: Supplier) => (
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        row.type === 'fuel'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    }`}
                >
                    {row.type === 'fuel' ? 'Fuel Supplier' : 'Lubricant Supplier'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'center' as const,
            render: (row: Supplier) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(row);
                        }}
                        title="Edit Supplier"
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
                        title="Delete Supplier"
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
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Suppliers
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage fuel and lubricant suppliers
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="btn-primary-glow flex items-center gap-2 w-fit"
                >
                    <Plus className="h-5 w-5" />
                    Add Supplier
                </button>
            </div>

            {/* Data Grid */}
            <div className="animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <DataGrid
                    columns={columns}
                    data={suppliers}
                    emptyMessage="No suppliers found. Add your first supplier."
                />
            </div>

            {/* Add Supplier Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="card-neumorphic-elevated border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Add New Supplier
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Supplier Name"
                            type="text"
                            value={supplierForm.name}
                            onChange={(e) =>
                                setSupplierForm({ ...supplierForm, name: e.target.value })
                            }
                        />
                        <FloatingInput
                            label="Supplier VAT No"
                            type="text"
                            value={supplierForm.vatNo}
                            onChange={(e) =>
                                setSupplierForm({ ...supplierForm, vatNo: e.target.value })
                            }
                        />
                        <SearchableSelect
                            label="Supplier Type"
                            options={supplierTypeOptions}
                            value={supplierForm.type}
                            onChange={(value) =>
                                setSupplierForm({ ...supplierForm, type: value })
                            }
                            placeholder="Select supplier type"
                            searchable={false}
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSupplier}
                                disabled={isSaving || !supplierForm.name || !supplierForm.type}
                                className="btn-success-glow flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Add Supplier'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Supplier Modal */}
            <Dialog
                open={showEditModal}
                onOpenChange={(open) => {
                    setShowEditModal(open);
                    if (!open) setEditingSupplierId(null);
                }}
            >
                <DialogContent className="card-neumorphic-elevated border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Edit Supplier
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Supplier Name"
                            type="text"
                            value={supplierForm.name}
                            onChange={(e) =>
                                setSupplierForm({ ...supplierForm, name: e.target.value })
                            }
                        />
                        <FloatingInput
                            label="Supplier VAT No"
                            type="text"
                            value={supplierForm.vatNo}
                            onChange={(e) =>
                                setSupplierForm({ ...supplierForm, vatNo: e.target.value })
                            }
                        />
                        <SearchableSelect
                            label="Supplier Type"
                            options={supplierTypeOptions}
                            value={supplierForm.type}
                            onChange={(value) =>
                                setSupplierForm({ ...supplierForm, type: value })
                            }
                            placeholder="Select supplier type"
                            searchable={false}
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateSupplier}
                                disabled={isSaving || !supplierForm.name || !supplierForm.type}
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Supplier'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this supplier? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
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
