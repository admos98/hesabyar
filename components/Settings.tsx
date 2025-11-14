import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getFullDb } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

const Settings: React.FC = () => {
  const [businessName, setBusinessName] = useState(localStorage.getItem('businessName') || '');
  const [businessPhone, setBusinessPhone] = useState(localStorage.getItem('businessPhone') || '');
  const [businessAddress, setBusinessAddress] = useState(localStorage.getItem('businessAddress') || '');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'IRR');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const { data: db } = useQuery({
    queryKey: ['fullDb'],
    queryFn: getFullDb
  });

  const handleSaveSettings = () => {
    localStorage.setItem('businessName', businessName);
    localStorage.setItem('businessPhone', businessPhone);
    localStorage.setItem('businessAddress', businessAddress);
    localStorage.setItem('currency', currency);
    localStorage.setItem('theme', theme);
    toast.success('تنظیمات ذخیره شد');
  };

  const handleExportData = () => {
    if (!db) {
      toast.error('دیتابیس بارگذاری نشد');
      return;
    }
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hesabyar-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('دیتابیس صادر شد');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate structure
        if (!data.vendors || !data.receipts || !data.sales) {
          throw new Error('فرمت فایل صحیح نیست');
        }

        // TODO: Implement data import to Gist
        toast.success('فایل آماده است، لطفا از طریق ادمین وارد کنید');
      } catch (error: any) {
        toast.error(`خطا: ${error.message}`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon size={32} className="text-primary-500" />
        <h1 className="text-3xl font-bold">تنظیمات</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold mb-4">اطلاعات کسب‌وکار</h2>

          <div>
            <label className="block text-sm font-medium mb-1">نام کسب‌وکار</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="نام کسب‌وکار"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">تلفن</label>
            <input
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="تلفن"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">آدرس</label>
            <textarea
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="آدرس"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">واحد پول</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="IRR">ریال ایران</option>
              <option value="USD">دلار آمریکا</option>
              <option value="EUR">یورو</option>
            </select>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            ذخیره تنظیمات
          </button>
        </div>

        {/* Appearance & Backup */}
        <div className="space-y-4">
          {/* Theme */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold mb-4">ظاهر</h2>

            <div>
              <label className="block text-sm font-medium mb-1">تم</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="light">روشن</option>
                <option value="dark">تیره</option>
                <option value="auto">خودکار</option>
              </select>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold mb-4">پشتیبان‌گیری و بازیابی</h2>

            <button
              onClick={handleExportData}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              صادر کردن دیتابیس
            </button>

            <button
              onClick={handleImportData}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              واردکردن دیتابیس
            </button>

            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg text-sm text-yellow-800 dark:text-yellow-300 flex gap-2">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>قبل از واردکردن دیتابیس جدید، مطمئن شوید که دیتابیس فعلی را صادر کرده باشید.</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">اطلاعات سیستم</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600 dark:text-slate-400">نسخه</p>
            <p className="font-bold">1.0.0</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">وضعیت</p>
            <p className="font-bold flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> فعال</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">آخر به‌روز رسانی</p>
            <p className="font-bold">{new Date().toLocaleDateString('fa-IR')}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">ذخیره‌ی محلی</p>
            <p className="font-bold">فعال</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
