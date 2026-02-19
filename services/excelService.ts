
import { Recipe, Family, Ingredient } from '../types';

declare const XLSX: any;

function cleanStr(v: any): string {
  if (v === null || v === undefined) return "";
  return v.toString().trim();
}

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

function parseQuantity(v: any): string {
  if (v === null || v === undefined || v === "") return "0";
  if (typeof v === 'number') {
    return Number.isInteger(v) ? v.toString() : parseFloat(v.toFixed(3)).toString();
  }
  let s = cleanStr(v);
  if (!s) return "0";
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = parseFloat(s);
  return !isNaN(n) ? parseFloat(n.toFixed(3)).toString() : s;
}

function classifyAndAppendMetadata(cell: string, meta: { prep: string[], plating: string[], desc: string[] }) {
  const text = fixMojibake(cleanStr(cell));
  if (!text) return;
  const lower = text.toLowerCase();
  
  const isPrep = /preparaci|instrucci|proceso|asar|fre[ií]r|cortar|picar|cocinar|llevar a|mezclar|batir|hornear|licuar|hervir/.test(lower);
  const isPlating = /emplatado|decorar|servir|presentar|montaje|vajilla|acabado|pizca de|decoraci/.test(lower);
  const isDesc = /descripci|carta|plato|sabor|nota|historia/.test(lower);

  if (isPrep) meta.prep.push(text.replace(/^(preparaci[oó]n|instrucciones|proceso)\s*:?\s*/i, ""));
  else if (isPlating) meta.plating.push(text.replace(/^(emplatado|montaje|decoraci[oó]n)\s*:?\s*/i, ""));
  else if (isDesc) meta.desc.push(text.replace(/^(descripci[oó]n|carta)\s*:?\s*/i, ""));
  else meta.prep.push(text);
}

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const families: Family[] = [];
        
        console.info(`[ExcelEngine] Iniciando proceso de ${workbook.SheetNames.length} hojas...`);

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          // Extraer matriz completa (header: 1 para preservar estructura de filas)
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            defval: ""
          });

          if (rows.length === 0) continue;

          // LOCALIZACIÓN FLEXIBLE DE BLOQUES
          // Buscamos "Ingrediente" en las primeras 3 columnas (A, B, C) por si hay desplazamientos
          const recipeStartIndices: { row: number, col: number }[] = [];
          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c <= 2; c++) {
              const val = cleanStr(rows[r]?.[c]).toLowerCase();
              if (val === "ingrediente" || val === "ingredientes") {
                recipeStartIndices.push({ row: r, col: c });
                break; // Encontrado en esta fila, saltar a la siguiente
              }
            }
          }

          if (recipeStartIndices.length === 0) {
            console.warn(`[ExcelEngine] Hoja "${sheetName}" saltada: No se encontró marcador "Ingrediente" en Col A, B o C.`);
            continue;
          }

          const recipesInSheet: Recipe[] = [];

          for (let i = 0; i < recipeStartIndices.length; i++) {
            const { row: headerRow, col: colIdx } = recipeStartIndices[i];
            const nextHeaderRow = (i + 1 < recipeStartIndices.length) ? recipeStartIndices[i + 1].row : rows.length;
            
            // BÚSQUEDA PROFUNDA DE NOMBRE (Hasta 5 filas arriba para celdas combinadas)
            let recipeName = "";
            for (let lookUp = 1; lookUp <= 5; lookUp++) {
              if (headerRow - lookUp < 0) break;
              recipeName = fixMojibake(cleanStr(rows[headerRow - lookUp]?.[colIdx]));
              if (!recipeName && colIdx > 0) {
                // Probar columna anterior por si el nombre está desplazado
                recipeName = fixMojibake(cleanStr(rows[headerRow - lookUp]?.[colIdx - 1]));
              }
              if (recipeName) break;
            }

            if (!recipeName) {
              console.warn(`[ExcelEngine] Bloque en Fila ${headerRow} de "${sheetName}" ignorado: No se halló nombre de receta.`);
              continue;
            }

            const ingredients: Ingredient[] = [];
            const meta = { prep: [], plating: [], desc: [] };
            let stopIngredients = false;

            // PROCESAMIENTO DEL BLOQUE ACTIVO
            for (let r = headerRow + 1; r < nextHeaderRow; r++) {
              const rowData = rows[r];
              if (!rowData) continue;

              const insumo = fixMojibake(cleanStr(rowData[colIdx]));    // Columna del marcador
              const unidad = fixMojibake(cleanStr(rowData[colIdx + 1])); // Siguiente columna (C si marcador es B)
              const cantidad = rowData[colIdx + 2];                     // Siguiente (D si marcador es B)
              const colM = rowData[12];                                // Metadata siempre en M (Index 12)

              // Capturar Insumos
              if (!stopIngredients && insumo) {
                if (insumo.toLowerCase().includes("total")) {
                  stopIngredients = true;
                } else if (!insumo.toLowerCase().includes("ingrediente")) {
                  ingredients.push({
                    insumo: insumo,
                    unidad: unidad || "uds",
                    cantidad: parseQuantity(cantidad)
                  });
                }
              }

              // Capturar Metadata de Columna M (Sin importar si stopIngredients es true)
              if (colM) {
                classifyAndAppendMetadata(colM, meta);
              }
            }

            recipesInSheet.push({
              id: `${sheetName}_${recipeName}_${i}_${headerRow}`.replace(/[^a-zA-Z0-9]/g, "_"),
              familia: sheetName,
              nombre: recipeName,
              ingredientes: ingredients,
              instrucciones: meta.prep.join("\n").trim() || "Proceso técnico en revisión.",
              preparacion: meta.prep.join("\n").trim() || undefined,
              emplatado: meta.plating.join("\n").trim() || undefined,
              descripcion: meta.desc.join("\n").trim() || undefined
            });
          }

          if (recipesInSheet.length > 0) {
            console.info(`[ExcelEngine] Hoja "${sheetName}" cargada: ${recipesInSheet.length} recetas detectadas.`);
            families.push({
              name: sheetName,
              recipes: recipesInSheet
            });
          }
        }
        
        families.sort((a, b) => a.name.localeCompare(b.name, "es"));
        console.info(`[ExcelEngine] Carga finalizada con éxito. ${families.length} familias integradas.`);
        resolve(families);
      } catch (err) {
        console.error("[ExcelEngine] ERROR CRÍTICO:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file); // ArrayBuffer es más seguro para grandes volúmenes y caracteres especiales
  });
};
