import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AppDatabase, Sale, Receipt } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatToman = (value: number) => {
    return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
};

export const formatTomanCompact = (value: number) => {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
};

export const formatPercent = (value: number, decimals = 1) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value) + '%';
};

type CalculationData = {
    receipts?: AppDatabase['receipts'];
    sales?: AppDatabase['sales'];
    purchaseItems?: AppDatabase['purchaseItems'];
    recipes?: AppDatabase['recipes'];
}

// Calculates the current stock of a single purchase item
export const calculateStock = (purchaseItemId: string, allData: CalculationData): number => {
    if (!allData.receipts || !allData.sales || !allData.recipes) return 0;

    // Sum of all items purchased in receipts
    const totalPurchased = allData.receipts.reduce((sum, receipt) => {
        const itemInReceipt = receipt.items.find(item => item.purchaseItemId === purchaseItemId);
        return sum + (itemInReceipt ? itemInReceipt.quantity : 0);
    }, 0);

    // Sum of all items used in sales (based on recipes)
    const totalSold = allData.sales.reduce((sum, sale) => {
        let consumedInSale = 0;
        sale.items.forEach(saleItem => {
            const recipe = allData.recipes!.find(r => r.sellableItemId === saleItem.sellableItemId);
            if (recipe) {
                const ingredient = recipe.ingredients.find(ing => ing.purchaseItemId === purchaseItemId);
                if (ingredient) {
                    consumedInSale += ingredient.quantity * saleItem.quantity;
                }
            }
        });
        return sum + consumedInSale;
    }, 0);

    return totalPurchased - totalSold;
};

// Calculates the price history of a single purchase item
export const calculatePriceHistory = (purchaseItemId: string, allData: CalculationData): { date: string, price: number }[] => {
    if (!allData.receipts) return [];

    const history: { date: string, price: number }[] = [];
    allData.receipts.forEach(receipt => {
        receipt.items.forEach(item => {
            if (item.purchaseItemId === purchaseItemId && item.unitPrice > 0) {
                history.push({
                    date: new Date(receipt.receiptDate).toLocaleDateString('fa-IR'),
                    price: item.unitPrice,
                });
            }
        });
    });
    
    // Sort by date and remove duplicates for the same day, keeping the last price
    return history
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter((item, index, self) => 
            index === self.findIndex((t) => (
                t.date === item.date
            ))
        );
};

// Advanced calculations for dashboard analytics
export const calculateMetrics = (allData: CalculationData) => {
    const sales = allData.sales ?? [];
    const receipts = allData.receipts ?? [];
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const totalTransactions = sales.length + receipts.length;
    const avgTransactionValue = totalTransactions > 0 ? (totalRevenue + totalExpenses) / totalTransactions : 0;
    
    return { totalRevenue, totalExpenses, grossProfit, profitMargin, avgTransactionValue, totalTransactions };
};

// Date range filtering
export const filterByDateRange = (items: (Sale | Receipt)[], startDate: Date, endDate: Date) => {
    return items.filter(item => {
        const itemDate = new Date('saleDate' in item ? item.saleDate : item.receiptDate);
        return itemDate >= startDate && itemDate <= endDate;
    });
};

// Get weekly data for charts
export const getWeeklyData = (sales: Sale[], receipts: Receipt[]) => {
    const now = new Date();
    const weeks = [];
    
    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekSales = filterByDateRange(sales, weekStart, weekEnd).reduce((sum, s) => sum + s.totalAmount, 0);
        const weekExpenses = filterByDateRange(receipts, weekStart, weekEnd).reduce((sum, r) => sum + r.totalAmount, 0);
        
        weeks.push({
            name: `هفته ${4 - i}`,
            درآمد: weekSales / 1000,
            هزینه: weekExpenses / 1000,
        });
    }
    return weeks;
};

// Get monthly trends
export const getMonthlyTrends = (sales: Sale[], receipts: Receipt[], months = 6) => {
    const trends = [];
    
    for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthSales = filterByDateRange(sales, monthStart, monthEnd).reduce((sum, s) => sum + s.totalAmount, 0);
        const monthExpenses = filterByDateRange(receipts, monthStart, monthEnd).reduce((sum, r) => sum + r.totalAmount, 0);
        
        const monthName = monthStart.toLocaleDateString('fa-IR', { month: 'long' });
        trends.push({
            name: monthName,
            درآمد: monthSales / 1000,
            هزینه: monthExpenses / 1000,
            سود: (monthSales - monthExpenses) / 1000,
        });
    }
    return trends;
};

// Category-based analytics
export const getCategoryBreakdown = (receipts: Receipt[], purchaseItems: AppDatabase['purchaseItems']) => {
    const categoryMap = new Map<string, number>();
    
    receipts.forEach(receipt => {
        receipt.items.forEach(item => {
            const purchaseItem = purchaseItems?.find(p => p.id === item.purchaseItemId);
            if (purchaseItem) {
                const current = categoryMap.get(purchaseItem.category) || 0;
                categoryMap.set(purchaseItem.category, current + item.totalPrice);
            }
        });
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
};

// Sales performance
export const getSalesPerformance = (sales: Sale[], recipes: AppDatabase['recipes'], sellableItems: AppDatabase['sellableItems']) => {
    const itemMap = new Map<string, { name: string; count: number; revenue: number }>();
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const sellable = sellableItems?.find(s => s.id === item.sellableItemId);
            if (sellable) {
                const current = itemMap.get(item.sellableItemId) || { name: sellable.name, count: 0, revenue: 0 };
                current.count += item.quantity;
                current.revenue += item.totalPrice;
                itemMap.set(item.sellableItemId, current);
            }
        });
    });
    
    return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
};

// Inventory health check
export const getInventoryHealth = (allData: CalculationData) => {
    if (!allData.purchaseItems) return { healthy: 0, warning: 0, critical: 0 };
    
    let healthy = 0, warning = 0, critical = 0;
    
    allData.purchaseItems.forEach(item => {
        const stock = calculateStock(item.id, allData);
        const threshold = item.minStockThreshold;
        
        if (stock <= 0) critical++;
        else if (stock <= threshold) warning++;
        else healthy++;
    });
    
    return { healthy, warning, critical };
};
