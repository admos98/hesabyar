import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Utensils, BookOpen, Loader2, ChevronDown, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSellableItems, deleteSellableItem, getRecipes, getPurchaseItems } from '../lib/api';
import { SellableItem, Recipe, PurchaseItem } from '../types';
import { formatToman } from '../lib/utils';

const Sales: React.FC = () => {
    const [activeTab, setActiveTab] = useState('menu');
    
    const renderContent = () => {
        switch (activeTab) {
            case 'menu':
                return <MenuContent />;
            case 'recipes':
                return <RecipesContent />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">بخش فروش</h1>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px space-x-6 space-x-reverse" aria-label="Tabs">
                    <TabButton name="menu" activeTab={activeTab} setActiveTab={setActiveTab} icon={Utensils}>منوی فروش</TabButton>
                    <TabButton name="recipes" activeTab={activeTab} setActiveTab={setActiveTab} icon={BookOpen}>دستور پخت</TabButton>
                </nav>
            </div>
            
            <div className="mt-8">{renderContent()}</div>
        </div>
    );
};

const TabButton: React.FC<{name: string, activeTab: string, setActiveTab: (name: string) => void, children: React.ReactNode, icon: React.ElementType}> = ({ name, activeTab, setActiveTab, children, icon: Icon }) => (
    <button onClick={() => setActiveTab(name)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === name ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
        <Icon size={18} />
        {children}
    </button>
);

const MenuContent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const { data: items, isLoading } = useQuery<SellableItem[]>({
        queryKey: ['sellableItems'],
        queryFn: getSellableItems,
    });

    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: deleteSellableItem,
        onSuccess: () => {
            toast.success("آیتم با موفقیت حذف شد.");
            queryClient.invalidateQueries({ queryKey: ['sellableItems'] });
        },
        onError: (error) => {
            toast.error(`خطا در حذف آیتم: ${error.message}`);
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm("آیا از حذف این آیتم مطمئن هستید؟")) {
            deleteMutation.mutate(id);
        }
    }

    const categories = items ? [...new Set(items.map(i => i.category))].sort() : [];
    const filteredItems = items?.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!categoryFilter || item.category === categoryFilter)
    ) || [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="جستجوی آیتم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="">تمام دسته‌بندی‌ها</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600">
                    <PlusCircle size={20} />
                    <span>آیتم جدید</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    ))
                ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div key={item.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary-500">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button><Edit className="w-5 h-5 text-blue-500 hover:text-blue-700"/></button>
                                    <button onClick={() => handleDelete(item.id)} disabled={deleteMutation.isPending}><Trash2 className="w-5 h-5 text-red-500 hover:text-red-700"/></button>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-primary-600">{formatToman(item.price)}</p>
                        </div>
                    ))
                ) : (
                     <div className="col-span-full text-center p-12 text-slate-500">هیچ آیتم فروشی یافت نشد.</div>
                )}
            </div>
        </div>
    );
};

const RecipesContent = () => {
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

    const { data: sellableItems, isLoading: isLoadingSellable } = useQuery<SellableItem[]>({
        queryKey: ['sellableItems'],
        queryFn: getSellableItems,
    });
    
    const { data: recipes, isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
        queryKey: ['recipes'],
        queryFn: getRecipes,
    });
    
    const { data: purchaseItems, isLoading: isLoadingPurchase } = useQuery<PurchaseItem[]>({
        queryKey: ['purchaseItems'],
        queryFn: getPurchaseItems,
    });

    const isLoading = isLoadingSellable || isLoadingRecipes || isLoadingPurchase;

    const findRecipeForSellableItem = (sellableItemId: string) => {
        return recipes?.find(r => r.sellableItemId === sellableItemId);
    }
    
    const findPurchaseItemName = (purchaseItemId: string) => {
        return purchaseItems?.find(p => p.id === purchaseItemId)?.name ?? 'نامعلوم';
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">مدیریت دستور پخت</h2>
            {isLoading ? (
                <div className="text-center p-8"><Loader2 className="inline animate-spin"/></div>
            ) : (
                <div className="space-y-3">
                    {sellableItems?.map(item => {
                        const recipe = findRecipeForSellableItem(item.id);
                        const isExpanded = expandedRecipe === item.id;
                        
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <button
                                    onClick={() => setExpandedRecipe(isExpanded ? null : item.id)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${recipe && recipe.ingredients.length > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                                            <Package className={`w-5 h-5 ${recipe && recipe.ingredients.length > 0 ? 'text-green-600' : 'text-yellow-600'}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">قیمت فروش: {formatToman(item.price)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {recipe && recipe.ingredients.length === 0 && (
                                            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">بدون مواد</span>
                                        )}
                                        <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-700/50">
                                        {recipe && recipe.ingredients.length > 0 ? (
                                            <div className="space-y-3">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">مواد اولیه:</p>
                                                {recipe.ingredients.map((ing, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-sm">{findPurchaseItemName(ing.purchaseItemId)}</p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">{ing.quantity} واحد</p>
                                                        </div>
                                                        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-slate-600 dark:text-slate-400 mb-3">دستور پختی برای این آیتم ثبت نشده است.</p>
                                                <button className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                                                    اضافه کردن مواد
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Sales;
