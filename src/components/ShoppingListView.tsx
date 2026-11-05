import React, { useState } from 'react';
import { Check, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  isAuthenticated: boolean;
  onAddItem: (ingrediente: string, cantidad: string, categoria: string) => Promise<void>;
  onToggleItem: (id: number) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onRequireAuth: () => void;
}

const SHOPPING_CATEGORIES = [
  'Verduras y frutas',
  'Carnes y pescados',
  'Lácteos y huevos',
  'Despensa',
  'Receta',
  'Otros',
];

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  isAuthenticated,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onRequireAuth,
}) => {
  const [ingrediente, setIngrediente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [categoria, setCategoria] = useState('Verduras y frutas');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-[#1B4332]/10 bg-white p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-[#1B4332]" />
        <h2 className="font-display mt-3 text-2xl font-bold text-[#1A2E22]">
          Tu lista de compras sincronizada
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#4A5D52]">
          Inicia sesión o crea una cuenta gratuita para organizar tus ingredientes por categoría y sincronizarlos entre tu celular y computadora.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-6 min-h-[44px] rounded-xl bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
        >
          Iniciar sesión o registrarme
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingrediente.trim()) return;
    setSubmitting(true);
    try {
      await onAddItem(ingrediente.trim(), cantidad.trim() || '1 unidad', categoria);
      setIngrediente('');
      setCantidad('');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = items.filter((i) => !i.comprado).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1A2E22]">
          Lista de compras
        </h1>
        <p className="mt-1 text-sm text-[#4A5D52]">
          Organiza los ingredientes que necesitas. Tienes{' '}
          <span className="font-mono-tabular font-semibold text-[#1B4332]">
            {pendingCount}
          </span>{' '}
          productos pendientes por comprar.
        </p>
      </div>

      {/* Add item form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#1B4332]/10 bg-white p-4 sm:grid-cols-12 sm:p-5"
      >
        <div className="sm:col-span-5">
          <label className="block text-xs font-semibold text-[#1A2E22]">
            Producto o ingrediente
          </label>
          <input
            type="text"
            required
            value={ingrediente}
            onChange={(e) => setIngrediente(e.target.value)}
            placeholder="Ej. Pechuga de pollo, espinaca..."
            className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-[#1A2E22]">
            Cantidad
          </label>
          <input
            type="text"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej. 500 gramos"
            className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#1A2E22]">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
          >
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#143326] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir</span>
          </button>
        </div>
      </form>

      {/* Shopping list grouped or listed */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center text-sm text-[#52665A]">
          Tu lista de compras está vacía. Añade productos arriba o desde cualquier receta desbloqueada.
        </div>
      ) : (
        <div className="divide-y divide-[#1B4332]/10 overflow-hidden rounded-2xl border border-[#1B4332]/10 bg-white">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[#FCFDFB] sm:px-6"
            >
              <button
                type="button"
                onClick={() => onToggleItem(item.id)}
                className="flex min-h-[44px] flex-1 items-center gap-3.5 text-left"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    item.comprado
                      ? 'border-[#1B4332] bg-[#1B4332] text-white'
                      : 'border-[#1B4332]/30 bg-white'
                  }`}
                >
                  {item.comprado ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      item.comprado
                        ? 'text-[#52665A] line-through'
                        : 'text-[#1A2E22]'
                    }`}
                  >
                    {item.ingrediente}
                  </p>
                  <p className="text-xs text-[#52665A]">
                    <span className="font-mono-tabular">{item.cantidad}</span> · {item.categoria}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                aria-label="Eliminar producto"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#52665A] hover:bg-[#FDF2F2] hover:text-[#B8332A]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
