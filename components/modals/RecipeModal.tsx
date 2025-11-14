import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Recipe, RecipeIngredient } from '../../types';
import { updateRecipe, getPurchaseItems, getSellableItems } from '../../lib/api';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: Recipe;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, recipe }) => {
  const queryClient = useQueryClient();
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients || []);
  const [newIngredient, setNewIngredient] = useState({ purchaseItemId: '', quantity: 0 });

  const { data: purchaseItems } = useQuery({
    queryKey: ['purchaseItems'],
    queryFn: async () => {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll', table: 'purchaseItems' })
      });
      return response.json();
    },
    enabled: isOpen
  });

  const { data: sellableItems } = useQuery({
    queryKey: ['sellableItems'],
    queryFn: async () => {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll', table: 'sellableItems' })
      });
      return response.json();
    },
    enabled: isOpen
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Recipe>) => 
      updateRecipe(recipe?.id || '', data),
    onSuccess: () => {
      toast.success('دستور پخت ذخیره شد');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    }
  });

  const handleAddIngredient = () => {
    if (!newIngredient.purchaseItemId || newIngredient.quantity <= 0) {
      toast.error('لطفا قلم و مقدار را مشخص کنید');
      return;
    }
    setIngredients([...ingredients, newIngredient]);
    setNewIngredient({ purchaseItemId: '', quantity: 0 });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (ingredients.length === 0) {
      toast.error('لطفا حداقل یک ماده‌ی اولیه اضافه کنید');
      return;
    }
    saveMutation.mutate({ ingredients });
  };

  const findItemName = (id: string) => {
    return purchaseItems?.find((p: any) => p.id === id)?.name || id;
  };

  const sellableName = sellableItems?.find((s: any) => s.id === recipe?.sellableItemId)?.name;

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <div>
            <h2 className="text-xl font-bold">دستور پخت: {sellableName}</h2>
            <p className="text-sm text-slate-500 mt-1">مواد اولیه مورد نیاز برای این آیتم فروشی</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Ingredient Section */}
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">افزودن ماده‌ی اولیه</h3>
            <div className="flex gap-3 flex-col md:flex-row">
              <select
                value={newIngredient.purchaseItemId}
                onChange={(e) => setNewIngredient({ ...newIngredient, purchaseItemId: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">انتخاب قلم خرید...</option>
                {purchaseItems?.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newIngredient.quantity}
                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="مقدار"
                className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                افزودن
              </button>
            </div>
          </div>

          {/* Ingredients List */}
          <div>
            <h3 className="font-semibold mb-3">مواد اولیه ({ingredients.length})</h3>
            {ingredients.length > 0 ? (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <p className="font-medium">{findItemName(ing.purchaseItemId)}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{ing.quantity} واحد</p>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-slate-600 rounded text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center p-8 text-slate-500">هنوز هیچ ماده‌ای اضافه نشده است</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50"
          >
            لغو
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || ingredients.length === 0}
            className="flex-1 px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveMutation.isPending ? 'درحال ذخیره...' : 'ذخیره دستور پخت'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
