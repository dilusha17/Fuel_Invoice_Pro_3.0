import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';

interface User {
    id: number;
    name: string;
    user_type: string;
    expired_at: string | null;
}

interface Props {
    user: User;
}

interface FormData {
    name: string;
    password: string;
    user_type: string;
    expired_at: string;
}

export default function Edit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: user.name,
        password: '',
        user_type: user.user_type,
        expired_at: user.expired_at ? user.expired_at.split('T')[0] : '',
    });

    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [extendOption, setExtendOption] = useState('');

    const handleExtendExpiry = () => {
        if (!extendOption) return;

        const currentExpiry = data.expired_at
            ? new Date(data.expired_at)
            : new Date();

        let daysToAdd = 0;
        if (extendOption === '1') daysToAdd = 30;
        else if (extendOption === '3') daysToAdd = 90;
        else if (extendOption === '12') daysToAdd = 365;

        const newDate = new Date(currentExpiry);
        newDate.setDate(newDate.getDate() + daysToAdd);
        setData('expired_at', newDate.toISOString().split('T')[0]);
        setExtendOption('');
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        put(`/admin/users/${user.id}`, {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'User updated successfully.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description:
                        'Failed to update user. Please check the form.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <>
            <Head title={`Edit User - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Edit User
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Update user information for {user.name}
                        </p>
                    </div>
                </div>

                {/* Edit Form */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Update the information below to modify the user
                            account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Username{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Enter username"
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                    disabled={processing}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span className="text-muted-foreground">
                                        (Optional)
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="Leave empty to keep current password"
                                        className={
                                            errors.password
                                                ? 'border-destructive pr-10'
                                                : 'pr-10'
                                        }
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Only fill this field if you want to change
                                    the password.
                                </p>
                                {errors.password && (
                                    <p className="text-xs text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* User Type */}
                            <div className="space-y-2">
                                <Label htmlFor="user_type">
                                    User Type{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.user_type}
                                    onValueChange={(value) =>
                                        setData('user_type', value)
                                    }
                                    disabled={processing}
                                >
                                    <SelectTrigger
                                        className={
                                            errors.user_type
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select user type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            User
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.user_type && (
                                    <p className="text-xs text-destructive">
                                        {errors.user_type}
                                    </p>
                                )}
                            </div>

                            {/* Expiry Date */}
                            <div className="space-y-2">
                                <Label htmlFor="expired_at">
                                    Expiry Date{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <DatePickerField
                                    label="Expiry Date"
                                    value={data.expired_at ? new Date(data.expired_at) : undefined}
                                    onChange={() => {}}
                                    placeholder={data.expired_at ? undefined : 'No expiry date set'}
                                    disabled={true}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Users cannot login after this date. Use the extend option below to change.
                                </p>
                                {errors.expired_at && (
                                    <p className="text-xs text-destructive">
                                        {errors.expired_at}
                                    </p>
                                )}
                            </div>

                            {/* Extend Expiry Date */}
                            <div className="space-y-2">
                                <Label>Extend For:</Label>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={extendOption}
                                        onValueChange={setExtendOption}
                                        disabled={processing}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">01 Month</SelectItem>
                                            <SelectItem value="3">03 Months</SelectItem>
                                            <SelectItem value="12">01 Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        onClick={handleExtendExpiry}
                                        disabled={!extendOption || processing}
                                        className="gap-2"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update User'
                                    )}
                                </Button>
                                <Link href="/admin/users">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
