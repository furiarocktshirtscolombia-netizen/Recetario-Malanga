
import React from 'react';
import { ChefHat, ArrowRight, BookOpen } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  viewMode: string;
  onClick: () => void;
  index: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, index }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-malanga-white border border-malanga-green/5 rounded-[2.5rem] overflow-hidden hover:border-malanga-green transition-all cursor-pointer animate-fade-in flex flex-col h-full shadow-sm hover:shadow-2xl"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-48 bg-malanga-pinkSoft relative overflow-hidden flex items-center justify-center p-8">
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-malanga-green"></div>
        <ChefHat className="w-20 h-20 text-malanga-green/20 group-hover:text-malanga-green/40 transition-all group-hover:scale-110 duration-700" />
        <div className="absolute top-6 right-6">
           <div className="bg-malanga-white border border-malanga-green/10 px-4 py-2 rounded-full text-[10px] font-black text-malanga-green uppercase tracking-widest shadow-sm">
            {recipe.ingredientes.length} Insumos
          </div>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-malanga-greenDark font-black text-2xl leading-tight mb-4 group-hover:text-malanga-green transition-colors line-clamp-2 uppercase tracking-tight">
          {recipe.nombre}
        </h3>
        
        {recipe.descripcion && (
          <p className="text-malanga-text/60 text-xs line-clamp-3 mb-8 flex-grow leading-relaxed italic">
            "{recipe.descripcion}"
          </p>
        )}

        <div className="pt-6 border-t border-malanga-pinkSoft mt-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-malanga-green/60 text-[10px] uppercase font-black tracking-widest">
            <BookOpen className="w-3 h-3" />
            Ficha Técnica
          </div>
          <div className="w-8 h-8 rounded-full bg-malanga-pinkSoft flex items-center justify-center text-malanga-green group-hover:bg-malanga-green group-hover:text-malanga-white transition-all shadow-inner">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
