import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { ShieldCheck } from 'lucide-react';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

export default function Login() {
    return (
        <>
            <Head title="Login - Fuel Invoice Pro" />
            <AuthLayout>
                <AuthCard>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                            <ShieldCheck className="h-7 w-7 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Sign in to your Fuel Invoice Pro account
                        </p>
                    </div>

                    {/* Login Form */}
                    <LoginForm />
                </AuthCard>
            </AuthLayout>
        </>
    );
}

Login.layout = (page: ReactNode) => page;
