
import { Recipe, Family, Ingredient } from '../types';

declare const XLSX: any;

function cleanStr(v: any): string {
  return (v ?? "").toString().trim();
}

/**
 * Corrige errores comunes de codificación (mojibake)
 */
function fixMojibake(s: string): string {
  if (!s) return s;
  return s
    .replace(/Ã‘/g, "Ñ")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã³/g, "ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ãº/g, "ú")
    .replace(/Ã‰/g, "É")
    .replace(/Ã©/g, "é")
    .replace(/Ã\u0081/g, "Á")
    .replace(/Ã¡/g, "á")
    .replace(/Ã\u008d/g, "Í")
    .replace(/Ã\u00ad/g, "í");
}

/**
 * Parsea números de Excel de forma robusta manejando comas y puntos
 * Soporta: 15,000 | 120.000 | 0,500 | 21.053
 */
function parseNumberLikeExcel(v: any): number | null {
  const s = cleanStr(v);
  if (!s) return null;
  if (typeof v === "number") return v;

  let normalized = s;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && !hasDot) {
    // Caso 0,500 -> 0.500
    normalized = normalized.replace(",", ".");
  } else if (hasDot && !hasComma) {
    // Caso 120.000 o 21.053
    // Si termina en .XXX asumimos que el punto es de miles si es que parece entero grande
    if (/\d+\.\d{3}$/.test(normalized)) {
      normalized = normalized.replace(/\./g, "");
    }
  } else if (hasComma && hasDot) {
    // 1.234,56 -> 1234.56 | 1,234.56 -> 1234.56
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    const decimalSep = lastComma > lastDot ? "," : ".";
    const thousandSep = decimalSep === "," ? "." : ",";
    normalized = normalized.split(thousandSep).join("");
    normalized = normalized.replace(decimalSep, ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formatea cantidades para visualización (máximo 3 decimales, quita ceros innecesarios)
 */
function formatQty(n: number | null): string {
  if (n === null || n === undefined) return "0";
  return n.toFixed(3).replace(/\.?0+$/, "");
}

/**
 * Extrae texto de la columna M (índice 12) entre dos límites de fila,
 * separando "Preparación", "Emplatado" y "Descripción".
 */
function extractMetadata(rows: any[][], startRow: number, endRowExclusive: number) {
  const colM = 12; // M (0-based index 12)
  let prep: string[] = [];
  let plating: string[] = [];
  let description: string[] = [];
  let mode: "prep" | "plating" | "desc" | null = null;

  for (let r = startRow; r < endRowExclusive; r++) {
    const cell = fixMojibake(cleanStr(rows[r]?.[colM]));
    if (!cell) continue;

    const lower = cell.toLowerCase();

    // Detección de encabezados de sección en Col M
    if (lower.includes("preparaci")) {
      mode = "prep";
      const after = cell.replace(/^(preparaci[oó]n|preparacion)\s*:?\s*/i, "");
      if (after) prep.push(after);
      continue;
    }
    if (lower.includes("emplatado")) {
      mode = "plating";
      const after = cell.replace(/^(emplatado)\s*:?\s*/i, "");
      if (after) plating.push(after);
      continue;
    }
    if (lower.includes("descripci") || lower.includes("carta")) {
      mode = "desc";
      const after = cell.replace(/^(descripci[oó]n|carta)\s*:?\s*/i, "");
      if (after) description.push(after);
      continue;
    }

    // Acumulación según modo actual
    if (mode === "prep") prep.push(cell);
    else if (mode === "plating") plating.push(cell);
    else if (mode === "desc") description.push(cell);
  }

  return {
    prep: prep.join("\n").trim(),
    plating: plating.join("\n").trim(),
    description: description.join("\n").trim()
  };
}

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const families: Family[] = [];
        
        // Iteramos TODAS las hojas (familias) del libro
        const sheetNames = workbook.SheetNames
          .map(s => cleanStr(s))
          .filter(Boolean);

        for (const sheetName of sheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          // Leemos como matriz 2D (header: 1) para control total de índices
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            defval: "",
          });

          // 1. Identificamos los inicios de bloque de receta (Col B == "Ingrediente")
          const headerRowIndices: number[] = [];
          for (let r = 0; r < rows.length; r++) {
            const bValue = fixMojibake(cleanStr(rows[r]?.[1])); // Columna B
            if (bValue.toLowerCase() === "ingrediente") {
              headerRowIndices.push(r);
            }
          }

          if (headerRowIndices.length === 0) continue;

          const recipesInSheet: Recipe[] = [];

          for (let i = 0; i < headerRowIndices.length; i++) {
            const headerIndex = headerRowIndices[i];
            const nextHeaderIndex = i + 1 < headerRowIndices.length ? headerRowIndices[i + 1] : rows.length;

            // 2. Nombre de la receta: Fila inmediatamente anterior al header, Col B
            const recipeName = fixMojibake(cleanStr(rows[headerIndex - 1]?.[1]));
            if (!recipeName) continue;

            // 3. Extracción de ingredientes (B: Insumo, C: Und, D: Unidades Netas)
            const ingredients: Ingredient[] = [];
            for (let r = headerIndex + 1; r < nextHeaderIndex; r++) {
              const name = fixMojibake(cleanStr(rows[r]?.[1])); // B
              if (!name || name.toLowerCase().includes("total")) break; // Fin de bloque de ingredientes

              const unit = fixMojibake(cleanStr(rows[r]?.[2])); // C
              const qtyRaw = rows[r]?.[3]; // D (Unidades Netas)
              const qtyParsed = parseNumberLikeExcel(qtyRaw);

              ingredients.push({
                insumo: name,
                unidad: unit,
                cantidad: qtyParsed !== null ? formatQty(qtyParsed) : (qtyRaw || "0")
              });
            }

            // 4. Metadatos (Columna M / Índice 12)
            const metadata = extractMetadata(rows, headerIndex - 1, nextHeaderIndex);

            recipesInSheet.push({
              id: `${sheetName}__${recipeName}`.replace(/\s+/g, "_"),
              familia: sheetName,
              nombre: recipeName,
              ingredientes: ingredients,
              instrucciones: metadata.prep || "Pendiente de registro en matriz.",
              preparacion: metadata.prep || undefined,
              emplatado: metadata.plating || undefined,
              descripcion: metadata.description || undefined
            });
          }

          if (recipesInSheet.length > 0) {
            families.push({
              name: sheetName,
              recipes: recipesInSheet
            });
          }
        }
        
        // Orden alfabético de familias
        families.sort((a, b) => a.name.localeCompare(b.name, "es"));
        resolve(families);
      } catch (err) {
        console.error("Error al procesar el Excel:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
