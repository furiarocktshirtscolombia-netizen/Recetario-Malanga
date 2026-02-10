
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChefHat, 
  FileSpreadsheet, 
  Flame, 
  ChevronLeft,
  LayoutGrid,
  Library,
  Sparkles
} from 'lucide-react';
import { Recipe, Family, ViewMode } from './types';
import { parseRecipesFromExcel } from './services/excelService';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';

const App: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hw_families');
    if (saved) {
      setFamilies(JSON.parse(saved));
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      const parsedFamilies = await parseRecipesFromExcel(file);
      setFamilies(parsedFamilies);
      localStorage.setItem('hw_families', JSON.stringify(parsedFamilies));
      setSelectedFamily(null);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error al leer el archivo Excel. Verifica el formato de la matriz.");
      setIsLoading(false);
    }
  };

  const filteredFamilies = useMemo(() => {
    if (!searchQuery) return families;
    return families.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.recipes.some(r => r.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [families, searchQuery]);

  const displayedRecipes = useMemo(() => {
    if (!selectedFamily) return [];
    if (!searchQuery) return selectedFamily.recipes;
    return selectedFamily.recipes.filter(r => 
      r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredientes.some(i => i.insumo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedFamily, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-hw-bg text-hw-text">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 bg-hw-surface2/80 backdrop-blur-md border-b border-hw-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSelectedFamily(null); setSearchQuery('');}}>
              <div className="bg-hw-orange p-2.5 rounded-xl shadow-lg shadow-hw-orange/20">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter text-white leading-none">
                  HOTWINGS <span className="text-hw-orange">MATRIZ</span>
                </h1>
                <span className="text-[10px] text-hw-muted uppercase font-bold tracking-[0.2em] mt-1">Recetario Pro</span>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-8 relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hw-muted group-focus-within:text-hw-orange transition-colors" />
              <input
                type="text"
                placeholder={selectedFamily ? `Buscar en ${selectedFamily.name}...` : "Buscar familias o recetas..."}
                className="w-full bg-hw-surface border border-hw-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hw-orange/30 focus:border-hw-orange transition-all placeholder:text-hw-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-hw-orange hover:bg-hw-orange2 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-hw-orange/20">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Sincronizar Excel</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-hw-orange/20 border-t-hw-orange rounded-full animate-spin"></div>
              <ChefHat className="w-8 h-8 text-hw-orange absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-8 text-hw-muted font-bold tracking-widest uppercase text-xs animate-pulse">Analizando Matriz de Costos...</p>
          </div>
        ) : !selectedFamily ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Library className="w-6 h-6 text-hw-orange" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Familias</h2>
              </div>
              <span className="text-hw-muted text-xs font-bold bg-hw-surface border border-hw-border px-4 py-1.5 rounded-full">
                {families.length} Categorías detectadas
              </span>
            </div>

            {families.length === 0 ? (
              <div className="bg-hw-surface border-2 border-dashed border-hw-border rounded-[2.5rem] py-24 px-10 text-center">
                <div className="w-24 h-24 bg-hw-surface2 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FileSpreadsheet className="w-10 h-10 text-hw-muted" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase">El recetario está vacío</h3>
                <p className="text-hw-muted max-w-md mx-auto mb-10 text-lg leading-relaxed">
                  Carga el archivo <strong>"Matriz de costos Malanga.xlsx"</strong> para visualizar todas las familias y sus recetas técnicas.
                </p>
                <label className="inline-flex cursor-pointer bg-hw-surface2 border border-hw-border hover:border-hw-orange text-hw-muted hover:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
                  Comenzar Sincronización
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredFamilies.map((f, idx) => (
                  <button
                    key={f.name}
                    onClick={() => {setSelectedFamily(f); setSearchQuery(''); window.scrollTo(0,0);}}
                    className="group bg-hw-surface border border-hw-border rounded-[2rem] p-8 text-left hover:border-hw-orange transition-all hover:-translate-y-2 animate-fade-in shadow-xl hover:shadow-hw-orange/5"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="text-[10px] font-black text-hw-orange uppercase tracking-[0.4em] mb-4">Categoría</div>
                    <div className="text-2xl font-black text-white group-hover:text-hw-orange transition-colors mb-6 leading-tight h-14 line-clamp-2">
                      {f.name}
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-hw-border/50">
                      <div className="flex items-center gap-2 text-hw-muted">
                        <ChefHat className="w-4 h-4" />
                        <span className="text-xs font-bold">{f.recipes.length} Recetas</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-hw-surface2 flex items-center justify-center group-hover:bg-hw-orange group-hover:text-white transition-all">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedFamily(null)}
                  className="w-12 h-12 bg-hw-surface border border-hw-border rounded-2xl flex items-center justify-center hover:border-hw-orange text-hw-muted hover:text-white transition-all group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedFamily.name}</h2>
                  <p className="text-hw-muted text-xs font-bold uppercase tracking-widest mt-1">Explorando recetas técnicas</p>
                </div>
              </div>
              <div className="bg-hw-orange/10 border border-hw-orange/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-hw-orange" />
                <span className="text-hw-orange font-black text-xs uppercase tracking-wider">Potenciado con Gemini AI</span>
              </div>
            </div>

            {displayedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedRecipes.map((recipe, index) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    viewMode="grid"
                    onClick={() => setSelectedRecipe(recipe)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-hw-surface border border-hw-border rounded-[2.5rem] py-20 text-center">
                <Search className="w-12 h-12 text-hw-muted mx-auto mb-6" />
                <p className="text-hw-muted font-bold text-lg">No se encontraron recetas que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-hw-border py-10 bg-hw-surface2/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-5 h-5 text-hw-orange" />
            <span className="text-white font-black tracking-widest text-sm">HOTWINGS MATRIZ SYSTEM</span>
          </div>
          <p className="text-hw-muted text-[10px] uppercase font-bold tracking-[0.3em]">
            Propiedad Intelectual Hot Wings · Gestión de Costos y Recetas Pro
          </p>
        </div>
      </footer>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  );
};

export default App;
