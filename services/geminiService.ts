import type { Recipe, GeminiEnhancement } from "../types";

/**
 * ✅ Lee la API key desde variables Vite.
 * (En Vercel debe ser VITE_GEMINI_API_KEY)
 * También soporta VITE_API_KEY por si la nombraste así.
 */
function getApiKey(): string | null {
  const k =
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ??
    (import.meta.env.VITE_API_KEY as string | undefined);

  if (!k) return null;

  const key = String(k).trim();
  if (!key || key.toLowerCase() === "undefined" || key.toLowerCase() === "null") return null;

  return key;
}

/**
 * 🌿 Fallback elegante (no tumba la app)
 */
function fallbackEnhancement(): GeminiEnhancement {
  return {
    variacionGourmet:
      "Podemos elevar el plato con un acabado artesanal: un topping fresco, un crocante y una salsa ligera para realzar aromas.",
    maridajeSugerido:
      "Marida perfecto con un café de especialidad (filtrado) o un cold brew cítrico para balancear sabores.",
    tipPro:
      "Controla temperatura y reposos: pequeños ajustes logran mejor textura, brillo y emplatado más limpio.",
    valorNutricional:
      "Preparación balanceada con enfoque en ingredientes frescos; buena energía y mejor perfil si priorizas fibras y proteínas.",
  };
}

export const getRecipeEnhancement = async (recipe: Recipe): Promise<GeminiEnhancement> => {
  try {
    const API_KEY = getApiKey();

    // ✅ Sin key -> NO intentamos cargar Gemini, devolvemos fallback
    if (!API_KEY) {
      console.warn("⚠️ Gemini desactivado: no hay VITE_GEMINI_API_KEY");
      return fallbackEnhancement();
    }

    // ✅ Import dinámico para evitar crash al cargar la app
    const genai = await import("@google/genai");
    const { GoogleGenAI, Type } = genai;

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const ingredientesText = recipe.ingredientes
      .map((i) => `${i.cantidad} ${i.unidad} de ${i.insumo}`)
      .join(", ");

    const prompt = `Actúa como el Chef Ejecutivo de Malanga Brunch & Coffee. Analiza esta ficha técnica de la matriz de costos:
Plato/Preparación: ${recipe.nombre}
Categoría/Familia: ${recipe.familia}
Descripción: ${recipe.descripcion || "No disponible"}
Ingredientes base: ${ingredientesText}
Proceso actual: ${recipe.instrucciones}

Genera una respuesta profesional en JSON con el estilo elegante y de brunch de Malanga:
1. "variacionGourmet": Una elevación del plato manteniendo el estilo de brunch artesanal.
2. "maridajeSugerido": La bebida ideal (Café de especialidad, Cocktail de autor o Jugo natural).
3. "tipPro": Un secreto técnico para perfeccionar la textura o el emplatado.
4. "valorNutricional": Análisis breve centrado en la calidad de los ingredientes.

Responde exclusivamente con el JSON.`;

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
    if (!text) return fallbackEnhancement();

    return JSON.parse(text) as GeminiEnhancement;
  } catch (error) {
    console.error("⚠️ Gemini enhancement failed (safe fallback):", error);
    return fallbackEnhancement();
  }
};

