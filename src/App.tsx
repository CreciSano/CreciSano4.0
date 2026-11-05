import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ChefHat,
  Crown,
  Home,
  Lock,
  Search,
  ShoppingBag,
  User as UserIcon,
  Utensils,
} from 'lucide-react';
import { apiFetch, getAuthToken, setAuthToken } from './api';
import { AccountView } from './components/AccountView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { PremiumView } from './components/PremiumView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { ShoppingListView } from './components/ShoppingListView';
import { AppView, RecipeSummary, ShoppingItem, User } from './types';

const COMMON_HOUSEHOLD_INGREDIENTS = [
  'Pollo',
  'Arroz',
  'Zanahoria',
  'Papa',
  'Huevo',
  'Avena',
  'Leche',
  'Quinua',
  'Lentejas',
  'Espinaca',
  'Plátano',
  'Fresa',
  'Queso fresco',
  'Atún',
  'Brócoli',
  'Camote',
  'Tomate',
  'Zapallo',
];

export default function App() {
  const [view, setView] = useState<AppView>('inicio');
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [freeCategories, setFreeCategories] = useState<string[]>([]);
  const [premiumCategories, setPremiumCategories] = useState<string[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // Filters for Biblioteca de Recetas
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [accessFilter, setAccessFilter] = useState<'Todas' | 'Gratis' | 'Premium'>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxTimeFilter, setMaxTimeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('Todas');

  // Smart Ingredient Search state
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientResults, setIngredientResults] = useState<RecipeSummary[]>([]);
  const [searchingIngredients, setSearchingIngredients] = useState(false);

  // Modals & Toast
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    mode: 'login' | 'register';
  }>({ open: false, mode: 'login' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadInitialData = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const [catRes, recRes] = await Promise.all([
        apiFetch<{
          freeCategories: string[];
          premiumCategories: string[];
        }>('/api/categories'),
        apiFetch<{ recipes: RecipeSummary[] }>('/api/recipes'),
      ]);
      setFreeCategories(catRes.freeCategories);
      setPremiumCategories(catRes.premiumCategories);
      setRecipes(recRes.recipes);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  const loadUserSession = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/me');
      setUser(data.user);
      const shopData = await apiFetch<{ items: ShoppingItem[] }>('/api/shopping-list');
      setShoppingList(shopData.items);
    } catch {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUserSession().then(() => loadInitialData());
  }, [loadUserSession, loadInitialData]);

  // Run smart ingredient search whenever selectedIngredients or filters change
  useEffect(() => {
    if (view !== 'ingredientes') return;
    if (selectedIngredients.length === 0) {
      setIngredientResults([]);
      return;
    }
    setSearchingIngredients(true);
    const params = new URLSearchParams();
    params.set('ingredientes', selectedIngredients.join(','));
    if (selectedCategory !== 'Todas') params.set('categoria', selectedCategory);
    if (accessFilter !== 'Todas') params.set('tipo_acceso', accessFilter);
    if (maxTimeFilter) params.set('maxTiempo', maxTimeFilter);
    if (difficultyFilter !== 'Todas') params.set('dificultad', difficultyFilter);

    apiFetch<{ recipes: RecipeSummary[] }>(`/api/recipes?${params.toString()}`)
      .then((res) => setIngredientResults(res.recipes))
      .catch(() => {})
      .finally(() => setSearchingIngredients(false));
  }, [
    view,
    selectedIngredients,
    selectedCategory,
    accessFilter,
    maxTimeFilter,
    difficultyFilter,
  ]);

  const handleAuthSuccess = async (loggedUser: User) => {
    setUser(loggedUser);
    await loadInitialData();
    const shopData = await apiFetch<{ items: ShoppingItem[] }>('/api/shopping-list');
    setShoppingList(shopData.items);
    showToast(`¡Bienvenida, ${loggedUser.nombre}!`);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setShoppingList([]);
    loadInitialData();
    setView('inicio');
    showToast('Has cerrado sesión.');
  };

  const handleToggleFavorite = async (recipeId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    const isFav = user.favorites.includes(recipeId);
    const res = await apiFetch<{ user: User }>(`/api/favorites/${recipeId}`, {
      method: isFav ? 'DELETE' : 'POST',
    });
    setUser(res.user);
    showToast(isFav ? 'Quitada de favoritos' : 'Guardada en favoritos');
  };

  const handleTogglePrepared = async (recipeId: number) => {
    if (!user) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    const isPrep = user.prepared.includes(recipeId);
    const res = await apiFetch<{ user: User }>(`/api/prepared/${recipeId}`, {
      method: isPrep ? 'DELETE' : 'POST',
    });
    setUser(res.user);
    showToast(
      isPrep ? 'Desmarcada de preparadas' : '¡Receta marcada como preparada!'
    );
  };

  const handleAddIngredientsToShoppingList = async (recipeId: number) => {
    if (!user) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    try {
      const res = await apiFetch<{ items: ShoppingItem[]; addedCount: number }>(
        `/api/shopping-list/from-recipe/${recipeId}`,
        { method: 'POST' }
      );
      setShoppingList(res.items);
      showToast(`Se añadieron ${res.addedCount} ingredientes a tu lista de compras.`);
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleAddIngredientChip = (ing: string) => {
    const clean = ing.trim();
    if (!clean) return;
    if (!selectedIngredients.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setSelectedIngredients([...selectedIngredients, clean]);
    }
    setIngredientInput('');
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setView('recetas');
      return;
    }
    // If user typed comma-separated ingredients, route to smart ingredient search
    if (searchQuery.includes(',')) {
      const parts = searchQuery
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setSelectedIngredients(parts);
      setView('ingredientes');
    } else {
      setView('recetas');
    }
  };

  const openCategory = (cat: string, access: 'Gratis' | 'Premium') => {
    setSelectedCategory(cat);
    setAccessFilter(access);
    setView('recetas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered recipes for Biblioteca
  const filteredRecipes = recipes.filter((r) => {
    if (accessFilter !== 'Todas' && r.tipo_acceso !== accessFilter) return false;
    if (selectedCategory !== 'Todas' && r.categoria !== selectedCategory) return false;
    if (maxTimeFilter && r.tiempo > Number(maxTimeFilter)) return false;
    if (difficultyFilter !== 'Todas' && r.dificultad !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (
        !r.nombre.toLowerCase().includes(q) &&
        !r.descripcion.toLowerCase().includes(q) &&
        !r.categoria.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const recommendedRecipes = recipes.filter((r) => r.destacada === 1).slice(0, 6);
  const popularRecipes = recipes.filter((r) => r.popular === 1 && r.tipo_acceso === 'Gratis').slice(0, 6);
  const premiumRecipes = recipes.filter((r) => r.tipo_acceso === 'Premium');
  const favoriteRecipes = user
    ? recipes.filter((r) => user.favorites.includes(r.id))
    : [];

  return (
    <div className="min-h-screen bg-[#F6F3EB] pb-20 text-[#1A2E22] md:pb-12">
      {/* TOP BAR CONTRACT: 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-[#1B4332]/10 bg-[#FCFDFB]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              setView('inicio');
            }}
            className="font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 text-[#1B4332]"
          >
            CreciSano
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#4A5D52] md:flex">
            <button
              type="button"
              onClick={() => setView('inicio')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                view === 'inicio' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todas');
                setAccessFilter('Todas');
                setView('recetas');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                view === 'recetas' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
              }`}
            >
              Recetas
            </button>
            <button
              type="button"
              onClick={() => setView('ingredientes')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                view === 'ingredientes' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
              }`}
            >
              Buscar por ingredientes
            </button>
            <button
              type="button"
              onClick={() => setView('premium')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                view === 'premium' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
              }`}
            >
              Premium
            </button>
            <button
              type="button"
              onClick={() => setView('compras')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                view === 'compras' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
              }`}
            >
              Lista de compras
            </button>
            {user?.rol === 'admin' && (
              <button
                type="button"
                onClick={() => setView('admin')}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1B4332] ${
                  view === 'admin' ? 'font-semibold text-[#1B4332] underline underline-offset-4' : ''
                }`}
              >
                Administrar
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action (+ PWA install if available) */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            {user ? (
              <button
                type="button"
                onClick={() => setView('cuenta')}
                className="min-h-[40px] rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 text-white transition-colors hover:bg-[#143326]"
              >
                Mi cuenta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal({ open: true, mode: 'login' })}
                className="min-h-[40px] rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 text-white transition-colors hover:bg-[#143326]"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* ==================== 1. PANTALLA DE INICIO ==================== */}
        {view === 'inicio' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <section className="overflow-hidden rounded-3xl border border-[#1B4332]/10 bg-white p-6 sm:p-10 lg:p-12">
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="mb-5 flex items-center gap-3">
                    <img
                      src="/assets/aistudio/Logotipo_Moda_Vintage_Minimalista_Beige_y_Azul_8f32ae19.png"
                      alt="Logotipo CreciSano"
                      className="h-14 w-14 rounded-2xl border border-[#1B4332]/10 object-cover"
                    />
                    <span className="text-xs font-semibold tracking-wide text-[#2D6A4F] uppercase">
                      Alimentación saludable para madres y familias
                    </span>
                  </div>

                  <h1 className="font-display text-3xl leading-tight font-bold text-balance text-[#1A2E22] sm:text-5xl">
                    ¡Cocinar rico y saludable nunca fue tan fácil!
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4A5D52] sm:text-lg">
                    Descubre recetas deliciosas, encuentra nuevas ideas y prepara comidas utilizando los ingredientes que tienes en casa. En CreciSano hacemos que cada comida sea más sencilla.
                  </p>

                  {/* Main Search Bar */}
                  <form
                    onSubmit={handleHeroSearchSubmit}
                    className="mt-6 flex flex-col gap-2.5 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#52665A]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Busca una receta o escribe ingredientes (ej. pollo, arroz, papa)..."
                        className="min-h-[48px] w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] pr-4 pl-10 text-sm text-[#1A2E22] focus:border-[#1B4332] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[48px] rounded-xl bg-[#1B4332] px-6 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#143326]"
                    >
                      Descubrir recetas
                    </button>
                  </form>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#1B4332]">
                    <button
                      type="button"
                      onClick={() => setView('ingredientes')}
                      className="underline underline-offset-4 hover:text-[#2D6A4F]"
                    >
                      Buscador inteligente por ingredientes →
                    </button>
                    {!user && (
                      <button
                        type="button"
                        onClick={() => setAuthModal({ open: true, mode: 'register' })}
                        className="underline underline-offset-4 hover:text-[#2D6A4F]"
                      >
                        Crear cuenta gratuita →
                      </button>
                    )}
                  </div>
                </div>

                {/* Editorial Food Showcase */}
                <div className="grid grid-cols-2 gap-4 lg:col-span-5">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10">
                      <img
                        src="/dishes/tallarines_verdes_1793843478129.jpg"
                        alt="Tallarines verdes con pollo a la plancha"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10">
                      <img
                        src="/dishes/jugo_fresa_1793843478752.jpg"
                        alt="Jugo natural de fresa"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-6">
                    <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10">
                      <img
                        src="/dishes/panqueques_frutas_1793843477901.jpg"
                        alt="Panqueques de avena con frutas frescas"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-[#1B4332]/10">
                      <img
                        src="/dishes/lonchera_saludable_1793843479461.jpg"
                        alt="Lonchera nutritiva de mini sándwiches y fruta"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Categorías de Recetas (9 Gratis + 9 Premium) */}
            <section>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                    Categorías de recetas
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D52]">
                    90 recetas gratuitas y 90 recetas exclusivas Premium organizadas para cada momento del día.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Todas');
                    setAccessFilter('Todas');
                    setView('recetas');
                  }}
                  className="text-sm font-semibold text-[#1B4332] hover:underline"
                >
                  Ver todas las recetas →
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {freeCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => openCategory(cat, 'Gratis')}
                    className="flex flex-col items-start rounded-2xl border border-[#1B4332]/10 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#1B4332]/30 hover:shadow-sm"
                  >
                    <Utensils className="h-5 w-5 text-[#1B4332]" />
                    <span className="font-display mt-2.5 text-base font-bold text-[#1A2E22]">
                      {cat}
                    </span>
                    <span className="mt-0.5 text-xs text-[#52665A]">
                      10 recetas gratis
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setView('premium')}
                  className="flex flex-col items-start rounded-2xl border border-[#1B4332] bg-[#1B4332] p-4 text-left text-white transition-all hover:-translate-y-0.5 hover:bg-[#143326]"
                >
                  <Crown className="h-5 w-5 text-[#74C69D]" />
                  <span className="font-display mt-2.5 text-base font-bold">
                    CreciSano Premium
                  </span>
                  <span className="mt-0.5 text-xs text-[#E9F5DB]">
                    9 categorías · 90 recetas
                  </span>
                </button>
              </div>
            </section>

            {/* Recetas Recomendadas */}
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                    Recetas recomendadas
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D52]">
                    Preparaciones prácticas, nutritivas y probadas para la mesa familiar.
                  </p>
                </div>
              </div>

              {loadingRecipes ? (
                <p className="mt-6 text-sm text-[#52665A]">Cargando recetas...</p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={user?.favorites.includes(recipe.id) || false}
                      onSelect={setSelectedRecipeId}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Recetas Populares */}
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                    Recetas populares
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D52]">
                    Las favoritas de las madres por su sabor, rapidez y economía.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {popularRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={user?.favorites.includes(recipe.id) || false}
                    onSelect={setSelectedRecipeId}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </section>

            {/* Sección de Recetas Premium */}
            <section className="rounded-3xl border border-[#1B4332]/15 bg-[#EFECE3] p-6 sm:p-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1B4332] uppercase">
                    <Lock className="h-4 w-4" />
                    <span>Contenido exclusivo</span>
                  </div>
                  <h2 className="font-display mt-1 text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                    CreciSano Premium
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-[#4A5D52]">
                    Accede a 90 recetas exclusivas adicionales, loncheras creativas, postres caseros sin azúcar refinada y videos originales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView('premium')}
                  className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-[#143326]"
                >
                  Conocer CreciSano Premium
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {premiumRecipes.slice(0, 3).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={user?.favorites.includes(recipe.id) || false}
                    onSelect={setSelectedRecipeId}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </section>

            {/* Beneficios de utilizar CreciSano & Registro */}
            <section className="rounded-3xl border border-[#1B4332]/10 bg-white p-6 sm:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <h2 className="font-display text-2xl font-bold text-[#1A2E22] sm:text-3xl">
                    ¿Por qué las familias eligen CreciSano?
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1B4332]">
                        Cocina con lo que ya tienes
                      </h3>
                      <p className="mt-1 text-sm text-[#4A5D52]">
                        Escribe los ingredientes de tu despensa o refrigerador y descubre qué preparar al instante.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1B4332]">
                        Pensado para madres ocupadas
                      </h3>
                      <p className="mt-1 text-sm text-[#4A5D52]">
                        Pasos claros, tiempos reales y recomendaciones nutricionales por edad para tus hijos.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1B4332]">
                        Recetas económicas y reales
                      </h3>
                      <p className="mt-1 text-sm text-[#4A5D52]">
                        Ingredientes accesibles del mercado local sin desperdiciar alimentos.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1B4332]">
                        Web y móvil sincronizados
                      </h3>
                      <p className="mt-1 text-sm text-[#4A5D52]">
                        Tu lista de compras, favoritos y membresía siempre disponibles en tu celular y computadora.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F6F3EB] p-6 sm:p-8 lg:col-span-5">
                  <h3 className="font-display text-xl font-bold text-[#1A2E22]">
                    {user ? `Hola, ${user.nombre}` : 'Únete gratis a CreciSano'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A5D52]">
                    {user
                      ? 'Administra tus recetas favoritas, tu lista de compras semanal y tu membresía desde tu cuenta.'
                      : 'Crea tu cuenta en segundos para guardar tus recetas favoritas, armar tu lista de compras y sincronizar tus dispositivos.'}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => setView('cuenta')}
                        className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
                      >
                        Ir a Mi cuenta
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setAuthModal({ open: true, mode: 'register' })}
                          className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#143326]"
                        >
                          Registrarse gratis
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthModal({ open: true, mode: 'login' })}
                          className="min-h-[44px] rounded-xl border border-[#1B4332] px-5 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-white"
                        >
                          Iniciar sesión
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== 2. BIBLIOTECA DE RECETAS ==================== */}
        {view === 'recetas' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-[#1A2E22]">
                Biblioteca de recetas
              </h1>
              <p className="mt-1 text-sm text-[#4A5D52]">
                Explora {filteredRecipes.length} preparaciones saludables, prácticas y económicas.
              </p>
            </div>

            {/* Filters Bar */}
            <div className="space-y-4 rounded-2xl border border-[#1B4332]/10 bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Buscar por nombre
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. tallarines, quinua, panqueques..."
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2 text-sm"
                  >
                    <option value="Todas">Todas las categorías</option>
                    <optgroup label="Biblioteca Gratuita">
                      {freeCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="CreciSano Premium">
                      {premiumCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Tiempo máximo
                  </label>
                  <select
                    value={maxTimeFilter}
                    onChange={(e) => setMaxTimeFilter(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2 text-sm"
                  >
                    <option value="">Cualquier tiempo</option>
                    <option value="15">Hasta 15 minutos</option>
                    <option value="25">Hasta 25 minutos</option>
                    <option value="40">Hasta 40 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2E22]">
                    Dificultad
                  </label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-3.5 py-2 text-sm"
                  >
                    <option value="Todas">Todas</option>
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Elaborada">Elaborada</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(['Todas', 'Gratis', 'Premium'] as const).map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setAccessFilter(acc)}
                    className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      accessFilter === acc
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-[#F6F3EB] text-[#1A2E22] hover:bg-[#EFECE3]'
                    }`}
                  >
                    {acc === 'Todas'
                      ? 'Todas'
                      : acc === 'Gratis'
                      ? 'Gratuitas'
                      : 'CreciSano Premium'}
                  </button>
                ))}
              </div>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center text-sm text-[#52665A]">
                No encontramos recetas con esos filtros. Prueba limpiando la búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={user?.favorites.includes(recipe.id) || false}
                    onSelect={setSelectedRecipeId}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. BUSCADOR INTELIGENTE POR INGREDIENTES ==================== */}
        {view === 'ingredientes' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-[#1A2E22]">
                Buscador inteligente por ingredientes
              </h1>
              <p className="mt-1 text-sm text-[#4A5D52]">
                Escribe o selecciona los ingredientes que tienes disponibles en casa y descubre qué cocinar hoy.
              </p>
            </div>

            <div className="rounded-3xl border border-[#1B4332]/10 bg-white p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddIngredientChip(ingredientInput);
                }}
                className="flex flex-col gap-2.5 sm:flex-row"
              >
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Escribe un ingrediente (ej. Pollo, Arroz, Zanahoria, Papa)..."
                  className="min-h-[44px] flex-1 rounded-xl border border-[#1B4332]/20 bg-[#FCFDFB] px-4 py-2 text-sm focus:border-[#1B4332] focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2 text-sm font-semibold text-white hover:bg-[#143326]"
                >
                  Agregar ingrediente
                </button>
              </form>

              {/* Selected Ingredients */}
              {selectedIngredients.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1B4332]">
                      Ingredientes seleccionados ({selectedIngredients.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedIngredients([])}
                      className="text-xs text-[#B8332A] hover:underline"
                    >
                      Limpiar todos
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIngredients.map((ing) => (
                      <button
                        key={ing}
                        type="button"
                        onClick={() =>
                          setSelectedIngredients(
                            selectedIngredients.filter((i) => i !== ing)
                          )
                        }
                        className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#1B4332] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <span>{ing}</span>
                        <span>✕</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              <div className="mt-5 border-t border-[#1B4332]/10 pt-4">
                <p className="text-xs font-semibold text-[#52665A]">
                  Ingredientes frecuentes en casa (toca para añadir):
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {COMMON_HOUSEHOLD_INGREDIENTS.map((ing) => {
                    const active = selectedIngredients.some(
                      (i) => i.toLowerCase() === ing.toLowerCase()
                    );
                    return (
                      <button
                        key={ing}
                        type="button"
                        onClick={() =>
                          active
                            ? setSelectedIngredients(
                                selectedIngredients.filter(
                                  (i) => i.toLowerCase() !== ing.toLowerCase()
                                )
                              )
                            : handleAddIngredientChip(ing)
                        }
                        className={`min-h-[36px] rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'border-[#1B4332] bg-[#E9F5DB] font-semibold text-[#1B4332]'
                            : 'border-[#1B4332]/15 bg-[#F6F3EB] text-[#1A2E22] hover:bg-[#EFECE3]'
                        }`}
                      >
                        {active ? `✓ ${ing}` : `+ ${ing}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Results */}
            {selectedIngredients.length === 0 ? (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center text-sm text-[#52665A]">
                Selecciona uno o varios ingredientes arriba para ver las recetas que puedes preparar hoy.
              </div>
            ) : searchingIngredients ? (
              <p className="text-sm text-[#52665A]">Buscando coincidencias...</p>
            ) : ingredientResults.length === 0 ? (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center text-sm text-[#52665A]">
                No encontramos recetas con esa combinación exacta. Prueba quitando algún ingrediente.
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm font-semibold text-[#1B4332]">
                  Encontramos {ingredientResults.length} recetas ordenadas por mayor coincidencia:
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {ingredientResults.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={user?.favorites.includes(recipe.id) || false}
                      onSelect={setSelectedRecipeId}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. CRECISANO PREMIUM ==================== */}
        {view === 'premium' && (
          <PremiumView
            user={user}
            premiumRecipes={premiumRecipes}
            premiumCategories={premiumCategories}
            onSelectRecipe={setSelectedRecipeId}
            onToggleFavorite={handleToggleFavorite}
            onRequireAuth={() => setAuthModal({ open: true, mode: 'login' })}
          />
        )}

        {/* ==================== 5. FAVORITOS ==================== */}
        {view === 'favoritos' && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl font-bold text-[#1A2E22]">
              Mis recetas favoritas
            </h1>
            {!user ? (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center">
                <p className="text-sm text-[#4A5D52]">
                  Inicia sesión para guardar y consultar tus recetas favoritas.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, mode: 'login' })}
                  className="mt-4 min-h-[44px] rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Iniciar sesión
                </button>
              </div>
            ) : favoriteRecipes.length === 0 ? (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-10 text-center text-sm text-[#52665A]">
                Aún no tienes recetas guardadas en favoritos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteRecipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    isFavorite={true}
                    onSelect={setSelectedRecipeId}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 6. LISTA DE COMPRAS ==================== */}
        {view === 'compras' && (
          <ShoppingListView
            items={shoppingList}
            isAuthenticated={Boolean(user)}
            onAddItem={async (ingrediente, cantidad, categoria) => {
              const res = await apiFetch<{ items: ShoppingItem[] }>(
                '/api/shopping-list',
                {
                  method: 'POST',
                  body: JSON.stringify({ ingrediente, cantidad, categoria }),
                }
              );
              setShoppingList(res.items);
            }}
            onToggleItem={async (id) => {
              const res = await apiFetch<{ items: ShoppingItem[] }>(
                `/api/shopping-list/${id}`,
                { method: 'PATCH' }
              );
              setShoppingList(res.items);
            }}
            onDeleteItem={async (id) => {
              const res = await apiFetch<{ items: ShoppingItem[] }>(
                `/api/shopping-list/${id}`,
                { method: 'DELETE' }
              );
              setShoppingList(res.items);
            }}
            onRequireAuth={() => setAuthModal({ open: true, mode: 'login' })}
          />
        )}

        {/* ==================== 7. MI CUENTA ==================== */}
        {view === 'cuenta' && (
          <AccountView
            user={user}
            allRecipes={recipes}
            onUpdateUser={setUser}
            onLogout={handleLogout}
            onRequireAuth={() => setAuthModal({ open: true, mode: 'login' })}
            onSelectRecipe={setSelectedRecipeId}
            onToggleFavorite={handleToggleFavorite}
            onGoToPremium={() => setView('premium')}
            onGoToAdmin={() => setView('admin')}
          />
        )}

        {/* ==================== 8. ADMINISTRAR CRECISANO ==================== */}
        {view === 'admin' && user?.rol === 'admin' && (
          <AdminPanel
            allCategories={[...freeCategories, ...premiumCategories]}
            onDataChanged={loadInitialData}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb Zone, <= 60px height) */}
      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-40 border-t border-[#1B4332]/10 bg-[#FCFDFB]/95 backdrop-blur-md md:hidden">
        <div className="grid h-15 grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => setView('inicio')}
            className={`flex flex-col items-center justify-center ${
              view === 'inicio' ? 'text-[#1B4332]' : 'text-[#52665A]'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => setView('recetas')}
            className={`flex flex-col items-center justify-center ${
              view === 'recetas' ? 'text-[#1B4332]' : 'text-[#52665A]'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Recetas</span>
          </button>

          <button
            type="button"
            onClick={() => setView('ingredientes')}
            className={`flex flex-col items-center justify-center ${
              view === 'ingredientes' ? 'text-[#1B4332]' : 'text-[#52665A]'
            }`}
          >
            <ChefHat className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Ingredientes</span>
          </button>

          <button
            type="button"
            onClick={() => setView('compras')}
            className={`flex flex-col items-center justify-center ${
              view === 'compras' ? 'text-[#1B4332]' : 'text-[#52665A]'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Compras</span>
          </button>

          <button
            type="button"
            onClick={() => setView('cuenta')}
            className={`flex flex-col items-center justify-center ${
              view === 'cuenta' ? 'text-[#1B4332]' : 'text-[#52665A]'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Cuenta</span>
          </button>
        </div>
      </nav>

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipeId !== null && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          isFavorite={user?.favorites.includes(selectedRecipeId) || false}
          isPrepared={user?.prepared.includes(selectedRecipeId) || false}
          onClose={() => setSelectedRecipeId(null)}
          onSelectRecipe={(id) => setSelectedRecipeId(id)}
          onToggleFavorite={handleToggleFavorite}
          onTogglePrepared={handleTogglePrepared}
          onAddIngredientsToShoppingList={handleAddIngredientsToShoppingList}
          onGoToPremium={() => setView('premium')}
        />
      )}

      {/* AUTH MODAL */}
      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ ...authModal, open: false })}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed right-4 bottom-20 z-50 rounded-xl bg-[#1B4332] px-4 py-3 text-xs font-semibold text-white shadow-lg md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
