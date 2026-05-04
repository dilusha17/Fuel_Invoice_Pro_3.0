import { usePage, router } from '@inertiajs/react';
import { NavLink } from '@/components/NavLink';
import {
    FileText,
    ClipboardList,
    Receipt,
    History,
    Banknote,
    BarChart2,
    Scale,
    Users,
    Settings,
    Menu,
    X,
    Shield,
    LogOut,
    User,
    Calendar,
    Clock,
    Printer,
    ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const navItems = [
    { path: '/', label: 'Invoice Form', icon: FileText },
    { path: '/manage', label: 'Manage Invoices', icon: ClipboardList },
    { path: '/tax-invoice', label: 'Tax Invoice', icon: Receipt },
    { path: '/history', label: 'Invoice History', icon: History },
    { path: '/invoice-summary', label: 'Invoice Summary', icon: Printer },
    { path: '/monthly-sale', label: 'Monthly Sale', icon: Banknote },
    { path: '/purchase', label: 'Purchase', icon: ShoppingCart },
    { path: '/purchase-summary', label: 'Purchase Summary', icon: BarChart2 },
    { path: '/vat-balance', label: 'VAT Balance', icon: Scale },
    { path: '/clients', label: 'Client Details', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const page = usePage();
    const { auth } = page.props as { auth?: { user?: { user_type?: string; name?: string; email?: string; expired_at?: string } } };
    const user = auth?.user;
    const isAdmin = user?.user_type === 'admin';
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    // Calculate days remaining until expiry for regular users
    const expiryInfo = useMemo(() => {
        if (!user || isAdmin || !user.expired_at) {
            return null;
        }

        const now = new Date();
        const expiryDate = new Date(user.expired_at);
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            days: diffDays,
            isExpired: diffDays < 0,
            isExpiringSoon: diffDays > 0 && diffDays <= 7,
            isWarning: diffDays > 7 && diffDays <= 30,
            expiryDate: expiryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        };
    }, [user, isAdmin]);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                type="button"
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-sidebar-foreground rounded-xl shadow-elevated"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <Menu className="h-5 w-5" />
                )}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-300 ease-out',
                    mobileOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-sidebar-border">
                        <h1 className="text-xl font-bold text-sidebar-foreground">
                            Fuel <span className="text-primary">Invoice </span>
                            Pro 2.0
                        </h1>
                        <p className="text-xs text-sidebar-foreground/60 mt-1">
                            Tax Invoice Management
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = page.url === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-glow'
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </NavLink>
                            );
                        })}

                        {/* Admin Section - Only visible to admins */}
                        {isAdmin && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="px-4 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                                        Administration
                                    </p>
                                </div>
                                <NavLink
                                    to="/admin/users"
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                        page.url.startsWith('/admin')
                                            ? 'bg-primary text-primary-foreground shadow-glow'
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                    )}
                                >
                                    <Shield className="h-5 w-5" />
                                    Admin
                                </NavLink>
                            </>
                        )}
                    </nav>

                    {/* User Menu Footer */}
                    {user && (
                        <div className="p-4 border-t border-sidebar-border space-y-3">
                            {/* Account Expiry Countdown - Only for regular users */}
                            {expiryInfo && (
                                <div
                                    className={cn(
                                        'p-3 rounded-xl border',
                                        expiryInfo.isExpired
                                            ? 'bg-destructive/10 border-destructive/50'
                                            : expiryInfo.isExpiringSoon
                                              ? 'bg-orange-500/10 border-orange-500/50'
                                              : expiryInfo.isWarning
                                                ? 'bg-yellow-500/10 border-yellow-500/50'
                                                : 'bg-green-500/10 border-green-500/50',
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Calendar
                                            className={cn(
                                                'h-4 w-4',
                                                expiryInfo.isExpired
                                                    ? 'text-destructive'
                                                    : expiryInfo.isExpiringSoon
                                                      ? 'text-orange-500'
                                                      : expiryInfo.isWarning
                                                        ? 'text-yellow-600'
                                                        : 'text-green-600',
                                            )}
                                        />
                                        <p className="text-xs font-semibold text-sidebar-foreground/80">
                                            Account Expiry
                                        </p>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <Clock
                                            className={cn(
                                                'h-3.5 w-3.5',
                                                expiryInfo.isExpired
                                                    ? 'text-destructive'
                                                    : expiryInfo.isExpiringSoon
                                                      ? 'text-orange-500'
                                                      : expiryInfo.isWarning
                                                        ? 'text-yellow-600'
                                                        : 'text-green-600',
                                            )}
                                        />
                                        {expiryInfo.isExpired ? (
                                            <p className="text-xs font-medium text-destructive">
                                                Expired
                                            </p>
                                        ) : (
                                            <>
                                                <p
                                                    className={cn(
                                                        'text-lg font-bold',
                                                        expiryInfo.isExpiringSoon
                                                            ? 'text-orange-500'
                                                            : expiryInfo.isWarning
                                                              ? 'text-yellow-600'
                                                              : 'text-green-600',
                                                    )}
                                                >
                                                    {expiryInfo.days}
                                                </p>
                                                <p className="text-xs text-sidebar-foreground/60">
                                                    {expiryInfo.days === 1
                                                        ? 'day left'
                                                        : 'days left'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-sidebar-foreground/50 mt-1">
                                        {expiryInfo.expiryDate}
                                    </p>
                                </div>
                            )}

                            {/* User Avatar Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent transition-all duration-200 text-left">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-sidebar-foreground/60 capitalize">
                                                {user.user_type}
                                            </p>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Signed in as{' '}
                                        <strong>{user.name}</strong>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-destructive cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
