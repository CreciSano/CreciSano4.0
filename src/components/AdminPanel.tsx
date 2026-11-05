import React, { useEffect, useState } from 'react';
import {
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { apiFetch } from '../api';
import { IngredientItem, SubscriptionPlan } from '../types';

interface AdminRecipe {
  id: number;
  nombre: string;
  descripcion: string;
  fotografia: string | null;
  categoria: string;
  tipo_acceso: 'Gratis' | 'Premium';
  tiempo: number;
  porciones: number;
  dificultad: 'Fácil' | 'Media' | 'Elaborada';
  consejos: string;
  apto_ninos: string | null;
  destacada: number;
  popular: number;
  estado_publicacion: 'publicada' | 'borrador';
  ingredientes: IngredientItem[];
  preparaciones: Array<{ numero_paso: number; instruccion: string }>;
  video: { archivo_multimedia: string; estado_publicacion: 'publicado' | 'oculto' } | null;
}

interface AdminUser {
  id: number;
  nombre: string;
  correo: string;
  rol: 'usuaria' | 'admin';
  fecha_registro: string;
  membresia: string;
  suscripcion: {
    plan: string;
    estado: string;
    fecha_vencimiento: string;
  } | null;
  pagos: Array<{ id: number; importe_soles: number; fecha: string }>;
}

interface GatewayConfig {
  proveedor_activo: 'ninguno' | 'culqi' | 'mercadopago';
  culqi_public_key: string;
  culqi_secret_key: string;
  culqi_webhook_secret: string;
  mp_public_key: string;
  mp_access_token: string;
  mp_webhook_secret: string;
}

interface AdminPanelProps {
  allCategories: string[];
  onDataChanged: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  allCategories,
  onDataChanged,
}) => {
  const [tab, setTab] = useState<'recetas' | 'usuarias' | 'planes'>('recetas');
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [gateway, setGateway] = useState<GatewayConfig>({
    proveedor_activo: 'ninguno',
    culqi_public_key: '',
    culqi_secret_key: '',
    culqi_webhook_secret: '',
    mp_public_key: '',
    mp_access_token: '',
    mp_webhook_secret: '',
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recipe Editor State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(allCategories[0] || 'Desayunos');
  const [tipoAcceso, setTipoAcceso] = useState<'Gratis' | 'Premium'>('Gratis');
  const [tiempo, setTiempo] = useState(20);
  const [porciones, setPorciones] = useState(4);
  const [dificultad, setDificultad] = useState<'Fácil' | 'Media' | 'Elaborada'>('Fácil');
  const [consejos, setConsejos] = useState('');
  const [aptoNinos, setAptoNinos] = useState('');
  const [destacada, setDestacada] = useState(false);
  const [popular, setPopular] = useState(false);
  const [estadoPub, setEstadoPub] = useState<'publicada' | 'borrador'>('publicada');
  const [ingredientes, setIngredientes] = useState<IngredientItem[]>([
    { nombre: '', cantidad: '1', unidad: 'taza' },
  ]);
  const [pasos, setPasos] = useState<string[]>(['']);

  // Photo & Video upload with preview
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const loadAdminData = async () => {
    try {
      const [recRes, usrRes, planRes, gwRes] = await Promise.all([
        apiFetch<{ recipes: AdminRecipe[] }>('/api/admin/recipes'),
        apiFetch<{ users: AdminUser[] }>('/api/admin/users'),
        apiFetch<{ plans: SubscriptionPlan[] }>('/api/subscriptions/plans'),
        apiFetch<{ gateway: GatewayConfig }>('/api/admin/gateway'),
      ]);
      setRecipes(recRes.recipes);
      setUsers(usrRes.users);
      setPlans(planRes.plans);
      setGateway(gwRes.gateway);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setCategoria(allCategories[0] || 'Desayunos');
    setTipoAcceso('Gratis');
    setTiempo(20);
    setPorciones(4);
    setDificultad('Fácil');
    setConsejos('');
    setAptoNinos('');
    setDestacada(false);
    setPopular(false);
    setEstadoPub('publicada');
    setIngredientes([{ nombre: '', cantidad: '1', unidad: 'taza' }]);
    setPasos(['']);
    setPhotoFile(null);
    setPhotoPreview(null);
    setVideoFile(null);
  };

  const startEdit = (r: AdminRecipe) => {
    setEditingId(r.id);
    setNombre(r.nombre);
    setDescripcion(r.descripcion);
    setCategoria(r.categoria);
    setTipoAcceso(r.tipo_acceso);
    setTiempo(r.tiempo);
    setPorciones(r.porciones);
    setDificultad(r.dificultad);
    setConsejos(r.consejos || '');
    setAptoNinos(r.apto_ninos || '');
    setDestacada(Boolean(r.destacada));
    setPopular(Boolean(r.popular));
    setEstadoPub(r.estado_publicacion);
    setIngredientes(
      r.ingredientes.length > 0
        ? r.ingredientes
        : [{ nombre: '', cantidad: '1', unidad: 'taza' }]
    );
    setPasos(
      r.preparaciones.length > 0
        ? r.preparaciones.map((p) => p.instruccion)
        : ['']
    );
    setPhotoFile(null);
    setPhotoPreview(r.fotografia);
    setVideoFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      let targetId = editingId;
      const payload = {
        nombre,
        descripcion,
        categoria,
        tipo_acceso: tipoAcceso,
        tiempo,
        porciones,
        dificultad,
        consejos,
        apto_ninos: aptoNinos,
        destacada,
        popular,
        estado_publicacion: estadoPub,
        ingredientes: ingredientes.filter((i) => i.nombre.trim() !== ''),
        preparaciones: pasos.filter((p) => p.trim() !== ''),
      };

      if (editingId) {
        await apiFetch(`/api/admin/recipes/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiFetch<{ id: number }>('/api/admin/recipes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        targetId = created.id;
      }

      if (targetId && photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await apiFetch(`/api/admin/recipes/${targetId}/photo`, {
          method: 'POST',
          body: fd,
        });
      }

      if (targetId && videoFile) {
        const fdVid = new FormData();
        fdVid.append('video', videoFile);
        await apiFetch(`/api/admin/recipes/${targetId}/video`, {
          method: 'POST',
          body: fdVid,
        });
      }

      setStatusMsg(
        editingId ? 'Receta actualizada correctamente.' : 'Nueva receta publicada.'
      );
      setShowForm(false);
      resetForm();
      await loadAdminData();
      onDataChanged();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    await apiFetch(`/api/admin/recipes/${id}`, { method: 'DELETE' });
    setStatusMsg('Receta eliminada.');
    await loadAdminData();
    onDataChanged();
  };

  const handleToggleVideoStatus = async (
    recipeId: number,
    current: 'publicado' | 'oculto'
  ) => {
    await apiFetch(`/api/admin/recipes/${recipeId}/video`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado_publicacion: current === 'publicado' ? 'oculto' : 'publicado',
      }),
    });
    await loadAdminData();
  };

  const handleDeleteVideo = async (recipeId: number) => {
    await apiFetch(`/api/admin/recipes/${recipeId}/video`, { method: 'DELETE' });
    setStatusMsg('Video eliminado de la receta.');
    await loadAdminData();
  };

  const handleToggleUserRole = async (u: AdminUser) => {
    try {
      await apiFetch(`/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ rol: u.rol === 'admin' ? 'usuaria' : 'admin' }),
      });
      await loadAdminData();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    try {
      await apiFetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        body: JSON.stringify(plan),
      });
      setStatusMsg(`Plan "${plan.nombre}" actualizado en soles (S/).`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/gateway', {
        method: 'PUT',
        body: JSON.stringify(gateway),
      });
      setStatusMsg('Configuración de pasarela de pago guardada.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1A2E22]">
            Administrar CreciSano
          </h1>
          <p className="mt-1 text-sm text-[#4A5D52]">
            Control total de recetas, fotografías, videos originales, usuarias y planes en soles (S/).
          </p>
        </div>

        {tab === 'recetas' && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? 'Cerrar formulario' : 'Nueva receta'}</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-[#E9F5DB] p-3.5 text-sm font-medium text-[#1B4332]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-[#FDF2F2] p-3.5 text-sm font-medium text-[#B8332A]">
          {errorMsg}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#1B4332]/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('recetas')}
          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'recetas'
              ? 'bg-[#1B4332] text-white'
              : 'text-[#4A5D52] hover:bg-[#EFECE3]'
          }`}
        >
          Recetas ({recipes.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('usuarias')}
          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'usuarias'
              ? 'bg-[#1B4332] text-white'
              : 'text-[#4A5D52] hover:bg-[#EFECE3]'
          }`}
        >
          Usuarias y suscripciones ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('planes')}
          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'planes'
              ? 'bg-[#1B4332] text-white'
              : 'text-[#4A5D52] hover:bg-[#EFECE3]'
          }`}
        >
          Planes (S/) y Pasarela de Pago
        </button>
      </div>

      {/* TAB 1: RECETAS */}
      {tab === 'recetas' && (
        <div className="space-y-6">
          {showForm && (
            <form
              onSubmit={handleSaveRecipe}
              className="space-y-6 rounded-3xl border border-[#1B4332]/15 bg-white p-6 sm:p-8"
            >
              <h2 className="font-display text-xl font-bold text-[#1A2E22]">
                {editingId ? 'Editar receta' : 'Crear nueva receta'}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Nombre de la preparación
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Descripción breve
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Tipo de acceso
                  </label>
                  <select
                    value={tipoAcceso}
                    onChange={(e) =>
                      setTipoAcceso(e.target.value as 'Gratis' | 'Premium')
                    }
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  >
                    <option value="Gratis">Gratis</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Tiempo (minutos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tiempo}
                    onChange={(e) => setTiempo(Number(e.target.value))}
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Porciones
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={porciones}
                    onChange={(e) => setPorciones(Number(e.target.value))}
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Dificultad
                  </label>
                  <select
                    value={dificultad}
                    onChange={(e) =>
                      setDificultad(
                        e.target.value as 'Fácil' | 'Media' | 'Elaborada'
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Elaborada">Elaborada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Estado de publicación
                  </label>
                  <select
                    value={estadoPub}
                    onChange={(e) =>
                      setEstadoPub(e.target.value as 'publicada' | 'borrador')
                    }
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  >
                    <option value="publicada">Publicada</option>
                    <option value="borrador">Borrador (oculta)</option>
                  </select>
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={destacada}
                      onChange={(e) => setDestacada(e.target.checked)}
                    />
                    <span>Destacar en inicio</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={popular}
                      onChange={(e) => setPopular(e.target.checked)}
                    />
                    <span>Popular</span>
                  </label>
                </div>
              </div>

              {/* Photo Upload + Preview before publishing */}
              <div className="grid grid-cols-1 gap-6 border-t border-[#1B4332]/10 pt-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Fotografía del plato (JPG, JPEG, PNG, WEBP)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handlePhotoSelect}
                    className="mt-2 block w-full text-xs text-[#4A5D52]"
                  />
                  {photoPreview && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#1B4332]/15">
                      <img
                        src={photoPreview}
                        alt="Vista previa"
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Video original opcional (MP4, WEBM, MOV)
                  </label>
                  <input
                    type="file"
                    accept=".mp4,.webm,.mov"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-xs text-[#4A5D52]"
                  />
                  <p className="mt-1 text-xs text-[#52665A]">
                    Solo se mostrará un reproductor si subes un video original.
                  </p>
                </div>
              </div>

              {/* Ingredients */}
              <div className="border-t border-[#1B4332]/10 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1A2E22]">Ingredientes</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setIngredientes([
                        ...ingredientes,
                        { nombre: '', cantidad: '1', unidad: 'unidad' },
                      ])
                    }
                    className="text-xs font-semibold text-[#1B4332] hover:underline"
                  >
                    + Añadir ingrediente
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {ingredientes.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Ingrediente"
                        value={ing.nombre}
                        onChange={(e) => {
                          const copy = [...ingredientes];
                          copy[idx].nombre = e.target.value;
                          setIngredientes(copy);
                        }}
                        className="col-span-6 rounded-lg border border-[#1B4332]/20 px-3 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Cant."
                        value={ing.cantidad}
                        onChange={(e) => {
                          const copy = [...ingredientes];
                          copy[idx].cantidad = e.target.value;
                          setIngredientes(copy);
                        }}
                        className="font-mono-tabular col-span-2 rounded-lg border border-[#1B4332]/20 px-3 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Unidad"
                        value={ing.unidad}
                        onChange={(e) => {
                          const copy = [...ingredientes];
                          copy[idx].unidad = e.target.value;
                          setIngredientes(copy);
                        }}
                        className="col-span-3 rounded-lg border border-[#1B4332]/20 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIngredientes(ingredientes.filter((_, i) => i !== idx))
                        }
                        className="col-span-1 text-xs text-[#B8332A]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="border-t border-[#1B4332]/10 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1A2E22]">
                    Preparación paso a paso
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPasos([...pasos, ''])}
                    className="text-xs font-semibold text-[#1B4332] hover:underline"
                  >
                    + Añadir paso
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {pasos.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#1B4332]">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const copy = [...pasos];
                          copy[idx] = e.target.value;
                          setPasos(copy);
                        }}
                        placeholder={`Paso ${idx + 1}`}
                        className="flex-1 rounded-lg border border-[#1B4332]/20 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setPasos(pasos.filter((_, i) => i !== idx))}
                        className="text-xs text-[#B8332A]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Consejos de cocina
                  </label>
                  <input
                    type="text"
                    value={consejos}
                    onChange={(e) => setConsejos(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Recomendación infantil y alérgenos
                  </label>
                  <input
                    type="text"
                    value={aptoNinos}
                    onChange={(e) => setAptoNinos(e.target.value)}
                    placeholder="Ej. Apto desde los 12 meses. Contiene huevo."
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
                >
                  {editingId ? 'Guardar cambios' : 'Publicar receta'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="min-h-[44px] rounded-xl border border-[#1B4332]/20 px-5 py-2.5 text-sm font-semibold text-[#1A2E22]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Recipes Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#1B4332]/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#1B4332]/10 bg-[#F6F3EB] text-xs font-semibold text-[#1A2E22]">
                <tr>
                  <th className="px-4 py-3">Receta</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Acceso</th>
                  <th className="px-4 py-3">Media</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B4332]/10">
                {recipes.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-[#FCFDFB]">
                    <td className="px-4 py-3 font-medium text-[#1A2E22]">
                      {r.nombre}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#52665A]">{r.categoria}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#1B4332]">
                      {r.tipo_acceso}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#52665A]">
                      <div className="flex items-center gap-2">
                        <span title={r.fotografia ? 'Con foto' : 'Sin foto'}>
                          <ImageIcon
                            className={`h-4 w-4 ${
                              r.fotografia ? 'text-[#2D6A4F]' : 'text-gray-300'
                            }`}
                          />
                        </span>
                        {r.video && (
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4 text-[#1B4332]" />
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleVideoStatus(
                                  r.id,
                                  r.video!.estado_publicacion
                                )
                              }
                              title="Publicar/Ocultar video"
                              className="text-[11px] underline"
                            >
                              {r.video.estado_publicacion === 'publicado' ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(r.id)}
                              className="text-[11px] text-[#B8332A]"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">
                      {r.estado_publicacion}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="rounded-lg p-2 text-[#1B4332] hover:bg-[#F6F3EB]"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecipe(r.id)}
                          className="rounded-lg p-2 text-[#B8332A] hover:bg-[#FDF2F2]"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USUARIAS */}
      {tab === 'usuarias' && (
        <div className="overflow-x-auto rounded-2xl border border-[#1B4332]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#1B4332]/10 bg-[#F6F3EB] text-xs font-semibold text-[#1A2E22]">
              <tr>
                <th className="px-4 py-3">Usuaria</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Membresía</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B4332]/10">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-[#1A2E22]">
                    {u.nombre}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52665A]">{u.correo}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1B4332]">
                    {u.membresia}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-xs text-[#52665A]">
                    {u.suscripcion
                      ? new Date(u.suscripcion.fecha_vencimiento).toLocaleDateString('es-PE')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase">{u.rol}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleUserRole(u)}
                      className="rounded-lg border border-[#1B4332]/20 px-3 py-1.5 text-xs font-semibold text-[#1B4332] hover:bg-[#F6F3EB]"
                    >
                      {u.rol === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PLANES Y PASARELA DE PAGO */}
      {tab === 'planes' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Edit Plans in S/ */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#1A2E22]">
              Planes de suscripción (Soles Peruanos S/)
            </h2>
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className="space-y-3 rounded-2xl border border-[#1B4332]/10 bg-white p-5"
              >
                <div>
                  <label className="block text-xs font-semibold">Nombre del plan</label>
                  <input
                    type="text"
                    value={plan.nombre}
                    onChange={(e) => {
                      const copy = [...plans];
                      copy[idx].nombre = e.target.value;
                      setPlans(copy);
                    }}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold">
                      Precio (S/)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      value={plan.precio_soles}
                      onChange={(e) => {
                        const copy = [...plans];
                        copy[idx].precio_soles = Number(e.target.value);
                        setPlans(copy);
                      }}
                      className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Duración (días)
                    </label>
                    <input
                      type="number"
                      value={plan.duracion_dias}
                      onChange={(e) => {
                        const copy = [...plans];
                        copy[idx].duracion_dias = Number(e.target.value);
                        setPlans(copy);
                      }}
                      className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Condiciones de renovación
                  </label>
                  <textarea
                    rows={2}
                    value={plan.condiciones_renovacion}
                    onChange={(e) => {
                      const copy = [...plans];
                      copy[idx].condiciones_renovacion = e.target.value;
                      setPlans(copy);
                    }}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSavePlan(plan)}
                  className="min-h-[44px] rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#143326]"
                >
                  Guardar plan
                </button>
              </div>
            ))}
          </div>

          {/* Configure Peru Payment Gateway */}
          <form
            onSubmit={handleSaveGateway}
            className="space-y-4 rounded-2xl border border-[#1B4332]/10 bg-white p-6"
          >
            <h2 className="font-display text-xl font-bold text-[#1A2E22]">
              Pasarela de pagos compatible con Perú
            </h2>
            <p className="text-xs text-[#4A5D52]">
              Configura Culqi Perú o Mercado Pago Perú. Las suscripciones solo se activarán tras recibir confirmación válida por webhook.
            </p>

            <div>
              <label className="block text-xs font-semibold">Proveedor activo</label>
              <select
                value={gateway.proveedor_activo}
                onChange={(e) =>
                  setGateway({
                    ...gateway,
                    proveedor_activo: e.target.value as GatewayConfig['proveedor_activo'],
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
              >
                <option value="ninguno">Ninguno (Pendiente de configuración)</option>
                <option value="culqi">Culqi Perú (Tarjetas / Yape)</option>
                <option value="mercadopago">Mercado Pago Perú</option>
              </select>
            </div>

            {gateway.proveedor_activo === 'culqi' && (
              <div className="space-y-3 border-t border-[#1B4332]/10 pt-3">
                <div>
                  <label className="block text-xs font-semibold">Culqi Public Key</label>
                  <input
                    type="text"
                    value={gateway.culqi_public_key}
                    onChange={(e) =>
                      setGateway({ ...gateway, culqi_public_key: e.target.value })
                    }
                    placeholder="pk_live_..."
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Culqi Secret Key</label>
                  <input
                    type="password"
                    value={gateway.culqi_secret_key}
                    onChange={(e) =>
                      setGateway({ ...gateway, culqi_secret_key: e.target.value })
                    }
                    placeholder="sk_live_..."
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Culqi Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={gateway.culqi_webhook_secret}
                    onChange={(e) =>
                      setGateway({ ...gateway, culqi_webhook_secret: e.target.value })
                    }
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            {gateway.proveedor_activo === 'mercadopago' && (
              <div className="space-y-3 border-t border-[#1B4332]/10 pt-3">
                <div>
                  <label className="block text-xs font-semibold">
                    Mercado Pago Public Key
                  </label>
                  <input
                    type="text"
                    value={gateway.mp_public_key}
                    onChange={(e) =>
                      setGateway({ ...gateway, mp_public_key: e.target.value })
                    }
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Mercado Pago Access Token
                  </label>
                  <input
                    type="password"
                    value={gateway.mp_access_token}
                    onChange={(e) =>
                      setGateway({ ...gateway, mp_access_token: e.target.value })
                    }
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Mercado Pago Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={gateway.mp_webhook_secret}
                    onChange={(e) =>
                      setGateway({ ...gateway, mp_webhook_secret: e.target.value })
                    }
                    className="font-mono-tabular mt-1 w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
            >
              Guardar configuración de pasarela
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
