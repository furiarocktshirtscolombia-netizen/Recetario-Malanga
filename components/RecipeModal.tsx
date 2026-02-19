
import React, { useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  Printer,
  UtensilsCrossed,
  ScrollText,
  Flame,
  Layout
} from 'lucide-react';
import { Recipe } from '../types';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-malanga-greenDark/90 backdrop-blur-xl">
      <div className="bg-malanga-pink border border-malanga-white w-full max-w-7xl max-h-full rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in ring-1 ring-malanga-white/20">
        
        {/* Header Section */}
        <div className="p-8 sm:p-10 border-b border-malanga-greenDark/10 flex justify-between items-center bg-malanga-green text-malanga-white relative">
          <div className="flex items-center gap-6 z-10">
            <div className="w-14 h-14 bg-malanga-white rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="w-7 h-7 text-malanga-green" />
            </div>
            <div>
              <span className="text-[10px] text-malanga-white/60 uppercase tracking-[0.4em] font-black">{recipe.familia}</span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none">{recipe.nombre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 z-10">
            <button onClick={() => window.print()} className="w-10 h-10 rounded-full bg-malanga-white/10 flex items-center justify-center text-malanga-white hover:bg-malanga-white hover:text-malanga-green transition-all">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-malanga-white flex items-center justify-center text-malanga-green hover:bg-malanga-pinkSoft transition-all group">
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar bg-malanga-white/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left: Ingredients & Desc */}
            <div className="lg:col-span-6 p-8 sm:p-12 space-y-10 border-r border-malanga-green/5">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <UtensilsCrossed className="w-5 h-5 text-malanga-green" />
                  <h3 className="text-xl font-black text-malanga-greenDark uppercase tracking-tighter">Insumos</h3>
                </div>
                
                <div className="bg-malanga-white rounded-[2.5rem] border border-malanga-green/10 shadow-sm overflow-hidden">
                  {/* Table Header for 3 columns */}
                  <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-malanga-pinkSoft/30 border-b border-malanga-pinkSoft text-[10px] font-black text-malanga-green uppercase tracking-[0.2em]">
                    <div className="col-span-7">Artículo / Insumo</div>
                    <div className="col-span-2 text-center">Unidad</div>
                    <div className="col-span-3 text-right">Cant. Neta</div>
                  </div>

                  <div className="divide-y divide-malanga-pinkSoft">
                    {recipe.ingredientes.map((ing, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-malanga-pinkSoft/10 transition-colors">
                        {/* Columna 1: Artículo */}
                        <div className="col-span-7">
                          <p className="text-[13px] font-black text-malanga-greenDark uppercase leading-tight tracking-tight">
                            {ing.insumo}
                          </p>
                        </div>
                        
                        {/* Columna 2: Unidad */}
                        <div className="col-span-2 text-center">
                          <span className="text-[11px] font-bold text-malanga-greenDark/60 uppercase tracking-wider">
                            {ing.unidad}
                          </span>
                        </div>

                        {/* Columna 3: Cantidad */}
                        <div className="col-span-3 text-right">
                          <span className="text-xl font-black text-malanga-greenDark leading-none">
                            {ing.cantidad}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {recipe.descripcion && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <ScrollText className="w-5 h-5 text-malanga-green" />
                    <h3 className="text-xl font-black text-malanga-greenDark uppercase tracking-tighter">En la Carta</h3>
                  </div>
                  <div className="bg-malanga-pinkSoft/40 p-8 rounded-[2rem] border border-malanga-green/5 italic text-malanga-greenDark text-lg leading-relaxed shadow-inner">
                    "{recipe.descripcion}"
                  </div>
                </section>
              )}
            </div>

            {/* Right: Preparation & Plating */}
            <div className="lg:col-span-6 p-8 sm:p-12 space-y-12 bg-malanga-white/60">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Flame className="w-6 h-6 text-malanga-green" />
                  <h3 className="text-2xl font-black text-malanga-greenDark uppercase tracking-tighter">Preparación Técnica</h3>
                </div>
                <div className="prose prose-sm text-malanga-text/80 leading-loose bg-malanga-white p-8 rounded-[2.5rem] border border-malanga-green/10 shadow-sm whitespace-pre-wrap font-serif italic text-base">
                  {recipe.preparacion || recipe.instrucciones || "No se registró proceso detallado en la matriz."}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Layout className="w-6 h-6 text-malanga-green" />
                  <h3 className="text-2xl font-black text-malanga-greenDark uppercase tracking-tighter">Arte del Emplatado</h3>
                </div>
                <div className="bg-malanga-greenDark/5 p-8 rounded-[2.5rem] border border-malanga-green/10 text-malanga-greenDark leading-relaxed font-bold italic text-base whitespace-pre-wrap">
                  {recipe.emplatado || "Instrucciones de servicio pendientes de registro técnico."}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="p-8 bg-malanga-white border-t border-malanga-green/5 flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-malanga-green text-malanga-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-malanga-greenDark transition-all">
            Cerrar Ficha Técnica
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
