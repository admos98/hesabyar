import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vendorSchema, Vendor } from '../../types';
import { createVendor, updateVendor } from '../../lib/api';
import { X, Loader2 } from 'lucide-react';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVendor?: Vendor;
}

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, editingVendor }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: editingVendor || { name: '', contactPerson: '', phone: '', address: '' }
  });

  React.useEffect(() => {
    if (editingVendor) {
      setValue('name', editingVendor.name);
      setValue('contactPerson', editingVendor.contactPerson);
      setValue('phone', editingVendor.phone);
      setValue('address', editingVendor.address);
    } else {
      reset();
    }
  }, [editingVendor, isOpen, setValue, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      editingVendor ? updateVendor(editingVendor.id, data) : createVendor(data),
    onSuccess: () => {
      toast.success(editingVendor ? 'فروشنده به‌روز شد' : 'فروشنده اضافه شد');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
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
          <h2 className="text-xl font-bold">{editingVendor ? 'ویرایش فروشنده' : 'فروشنده جدید'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نام فروشنده *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="نام فروشنده"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">شخص تماس</label>
            <input
              {...register('contactPerson')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="نام شخص تماس"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">تلفن</label>
            <input
              {...register('phone')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="تلفن"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">آدرس</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="آدرس"
            />
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
              {saveMutation.isPending ? 'درحال ذخیره...' : editingVendor ? 'به‌روز رسانی' : 'افزودن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;
