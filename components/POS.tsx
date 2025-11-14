import React, { useState, useMemo } from 'react';
import { Plus, Minus, Trash2, X, ShoppingCart, Loader2, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellableItems, createSale, getRecipes, getPurchaseItems } from '../lib/api';
import { useCartStore } from '../store/use-cart-store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatToman } from '../lib/utils';

const POS: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [expandedCart, setExpandedCart] = useState(true);
    const { items, addToCart, updateQuantity, removeFromCart, clearCart } = useCartStore();
    const queryClient = useQueryClient();

    const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
        queryKey: ['sellableItems'],
        queryFn: getSellableItems,
    });
    
    useQuery({ queryKey: ['recipes'], queryFn: getRecipes });
    useQuery({ queryKey: ['purchaseItems'], queryFn: getPurchaseItems });

    const saleMutation = useMutation({
        mutationFn: createSale,
        onSuccess: () => {
            toast.success("فروش با موفقیت ثبت شد.");
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseItems'] });
        },
        onError: (error) => {
            toast.error(`خطا در ثبت فروش: ${error.message}`);
        }
    });

    const handleFinalizeSale = () => {
        if (items.length === 0) return;
        const salePayload = {
            saleDate: new Date().toISOString(),
            items: items.map(item => ({
                sellableItemId: item.id,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
            })),
            totalAmount: totalAmount,
        };
        saleMutation.mutate(salePayload);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const categories = useMemo(() => 
        menuItems ? [...new Set(menuItems.map(i => i.category))].sort() : [],
        [menuItems]
    );

    const filteredMenuItems = useMemo(() => 
        menuItems?.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!categoryFilter || item.category === categoryFilter)
        ) || [],
        [menuItems, searchTerm, categoryFilter]
    );

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col lg:flex-row h-screen">
            <Link to="/" className="absolute top-4 left-4 z-20 p-2 bg-white/50 dark:bg-slate-800/50 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors">
                <X className="w-6 h-6" />
            </Link>
            
            {/* Main content - Menu */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden lg:overflow-y-auto">
                <h1 className="text-3xl font-bold mb-2">ثبت فروش (POS)</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">برای افزودن آیتم کلیک کنید</p>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 mb-4 md:flex-row">
                    <input
                        type="text"
                        placeholder="جستجوی آیتم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">تمام دسته‌بندی‌ها</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Menu Items Grid */}
                {isLoadingMenu ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                            {filteredMenuItems.length > 0 ? (
                                filteredMenuItems.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => addToCart(item)}
                                        className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg hover:ring-2 hover:ring-primary-500 transition-all text-center border-l-4 border-primary-500 flex flex-col justify-between h-full"
                                    >
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">{item.category}</p>
                                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatToman(item.price)}</p>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full text-center p-8 text-slate-500">آیتمی یافت نشد.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar - Cart */}
            <div className={`fixed bottom-0 left-0 right-0 lg:static w-full lg:w-96 h-auto lg:h-full bg-white dark:bg-slate-800 shadow-lg lg:shadow-lg flex flex-col p-4 border-t lg:border-t-0 lg:border-r dark:border-slate-700 transition-all ${expandedCart ? 'max-h-96 lg:max-h-full' : 'max-h-20'} overflow-hidden`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={24} className="text-primary-500" />
                        <h2 className="text-2xl font-bold">سفارش فعلی</h2>
                        {items.length > 0 && (
                            <span className="px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">{items.length}</span>
                        )}
                    </div>
                    <button 
                        onClick={() => setExpandedCart(!expandedCart)}
                        className="lg:hidden p-1"
                    >
                        <ChevronDown className={`w-6 h-6 transition-transform ${expandedCart ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {expandedCart && (
                    <>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
                                    <ShoppingCart size={48} className="mb-3 opacity-50" />
                                    <p className="font-medium">سبد خرید خالی است.</p>
                                    <p className="text-xs mt-1">برای افزودن، روی آیتم‌ها کلیک کنید.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{formatToman(item.price)} × {item.quantity}</p>
                                                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">{formatToman(item.price * item.quantity)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"><Plus size={16}/></button>
                                                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"><Minus size={16}/></button>
                                                <button onClick={() => removeFromCart(item.id)} className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors ml-1"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-3 border-t dark:border-slate-700">
                            {items.length > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                        <span>تعداد کل:</span>
                                        <span>{items.reduce((sum, item) => sum + item.quantity, 0)} عدد</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-3 rounded-lg">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm text-slate-600 dark:text-slate-300">مبلغ کل:</span>
                                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatToman(totalAmount)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={clearCart}
                                        className="w-full text-sm px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                    >
                                        پاک کردن سبد
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={handleFinalizeSale}
                                disabled={items.length === 0 || saleMutation.isPending}
                                className="w-full p-3 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                            >
                                {saleMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />}
                                {saleMutation.isPending ? "در حال ثبت..." : items.length === 0 ? "سبد خالی" : "ثبت نهایی فروش"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default POS;
