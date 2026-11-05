import React from 'react';
import { Heart } from 'lucide-react';
import { RecipeSummary } from '../types';
import { RecipeImage } from './RecipeImage';

interface RecipeCardProps {
  recipe: RecipeSummary;
  isFavorite: boolean;
  onSelect: (recipeId: number) => void;
  onToggleFavorite: (recipeId: number, e: React.MouseEvent) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <article
      onClick={() => onSelect(recipe.id)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#1B4332]/10 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <RecipeImage
          src={recipe.fotografia}
          alt={recipe.nombre}
          categoria={recipe.categoria}
          locked={recipe.locked}
          isPremium={recipe.tipo_acceso === 'Premium'}
        />
        <button
          type="button"
          onClick={(e) => onToggleFavorite(recipe.id, e)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          className="absolute top-2.5 right-2.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 text-[#1B4332] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite ? 'fill-[#D9534F] text-[#D9534F]' : 'text-[#1B4332]'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-[#52665A]">
          <span className="truncate">{recipe.categoria}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular whitespace-nowrap">{recipe.tiempo} min</span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">{recipe.dificultad}</span>
        </div>

        <h3 className="font-display mt-1.5 text-lg leading-snug font-semibold text-[#1A2E22] group-hover:text-[#1B4332]">
          {recipe.nombre}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#4A5D52]">
          {recipe.descripcion}
        </p>

        {typeof recipe.matchCount === 'number' && recipe.matchCount > 0 && (
          <div className="mt-3 border-t border-[#1B4332]/10 pt-2.5 text-xs">
            <p className="font-semibold text-[#1B4332]">
              Coinciden {recipe.matchCount} de {recipe.totalIngredients} ingredientes
            </p>
            {!recipe.locked && recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
              <p className="mt-0.5 text-[#52665A]">
                Falta: {recipe.missingIngredients.slice(0, 3).join(', ')}
                {recipe.missingIngredients.length > 3 ? ` (+${recipe.missingIngredients.length - 3})` : ''}
              </p>
            )}
            {!recipe.locked && recipe.missingIngredients && recipe.missingIngredients.length === 0 && (
              <p className="mt-0.5 font-medium text-[#2D6A4F]">
                Tienes todos los ingredientes en casa
              </p>
            )}
            {recipe.locked && (
              <p className="mt-0.5 text-[#52665A]">
                Contenido exclusivo de CreciSano Premium
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
