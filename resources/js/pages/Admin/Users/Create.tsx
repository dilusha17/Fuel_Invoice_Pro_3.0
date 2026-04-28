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

interface FormData {
    name: string;
    password: string;
    user_type: string;
    expired_at: string;
}

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        password: '',
        user_type: 'user',
        expired_at: '',
    });

    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post('/admin/users', {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'User created successfully.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description:
                        'Failed to create user. Please check the form.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <>
            <Head title="Create User" />

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
                            Create New User
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Add a new user to the system
                        </p>
                    </div>
                </div>

                {/* Create Form */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Fill in the information below to create a new user
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
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="Enter password (min. 6 characters)"
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
                                    onChange={(date) =>
                                        setData('expired_at', date ? date.toISOString().split('T')[0] : '')
                                    }
                                    placeholder="Select expiry date"
                                    disabled={processing}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Users cannot login after this date.
                                </p>
                                {errors.expired_at && (
                                    <p className="text-xs text-destructive">
                                        {errors.expired_at}
                                    </p>
                                )}
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
                                            Creating...
                                        </>
                                    ) : (
                                        'Create User'
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
