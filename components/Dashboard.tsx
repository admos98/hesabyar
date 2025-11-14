import React, { useMemo, useState } from 'react';
import { DollarSign, ShoppingBag, ArrowUp, ArrowDown, AlertTriangle, LineChart as LineChartIcon, TrendingUp, AlertCircle, Check } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getSales, getReceipts, getPurchaseItems, getSellableItems } from '../lib/api';
import { calculateStock, calculateMetrics, getWeeklyData, getMonthlyTrends, getCategoryBreakdown, getSalesPerformance, getInventoryHealth, formatToman, formatPercent } from '../lib/utils';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, trend, isLoading, subtitle }: { title: string, value: string, icon: React.ElementType, trend?: number, isLoading: boolean, subtitle?: string }) => (
  <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800 hover:shadow-lg transition-shadow">
     {isLoading ? (
       <div className="animate-pulse">
         <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
         <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
         <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
       </div>
     ) : (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 text-white bg-primary-500 rounded-full">
            {React.createElement(icon, { className: "w-6 h-6" })}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`mt-3 flex items-center text-sm ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? <ArrowUp className="w-4 h-4 me-1" /> : <ArrowDown className="w-4 h-4 me-1" />}
            {Math.abs(trend).toFixed(1)}% نسبت به ماه قبل
          </div>
        )}
      </div>
     )}
  </div>
);

const InventoryHealthBadge = ({ healthy, warning, critical }: { healthy: number, warning: number, critical: number }) => (
  <div className="grid grid-cols-3 gap-2">
    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
      <div className="flex items-center justify-center mb-1">
        <Check className="w-4 h-4 text-green-600" />
      </div>
      <p className="text-lg font-bold text-green-600">{healthy}</p>
      <p className="text-xs text-green-600">سالم</p>
    </div>
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
      <div className="flex items-center justify-center mb-1">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
      </div>
      <p className="text-lg font-bold text-yellow-600">{warning}</p>
      <p className="text-xs text-yellow-600">هشدار</p>
    </div>
    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
      <div className="flex items-center justify-center mb-1">
        <AlertCircle className="w-4 h-4 text-red-600" />
      </div>
      <p className="text-lg font-bold text-red-600">{critical}</p>
      <p className="text-xs text-red-600">بحرانی</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
    const [monthRange, setMonthRange] = useState(1);

    const { data: sales, isLoading: isLoadingSales } = useQuery({
        queryKey: ['sales'],
        queryFn: getSales,
    });
    
    const { data: receipts, isLoading: isLoadingReceipts } = useQuery({
        queryKey: ['receipts'],
        queryFn: getReceipts,
    });
    
    const { data: purchaseItems, isLoading: isLoadingPurchaseItems } = useQuery({
        queryKey: ['purchaseItems'],
        queryFn: getPurchaseItems,
    });

    const { data: sellableItems } = useQuery({
        queryKey: ['sellableItems'],
        queryFn: getSellableItems,
    });

    const allData = { receipts, sales, purchaseItems };

    // Advanced calculations
    const metrics = useMemo(() => calculateMetrics(allData), [allData]);
    const weeklyData = useMemo(() => getWeeklyData(sales || [], receipts || []), [sales, receipts]);
    const monthlyTrends = useMemo(() => getMonthlyTrends(sales || [], receipts || [], 6), [sales, receipts]);
    const categoryBreakdown = useMemo(() => getCategoryBreakdown(receipts || [], purchaseItems || []), [receipts, purchaseItems]);
    const salesPerformance = useMemo(() => getSalesPerformance(sales || [], [], sellableItems || []), [sales, sellableItems]);
    const inventoryHealth = useMemo(() => getInventoryHealth(allData), [allData]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const monthlySales = sales
        ?.filter(s => new Date(s.saleDate) >= startOfMonth)
        .reduce((sum, s) => sum + s.totalAmount, 0) ?? 0;
        
    const lastMonthSales = sales
        ?.filter(s => {
            const d = new Date(s.saleDate);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        })
        .reduce((sum, s) => sum + s.totalAmount, 0) ?? 0;

    const salesTotalExpenses = receipts
        ?.filter(r => new Date(r.receiptDate) >= startOfMonth)
        .reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;

    const profit = monthlySales - salesTotalExpenses;
    const salesTrend = lastMonthSales > 0 ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100 : 0;

    const lowStockItems = purchaseItems
        ?.map(item => ({
            ...item,
            stock: calculateStock(item.id, allData),
        }))
        .filter(item => item.stock <= item.minStockThreshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5) ?? [];

    const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    const isLoading = isLoadingSales || isLoadingReceipts || isLoadingPurchaseItems;

    return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">داشبورد</h1>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          آخر‌روز‌رسانی: {new Date().toLocaleDateString('fa-IR')}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="کل فروش (این ماه)" 
          value={formatToman(monthlySales)} 
          icon={DollarSign} 
          isLoading={isLoadingSales}
          trend={salesTrend}
          subtitle={`${formatToman(metrics.totalRevenue)} کل`}
        />
        <StatCard 
          title="کل هزینه‌ها (این ماه)" 
          value={formatToman(salesTotalExpenses)} 
          icon={ShoppingBag} 
          isLoading={isLoadingReceipts}
          subtitle={`${formatToman(metrics.totalExpenses)} کل`}
        />
        <StatCard 
          title="سود / زیان" 
          value={formatToman(profit)} 
          icon={TrendingUp} 
          isLoading={isLoadingSales || isLoadingReceipts}
          subtitle={`حاشیه: ${formatPercent(metrics.profitMargin)}`}
        />
        <StatCard 
          title="میانگین تراکنش" 
          value={formatToman(metrics.avgTransactionValue)} 
          icon={LineChartIcon} 
          isLoading={isLoading}
          subtitle={`${metrics.totalTransactions} تراکنش`}
        />
      </div>

      {/* Inventory Health */}
      <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
        <h2 className="text-lg font-bold mb-4">وضعیت موجودی</h2>
        <InventoryHealthBadge {...inventoryHealth} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-bold mb-4">رفتار هفتگی</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatToman((value as number) * 1000)} />
                <Tooltip formatter={(value) => formatToman((value as number) * 1000)} />
                <Legend />
                <Bar dataKey="هزینه" fill="#ef4444" name="هزینه" radius={[4, 4, 0, 0]} />
                <Bar dataKey="درآمد" fill="#22c55e" name="درآمد" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
            <h2 className="text-lg font-bold mb-4">اقلام با موجودی کم</h2>
            <div className="space-y-3">
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>)
                ) : lowStockItems.length > 0 ? (
                    lowStockItems.map(item => (
                        <div key={item.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.stock} {item.unit} / {item.minStockThreshold}</p>
                                </div>
                                <Link to="/inventory" className="text-xs bg-primary-500 text-white px-2 py-1 rounded hover:bg-primary-600">
                                    ویرایش
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-500 text-sm py-4">وضعیت موجودی خوب است</p>
                )}
             </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
        <h2 className="text-lg font-bold mb-4">رفتار ماهانه (۶ ماه)</h2>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value as number / 1000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => formatToman((value as number) * 1000)} />
              <Legend />
              <Line type="monotone" dataKey="درآمد" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="هزینه" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="سود" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
            <h2 className="text-lg font-bold mb-4">توزیع هزینه‌ها براساس دسته</h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatToman(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatToman(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Selling Items */}
        {salesPerformance.length > 0 && (
          <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
            <h2 className="text-lg font-bold mb-4">محصولات پرفروش</h2>
            <div className="space-y-3">
              {salesPerformance.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.count} فروخته شده</p>
                  </div>
                  <p className="font-bold text-primary-600">{formatToman(item.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
