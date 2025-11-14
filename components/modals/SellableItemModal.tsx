import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sellableItemSchema, SellableItem } from '../../types';
import { createSellableItem, updateSellableItem } from '../../lib/api';
import { X, Loader2 } from 'lucide-react';

interface SellableItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: SellableItem;
}

const SellableItemModal: React.FC<SellableItemModalProps> = ({ isOpen, onClose, editingItem }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(sellableItemSchema),
    defaultValues: editingItem || { name: '', price: 0, category: '' }
  });

  React.useEffect(() => {
    if (editingItem) {
      setValue('name', editingItem.name);
      setValue('price', editingItem.price);
      setValue('category', editingItem.category);
    } else {
      reset();
    }
  }, [editingItem, isOpen, setValue, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      editingItem ? updateSellableItem(editingItem.id, data) : createSellableItem(data),
    onSuccess: () => {
      toast.success(editingItem ? 'آیتم فروشی به‌روز شد' : 'آیتم فروشی اضافه شد');
      queryClient.invalidateQueries({ queryKey: ['sellableItems'] });
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
          <h2 className="text-xl font-bold">{editingItem ? 'ویرایش آیتم فروشی' : 'آیتم فروشی جدید'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نام آیتم *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="نام آیتم"
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
            <label className="block text-sm font-medium mb-1">قیمت فروش *</label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="قیمت"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
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

export default SellableItemModal;
