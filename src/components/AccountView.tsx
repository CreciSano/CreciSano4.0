import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Crown,
  Heart,
  LogOut,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { apiFetch } from '../api';
import { RecipeSummary, User } from '../types';
import { RecipeCard } from './RecipeCard';

interface AccountViewProps {
  user: User | null;
  allRecipes: RecipeSummary[];
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onRequireAuth: () => void;
  onSelectRecipe: (id: number) => void;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
  onGoToPremium: () => void;
  onGoToAdmin: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  allRecipes,
  onUpdateUser,
  onLogout,
  onRequireAuth,
  onSelectRecipe,
  onToggleFavorite,
  onGoToPremium,
  onGoToAdmin,
}) => {
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [correo, setCorreo] = useState(user?.correo || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favoritas' | 'preparadas' | 'pagos'>('favoritas');

  if (!user) {
    return (
      <div className="rounded-3xl border border-[#1B4332]/10 bg-white p-10 text-center">
        <UserIcon className="mx-auto h-10 w-10 text-[#1B4332]" />
        <h2 className="font-display mt-3 text-2xl font-bold text-[#1A2E22]">
          Mi cuenta CreciSano
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#4A5D52]">
          Inicia sesión o crea tu cuenta para administrar tu perfil, consultar tu membresía y acceder a tus recetas guardadas desde cualquier dispositivo.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-6 min-h-[44px] rounded-xl bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
        >
          Iniciar sesión o crear cuenta
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const data = await apiFetch<{ user: User }>('/api/account/profile', {
        method: 'PUT',
        body: JSON.stringify({ nombre, correo }),
      });
      onUpdateUser(data.user);
      setFeedback('Perfil actualizado correctamente.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const data = await apiFetch<{ user: User }>('/api/account/photo', {
        method: 'POST',
        body: formData,
      });
      onUpdateUser(data.user);
      setFeedback('Fotografía de perfil actualizada.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelSubscription = async () => {
    setError(null);
    setFeedback(null);
    try {
      const data = await apiFetch<{ message: string; user: User }>(
        '/api/account/cancel-subscription',
        { method: 'POST' }
      );
      onUpdateUser(data.user);
      setFeedback(data.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const favoriteRecipes = allRecipes.filter((r) => user.favorites.includes(r.id));
  const preparedRecipes = allRecipes.filter((r) => user.prepared.includes(r.id));

  return (
    <div className="space-y-8">
      {/* Header & Profile Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#1B4332]/10 bg-white p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#1B4332]/20 bg-[#EFECE3]">
                {user.foto_perfil ? (
                  <img
                    src={user.foto_perfil}
                    alt={user.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#1B4332]">
                    <UserIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <label
                title="Cambiar fotografía de perfil"
                className="absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#1B4332] text-white shadow-sm hover:bg-[#143326]"
              >
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[#1A2E22]">
                  {user.nombre}
                </h1>
              </div>
              <p className="text-sm text-[#52665A]">{user.correo}</p>
              <p className="mt-1 text-xs font-semibold text-[#1B4332]">
                {user.rol === 'admin'
                  ? 'Cuenta Administradora · Acceso total'
                  : user.isPremium
                  ? 'Membresía CreciSano Premium'
                  : 'Cuenta Gratuita'}
              </p>
              {uploadingPhoto && (
                <p className="mt-1 text-xs text-[#2D6A4F]">Subiendo fotografía...</p>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#1B4332]/15 px-4 py-2 text-xs font-semibold text-[#1A2E22] hover:bg-[#F6F3EB]"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>

          {feedback && (
            <div className="mt-4 rounded-xl bg-[#E9F5DB] p-3 text-xs font-medium text-[#1B4332]">
              {feedback}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl bg-[#FDF2F2] p-3 text-xs font-medium text-[#B8332A]">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1A2E22]">
                Nombre
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2E22]">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {user.rol === 'admin' && (
                <button
                  type="button"
                  onClick={onGoToAdmin}
                  className="min-h-[44px] rounded-xl border border-[#1B4332] px-5 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#F6F3EB]"
                >
                  Abrir panel «Administrar CreciSano»
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Membership & Multi-device Sync Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#1B4332]/10 bg-[#1B4332] p-6 text-white sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 text-[#74C69D]">
              <Crown className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                Estado de membresía
              </span>
            </div>

            <h2 className="font-display mt-2 text-2xl font-bold">
              {user.isPremium ? 'CreciSano Premium Activo' : 'Plan Gratuito'}
            </h2>

            {user.subscription ? (
              <div className="mt-3 space-y-1 text-sm text-[#E9F5DB]">
                <p>Plan: {user.subscription.plan}</p>
                <p>
                  Estado:{' '}
                  <span className="font-semibold capitalize">
                    {user.subscription.estado}
                  </span>
                </p>
                <p className="font-mono-tabular">
                  Vence:{' '}
                  {new Date(user.subscription.fecha_vencimiento).toLocaleDateString('es-PE')}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[#E9F5DB]">
                Tienes acceso completo a las 90 recetas gratuitas y al buscador por ingredientes.
              </p>
            )}

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white/10 p-3.5 text-xs text-[#E9F5DB]">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#74C69D]" />
              <span>
                Tu cuenta, favoritos, lista de compras y suscripción están sincronizados en tiempo real entre la web y la aplicación móvil.
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!user.isPremium ? (
              <button
                type="button"
                onClick={onGoToPremium}
                className="min-h-[44px] w-full rounded-xl bg-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#1A2E22] hover:bg-[#74C69D]"
              >
                Administrar suscripción · Pasar a Premium
              </button>
            ) : (
              user.subscription?.estado === 'activa' && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="min-h-[44px] w-full rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Administrar / Cancelar suscripción
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Favoritas / Preparadas / Historial */}
      <div>
        <div className="flex flex-wrap gap-2 border-b border-[#1B4332]/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('favoritas')}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'favoritas'
                ? 'bg-[#1B4332] text-white'
                : 'text-[#4A5D52] hover:bg-[#EFECE3]'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Recetas favoritas ({favoriteRecipes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preparadas')}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'preparadas'
                ? 'bg-[#1B4332] text-white'
                : 'text-[#4A5D52] hover:bg-[#EFECE3]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Recetas preparadas ({preparedRecipes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'pagos'
                ? 'bg-[#1B4332] text-white'
                : 'text-[#4A5D52] hover:bg-[#EFECE3]'
            }`}
          >
            <span>Historial de suscripciones y pagos ({user.payments.length})</span>
          </button>
        </div>

        {activeTab === 'favoritas' && (
          <div className="mt-6">
            {favoriteRecipes.length === 0 ? (
              <p className="rounded-2xl border border-[#1B4332]/10 bg-white p-8 text-center text-sm text-[#52665A]">
                Aún no has guardado recetas en favoritos. Toca el corazón en cualquier receta para guardarla aquí.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteRecipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    isFavorite={true}
                    onSelect={onSelectRecipe}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preparadas' && (
          <div className="mt-6">
            {preparedRecipes.length === 0 ? (
              <p className="rounded-2xl border border-[#1B4332]/10 bg-white p-8 text-center text-sm text-[#52665A]">
                Todavía no has marcado recetas como preparadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {preparedRecipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    isFavorite={user.favorites.includes(r.id)}
                    onSelect={onSelectRecipe}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pagos' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#1B4332]/10 bg-white">
            {user.payments.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#52665A]">
                No registras pagos realizados hasta el momento.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#1B4332]/10 bg-[#F6F3EB] text-xs font-semibold text-[#1A2E22]">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Transacción</th>
                    <th className="px-4 py-3">Pasarela</th>
                    <th className="px-4 py-3">Importe (S/)</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B4332]/10">
                  {user.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono-tabular px-4 py-3 text-xs text-[#52665A]">
                        {new Date(p.fecha).toLocaleDateString('es-PE')}
                      </td>
                      <td className="font-mono-tabular px-4 py-3 text-xs font-medium text-[#1A2E22]">
                        {p.identificador_transaccion}
                      </td>
                      <td className="px-4 py-3 capitalize">{p.proveedor}</td>
                      <td className="font-mono-tabular px-4 py-3 font-semibold text-[#1B4332]">
                        S/ {Number(p.importe_soles).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 capitalize">{p.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
