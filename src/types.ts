export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'usuaria' | 'admin';
  foto_perfil: string | null;
  isPremium: boolean;
  subscription: {
    id: number;
    plan: string;
    estado: 'activa' | 'cancelada' | 'vencida';
    fecha_inicio: string;
    fecha_vencimiento: string;
    identificador_transaccion: string;
  } | null;
  favorites: number[];
  prepared: number[];
  payments: Array<{
    id: number;
    proveedor: string;
    identificador_transaccion: string;
    importe_soles: number;
    estado: string;
    fecha: string;
  }>;
  subscriptionHistory: Array<{
    id: number;
    plan: string;
    estado: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    identificador_transaccion: string;
  }>;
}

export interface IngredientItem {
  id?: number;
  nombre: string;
  cantidad: string;
  unidad: string;
}

export interface PreparationStep {
  id?: number;
  numero_paso: number;
  instruccion: string;
}

export interface RecipeSummary {
  id: number;
  nombre: string;
  descripcion: string;
  fotografia: string | null;
  categoria: string;
  tipo_acceso: 'Gratis' | 'Premium';
  tiempo: number;
  porciones: number;
  dificultad: 'Fácil' | 'Media' | 'Elaborada';
  destacada?: number;
  popular?: number;
  locked: boolean;
  totalIngredients?: number;
  matchCount?: number;
  matchedIngredients?: string[];
  missingIngredients?: string[];
}

export interface RecipeDetail extends RecipeSummary {
  consejos?: string;
  apto_ninos?: string | null;
  ingredientes?: IngredientItem[];
  preparaciones?: PreparationStep[];
  videoUrl?: string | null;
}

export interface SubscriptionPlan {
  id: number;
  codigo: string;
  nombre: string;
  precio_soles: number;
  duracion_dias: number;
  condiciones_renovacion: string;
  activo: number;
}

export interface ShoppingItem {
  id: number;
  usuaria_id: number;
  ingrediente: string;
  cantidad: string;
  categoria: string;
  comprado: number;
}

export type AppView =
  | 'inicio'
  | 'recetas'
  | 'premium'
  | 'ingredientes'
  | 'favoritos'
  | 'compras'
  | 'cuenta'
  | 'admin';
