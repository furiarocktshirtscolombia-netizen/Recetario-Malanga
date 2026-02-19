
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, GeminiEnhancement } from "../types";

/**
 * 🧠 Genera mejoras gourmet usando Gemini 3 Flash
 */
export const getRecipeEnhancement = async (
  recipe: Recipe
): Promise<GeminiEnhancement> => {
  try {
    // Direct initialization using the apiKey from process.env as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const ingredientesText = recipe.ingredientes
      .map(i => `${i.cantidad} ${i.unidad} de ${i.insumo}`)
      .join(", ");

    const prompt = `
Actúa como el Chef Ejecutivo de Malanga Brunch & Coffee.
Analiza la siguiente ficha técnica:

Plato: ${recipe.nombre}
Familia: ${recipe.familia}
Insumos: ${ingredientesText}
Proceso Técnico: ${recipe.preparacion || recipe.instrucciones}
Instrucciones de Servicio/Emplatado: ${recipe.emplatado || "No especificado"}

Genera una respuesta en JSON con este esquema exacto:
{
  "variacionGourmet": "Propuesta de elevación creativa estilo Malanga",
  "maridajeSugerido": "Bebida ideal del menú Malanga",
  "tipPro": "Secreto técnico de alta cocina para este plato",
  "valorNutricional": "Breve nota sobre la calidad nutricional"
}
`;

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
    if (!text) throw new Error("Respuesta vacía");

    return JSON.parse(text) as GeminiEnhancement;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      variacionGourmet: "Una versión elevada con técnicas artesanales y acabados frescos.",
      maridajeSugerido: "Café de especialidad de origen latinoamericano.",
      tipPro: "El control preciso de temperatura garantiza la textura perfecta.",
      valorNutricional: "Balance equilibrado de ingredientes frescos y naturales.",
    };
  }
};
