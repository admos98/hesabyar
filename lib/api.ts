import { AppDatabase, DbTableName, VendorPayload, PurchaseItemPayload, SellableItemPayload, RecurringExpensePayload, Recipe, Sale } from '../types';

async function apiCall<T>(body: object): Promise<T> {
    const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An API error occurred');
    }

    if (response.status === 204) { // No Content for delete
        return null as T;
    }
    
    return response.json();
}

// --- Generic CRUD Functions ---
const getAll = <T>(table: DbTableName) => () => apiCall<T[]>({ action: 'getAll', table });
const create = <T>(table: DbTableName) => (payload: any) => apiCall<T>({ action: 'create', table, payload });
const update = <T>(table: DbTableName) => (id: string, payload: any) => apiCall<T>({ action: 'update', table, id, payload });
const del = (table: DbTableName) => (id: string) => apiCall<null>({ action: 'delete', table, id });

// --- Specific API Functions ---

// Vendors
export const getVendors = getAll<AppDatabase['vendors'][0]>('vendors');
export const createVendor = create<AppDatabase['vendors'][0]>('vendors');
export const updateVendor = update<AppDatabase['vendors'][0]>('vendors');
export const deleteVendor = del('vendors');

// Purchase Items
export const getPurchaseItems = getAll<AppDatabase['purchaseItems'][0]>('purchaseItems');
export const createPurchaseItem = create<AppDatabase['purchaseItems'][0]>('purchaseItems');
export const updatePurchaseItem = update<AppDatabase['purchaseItems'][0]>('purchaseItems');
export const deletePurchaseItem = del('purchaseItems');

// Receipts
export const getReceipts = getAll<AppDatabase['receipts'][0]>('receipts');
export const createReceipt = create<AppDatabase['receipts'][0]>('receipts');

// Sellable Items
export const getSellableItems = getAll<AppDatabase['sellableItems'][0]>('sellableItems');
export const createSellableItem = create<AppDatabase['sellableItems'][0]>('sellableItems');
export const updateSellableItem = update<AppDatabase['sellableItems'][0]>('sellableItems');
export const deleteSellableItem = del('sellableItems');

// Recipes
export const getRecipes = getAll<Recipe>('recipes');
export const updateRecipe = (id: string, payload: Partial<Recipe>) => apiCall<Recipe>({ action: 'update', table: 'recipes', id, payload });

// Sales
export const getSales = getAll<Sale>('sales');
export const createSale = (payload: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => apiCall<Sale>({ action: 'createSale', payload });

// Recurring Expenses
export const getRecurringExpenses = getAll<AppDatabase['recurringExpenses'][0]>('recurringExpenses');
export const createRecurringExpense = create<AppDatabase['recurringExpenses'][0]>('recurringExpenses');
export const updateRecurringExpense = update<AppDatabase['recurringExpenses'][0]>('recurringExpenses');
export const deleteRecurringExpense = del('recurringExpenses');

// Function to get the entire DB for calculations
export const getFullDb = () => apiCall<AppDatabase>({ action: 'getDB' });
