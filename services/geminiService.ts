
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, GeminiEnhancement } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRecipeEnhancement = async (recipe: Recipe): Promise<GeminiEnhancement> => {
  const ingredientesText = recipe.ingredientes.map(i => `${i.cantidad} ${i.unidad} de ${i.insumo}`).join(', ');
  
  const prompt = `Actúa como un Chef Ejecutivo de un restaurante Michelin. Analiza esta ficha técnica:
    Nombre: ${recipe.nombre}
    Familia: ${recipe.familia}
    Descripción: ${recipe.descripcion || 'No disponible'}
    Ingredientes: ${ingredientesText}
    Proceso: ${recipe.instrucciones}

    Genera una respuesta profesional en JSON con:
    1. "variacionGourmet": Una elevación creativa de la receta usando técnicas de vanguardia.
    2. "maridajeSugerido": La bebida perfecta (vino, craft beer o signature cocktail).
    3. "tipPro": Un secreto técnico para mejorar la textura, sabor o rendimiento.
    4. "valorNutricional": Breve análisis de los macros y calidad de insumos.
    
    Responde solo con el JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variacionGourmet: { type: Type.STRING },
            maridajeSugerido: { type: Type.STRING },
            tipPro: { type: Type.STRING },
            valorNutricional: { type: Type.STRING },
          },
          required: ["variacionGourmet", "maridajeSugerido", "tipPro", "valorNutricional"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as GeminiEnhancement;
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    return {
      variacionGourmet: "No se pudo generar en este momento.",
      maridajeSugerido: "Recomendado: Cerveza artesanal de la casa.",
      tipPro: "Mantener la cadena de frío es vital para la textura de esta receta.",
      valorNutricional: "Perfil proteico alto con balance de grasas."
    };
  }
};
