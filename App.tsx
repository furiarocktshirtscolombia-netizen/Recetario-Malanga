
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChefHat, 
  FileSpreadsheet, 
  Leaf, 
  ChevronLeft,
  LayoutGrid,
  Library,
  Sparkles,
  RefreshCcw
} from 'lucide-react';
import { Recipe, Family } from './types';
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
    const saved = localStorage.getItem('malanga_families');
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
      localStorage.setItem('malanga_families', JSON.stringify(parsedFamilies));
      setSelectedFamily(null);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error al leer el archivo Excel. Verifica el formato de la matriz de Malanga.");
      setIsLoading(false);
    }
  };

  const filteredFamilies = useMemo(() => {
    if (!searchQuery) return families;
    const q = searchQuery.toLowerCase();
    return families.filter(f => 
      f.name.toLowerCase().includes(q) ||
      f.recipes.some(r => r.nombre.toLowerCase().includes(q))
    );
  }, [families, searchQuery]);

  const displayedRecipes = useMemo(() => {
    if (!selectedFamily) return [];
    if (!searchQuery) return selectedFamily.recipes;
    const q = searchQuery.toLowerCase();
    return selectedFamily.recipes.filter(r => 
      r.nombre.toLowerCase().includes(q) ||
      r.ingredientes.some(i => i.insumo.toLowerCase().includes(q))
    );
  }, [selectedFamily, searchQuery]);

  const clearData = () => {
    if (confirm("¿Deseas borrar los datos locales? Tendrás que subir el Excel de nuevo.")) {
      localStorage.removeItem('malanga_families');
      setFamilies([]);
      setSelectedFamily(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-malanga-pink text-malanga-text">
      {/* Navbar Superior Malanga Style */}
      <header className="sticky top-0 z-40 bg-malanga-green text-malanga-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center gap-4 cursor-pointer" 
              onClick={() => {setSelectedFamily(null); setSearchQuery('');}}
            >
              <div className="bg-malanga-white p-2 rounded-full shadow-md">
                <Leaf className="w-6 h-6 text-malanga-green" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter leading-none">
                  MALANGA <span className="opacity-70 font-light">MATRIZ</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 opacity-80">
                  Gestión Gastronómica Pro
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-8 relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-malanga-white/50 group-focus-within:text-malanga-white transition-colors" />
              <input
                type="text"
                placeholder={selectedFamily ? `Buscar en ${selectedFamily.name}...` : "Buscar familias o platos..."}
                className="w-full bg-malanga-greenDark/30 border border-malanga-white/20 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-malanga-white/30 focus:border-malanga-white transition-all placeholder:text-malanga-white/40 text-malanga-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-malanga-white text-malanga-green hover:bg-malanga-pinkSoft px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md border border-malanga-green/10">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Sincronizar Excel</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-malanga-green/10 border-t-malanga-green rounded-full animate-spin"></div>
              <ChefHat className="w-8 h-8 text-malanga-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-8 text-malanga-green font-bold tracking-widest uppercase text-xs animate-pulse italic">
              Analizando Matriz Malanga...
            </p>
          </div>
        ) : !selectedFamily ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Library className="w-6 h-6 text-malanga-green" />
                <h2 className="text-4xl font-black text-malanga-greenDark uppercase tracking-tighter">Categorías</h2>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-malanga-text/60 text-xs font-bold bg-malanga-pinkSoft border border-malanga-green/10 px-4 py-2 rounded-full">
                  {families.length} Familias cargadas
                </span>
                {families.length > 0 && (
                  <button onClick={clearData} className="text-malanga-green hover:text-malanga-greenDark transition-colors">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {families.length === 0 ? (
              <div className="bg-malanga-white border-2 border-dashed border-malanga-green/20 rounded-[3rem] py-24 px-10 text-center shadow-sm">
                <div className="w-24 h-24 bg-malanga-pinkSoft rounded-full flex items-center justify-center mx-auto mb-8">
                  <FileSpreadsheet className="w-10 h-10 text-malanga-green" />
                </div>
                <h3 className="text-2xl font-black text-malanga-greenDark mb-4 uppercase">El recetario está listo</h3>
                <p className="text-malanga-text/70 max-w-md mx-auto mb-10 text-lg leading-relaxed italic">
                  Carga la <strong>"Matriz de costos Malanga.xlsx"</strong> para explorar el corazón de nuestra cocina.
                </p>
                <label className="inline-flex cursor-pointer bg-malanga-green text-malanga-white hover:bg-malanga-greenDark px-10 py-4 rounded-full font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
                  Importar Matriz
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredFamilies.map((f, idx) => (
                  <button
                    key={f.name}
                    onClick={() => {setSelectedFamily(f); setSearchQuery(''); window.scrollTo(0,0);}}
                    className="group bg-malanga-white border border-malanga-green/5 rounded-[2.5rem] p-10 text-left hover:border-malanga-green transition-all hover:-translate-y-2 animate-fade-in shadow-sm hover:shadow-xl"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="text-[10px] font-black text-malanga-green uppercase tracking-[0.4em] mb-4 opacity-60">Familia</div>
                    <div className="text-2xl font-black text-malanga-greenDark group-hover:text-malanga-green transition-colors mb-6 leading-tight h-14 line-clamp-2">
                      {f.name}
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-malanga-pinkSoft">
                      <div className="flex items-center gap-2 text-malanga-text/60">
                        <ChefHat className="w-4 h-4 text-malanga-green/40" />
                        <span className="text-xs font-bold italic">{f.recipes.length} Recetas</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-malanga-pinkSoft flex items-center justify-center group-hover:bg-malanga-green group-hover:text-malanga-white transition-all shadow-inner">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSelectedFamily(null)}
                  className="w-14 h-14 bg-malanga-white border border-malanga-green/10 rounded-full flex items-center justify-center hover:border-malanga-green text-malanga-green transition-all group shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-5xl font-black text-malanga-greenDark uppercase tracking-tighter leading-none">{selectedFamily.name}</h2>
                  <p className="text-malanga-green font-bold text-xs uppercase tracking-[0.3em] mt-2 italic">Colección de recetas técnicas</p>
                </div>
              </div>
              <div className="bg-malanga-green text-malanga-white px-8 py-3 rounded-full flex items-center gap-3 shadow-lg">
                <Sparkles className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-wider">Potenciado con Gemini AI</span>
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
              <div className="bg-malanga-white border border-malanga-green/10 rounded-[3rem] py-20 text-center shadow-sm">
                <Search className="w-12 h-12 text-malanga-green/20 mx-auto mb-6" />
                <p className="text-malanga-green font-bold text-lg italic">No se encontraron resultados para tu búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Malanga */}
      <footer className="border-t border-malanga-green/10 py-12 bg-malanga-pinkSoft/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Leaf className="w-5 h-5 text-malanga-green" />
            <span className="text-malanga-greenDark font-black tracking-widest text-sm uppercase">Malanga Matriz System</span>
          </div>
          <p className="text-malanga-text/40 text-[10px] uppercase font-bold tracking-[0.4em]">
            Propiedad de Malanga Brunch & Coffee · Excel Intelligence v3.0
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
