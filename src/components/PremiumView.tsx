import React, { useEffect, useState } from 'react';
import { Check, Lock, ShieldAlert, Unlock } from 'lucide-react';
import { apiFetch } from '../api';
import { RecipeSummary, SubscriptionPlan, User } from '../types';
import { RecipeCard } from './RecipeCard';

interface PremiumViewProps {
  user: User | null;
  premiumRecipes: RecipeSummary[];
  premiumCategories: string[];
  onSelectRecipe: (id: number) => void;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
  onRequireAuth: () => void;
}

const PREMIUM_BENEFITS = [
  'Acceso a todas las recetas Premium',
  'Desayunos exclusivos',
  'Almuerzos especiales',
  'Cenas saludables',
  'Bebidas y jugos',
  'Postres caseros',
  'Loncheras creativas',
  'Recetas económicas',
  'Preparaciones especiales',
  'Videos originales incorporados por la administradora',
];

export const PremiumView: React.FC<PremiumViewProps> = ({
  user,
  premiumRecipes,
  premiumCategories,
  onSelectRecipe,
  onToggleFavorite,
  onRequireAuth,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [gatewayInfo, setGatewayInfo] = useState<{
    configured: boolean;
    provider: string;
  }>({ configured: false, provider: 'ninguno' });
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [checkoutStatus, setCheckoutStatus] = useState<{
    type: 'error' | 'info';
    text: string;
  } | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{
      plans: SubscriptionPlan[];
      gateway: { configured: boolean; provider: string };
    }>('/api/subscriptions/plans')
      .then((data) => {
        setPlans(data.plans);
        setGatewayInfo(data.gateway);
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (planId: number) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setCheckoutStatus(null);
    setProcessingPlanId(planId);
    try {
      const res = await apiFetch<{
        configured: boolean;
        provider?: string;
        checkoutUrl?: string;
        orderId?: string;
      }>('/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res.orderId) {
        setCheckoutStatus({
          type: 'info',
          text: `Orden Culqi generada (${res.orderId}). Completa el pago en la ventana de Culqi para activar tu membresía automáticamente vía webhook.`,
        });
      }
    } catch (err) {
      setCheckoutStatus({
        type: 'error',
        text: (err as Error).message,
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const filteredPremium =
    selectedCategory === 'Todas'
      ? premiumRecipes
      : premiumRecipes.filter((r) => r.categoria === selectedCategory);

  return (
    <div className="space-y-12">
      {/* Hero / Presentation of CreciSano Premium */}
      <section className="rounded-3xl border border-[#1B4332]/15 bg-[#1B4332] p-6 text-white sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold tracking-wider text-[#74C69D] uppercase">
              Membresía CreciSano Premium
            </p>
            <h1 className="font-display mt-2 text-3xl leading-tight font-bold text-balance sm:text-4xl">
              ¡Lleva tu experiencia de cocina al siguiente nivel!
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#E9F5DB]">
              Con CreciSano Premium tendrás acceso a recetas exclusivas, nuevas ideas para alimentar a tu familia y preparaciones especiales para cada momento del día.
            </p>

            {user?.isPremium && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#52B788]/20 px-4 py-2.5 text-sm font-semibold text-[#E9F5DB]">
                <Unlock className="h-4 w-4 text-[#74C69D]" />
                <span>
                  Tu membresía Premium está activa
                  {user.subscription?.fecha_vencimiento
                    ? ` hasta el ${new Date(user.subscription.fecha_vencimiento).toLocaleDateString('es-PE')}`
                    : ''}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-xs lg:col-span-5">
            <h2 className="font-display text-lg font-bold text-white">
              Beneficios incluidos
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#E9F5DB] sm:grid-cols-2 lg:grid-cols-1">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#74C69D]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Plans in Peruvian Soles (S/) */}
      <section>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#1A2E22]">
              Planes de suscripción en soles peruanos
            </h2>
            <p className="mt-1 text-sm text-[#4A5D52]">
              Precios transparentes en S/ (PEN). La membresía se activa al confirmarse el pago en el servidor.
            </p>
          </div>
        </div>

        {!gatewayInfo.configured && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#1B4332]/20 bg-[#EFECE3] p-4 text-sm text-[#1A2E22]">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
            <div>
              <p className="font-semibold text-[#1B4332]">
                Servicio de pago pendiente de configuración
              </p>
              <p className="mt-0.5 text-xs text-[#4A5D52]">
                Actualmente no hay una pasarela de pago conectada (Culqi o Mercado Pago Perú). Una cuenta administradora debe configurar las credenciales reales en el panel «Administrar CreciSano» para habilitar los cobros.
              </p>
            </div>
          </div>
        )}

        {checkoutStatus && (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              checkoutStatus.type === 'error'
                ? 'border-[#B8332A]/30 bg-[#FDF2F2] text-[#B8332A]'
                : 'border-[#2D6A4F]/30 bg-[#E9F5DB] text-[#1B4332]'
            }`}
          >
            {checkoutStatus.text}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col justify-between rounded-2xl border border-[#1B4332]/15 bg-white p-6"
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl font-bold text-[#1A2E22]">
                    {plan.nombre}
                  </h3>
                  <span className="font-mono-tabular text-xs font-medium text-[#52665A]">
                    {plan.duracion_dias} días
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono-tabular text-3xl font-bold text-[#1B4332]">
                    S/ {Number(plan.precio_soles).toFixed(2)}
                  </span>
                  <span className="text-xs text-[#52665A]">
                    / {plan.codigo === 'anual' ? 'año' : 'mes'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#4A5D52]">
                  {plan.condiciones_renovacion}
                </p>
              </div>

              <button
                type="button"
                disabled={processingPlanId === plan.id}
                onClick={() => handleSubscribe(plan.id)}
                className="mt-6 min-h-[44px] w-full rounded-xl bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143326] disabled:opacity-60"
              >
                {processingPlanId === plan.id
                  ? 'Conectando con pasarela...'
                  : 'Suscribirme ahora'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Independent CreciSano Premium Library */}
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-bold text-[#1A2E22]">
                Biblioteca CreciSano Premium
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#4A5D52]">
              {premiumRecipes.length} recetas exclusivas organizadas en 9 categorías especializadas.
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('Todas')}
            className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'Todas'
                ? 'bg-[#1B4332] text-white'
                : 'border border-[#1B4332]/15 bg-white text-[#1A2E22] hover:bg-[#EFECE3]'
            }`}
          >
            Todas ({premiumRecipes.length})
          </button>
          {premiumCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1B4332] text-white'
                  : 'border border-[#1B4332]/15 bg-white text-[#1A2E22] hover:bg-[#EFECE3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPremium.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={user?.favorites.includes(recipe.id) || false}
              onSelect={onSelectRecipe}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
