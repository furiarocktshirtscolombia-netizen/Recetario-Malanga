
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
  ScrollText,
  Leaf
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-malanga-greenDark/80 backdrop-blur-md">
      <div className="bg-malanga-pink border border-malanga-white w-full max-w-6xl max-h-full rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in ring-1 ring-malanga-white/20">
        
        {/* Header Malanga Green */}
        <div className="p-10 border-b border-malanga-greenDark/10 flex justify-between items-center bg-malanga-green text-malanga-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-malanga-greenDark/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-malanga-white rounded-full flex items-center justify-center shadow-xl">
              <Leaf className="w-8 h-8 text-malanga-green" />
            </div>
            <div>
              <span className="text-[10px] text-malanga-white/60 uppercase tracking-[0.5em] font-black">{recipe.familia}</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none mt-1">{recipe.nombre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => window.print()} className="w-12 h-12 rounded-full bg-malanga-white/10 border border-malanga-white/20 flex items-center justify-center text-malanga-white hover:bg-malanga-white hover:text-malanga-green transition-all shadow-sm">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-12 h-12 rounded-full bg-malanga-white flex items-center justify-center text-malanga-green hover:bg-malanga-pinkSoft transition-all group shadow-xl">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar bg-malanga-white/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Contenido Izquierdo: Ficha Técnica */}
            <div className="lg:col-span-8 p-10 sm:p-16 space-y-16 border-r border-malanga-green/5">
              
              {recipe.descripcion && (
                <div className="bg-malanga-pinkSoft p-10 rounded-[2.5rem] border border-malanga-green/5 shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                    <ScrollText className="w-5 h-5 text-malanga-green" />
                    <p className="text-malanga-green text-[10px] font-black uppercase tracking-[0.3em]">Nota de la Carta</p>
                  </div>
                  <p className="text-malanga-greenDark text-2xl italic font-medium leading-relaxed">"{recipe.descripcion}"</p>
                </div>
              )}

              {/* Insumos */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <UtensilsCrossed className="w-6 h-6 text-malanga-green" />
                  <h3 className="text-2xl font-black text-malanga-greenDark uppercase tracking-tighter">Composición de Insumos</h3>
                </div>
                <div className="bg-malanga-white border border-malanga-green/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-malanga-pinkSoft/50 border-b border-malanga-green/10">
                        <th className="px-8 py-6 font-black text-malanga-green/60 uppercase tracking-widest text-[10px]">Articulo</th>
                        <th className="px-8 py-6 font-black text-malanga-green/60 uppercase tracking-widest text-[10px]">Unidad</th>
                        <th className="px-8 py-6 font-black text-malanga-green/60 uppercase tracking-widest text-[10px] text-right">Cant. Neta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-malanga-pinkSoft">
                      {recipe.ingredientes.map((ing, i) => (
                        <tr key={i} className="hover:bg-malanga-pinkSoft/30 transition-colors group">
                          <td className="px-8 py-5 text-malanga-greenDark font-bold group-hover:text-malanga-green transition-colors">{ing.insumo}</td>
                          <td className="px-8 py-5 text-malanga-text/40 uppercase font-bold text-xs">{ing.unidad}</td>
                          <td className="px-8 py-5 text-right font-mono text-malanga-green font-black">{ing.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Elaboración */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <ChefHat className="w-6 h-6 text-malanga-green" />
                  <h3 className="text-2xl font-black text-malanga-greenDark uppercase tracking-tighter">Proceso de Elaboración</h3>
                </div>
                <div className="bg-malanga-white p-12 rounded-[3rem] border border-malanga-green/10 text-malanga-text leading-relaxed text-lg whitespace-pre-wrap italic font-medium shadow-sm">
                  {recipe.instrucciones}
                </div>
              </section>
            </div>

            {/* Contenido Derecho: IA Malanga */}
            <div className="lg:col-span-4 bg-malanga-pinkSoft/30 p-10 sm:p-16 space-y-10">
              {!enhancement ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-10">
                  <div className="w-28 h-28 bg-malanga-green text-malanga-white rounded-full flex items-center justify-center shadow-2xl relative">
                    <Sparkles className="w-12 h-12" />
                    <div className="absolute inset-0 rounded-full border-2 border-malanga-green border-dashed animate-spin-slow"></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-malanga-greenDark uppercase tracking-tighter mb-4">Gemini Gastronomy</h3>
                    <p className="text-malanga-text/60 text-sm leading-relaxed max-w-xs mx-auto italic">
                      Potenciamos la técnica tradicional con inteligencia de vanguardia.
                    </p>
                  </div>
                  <button
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="w-full bg-malanga-green hover:bg-malanga-greenDark text-malanga-white font-black py-5 px-10 rounded-full flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                  >
                    {isEnhancing ? (
                      <div className="w-6 h-6 border-4 border-malanga-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        MEJORAR PLATO
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-malanga-green uppercase tracking-tighter flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      Optimización AI
                    </h3>
                    <button 
                      onClick={() => setEnhancement(null)} 
                      className="text-[10px] text-malanga-green font-black uppercase tracking-widest bg-malanga-white px-3 py-1.5 rounded-full border border-malanga-green/20 shadow-sm"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-6">
                    {[
                      { title: 'Toque de Vanguardia', icon: ArrowUpRight, content: enhancement.variacionGourmet },
                      { title: 'Maridaje Brunch', icon: Wine, content: enhancement.maridajeSugerido },
                      { title: 'Tip del Chef', icon: Lightbulb, content: enhancement.tipPro },
                      { title: 'Perfil Nutricional', icon: Apple, content: enhancement.valorNutricional }
                    ].map((card, i) => (
                      <div key={i} className="bg-malanga-white border border-malanga-green/5 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <card.icon className="w-5 h-5 text-malanga-green" />
                          <h4 className="text-[10px] font-black text-malanga-greenDark uppercase tracking-widest">{card.title}</h4>
                        </div>
                        <p className="text-sm text-malanga-text/80 leading-relaxed font-medium italic">
                          {card.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 flex items-center gap-3 text-[10px] text-malanga-green/40 justify-center border-t border-malanga-green/10">
                    <Info className="w-3 h-3" />
                    MALANGA BRUNCH INTELLIGENCE
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-malanga-pinkSoft/50 border-t border-malanga-green/5 flex justify-end">
           <button 
            className="px-12 py-4 bg-malanga-white border border-malanga-green/20 text-malanga-green hover:bg-malanga-green hover:text-malanga-white rounded-full text-xs font-black uppercase tracking-[0.3em] transition-all shadow-sm"
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
