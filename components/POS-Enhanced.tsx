import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSellableItems, getRecipes, createSale } from '../lib/api';
import { SellableItem, Recipe, Sale } from '../types';
import { formatToman } from '../lib/utils';
import { Plus, Minus, Trash2, Printer, Receipt, Loader2, DollarSign } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const POSSystem: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['sellableItems'],
    queryFn: async () => {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll', table: 'sellableItems' })
      });
      return response.json();
    }
  });

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll', table: 'recipes' })
      });
      return response.json();
    }
  });

  const queryClient = useQueryClient();
  const createSaleMutation = useMutation({
    mutationFn: (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => createSale(saleData),
    onSuccess: (sale) => {
      setLastSale(sale);
      setShowReceipt(true);
      setCart([]);
      setPaidAmount(0);
      toast.success('فروش ثبت شد');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    }
  });

  const categories = useMemo(() =>
    items ? [...new Set(items.map((i: SellableItem) => i.category))].sort() : [],
    [items]
  );

  const filteredItems = useMemo(() =>
    items?.filter((item: SellableItem) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!categoryFilter || item.category === categoryFilter)
    ) || [],
    [items, searchTerm, categoryFilter]
  );

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.total, 0),
    [cart]
  );

  const change = paidAmount - cartTotal;

  const handleAddToCart = (item: SellableItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price }
            : c
        );
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price
      }];
    });
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('سبد خرید خالی است');
      return;
    }
    if (paidAmount < cartTotal) {
      toast.error('مبلغ پرداختی کافی نیست');
      return;
    }

    const saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
      saleDate: new Date().toISOString(),
      items: cart.map(item => ({
        sellableItemId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.total
      })),
      totalAmount: cartTotal
    };

    createSaleMutation.mutate(saleData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">سیستم فروش (POS)</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-4">محصولات</h2>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="جستجوی محصول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">تمام دسته‌بندی‌ها</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {isLoadingItems ? (
              <div className="col-span-full text-center p-8"><Loader2 className="inline animate-spin" /></div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: SellableItem) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:shadow-lg transition-all text-right"
                >
                  <p className="font-bold text-lg">{item.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.category}</p>
                  <p className="text-primary-600 font-bold">{formatToman(item.price)}</p>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center p-8 text-slate-500">محصولی یافت نشد</div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4 h-fit sticky top-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt size={24} />
            سبد خرید
          </h2>

          <div className="border-t dark:border-slate-700 pt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-right flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{formatToman(item.price)} × {item.quantity}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-slate-600 rounded text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm flex-1">{formatToman(item.total)}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">سبد خرید خالی است</p>
            )}
          </div>

          <div className="border-t dark:border-slate-700 pt-4 space-y-3">
            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>جمع:</span>
              <span className="text-primary-600">{formatToman(cartTotal)}</span>
            </div>

            {/* Payment Section */}
            <div className="space-y-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-sm"
              >
                <option value="cash">نقدی</option>
                <option value="card">کارت</option>
                <option value="cheque">چک</option>
              </select>

              <input
                type="number"
                placeholder="مبلغ دریافتی"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-sm"
              />
            </div>

            {/* Change */}
            {paidAmount > 0 && (
              <div className={`p-3 rounded-lg text-sm font-semibold text-center ${
                change >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'
              }`}>
                {change >= 0 ? `خورد: ${formatToman(change)}` : `کسری: ${formatToman(Math.abs(change))}`}
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || createSaleMutation.isPending}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-bold flex items-center justify-center gap-2"
            >
              {createSaleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              تایید و ثبت فروش
            </button>

            {/* Clear Cart Button */}
            <button
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="w-full py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
            >
              پاک کردن سبد
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center printable-receipt">
            <div className="space-y-4">
              <Receipt size={48} className="mx-auto text-primary-500" />
              <h2 className="text-2xl font-bold">رسید فروش</h2>

              <div className="border-t dark:border-slate-700 pt-4 text-right space-y-2">
                <p className="text-sm"><span className="font-semibold">تاریخ:</span> {new Date(lastSale.saleDate).toLocaleDateString('fa-IR')}</p>
                <p className="text-sm"><span className="font-semibold">ساعت:</span> {new Date(lastSale.saleDate).toLocaleTimeString('fa-IR')}</p>
              </div>

              <div className="border-t border-b dark:border-slate-700 py-4">
                <div className="space-y-2 text-right text-sm">
                  {lastSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity} ×</span>
                      <span>{formatToman(item.unitPrice)}</span>
                      <span className="flex-1 ml-2">آیتم {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-bold">جمع: {formatToman(lastSale.totalAmount)}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">روش پرداخت: {paymentMethod === 'cash' ? 'نقدی' : paymentMethod === 'card' ? 'کارت' : 'چک'}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400"
                >
                  بستن
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  چاپ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSystem;
