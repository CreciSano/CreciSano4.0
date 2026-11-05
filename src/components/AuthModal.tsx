import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';
import { User } from '../types';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCodeInfo, setGeneratedCodeInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ correo, password }),
        });
        setAuthToken(data.token);
        onSuccess(data.user);
        onClose();
      } else if (mode === 'register') {
        const data = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ nombre, correo, password }),
        });
        setAuthToken(data.token);
        onSuccess(data.user);
        onClose();
      } else if (mode === 'forgot') {
        const data = await apiFetch<{ message: string; resetCode: string }>(
          '/api/auth/forgot-password',
          {
            method: 'POST',
            body: JSON.stringify({ correo }),
          }
        );
        setGeneratedCodeInfo(data.resetCode);
        setResetCode(data.resetCode);
        setMessage(data.message);
        setMode('reset');
      } else if (mode === 'reset') {
        const data = await apiFetch<{ message: string }>('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ correo, code: resetCode, newPassword: password }),
        });
        setMessage(data.message);
        setPassword('');
        setMode('login');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setCorreo(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FCFDFB] p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#52665A] hover:bg-[#F6F3EB]"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-2xl font-bold text-[#1A2E22]">
          {mode === 'login' && 'Bienvenida a CreciSano'}
          {mode === 'register' && 'Crea tu cuenta familiar'}
          {mode === 'forgot' && 'Recuperar contraseña'}
          {mode === 'reset' && 'Establecer nueva contraseña'}
        </h2>
        <p className="mt-1 text-sm text-[#4A5D52]">
          {mode === 'login' && 'Ingresa para sincronizar tus recetas favoritas, lista de compras y membresía.'}
          {mode === 'register' && 'Guarda recetas, organiza tus compras y cocina con lo que tienes en casa.'}
          {mode === 'forgot' && 'Ingresa tu correo para generar un código de recuperación.'}
          {mode === 'reset' && 'Ingresa el código de recuperación y tu nueva contraseña.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-[#B8332A]/30 bg-[#FDF2F2] p-3 text-xs font-medium text-[#B8332A]">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-[#2D6A4F]/30 bg-[#E9F5DB] p-3 text-xs font-medium text-[#1B4332]">
            {message}
            {generatedCodeInfo && (
              <div className="font-mono-tabular mt-1 font-bold">
                Código: {generatedCodeInfo}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#1A2E22]">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Ana Lucía Torres"
                className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-white px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1A2E22]">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-white px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          {mode === 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-[#1A2E22]">
                Código de recuperación
              </label>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-white px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-[#1A2E22]">
                {mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-white px-3.5 py-2.5 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#143326] disabled:opacity-60"
          >
            {loading
              ? 'Procesando...'
              : mode === 'login'
              ? 'Iniciar sesión'
              : mode === 'register'
              ? 'Crear cuenta'
              : mode === 'forgot'
              ? 'Generar código'
              : 'Actualizar contraseña'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-5 border-t border-[#1B4332]/10 pt-4">
            <p className="text-xs font-medium text-[#52665A]">
              Cuentas de acceso rápido para probar roles:
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('maria@crecisano.pe', 'Maria2026!')}
                className="rounded-lg border border-[#1B4332]/15 bg-[#F6F3EB] px-2 py-1.5 text-[11px] font-medium text-[#1A2E22] hover:bg-[#EFECE3]"
              >
                Gratuita
              </button>
              <button
                type="button"
                onClick={() => fillDemo('sofia.premium@crecisano.pe', 'Sofia2026!')}
                className="rounded-lg border border-[#1B4332]/15 bg-[#F6F3EB] px-2 py-1.5 text-[11px] font-medium text-[#1A2E22] hover:bg-[#EFECE3]"
              >
                Premium
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@crecisano.pe', 'AdminCreciSano2026!')}
                className="rounded-lg border border-[#1B4332]/15 bg-[#F6F3EB] px-2 py-1.5 text-[11px] font-medium text-[#1B4332] hover:bg-[#EFECE3]"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52665A]">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-[#1B4332] hover:underline"
              >
                ¿No tienes cuenta? Regístrate
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="hover:underline"
              >
                Olvidé mi contraseña
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="font-semibold text-[#1B4332] hover:underline"
            >
              Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
