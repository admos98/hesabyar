import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getReceipts, getRecurringExpenses, getSales, getPurchaseItems } from '../lib/api';
import { Loader2, PlusCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { formatToman, getCategoryBreakdown } from '../lib/utils';

interface ExpenseCategory {
    name: string;
    value: number;
    percentage: number;
}

const Reports: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    const { data: receipts, isLoading: isLoadingReceipts } = useQuery({
      queryKey: ['receipts'],
      queryFn: getReceipts
    });

    const { data: sales, isLoading: isLoadingSales } = useQuery({
      queryKey: ['sales'],
      queryFn: getSales
    });

    const { data: purchaseItems } = useQuery({
        queryKey: ['purchaseItems'],
        queryFn: getPurchaseItems,
    });

    const { data: recurringExpenses, isLoading: isLoadingRecurring } = useQuery({
        queryKey: ['recurringExpenses'],
        queryFn: getRecurringExpenses,
    });

    // Filter data by time range
    const getDateRange = (range: string) => {
        const now = new Date();
        const start = new Date();
        
        switch(range) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }
        return { start, now };
    };

    const { start: rangeStart, now: rangeEnd } = useMemo(() => getDateRange(timeRange), [timeRange]);

    // Category breakdown analysis
    const categoryData = useMemo(() => {
        const filtered = receipts?.filter(r => {
            const d = new Date(r.receiptDate);
            return d >= rangeStart && d <= rangeEnd;
        }) || [];
        
        return getCategoryBreakdown(filtered, purchaseItems || []);
    }, [receipts, purchaseItems, rangeStart, rangeEnd]);

    const totalExpenses = useMemo(() => 
        categoryData.reduce((sum, cat) => sum + cat.value, 0),
        [categoryData]
    );

    const categoryWithPercentage = useMemo(() => 
        categoryData.map(cat => ({
            ...cat,
            percentage: totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0
        })),
        [categoryData, totalExpenses]
    );

    // Monthly comparison
    const monthlyComparison = useMemo(() => {
        const comparison = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            const monthSales = (sales || [])
                .filter(s => {
                    const d = new Date(s.saleDate);
                    return d >= monthStart && d <= monthEnd;
                })
                .reduce((sum, s) => sum + s.totalAmount, 0);

            const monthExpenses = (receipts || [])
                .filter(r => {
                    const d = new Date(r.receiptDate);
                    return d >= monthStart && d <= monthEnd;
                })
                .reduce((sum, r) => sum + r.totalAmount, 0);

            comparison.push({
                name: monthStart.toLocaleDateString('fa-IR', { month: 'short' }),
                درآمد: monthSales / 1000000,
                هزینه: monthExpenses / 1000000,
                سود: (monthSales - monthExpenses) / 1000000,
            });
        }
        return comparison;
    }, [sales, receipts]);

    // Recurring expenses projection
    const recurringProjection = useMemo(() => {
        if (!recurringExpenses) return 0;
        return recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [recurringExpenses]);

    const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
    const isLoading = isLoadingReceipts || isLoadingSales || isLoadingRecurring;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">گزارشات و تحلیل‌های مالی</h1>
                <div className="flex gap-2">
                    {(['week', 'month', 'quarter', 'year'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                timeRange === range 
                                    ? 'bg-primary-500 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                        >
                            {range === 'week' ? 'هفته' : range === 'month' ? 'ماه' : range === 'quarter' ? 'سه‌ماهه' : 'سال'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">کل هزینه‌ها</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-300">{formatToman(totalExpenses)}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-red-400 opacity-20" />
                    </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">هزینه‌های تکرارشونده</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-300">{formatToman(recurringProjection)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-400 opacity-20" />
                    </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">میانگین روزانه</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{formatToman(totalExpenses / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365))}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-400 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Category Pie Chart */}
                <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                    <h2 className="text-lg font-bold mb-4">توزیع هزینه‌ها براساس دسته</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin" /></div>
                    ) : categoryData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value, percentage }) => `${name}: ${((value/totalExpenses)*100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatToman(value as number)}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                         <div className="flex justify-center items-center h-[300px] text-slate-500">داده‌ای برای نمایش وجود ندارد.</div>
                    )}
                </div>

                {/* Category Details Table */}
                <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                    <h2 className="text-lg font-bold mb-4">تفصیل هزینه‌ها</h2>
                    <div className="space-y-2">
                        {categoryWithPercentage.length > 0 ? (
                            categoryWithPercentage.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                        ></div>
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{cat.percentage.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                    <p className="font-bold">{formatToman(cat.value)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-8">داده‌ای برای نمایش وجود ندارد.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                <h2 className="text-lg font-bold mb-4">مقایسه ماهانه</h2>
                {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={monthlyComparison}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `${(value).toFixed(0)}M`} />
                                <Tooltip formatter={(value) => formatToman((value as number) * 1000000)} />
                                <Legend />
                                <Bar dataKey="درآمد" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="هزینه" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="سود" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Recurring Expenses */}
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">هزینه‌های تکرارشونده</h2>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-white rounded-lg bg-primary-500 hover:bg-primary-600">
                        <PlusCircle size={16}/>
                        <span>افزودن</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoadingRecurring ? (
                       <div className="flex justify-center items-center h-[200px] md:col-span-2"><Loader2 className="animate-spin" /></div>
                    ) : recurringExpenses && recurringExpenses.length > 0 ? (
                        recurringExpenses.map(expense => (
                            <div key={expense.id} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold">{expense.title}</p>
                                    <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded">{expense.category}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">روز {expense.dueDate} هر ماه</p>
                                <p className="text-lg font-bold text-primary-600">{formatToman(expense.amount)}</p>
                            </div>
                        ))
                    ) : (
                       <div className="flex justify-center items-center h-[200px] md:col-span-2 text-slate-500">هیچ هزینه تکرارشونده‌ای ثبت نشده.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
