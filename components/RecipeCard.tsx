
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
      className="group bg-hw-surface border border-hw-border rounded-[2rem] overflow-hidden hover:border-hw-orange/50 transition-all cursor-pointer animate-fade-in flex flex-col h-full shadow-lg hover:shadow-hw-orange/10"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-44 bg-hw-surface2 relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-br from-hw-orange to-transparent"></div>
        </div>
        <ChefHat className="w-16 h-16 text-hw-muted/20 group-hover:text-hw-orange/40 transition-all group-hover:scale-110 duration-500" />
        <div className="absolute top-5 right-5">
           <div className="bg-hw-surface border border-hw-border px-3 py-1.5 rounded-xl text-[10px] font-black text-hw-orange uppercase tracking-widest">
            {recipe.ingredientes.length} Insumos
          </div>
        </div>
      </div>
      
      <div className="p-7 flex flex-col flex-grow">
        <h3 className="text-white font-black text-xl leading-tight mb-4 group-hover:text-hw-orange transition-colors line-clamp-2 uppercase tracking-tight">
          {recipe.nombre}
        </h3>
        
        {recipe.descripcion && (
          <p className="text-hw-muted text-xs line-clamp-3 mb-6 flex-grow leading-relaxed italic opacity-80">
            "{recipe.descripcion}"
          </p>
        )}

        <div className="pt-6 border-t border-hw-border/50 mt-auto flex justify-between items-center group-hover:border-hw-orange/20">
          <div className="flex items-center gap-2 text-hw-muted text-[10px] uppercase font-black tracking-widest">
            <BookOpen className="w-3 h-3" />
            Ver Ficha Técnica
          </div>
          <ArrowRight className="w-5 h-5 text-hw-muted group-hover:text-hw-orange group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
