
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, GeminiEnhancement } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRecipeEnhancement = async (recipe: Recipe): Promise<GeminiEnhancement> => {
  const ingredientesText = recipe.ingredientes.map(i => `${i.cantidad} ${i.unidad} de ${i.insumo}`).join(', ');
  
  const prompt = `Actúa como el Chef Ejecutivo de Malanga Brunch & Coffee. Analiza esta ficha técnica técnica de la matriz de costos:
    Plato/Preparación: ${recipe.nombre}
    Categoría/Familia: ${recipe.familia}
    Descripción: ${recipe.descripcion || 'No disponible'}
    Ingredientes base: ${ingredientesText}
    Proceso actual: ${recipe.instrucciones}

    Genera una respuesta profesional en JSON con el estilo elegante y de brunch de Malanga:
    1. "variacionGourmet": Una elevación del plato manteniendo el estilo de brunch artesanal.
    2. "maridajeSugerido": La bebida ideal (Café de especialidad, Cocktail de autor o Jugo natural).
    3. "tipPro": Un secreto técnico para perfeccionar la textura o el emplatado.
    4. "valorNutricional": Análisis breve centrado en la calidad de los ingredientes.
    
    Responde exclusivamente con el JSON.`;

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
      variacionGourmet: "Recomendamos usar masa madre para elevar el perfil de sabor.",
      maridajeSugerido: "Un Espresso Tonic con frutos rojos es el balance ideal.",
      tipPro: "Controlar la temperatura de los lácteos garantiza la cremosidad exacta.",
      valorNutricional: "Balanceado, rico en fibras y carbohidratos complejos."
    };
  }
};
