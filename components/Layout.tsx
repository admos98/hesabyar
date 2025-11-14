import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BarChart2, Home, Menu, Package, DollarSign, ShoppingCart, X, Settings, Utensils, Receipt } from 'lucide-react';

const navigation = [
  { name: 'داشبورد', href: '/', icon: Home },
  { name: 'بخش خرید', href: '/purchases', icon: Receipt },
  { name: 'بخش فروش', href: '/sales', icon: Utensils },
  { name: 'مدیریت موجودی', href: '/inventory', icon: Package },
  { name: 'گزارشات', href: '/reports', icon: BarChart2 },
  { name: 'تنظیمات', href: '/settings', icon: Settings },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (location.pathname === '/pos') {
    return <>{children}</>;
  }

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2.5 text-base font-medium rounded-lg transition-all duration-200 group ${
      isActive
        ? 'bg-primary-500 text-white shadow-lg'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
        <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-700">
          <Link to="/" className="text-3xl font-bold text-primary-500 tracking-tight">
            حساب‌یار
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={navLinkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-6 h-6 me-3 transition-colors group-hover:text-primary-500" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 mt-auto border-t border-slate-200 dark:border-slate-700">
            <Link to="/pos" className="w-full flex items-center justify-center p-3 text-lg font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg">
                <ShoppingCart className="w-6 h-6 ms-2" />
                ثبت فروش جدید
            </Link>
        </div>
    </div>
  );

  return (
    <div>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white dark:bg-slate-800">
          <div className="absolute top-0 left-0 pt-2 -ml-14">
            <button
              type="button"
              className="flex items-center justify-center w-12 h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">بستن سایدبار</span>
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-l border-slate-200 dark:border-slate-700">
          <SidebarContent />
        </div>
      </div>
      
      <div className="flex flex-col md:pr-64">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm md:justify-end px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="p-2 -mr-2 text-slate-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">باز کردن سایدبار</span>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">کاربر تست</span>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <Settings className="w-6 h-6 text-slate-500"/>
            </button>
          </div>
        </header>

        <main className="flex-1">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
