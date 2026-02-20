
import { Recipe, Family, Ingredient } from '../types';
import * as XLSX from 'xlsx';

/**
 * Normalización de texto para comparaciones seguras
 */
const norm = (v: any): string => {
  if (v === null || v === undefined) return "";
  return v.toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Quita acentos para búsqueda robusta
};

const toStr = (v: any): string => (v === null || v === undefined) ? "" : v.toString().trim();

/**
 * Corrección manual de mojibake común si persiste tras lectura de buffer
 */
const fixMojibakeManual = (s: string): string => {
  if (!s) return s;
  return s
    .replace(/Ã‘/g, "Ñ")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã³/g, "ó")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã/g, "í"); // Ajuste genérico para í
};

/**
 * Formateo de cantidades numéricas (3 decimales si no es entero)
 */
const formatQuantity = (v: any): string => {
  if (v === null || v === undefined || v === "") return "0";
  let n: number;
  if (typeof v === 'number') {
    n = v;
  } else {
    const s = v.toString().replace(/\./g, "").replace(",", ".");
    n = parseFloat(s);
  }
  if (isNaN(n)) return v.toString();
  return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(3)).toString();
};

// Diccionarios de búsqueda de encabezados
const HEAD_INS = ["ingrediente", "insumo", "articulo", "insumos", "item"];
const HEAD_UNIT = ["und", "unidad", "unid", "u. medida", "medida"];
const HEAD_QTY = ["unidades netas", "cant neta", "cantidad neta", "cantidad", "neto"];

const KEY_DESC = ["descripcion", "carta", "historia"];
const KEY_PREP = ["preparacion", "proceso", "instrucciones", "tecnica"];
const KEY_EMPL = ["emplatado", "montaje", "decoracion", "presentacion"];

/**
 * Analiza una sección de filas en la Columna M (Index 12) para extraer metadata
 */
const parseMetadataFromColM = (rows: any[][]) => {
  let currentSection: 'desc' | 'prep' | 'empl' | null = null;
  const sections = { desc: [] as string[], prep: [] as string[], empl: [] as string[] };

  for (const row of rows) {
    const cellValue = toStr(row[12]); // Columna M
    if (!cellValue) continue;

    const cellNorm = norm(cellValue);
    
    if (KEY_DESC.some(k => cellNorm.includes(k))) { currentSection = 'desc'; continue; }
    if (KEY_PREP.some(k => cellNorm.includes(k))) { currentSection = 'prep'; continue; }
    if (KEY_EMPL.some(k => cellNorm.includes(k))) { currentSection = 'empl'; continue; }

    if (currentSection === 'desc') sections.desc.push(cellValue);
    else if (currentSection === 'prep') sections.prep.push(cellValue);
    else if (currentSection === 'empl') sections.empl.push(cellValue);
    else {
      // Si no hay sección definida pero hay texto en M, lo asumimos como preparación
      sections.prep.push(cellValue);
    }
  }

  return {
    descripcion: sections.desc.join("\n").trim(),
    preparacion: sections.prep.join("\n").trim(),
    emplatado: sections.empl.join("\n").trim()
  };
};

/**
 * Mapea los índices de columna según los encabezados encontrados
 */
const getColumnMapping = (headerRow: any[]) => {
  const rowNorm = headerRow.map(norm);
  return {
    insumo: rowNorm.findIndex(c => HEAD_INS.some(h => c.includes(h))),
    unidad: rowNorm.findIndex(c => HEAD_UNIT.some(h => c.includes(h))),
    cantidad: rowNorm.findIndex(c => HEAD_QTY.some(h => c.includes(h)))
  };
};

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  console.log("Leyendo excel...");
  const buffer = await file.arrayBuffer();
  // Lectura segura mediante Uint8Array para evitar errores de codificación
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const families: Family[] = [];

  console.info(`[ExcelEngine] Procesando ${workbook.SheetNames.length} hojas...`);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: ""
    });

    if (rows.length < 3) continue;

    // Identificar inicios de recetas: Un nombre de receta seguido de una fila con encabezados
    const recipeStarts: number[] = [];
    for (let r = 0; r < rows.length - 1; r++) {
      const nameCandidate = toStr(rows[r][1]); // Nombre suele estar en Col B (Index 1)
      const nextRow = rows[r+1] || [];
      const nextRowNorm = nextRow.map(norm);
      
      const hasHeader = nextRowNorm.some(c => HEAD_INS.some(h => c.includes(h))) &&
                        nextRowNorm.some(c => HEAD_QTY.some(h => c.includes(h)));
      
      if (nameCandidate && hasHeader && !HEAD_INS.some(h => norm(nameCandidate).includes(h))) {
        recipeStarts.push(r);
      }
    }

    if (recipeStarts.length === 0) {
      console.info(`[ExcelEngine] Hoja "${sheetName}" descartada: No se detectaron bloques de receta válidos.`);
      continue;
    }

    const recipesInSheet: Recipe[] = [];

    for (let i = 0; i < recipeStarts.length; i++) {
      const startIdx = recipeStarts[i];
      const endIdx = (i + 1 < recipeStarts.length) ? recipeStarts[i + 1] : rows.length;
      
      const recipeName = fixMojibakeManual(toStr(rows[startIdx][1]));
      const headerRow = rows[startIdx + 1];
      const mapping = getColumnMapping(headerRow);

      if (mapping.insumo === -1 || mapping.cantidad === -1) {
        console.warn(`[ExcelEngine] Bloque "${recipeName}" en "${sheetName}" tiene mapeo de columnas inválido.`);
        continue;
      }

      const ingredients: Ingredient[] = [];
      const blockRows = rows.slice(startIdx, endIdx);

      // Extraer Ingredientes (Comienzan 2 filas después del inicio del bloque)
      for (let r = startIdx + 2; r < endIdx; r++) {
        const row = rows[r];
        const insumo = fixMojibakeManual(toStr(row[mapping.insumo]));
        
        // El bloque de ingredientes termina si la celda de insumo está vacía o contiene "TOTAL"
        if (!insumo || norm(insumo).includes("total")) break;

        ingredients.push({
          insumo,
          unidad: toStr(row[mapping.unidad]) || "uds",
          cantidad: formatQuantity(row[mapping.cantidad])
        });
      }

      // Extraer Metadata de Columna M (Aislamiento por bloque)
      const meta = parseMetadataFromColM(blockRows);

      recipesInSheet.push({
        id: `${sheetName}_${recipeName}_${i}`.replace(/[^a-zA-Z0-9]/g, "_"),
        familia: sheetName,
        nombre: recipeName,
        ingredientes: ingredients,
        instrucciones: meta.preparacion || "Consultar ficha técnica.",
        preparacion: meta.preparacion || undefined,
        emplatado: meta.emplatado || undefined,
        descripcion: meta.descripcion || undefined
      });
    }

    if (recipesInSheet.length > 0) {
      console.info(`[ExcelEngine] Hoja "${sheetName}": ${recipesInSheet.length} recetas cargadas.`);
      families.push({
        name: sheetName,
        recipes: recipesInSheet
      });
    }
  }

  return families.sort((a, b) => a.name.localeCompare(b.name, "es"));
};
