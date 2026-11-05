import React, { useState } from 'react';
import { Lock, UtensilsCrossed } from 'lucide-react';

interface RecipeImageProps {
  src: string | null;
  alt: string;
  categoria: string;
  locked?: boolean;
  isPremium?: boolean;
  className?: string;
}

export const RecipeImage: React.FC<RecipeImageProps> = ({
  src,
  alt,
  categoria,
  locked = false,
  isPremium = false,
  className = 'aspect-[4/3] w-full',
}) => {
  const [imgError, setImgError] = useState(false);

  const hasValidPhoto = Boolean(src) && !imgError;

  return (
    <div className={`relative overflow-hidden bg-[#EFECE3] ${className}`}>
      {hasValidPhoto ? (
        <img
          src={src!}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EFECE3] via-[#E6E2D5] to-[#DCE5D5] p-4 text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[#1B4332]">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-[#1B4332]">Fotografía pendiente</span>
          <span className="mt-0.5 text-[11px] text-[#52665A]">{categoria}</span>
        </div>
      )}

      {/* Subtle scrim & lock overlay for locked Premium recipes without hiding the photo */}
      {locked && (
        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3.5">
          <span className="text-xs font-semibold tracking-wide text-white">
            PREMIUM
          </span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332]/90 text-white shadow-sm backdrop-blur-sm"
            title="Receta exclusiva de CreciSano Premium"
          >
            <Lock className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Unlocked Premium indicator */}
      {!locked && isPremium && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3.5 py-2.5">
          <span className="text-xs font-semibold tracking-wide text-white">
            PREMIUM DESBLOQUEADO
          </span>
        </div>
      )}
    </div>
  );
};
