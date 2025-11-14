import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusCircle, UploadCloud, Edit, Trash2, Loader2, FileWarning, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  getVendors, createVendor, updateVendor, deleteVendor,
  getPurchaseItems, createPurchaseItem, updatePurchaseItem, deletePurchaseItem,
  getReceipts, createReceipt
} from '../lib/api';
import { vendorSchema, purchaseItemSchema, Vendor, PurchaseItem } from '../types';
import VendorModal from './modals/VendorModal';
import PurchaseItemModal from './modals/PurchaseItemModal';

const Purchases: React.FC = () => {
    const [activeTab, setActiveTab] = useState('receipts');
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();
    const [showPurchaseItemModal, setShowPurchaseItemModal] = useState(false);
    const [editingPurchaseItem, setEditingPurchaseItem] = useState<PurchaseItem | undefined>();

    const handleEditVendor = (vendor: Vendor) => {
      setEditingVendor(vendor);
      setShowVendorModal(true);
    };

    const handleEditPurchaseItem = (item: PurchaseItem) => {
      setEditingPurchaseItem(item);
      setShowPurchaseItemModal(true);
    };

    const handleCloseVendorModal = () => {
      setShowVendorModal(false);
      setEditingVendor(undefined);
    };

    const handleClosePurchaseItemModal = () => {
      setShowPurchaseItemModal(false);
      setEditingPurchaseItem(undefined);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'receipts':
                return <ReceiptsContent />;
            case 'vendors':
                return <VendorsContent onEdit={handleEditVendor} onModalOpen={() => setShowVendorModal(true)} />;
            case 'items':
                return <PurchaseItemsContent onEdit={handleEditPurchaseItem} onModalOpen={() => setShowPurchaseItemModal(true)} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">بخش خرید</h1>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px space-x-6 space-x-reverse" aria-label="Tabs">
                    <TabButton name="receipts" activeTab={activeTab} setActiveTab={setActiveTab}>فاکتورها</TabButton>
                    <TabButton name="vendors" activeTab={activeTab} setActiveTab={setActiveTab}>فروشندگان</TabButton>
                    <TabButton name="items" activeTab={activeTab} setActiveTab={setActiveTab}>اقلام خرید</TabButton>
                </nav>
            </div>

            <div className="mt-8">{renderContent()}</div>

            <VendorModal isOpen={showVendorModal} onClose={handleCloseVendorModal} editingVendor={editingVendor} />
            <PurchaseItemModal isOpen={showPurchaseItemModal} onClose={handleClosePurchaseItemModal} editingPurchaseItem={editingPurchaseItem} />
        </div>
    );
};

const TabButton: React.FC<{name: string, activeTab: string, setActiveTab: (name: string) => void, children: React.ReactNode}> = ({ name, activeTab, setActiveTab, children }) => (
    <button onClick={() => setActiveTab(name)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === name ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
        {children}
    </button>
);


// --- Receipts Tab Content ---
const ReceiptsContent: React.FC = () => {
    const [ocrResult, setOcrResult] = useState<any>(null);

    const ocrMutation = useMutation<any, Error, File>({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('receipt', file);
            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'خطا در ارتباط با سرور');
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast.success("فاکتور با موفقیت پردازش شد.");
            setOcrResult(data);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setOcrResult(null);
        ocrMutation.mutate(file);
    }, [ocrMutation]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
        multiple: false,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">ثبت فاکتور با هوش مصنوعی</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600">
                    <PlusCircle size={20} />
                    <span>افزودن دستی فاکتور</span>
                </button>
            </div>

            <div {...getRootProps()} className={`relative p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4">
                    {ocrMutation.isPending ? (
                        <>
                           <Loader2 size={48} className="text-primary-500 animate-spin" />
                           <p className="text-lg font-semibold">در حال پردازش تصویر...</p>
                           <p className="text-sm text-gray-500">این فرآیند ممکن است کمی طول بکشد.</p>
                        </>
                    ) : (
                         <>
                            <UploadCloud size={48} className="text-gray-400" />
                            <p className="text-lg">{isDragActive ? "فایل را اینجا رها کنید..." : "تصویر فاکتور را بکشید و اینجا رها کنید یا برای انتخاب کلیک کنید"}</p>
                            <p className="text-sm text-gray-500">پشتیبانی از فرمت‌های PNG, JPG, WEBP</p>
                         </>
                    )}
                </div>
            </div>

            {ocrMutation.isError && (
              <div className="flex items-center gap-4 p-4 text-red-800 bg-red-100 border border-red-400 rounded-lg dark:bg-red-900/30 dark:text-red-300">
                <FileWarning size={24} />
                <span>{ocrMutation.error.message}</span>
              </div>
            )}
            {ocrResult && <OcrResultForm result={ocrResult} onCancel={() => setOcrResult(null)} />}
        </div>
    );
};

// --- OCR Result Form with Validation ---
const OcrResultForm = ({ result, onCancel }: { result: any, onCancel: () => void }) => {
    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const { data: purchaseItems } = useQuery({
        queryKey: ['purchaseItems'],
        queryFn: getPurchaseItems,
    });

    const queryClient = useQueryClient();
    const saveMutation = useMutation({
        mutationFn: createReceipt,
        onSuccess: () => {
            toast.success("فاکتور با موفقیت ذخیره شد!");
            queryClient.invalidateQueries({ queryKey: ['receipts'] });
            onCancel();
        },
        onError: (error) => {
            toast.error(`خطا: ${error.message}`);
        }
    });

    const [formData, setFormData] = React.useState({
        vendorId: '',
        vendorName: result.vendorName || '',
        receiptDate: result.date || new Date().toISOString().split('T')[0],
        items: result.items || [],
    });

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, vendorId: e.target.value }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.vendorId) {
            toast.error("لطفا فروشنده را انتخاب کنید.");
            return;
        }

        if (formData.items.length === 0) {
            toast.error("فاکتور باید حداقل یک قلم داشته باشد.");
            return;
        }

        const receiptPayload = {
            vendorId: formData.vendorId,
            receiptDate: new Date(formData.receiptDate).toISOString(),
            items: formData.items.map((item: any) => ({
                purchaseItemId: item.purchaseItemId || '',
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: parseFloat(item.totalPrice) || 0,
            })),
            totalAmount: formData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.totalPrice) || 0), 0),
        };

        saveMutation.mutate(receiptPayload);
    };

    return (
        <div className="p-6 mt-6 bg-white rounded-xl shadow-md dark:bg-slate-800 animate-fade-in">
            <h3 className="text-xl font-bold mb-4">اطلاعات استخراج شده - جهت تایید</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium text-sm">فروشنده</label>
                        <select value={formData.vendorId} onChange={handleVendorChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                            <option value="">انتخاب فروشنده...</option>
                            {vendors?.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-sm">تاریخ</label>
                        <input type="date" value={formData.receiptDate} onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                </div>

                <h4 className="font-semibold pt-4">اقلام فاکتور</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {formData.items.map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 bg-gray-50 rounded-md dark:bg-slate-700/50">
                            <select value={item.purchaseItemId || ''} onChange={(e) => handleItemChange(index, 'purchaseItemId', e.target.value)} className="p-2 border rounded-md dark:bg-slate-600 dark:border-slate-500 text-sm">
                                <option value="">انتخاب قلم...</option>
                                {purchaseItems?.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <input placeholder="تعداد" type="number" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="p-2 border rounded-md dark:bg-slate-600 dark:border-slate-500 text-sm"/>
                            <input placeholder="قیمت واحد" type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="p-2 border rounded-md dark:bg-slate-600 dark:border-slate-500 text-sm"/>
                            <input placeholder="قیمت کل" type="number" step="0.01" value={item.totalPrice} onChange={(e) => handleItemChange(index, 'totalPrice', e.target.value)} className="p-2 border rounded-md dark:bg-slate-600 dark:border-slate-500 text-sm"/>
                            <span className="text-xs text-gray-500 text-center flex items-center justify-center">{item.name || 'نامعلوم'}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} disabled={saveMutation.isPending} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50">لغو</button>
                    <button type="submit" disabled={saveMutation.isPending} className="px-6 py-2 text-white rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2">
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره فاکتور"}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Vendors Tab Content ---
const VendorsContent: React.FC<{ onEdit: (vendor: Vendor) => void, onModalOpen: () => void }> = ({ onEdit, onModalOpen }) => {
    const queryClient = useQueryClient();
    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteVendor,
        onSuccess: () => {
            toast.success("فروشنده با موفقیت حذف شد.");
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
        onError: (error) => {
            toast.error(`خطا: ${error.message}`);
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm("آیا از حذف این فروشنده مطمئن هستید؟")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">مدیریت فروشندگان</h2>
                <button onClick={onModalOpen} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600">
                    <PlusCircle size={20} />
                    <span>فروشنده جدید</span>
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">نام</th>
                            <th className="px-6 py-3">تلفن</th>
                            <th className="px-6 py-3">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center p-8"><Loader2 className="inline animate-spin"/></td></tr>
                        ) : vendors && vendors.length > 0 ? (
                            vendors.map(vendor => (
                                <tr key={vendor.id} className="bg-white border-b dark:bg-slate-800 dark:border-gray-700 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{vendor.name}</td>
                                    <td className="px-6 py-4">{vendor.phone || '-'}</td>
                                    <td className="px-6 py-4 flex gap-4">
                                        <button onClick={() => onEdit(vendor)}><Edit className="w-5 h-5 text-blue-500 hover:text-blue-700"/></button>
                                        <button onClick={() => handleDelete(vendor.id)} disabled={deleteMutation.isPending}><Trash2 className="w-5 h-5 text-red-500 hover:text-red-700"/></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3} className="text-center p-8 text-slate-500">هیچ فروشنده‌ای ثبت نشده است.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Purchase Items Tab Content ---
const PurchaseItemsContent: React.FC<{ onEdit: (item: PurchaseItem) => void, onModalOpen: () => void }> = ({ onEdit, onModalOpen }) => {
    const queryClient = useQueryClient();
    const { data: items, isLoading } = useQuery({
        queryKey: ['purchaseItems'],
        queryFn: getPurchaseItems,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePurchaseItem,
        onSuccess: () => {
            toast.success("قلم خرید با موفقیت حذف شد.");
            queryClient.invalidateQueries({ queryKey: ['purchaseItems'] });
        },
        onError: (error) => {
            toast.error(`خطا: ${error.message}`);
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm("آیا از حذف این قلم مطمئن هستید؟")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">مدیریت اقلام خرید</h2>
                <button onClick={onModalOpen} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600">
                    <PlusCircle size={20} />
                    <span>قلم جدید</span>
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">نام کالا</th>
                            <th className="px-6 py-3">دسته‌بندی</th>
                            <th className="px-6 py-3">واحد</th>
                            <th className="px-6 py-3">حداقل موجودی</th>
                            <th className="px-6 py-3">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-8"><Loader2 className="inline animate-spin"/></td></tr>
                        ) : items && items.length > 0 ? (
                            items.map(item => (
                                <tr key={item.id} className="bg-white border-b dark:bg-slate-800 dark:border-gray-700 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{item.name}</td>
                                    <td className="px-6 py-4">{item.category}</td>
                                    <td className="px-6 py-4">{item.unit}</td>
                                    <td className="px-6 py-4">{item.minStockThreshold}</td>
                                    <td className="px-6 py-4 flex gap-4">
                                        <button onClick={() => onEdit(item)}><Edit className="w-5 h-5 text-blue-500 hover:text-blue-700"/></button>
                                        <button onClick={() => handleDelete(item.id)} disabled={deleteMutation.isPending}><Trash2 className="w-5 h-5 text-red-500 hover:text-red-700"/></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center p-8 text-slate-500">هیچ قلم خریدی ثبت نشده است.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Purchases;
