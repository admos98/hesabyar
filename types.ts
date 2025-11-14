// types.ts
import { z } from 'zod';

// Generic database entity with common fields
export interface DbEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// B. Purchase Management
export const vendorSchema = z.object({
  name: z.string().min(2, "نام فروشنده حداقل باید ۲ حرف باشد."),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
export type VendorPayload = z.infer<typeof vendorSchema>;
export interface Vendor extends DbEntity, VendorPayload {}

export enum PurchaseItemUnit {
  Kilogram = 'کیلوگرم',
  Number = 'عدد',
  Package = 'بسته',
  Liter = 'لیتر',
  Meter = 'متر',
}
export const purchaseItemSchema = z.object({
    name: z.string().min(2, "نام کالا حداقل باید ۲ حرف باشد."),
    category: z.string().min(2, "نام دسته‌بندی حداقل باید ۲ حرف باشد."),
    unit: z.nativeEnum(PurchaseItemUnit),
    minStockThreshold: z.number().min(0).default(0),
});
export type PurchaseItemPayload = z.infer<typeof purchaseItemSchema>;
export interface PurchaseItem extends DbEntity, PurchaseItemPayload {
  stock: number; // This is a calculated field, not stored directly
}

export interface ReceiptItem {
  purchaseItemId: string; // Link to PurchaseItem
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
export interface Receipt extends DbEntity {
  vendorId: string;
  receiptDate: string; // ISO 8601 format
  items: ReceiptItem[];
  totalAmount: number;
  imageUrl?: string;
}

// C. Sales Management
export const sellableItemSchema = z.object({
    name: z.string().min(2, "نام آیتم حداقل باید ۲ حرف باشد."),
    price: z.number().min(0, "قیمت نمی‌تواند منفی باشد."),
    category: z.string().min(2, "نام دسته‌بندی حداقل باید ۲ حرف باشد."),
});
export type SellableItemPayload = z.infer<typeof sellableItemSchema>;
export interface SellableItem extends DbEntity, SellableItemPayload {}

export interface RecipeIngredient {
  purchaseItemId: string;
  quantity: number; // How much of the purchaseItem is used for one sellableItem
}
export interface Recipe extends DbEntity {
  sellableItemId: string; // Links to one SellableItem
  ingredients: RecipeIngredient[];
}

export interface SaleItem {
  sellableItemId: string;
  quantity: number;
  unitPrice: number; // Price at the time of sale
  totalPrice: number;
}
export interface Sale extends DbEntity {
  saleDate: string; // ISO 8601 format
  items: SaleItem[];
  totalAmount: number;
}


// E. Financials & Reports
export const recurringExpenseSchema = z.object({
    title: z.string().min(2, "عنوان هزینه حداقل باید ۲ حرف باشد."),
    amount: z.number().min(1, "مبلغ باید بزرگتر از صفر باشد."),
    dueDate: z.number().min(1).max(31, "روز ماه باید بین ۱ و ۳۱ باشد."),
    category: z.string().min(2, "نام دسته‌بندی حداقل باید ۲ حرف باشد."),
});
export type RecurringExpensePayload = z.infer<typeof recurringExpenseSchema>;
export interface RecurringExpense extends DbEntity, RecurringExpensePayload {}


// The complete structure of our JSON database file
export interface AppDatabase {
  vendors: Vendor[];
  purchaseItems: PurchaseItem[];
  receipts: Receipt[];
  sellableItems: SellableItem[];
  recipes: Recipe[];
  sales: Sale[];
  recurringExpenses: RecurringExpense[];
  // shoppingLists removed for brevity, can be added back
}

export type DbTableName = keyof AppDatabase;
