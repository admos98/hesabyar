import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { purchaseItemSchema, PurchaseItem, PurchaseItemUnit } from '../../types';
import { createPurchaseItem, updatePurchaseItem } from '../../lib/api';
import { X, Loader2 } from 'lucide-react';

interface PurchaseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: PurchaseItem;
}

const PurchaseItemModal: React.FC<PurchaseItemModalProps> = ({ isOpen, onClose, editingItem }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: editingItem || { name: '', category: '', unit: PurchaseItemUnit.Kilogram, minStockThreshold: 0 }
  });

  React.useEffect(() => {
    if (editingItem) {
      setValue('name', editingItem.name);
      setValue('category', editingItem.category);
      setValue('unit', editingItem.unit);
      setValue('minStockThreshold', editingItem.minStockThreshold);
    } else {
      reset();
    }
  }, [editingItem, isOpen, setValue, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      editingItem ? updatePurchaseItem(editingItem.id, data) : createPurchaseItem(data),
    onSuccess: () => {
      toast.success(editingItem ? 'قلم خرید به‌روز شد' : 'قلم خرید اضافه شد');
      queryClient.invalidateQueries({ queryKey: ['purchaseItems'] });
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    }
  });

  const onSubmit = (data: any) => saveMutation.mutate(data);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{editingItem ? 'ویرایش قلم خرید' : 'قلم خرید جدید'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نام کالا *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="نام کالا"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">دسته‌بندی *</label>
            <input
              {...register('category')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="دسته‌بندی"
            />
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">واحد اندازه‌گیری *</label>
            <select
              {...register('unit')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(PurchaseItemUnit).map(([key, value]) => (
                <option key={key} value={value}>{value}</option>
              ))}
            </select>
            {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">حداقل موجودی</label>
            <input
              {...register('minStockThreshold', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="حداقل موجودی"
            />
            {errors.minStockThreshold && <p className="text-red-500 text-sm mt-1">{errors.minStockThreshold.message}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50"
            >
              لغو
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveMutation.isPending ? 'درحال ذخیره...' : editingItem ? 'به‌روز رسانی' : 'افزودن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseItemModal;
