import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  Share2,
  ShoppingBag,
  Users,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../api';
import { RecipeDetail, RecipeSummary } from '../types';
import { RecipeImage } from './RecipeImage';

interface RecipeDetailModalProps {
  recipeId: number;
  isFavorite: boolean;
  isPrepared: boolean;
  onClose: () => void;
  onSelectRecipe: (id: number) => void;
  onToggleFavorite: (id: number, e?: React.MouseEvent) => void;
  onTogglePrepared: (id: number) => void;
  onAddIngredientsToShoppingList: (id: number) => void;
  onGoToPremium: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipeId,
  isFavorite,
  isPrepared,
  onClose,
  onSelectRecipe,
  onToggleFavorite,
  onTogglePrepared,
  onAddIngredientsToShoppingList,
  onGoToPremium,
}) => {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [related, setRelated] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiFetch<{ recipe: RecipeDetail; related: RecipeSummary[] }>(`/api/recipes/${recipeId}`)
      .then((data) => {
        if (!active) return;
        setRecipe(data.recipe);
        setRelated(data.related || []);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recipeId]);

  const handleShare = async () => {
    if (!recipe) return;
    const shareText = `Mira esta receta en CreciSano: ${recipe.nombre}`;
    const shareUrl = `${window.location.origin}/?receta=${recipe.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.nombre, text: shareText, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-0 backdrop-blur-xs sm:p-4 md:p-6">
      <div className="mx-auto min-h-screen w-full max-w-4xl bg-[#FCFDFB] sm:min-h-0 sm:rounded-3xl sm:shadow-2xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1B4332]/10 bg-[#FCFDFB]/95 px-4 py-3 backdrop-blur-md sm:rounded-t-3xl sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#1B4332] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a la biblioteca</span>
          </button>

          {recipe && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => onToggleFavorite(recipe.id, e)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#1B4332]/15 px-3 py-2 text-xs font-medium text-[#1B4332] hover:bg-[#F6F3EB]"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite ? 'fill-[#D9534F] text-[#D9534F]' : 'text-[#1B4332]'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isFavorite ? 'En favoritos' : 'Guardar en favoritos'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#1B4332]/15 px-3 py-2 text-xs font-medium text-[#1B4332] hover:bg-[#F6F3EB]"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {copiedShare ? 'Enlace copiado' : 'Compartir receta'}
                </span>
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-[#52665A]">
            Cargando ficha de la receta...
          </div>
        )}

        {error && (
          <div className="p-12 text-center">
            <p className="text-sm text-[#B8332A]">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-medium text-white"
            >
              Volver
            </button>
          </div>
        )}

        {!loading && recipe && recipe.locked && (
          /* PANTALLA DE BLOQUEO PREMIUM */
          <div className="p-6 sm:p-10">
            <div className="overflow-hidden rounded-2xl border border-[#1B4332]/15 bg-[#F6F3EB]">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <RecipeImage
                  src={recipe.fotografia}
                  alt={recipe.nombre}
                  categoria={recipe.categoria}
                  locked={true}
                  className="aspect-[4/3] w-full md:h-full"
                />
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#1B4332] text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-[#2D6A4F]">
                    {recipe.categoria} · {recipe.tiempo} min
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-bold text-[#1A2E22]">
                    {recipe.nombre}
                  </h2>
                  <h3 className="mt-4 text-base font-semibold text-[#1B4332]">
                    ¡Esta receta es exclusiva de CreciSano Premium!
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A5D52]">
                    Desbloquea recetas especiales, descubre nuevas preparaciones y disfruta de todo el contenido exclusivo de CreciSano.
                  </p>

                  <ul className="mt-4 space-y-1.5 text-sm text-[#1A2E22]">
                    <li>· Acceso ilimitado a más de 90 recetas Premium</li>
                    <li>· Ingredientes con cantidades exactas y paso a paso</li>
                    <li>· Loncheras creativas, postres caseros y cenas saludables</li>
                    <li>· Videos originales incorporados por la administradora</li>
                  </ul>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onGoToPremium();
                      }}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
                    >
                      Desbloquear receta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onGoToPremium();
                      }}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#1B4332] px-5 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-white"
                    >
                      Conocer CreciSano Premium
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && recipe && !recipe.locked && (
          /* FICHA COMPLETA DE RECETA DESBLOQUEADA */
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <div className="md:col-span-6">
                <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10">
                  <RecipeImage
                    src={recipe.fotografia}
                    alt={recipe.nombre}
                    categoria={recipe.categoria}
                    locked={false}
                    isPremium={recipe.tipo_acceso === 'Premium'}
                    className="aspect-[4/3] w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center md:col-span-6">
                <div className="text-xs font-medium text-[#2D6A4F]">
                  {recipe.categoria} · {recipe.tipo_acceso}
                </div>
                <h1 className="font-display mt-1.5 text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                  {recipe.nombre}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-[#4A5D52]">
                  {recipe.descripcion}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#1B4332]/10 py-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#52665A]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Tiempo</span>
                    </div>
                    <p className="font-mono-tabular mt-0.5 text-sm font-semibold text-[#1A2E22]">
                      {recipe.tiempo} min
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#52665A]">
                      <Users className="h-3.5 w-3.5" />
                      <span>Porciones</span>
                    </div>
                    <p className="font-mono-tabular mt-0.5 text-sm font-semibold text-[#1A2E22]">
                      {recipe.porciones} porciones
                    </p>
                  </div>
                  <div>
                    <div className="text-xs text-[#52665A]">Dificultad</div>
                    <p className="mt-0.5 text-sm font-semibold text-[#1A2E22]">
                      {recipe.dificultad}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onTogglePrepared(recipe.id)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      isPrepared
                        ? 'bg-[#2D6A4F] text-white'
                        : 'border border-[#1B4332] text-[#1B4332] hover:bg-[#F6F3EB]'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {isPrepared ? 'Receta preparada' : 'Marcar receta como preparada'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddIngredientsToShoppingList(recipe.id)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Añadir a lista de compras</span>
                  </button>
                </div>
              </div>
            </div>

            {recipe.apto_ninos && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#52B788]/30 bg-[#E9F5DB]/50 p-4 text-sm text-[#1A2E22]">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                <div>
                  <span className="font-semibold text-[#1B4332]">
                    Recomendación infantil y alérgenos:{' '}
                  </span>
                  <span>{recipe.apto_ninos}</span>
                </div>
              </div>
            )}

            {/* Optional original Admin video (only shown when uploaded by Admin) */}
            {recipe.videoUrl && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-[#1A2E22]">
                  Video de preparación
                </h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-[#1B4332]/15 bg-black">
                  <video
                    src={recipe.videoUrl}
                    controls
                    preload="metadata"
                    className="max-h-[420px] w-full"
                  />
                </div>
              </div>
            )}

            {/* Ingredients & Step-by-Step */}
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12">
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-[#1B4332]/10 bg-[#F6F3EB] p-6">
                  <h2 className="font-display text-xl font-bold text-[#1A2E22]">
                    Ingredientes
                  </h2>
                  <ul className="mt-4 divide-y divide-[#1B4332]/10">
                    {recipe.ingredientes?.map((ing, idx) => (
                      <li
                        key={ing.id || idx}
                        className="flex items-center justify-between py-2.5 text-sm"
                      >
                        <span className="font-medium text-[#1A2E22]">{ing.nombre}</span>
                        <span className="font-mono-tabular text-[#52665A]">
                          {ing.cantidad} {ing.unidad}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-7">
                <h2 className="font-display text-xl font-bold text-[#1A2E22]">
                  Preparación paso a paso
                </h2>
                <ol className="mt-4 space-y-4">
                  {recipe.preparaciones?.map((step) => (
                    <li
                      key={step.numero_paso}
                      className="flex gap-4 rounded-2xl border border-[#1B4332]/10 bg-white p-4"
                    >
                      <span className="font-mono-tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B4332] text-xs font-bold text-white">
                        {step.numero_paso}
                      </span>
                      <p className="text-sm leading-relaxed text-[#1A2E22]">
                        {step.instruccion}
                      </p>
                    </li>
                  ))}
                </ol>

                {recipe.consejos && (
                  <div className="mt-6 rounded-2xl border border-[#1B4332]/10 bg-[#F6F3EB] p-5">
                    <h3 className="font-display text-base font-bold text-[#1B4332]">
                      Consejos de cocina
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#4A5D52]">
                      {recipe.consejos}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recetas relacionadas */}
            {related.length > 0 && (
              <div className="mt-10 border-t border-[#1B4332]/10 pt-8">
                <h2 className="font-display text-xl font-bold text-[#1A2E22]">
                  Recetas relacionadas
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRecipe(rel.id)}
                      className="cursor-pointer overflow-hidden rounded-2xl border border-[#1B4332]/10 bg-white transition-shadow hover:shadow-md"
                    >
                      <RecipeImage
                        src={rel.fotografia}
                        alt={rel.nombre}
                        categoria={rel.categoria}
                        className="aspect-[4/3] w-full"
                      />
                      <div className="p-3.5">
                        <p className="text-xs text-[#52665A]">{rel.tiempo} min · {rel.dificultad}</p>
                        <h4 className="font-display mt-1 text-base font-semibold text-[#1A2E22]">
                          {rel.nombre}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
