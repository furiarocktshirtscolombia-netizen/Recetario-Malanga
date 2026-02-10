
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
  instrucciones: string;
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

export interface GeminiEnhancement {
  variacionGourmet: string;
  maridajeSugerido: string;
  tipPro: string;
  valorNutricional: string;
}

export enum ViewMode {
  FAMILIES = 'families',
  RECIPES = 'recipes'
}
