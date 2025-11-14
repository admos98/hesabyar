import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseItems, getReceipts, getSales, getRecipes } from '../lib/api';
import { calculateStock, calculatePriceHistory, formatToman } from '../lib/utils';
import { AlertTriangle, Loader2, TrendingDown, TrendingUp, Package } from 'lucide-react';

const Inventory: React.FC = () => {
    const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value'>('name');
    const [filterCategory, setFilterCategory] = useState('');

    const { data: purchaseItems, isLoading: isLoadingPI } = useQuery({ queryKey: ['purchaseItems'], queryFn: getPurchaseItems });
    const { data: receipts, isLoading: isLoadingR } = useQuery({ queryKey: ['receipts'], queryFn: getReceipts });
    const { data: sales, isLoading: isLoadingS } = useQuery({ queryKey: ['sales'], queryFn: getSales });
    const { data: recipes, isLoading: isLoadingRecipes } = useQuery({ queryKey: ['recipes'], queryFn: getRecipes });

    const isLoading = isLoadingPI || isLoadingR || isLoadingS || isLoadingRecipes;

    const allData = { receipts, sales, purchaseItems, recipes };

    const inventoryWithStock = React.useMemo(() => {
        if (!purchaseItems || !receipts || !sales || !recipes) return [];
        
        let inventory = purchaseItems.map(item => {
            const stock = calculateStock(item.id, allData);
            const priceHistory = calculatePriceHistory(item.id, allData);
            const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;
            const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : currentPrice;
            const priceChange = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
            
            return {
                ...item,
                stock,
                priceHistory,
                currentPrice,
                priceChange,
                stockValue: stock * currentPrice,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        // Apply filters and sorting
        if (filterCategory) {
            inventory = inventory.filter(i => i.category === filterCategory);
        }

        switch (sortBy) {
            case 'stock':
                return inventory.sort((a, b) => a.stock - b.stock);
            case 'value':
                return inventory.sort((a, b) => b.stockValue - a.stockValue);
            default:
                return inventory;
        }
    }, [purchaseItems, receipts, sales, recipes, allData, sortBy, filterCategory]);

    const categories = React.useMemo(() => {
        if (!purchaseItems) return [];
        return [...new Set(purchaseItems.map(p => p.category))].sort();
    }, [purchaseItems]);

    const totalStockValue = React.useMemo(() => {
        return inventoryWithStock.reduce((sum, item) => sum + item.stockValue, 0);
    }, [inventoryWithStock]);

    const criticalItems = React.useMemo(() => {
        return inventoryWithStock.filter(i => i.stock <= i.minStockThreshold);
    }, [inventoryWithStock]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">مدیریت موجودی</h1>
                <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">ارزش کل موجودی</p>
                    <p className="text-2xl font-bold text-primary-600">{formatToman(totalStockValue)}</p>
                </div>
            </div>

            {/* Inventory Summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-600 font-medium">کل اقلام</p>
                    <p className="text-2xl font-bold text-blue-700">{inventoryWithStock.length}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm text-yellow-600 font-medium">موجودی هشدار</p>
                    <p className="text-2xl font-bold text-yellow-700">{criticalItems.length}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-green-600 font-medium">ارزش متوسط</p>
                    <p className="text-2xl font-bold text-green-700">{formatToman(totalStockValue / (inventoryWithStock.length || 1))}</p>
                </div>
            </div>

            {/* Filters & Sort */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                <div className="flex gap-4">
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="name">ترتیب: نام</option>
                        <option value="stock">ترتیب: موجودی</option>
                        <option value="value">ترتیب: ارزش</option>
                    </select>
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="">تمام دسته‌بندی‌ها</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    نمایش: {inventoryWithStock.length} از {purchaseItems?.length || 0}
                </p>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">نام کالا</th>
                            <th className="px-6 py-3">دسته‌بندی</th>
                            <th className="px-6 py-3">واحد</th>
                            <th className="px-6 py-3">موجودی</th>
                            <th className="px-6 py-3">آستانه</th>
                            <th className="px-6 py-3">قیمت</th>
                            <th className="px-6 py-3">تغییر قیمت</th>
                            <th className="px-6 py-3">ارزش</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center p-8"><Loader2 className="inline animate-spin"/></td></tr>
                        ) : inventoryWithStock.length > 0 ? (
                            inventoryWithStock.map(item => {
                                const isLowStock = item.stock <= item.minStockThreshold;
                                const isOutOfStock = item.stock <= 0;
                                return (
                                    <tr key={item.id} className={`border-b dark:border-gray-700 ${isOutOfStock ? 'bg-red-50 dark:bg-red-900/20' : isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {isOutOfStock && <AlertTriangle className="w-5 h-5 text-red-500"/>}
                                            {isLowStock && !isOutOfStock && <AlertTriangle className="w-5 h-5 text-yellow-500"/>}
                                            {!isLowStock && !isOutOfStock && <Package className="w-5 h-5 text-green-500"/>}
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-xs bg-slate-100 dark:bg-slate-700/50 rounded">{item.category}</td>
                                        <td className="px-6 py-4">{item.unit}</td>
                                        <td className={`px-6 py-4 font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {item.stock.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{item.minStockThreshold}</td>
                                        <td className="px-6 py-4">{formatToman(item.currentPrice)}</td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1 ${item.priceChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {Math.abs(item.priceChange).toFixed(1)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold">{formatToman(item.stockValue)}</td>
                                    </tr>
                                )
                            })
                        ) : (
                             <tr><td colSpan={8} className="text-center p-8 text-slate-500">هیچ کالایی برای نمایش موجودی یافت نشد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Price Charts */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">تحلیل قیمت و رفتار</h2>
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="inline animate-spin"/></div>
                ) : inventoryWithStock.map(item => (
                    item.priceHistory && item.priceHistory.length > 1 && (
                        <div key={item.id} className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{item.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        موجودی: {item.stock} {item.unit} | ارزش: {formatToman(item.stockValue)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">قیمت فعلی</p>
                                    <p className="text-xl font-bold text-primary-600">{formatToman(item.currentPrice)}</p>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={item.priceHistory}>
                                        <defs>
                                            <linearGradient id={`colorPrice-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} style={{ fontSize: '12px' }} />
                                        <Tooltip formatter={(value) => formatToman(value as number)} />
                                        <Area type="monotone" dataKey="price" stroke="#0ea5e9" fillOpacity={1} fill={`url(#colorPrice-${item.id})`} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default Inventory;
