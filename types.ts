
export interface Ingredient {
  insumo: string;
  unidad: string;
  cantidad: number | string;
  costo_linea?: number;
}

export interface Recipe {
  id: string;
  familia: string;
  nombre: string;
  ingredientes: Ingredient[];
  instrucciones: string; // Keep as fallback/combined
  preparacion?: string;
  emplatado?: string;
  descripcion?: string;
  rendimiento?: string;
  tiempoPreparacion?: string;
  costoAproximado?: number;
  fotoUrl?: string;
}

export interface Family {
  name: string;
  recipes: Recipe[];
}

export enum ViewMode {
  FAMILIES = 'families',
  RECIPES = 'recipes'
}

// Added GeminiEnhancement interface to resolve the module error in geminiService.ts
export interface GeminiEnhancement {
  variacionGourmet: string;
  maridajeSugerido: string;
  tipPro: string;
  valorNutricional: string;
}
