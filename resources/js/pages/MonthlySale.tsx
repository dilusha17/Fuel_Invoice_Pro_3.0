import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Banknote,
    Loader2,
    Printer,
    TrendingUp,
    Calculator,
    Receipt,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { useToast } from '@/hooks/use-toast';

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
        const year = currentYear - i;
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};

const years = generateYears();

const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface RecentEntry {
    year: number;
    month: string;
    income: number;
    vat_percentage: number;
    vat_amount: number;
    net_amount: number;
}

interface MonthlySaleProps {
    recentEntries: RecentEntry[];
    vatPercentage: number;
}

export default function MonthlySale({
    recentEntries,
    vatPercentage,
}: MonthlySaleProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');
    const [isLoading, setIsLoading] = useState(false);

    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const [entryData, setEntryData] = useState({
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
        totalIncome: '',
    });

    const [historyData, setHistoryData] = useState({
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
    });

    const [retrievedData, setRetrievedData] = useState<{
        totalIncome: number;
        vatAmount: number;
        vatPercentage: number;
        netAmount: number;
    } | null>(null);

    // Preview calculation for entry tab
    const previewVatAmount = (() => {
        const income = parseFloat(entryData.totalIncome) || 0;
        if (income <= 0 || vatPercentage <= 0) return { vatAmount: 0, netAmount: 0 };
        const vatAmount = Math.round((income * (vatPercentage / (100 + vatPercentage))) * 100) / 100;
        const netAmount = Math.round((income - vatAmount) * 100) / 100;
        return { vatAmount, netAmount };
    })();

    const handleSave = async () => {
        if (!entryData.totalIncome) {
            toast({
                title: 'Validation Error',
                description: 'Please enter the total income amount.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/monthly-sale/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    year: parseInt(entryData.year),
                    month: parseInt(entryData.month),
                    income: parseFloat(entryData.totalIncome),
                }),
            });

            const data = await response.json();

            if (data.success) {
                const monthName = months.find((m) => m.value === entryData.month)?.label;
                toast({
                    title: 'Monthly Sale Saved!',
                    description: `Monthly sale for ${monthName} ${entryData.year} saved successfully.`,
                });
                setEntryData({ ...entryData, totalIncome: '' });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to save monthly sale.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save monthly sale.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/monthly-sale/show', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    year: parseInt(historyData.year),
                    month: parseInt(historyData.month),
                }),
            });

            const data = await response.json();

            if (data.success && data.data) {
                setRetrievedData({
                    totalIncome:   data.data.income,
                    vatPercentage: data.data.vatPercentage,
                    vatAmount:     data.data.vatAmount,
                    netAmount:     data.data.netAmount,
                });

                toast({
                    title: 'Data Retrieved',
                    description: 'Monthly sale record found.',
                });
            } else {
                setRetrievedData(null);
                const monthName = months.find((m) => m.value === historyData.month)?.label;
                toast({
                    title: 'No Data',
                    description: `No monthly sale record found for ${monthName} ${historyData.year}.`,
                    variant: 'destructive',
                });
            }
        } catch {
            setRetrievedData(null);
            toast({
                title: 'Error',
                description: 'Failed to retrieve monthly sale record.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!retrievedData) return;
        const pdfUrl = `/monthly-sale/pdf/${historyData.year}/${historyData.month}`;
        window.open(pdfUrl, '_blank');
        toast({
            title: 'PDF Generated',
            description: 'Opening monthly sale PDF in new window...',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-success/10">
                        <Banknote className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Monthly Sale
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Record and manage monthly sales
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="card-neumorphic p-2 inline-flex gap-1 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('entry')}
                    className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeTab === 'entry'
                            ? 'bg-primary text-primary-foreground shadow-glow'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                    Entry
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeTab === 'history'
                            ? 'bg-primary text-primary-foreground shadow-glow'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                    Print / History
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entry Panel */}
                {activeTab === 'entry' && (
                    <div className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance">
                        <h2 className="text-lg font-semibold text-foreground">
                            Record Monthly Sale
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <SearchableSelect
                                label="Year"
                                options={years}
                                value={entryData.year}
                                onChange={(value) => setEntryData({ ...entryData, year: value })}
                            />
                            <SearchableSelect
                                label="Month"
                                options={months}
                                value={entryData.month}
                                onChange={(value) => setEntryData({ ...entryData, month: value })}
                            />
                        </div>

                        <FloatingInput
                            label="Total Income (LKR)"
                            type="number"
                            value={entryData.totalIncome}
                            onChange={(e) => setEntryData({ ...entryData, totalIncome: e.target.value })}
                            className="border-2 border-success/30 focus:border-success"
                        />

                        {/* VAT preview */}
                        {parseFloat(entryData.totalIncome) > 0 && (
                            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">VAT ({vatPercentage}%)</span>
                                    <span className="font-medium">LKR {formatCurrency(previewVatAmount.vatAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Net Sale (Excl. VAT)</span>
                                    <span className="font-semibold text-success">LKR {formatCurrency(previewVatAmount.netAmount)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading || !entryData.totalIncome}
                            className="btn-success-glow w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                )}

                {/* History Panel */}
                {activeTab === 'history' && (
                    <div className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance">
                        <h2 className="text-lg font-semibold text-foreground">
                            Retrieve & Print
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <SearchableSelect
                                label="Year"
                                options={years}
                                value={historyData.year}
                                onChange={(value) => {
                                    setHistoryData({ ...historyData, year: value });
                                    setRetrievedData(null);
                                }}
                            />
                            <SearchableSelect
                                label="Month"
                                options={months}
                                value={historyData.month}
                                onChange={(value) => {
                                    setHistoryData({ ...historyData, month: value });
                                    setRetrievedData(null);
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleView}
                            disabled={isLoading}
                            className="btn-primary-glow w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            {isLoading ? 'Loading...' : 'View'}
                        </button>

                        {retrievedData && (
                            <div className="bg-success/5 border border-success/20 rounded-2xl p-6 space-y-4 animate-scale-in">
                                {/* Total Income */}
                                <div className="text-center pb-4 border-b border-success/20">
                                    <TrendingUp className="h-8 w-8 mx-auto text-success mb-2" />
                                    <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        LKR {formatCurrency(retrievedData.totalIncome)}
                                    </p>
                                </div>

                                {/* VAT Amount */}
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            VAT ({retrievedData.vatPercentage}%)
                                        </span>
                                    </div>
                                    <span className="font-medium text-foreground">
                                        LKR {formatCurrency(retrievedData.vatAmount)}
                                    </span>
                                </div>

                                {/* Net Sale */}
                                <div className="flex items-center justify-between py-3 px-4 bg-success/10 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-success" />
                                        <span className="font-semibold text-foreground">Net Sale</span>
                                    </div>
                                    <span className="text-xl font-bold text-success">
                                        LKR {formatCurrency(retrievedData.netAmount)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="btn-success-glow w-full mt-4 flex items-center justify-center gap-2"
                                >
                                    <Printer className="h-5 w-5" />
                                    Print
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Activity Feed */}
                <div className="card-neumorphic p-6 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Recent Entries
                    </h2>
                    <div className="space-y-3">
                        {recentEntries.length > 0 ? (
                            recentEntries.map((entry) => {
                                const monthName = months.find((m) => m.value === entry.month)?.label;
                                return (
                                    <div
                                        key={`${entry.year}-${entry.month}`}
                                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {monthName} {entry.year}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Monthly Sale Record
                                            </p>
                                        </div>
                                        <p className="font-semibold text-success">
                                            LKR {formatCurrency(entry.income)}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent entries
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
