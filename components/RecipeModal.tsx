
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  Sparkles, 
  Wine, 
  Lightbulb, 
  Apple, 
  ArrowUpRight,
  Printer,
  Info,
  UtensilsCrossed,
  ScrollText
} from 'lucide-react';
import { Recipe, GeminiEnhancement } from '../types';
import { getRecipeEnhancement } from '../services/geminiService';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  const [enhancement, setEnhancement] = useState<GeminiEnhancement | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const data = await getRecipeEnhancement(recipe);
      setEnhancement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-hw-bg/95 backdrop-blur-md">
      <div className="bg-hw-surface border border-hw-border w-full max-w-6xl max-h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in border-hw-orange/20">
        
        {/* Header con Branding */}
        <div className="p-8 border-b border-hw-border flex justify-between items-center bg-hw-surface2/50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-hw-orange rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-hw-orange/40">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-hw-orange uppercase tracking-[0.4em] font-black">{recipe.familia}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none mt-1">{recipe.nombre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => window.print()} className="w-10 h-10 rounded-xl bg-hw-surface border border-hw-border flex items-center justify-center text-hw-muted hover:text-white transition-all">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-hw-orange/10 border border-hw-orange/30 flex items-center justify-center text-hw-orange hover:bg-hw-orange hover:text-white transition-all group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Contenido Izquierdo: Matriz Técnica */}
            <div className="lg:col-span-8 p-8 sm:p-12 space-y-12 border-r border-hw-border">
              
              {recipe.descripcion && (
                <div className="bg-hw-orange/5 border-l-4 border-hw-orange p-6 rounded-r-2xl">
                  <p className="text-hw-orange text-xs font-black uppercase tracking-widest mb-2">Reseña de la Carta</p>
                  <p className="text-white text-lg italic font-medium leading-relaxed">"{recipe.descripcion}"</p>
                </div>
              )}

              {/* Tabla de Ingredientes Estilo Matriz */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <UtensilsCrossed className="w-5 h-5 text-hw-orange" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Composición de Insumos</h3>
                </div>
                <div className="bg-hw-surface2/50 border border-hw-border rounded-3xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-hw-surface border-b border-hw-border">
                        <th className="px-6 py-4 font-black text-hw-muted uppercase tracking-widest text-[10px]">Ingrediente / Insumo</th>
                        <th className="px-6 py-4 font-black text-hw-muted uppercase tracking-widest text-[10px]">Und.</th>
                        <th className="px-6 py-4 font-black text-hw-muted uppercase tracking-widest text-[10px] text-right">Cant. Neta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hw-border/50">
                      {recipe.ingredientes.map((ing, i) => (
                        <tr key={i} className="hover:bg-hw-orange/5 transition-colors group">
                          <td className="px-6 py-4 text-white font-bold group-hover:text-hw-orange transition-colors">{ing.insumo}</td>
                          <td className="px-6 py-4 text-hw-muted uppercase font-bold">{ing.unidad}</td>
                          <td className="px-6 py-4 text-right font-mono text-hw-orange font-black">{ing.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Proceso Técnico */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <ScrollText className="w-5 h-5 text-hw-orange" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Proceso de Elaboración</h3>
                </div>
                <div className="bg-hw-surface2/30 p-8 rounded-3xl border border-hw-border/50 text-hw-muted leading-relaxed text-base whitespace-pre-wrap font-medium">
                  {recipe.instrucciones}
                </div>
              </section>
            </div>

            {/* Contenido Derecho: Potenciador IA */}
            <div className="lg:col-span-4 bg-hw-surface2/50 p-8 sm:p-12 space-y-8">
              {!enhancement ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                  <div className="w-24 h-24 bg-hw-orange/10 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-hw-orange/20 border border-hw-orange/20">
                    <Sparkles className="w-12 h-12 text-hw-orange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Gemini Gastronomy</h3>
                    <p className="text-hw-muted text-sm leading-relaxed max-w-xs mx-auto">
                      Analiza la matriz técnica y genera variaciones gourmet, maridajes exclusivos y secretos de alta cocina.
                    </p>
                  </div>
                  <button
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="w-full bg-hw-orange hover:bg-hw-orange2 text-white font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-hw-orange/30 group"
                  >
                    {isEnhancing ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        MEJORAR RECETA
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-hw-orange uppercase tracking-tighter flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      Optimizaciones AI
                    </h3>
                    <button onClick={() => setEnhancement(null)} className="text-[10px] text-hw-muted hover:text-white uppercase font-black tracking-widest bg-hw-surface border border-hw-border px-3 py-1 rounded-lg">
                      Reset
                    </button>
                  </div>

                  {/* Cards de IA */}
                  {[
                    { title: 'Versión Gourmet', icon: ArrowUpRight, content: enhancement.variacionGourmet },
                    { title: 'Maridaje Pro', icon: Wine, content: enhancement.maridajeSugerido },
                    { title: 'Secreto del Chef', icon: Lightbulb, content: enhancement.tipPro },
                    { title: 'Perfil Nutricional', icon: Apple, content: enhancement.valorNutricional }
                  ].map((card, i) => (
                    <div key={i} className="bg-hw-surface border border-hw-border p-6 rounded-[1.5rem] shadow-xl hover:border-hw-orange/30 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <card.icon className="w-5 h-5 text-hw-orange" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">{card.title}</h4>
                      </div>
                      <p className="text-sm text-hw-muted leading-relaxed font-medium italic">
                        {card.content}
                      </p>
                    </div>
                  ))}

                  <div className="pt-6 flex items-center gap-3 text-[10px] text-hw-muted/60 justify-center border-t border-hw-border/50">
                    <Info className="w-3 h-3" />
                    HOT WINGS INTELLIGENCE SYSTEM
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-hw-surface2 border-t border-hw-border flex justify-end">
           <button 
            className="px-10 py-4 bg-hw-surface border border-hw-border text-hw-muted hover:text-hw-orange hover:border-hw-orange rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all"
            onClick={onClose}
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
