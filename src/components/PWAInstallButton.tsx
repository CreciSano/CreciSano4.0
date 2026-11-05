import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#1B4332]/20 bg-[#F6F3EB] px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#1B4332] hover:bg-[#EFECE3]"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#1B4332]/20 bg-[#F6F3EB] px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#1B4332]"
        >
          <Download className="h-3.5 w-3.5" />
          <span>App iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="font-display text-lg font-bold text-[#1A2E22]">
                Instalar CreciSano en iPhone / iPad
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4A5D52]">
                1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                <br />
                2. Desliza y selecciona <strong>Agregar a inicio</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 min-h-[44px] w-full rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
