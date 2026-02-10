
import { Recipe, Family, Ingredient } from '../types';

declare const XLSX: any;

function normKey(x: any) {
  let s = (x ?? "").toString().toLowerCase();
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function hasLetters(s: string) {
  return /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(s);
}

function isBadTitleCandidate(txt: string) {
  const t = normKey(txt);
  if (!t) return true;
  if (!isNaN(Number(t))) return true;
  const banned = [
    "analisis", "receta", "costo", "coste", "subtotal", "total", "margen", "ganancia",
    "ingrediente", "articulo", "unidad", "unidades", "und", "cant", "cantidad", "netas",
    "descripcion", "carta", "proceso", "elaboracion", "preparacion", "foto", "insumo", "insumos"
  ];
  return banned.some(w => t.includes(w));
}

function sheetToMatrixWithMerges(sheet: any): any[][] {
  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: "" }) as any[][];
  const merges = (sheet["!merges"] || []) as any[];
  for (const m of merges) {
    const v = matrix?.[m.s.r]?.[m.s.c] ?? "";
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (!matrix[r]) matrix[r] = [];
        if ((matrix[r][c] ?? "") === "") {
          matrix[r][c] = v;
        }
      }
    }
  }
  return matrix;
}

/**
 * Detecta si una fila es un encabezado de tabla de ingredientes.
 * Altamente tolerante a variaciones técnicas de Malanga.
 */
function isHeaderRow(row: any[]) {
  const r = (row || []).map(normKey);

  // Columna de item: acepta ingrediente, artículo, insumos
  const hasItem = r.some(v =>
    v.includes("ingrediente") ||
    v.includes("insumo") ||
    v.includes("insumos") ||
    /art.?culo/.test(v)
  );

  // Columna de unidad: acepta unidad, und, u medida, medida
  const hasUnit = r.some(v =>
    v === "und" ||
    v.includes("unidad") ||
    v.includes("u. medida") ||
    v.includes("u medida") ||
    v.includes("medida") ||
    v.includes("unidad medida")
  );

  // Columna de cantidad: acepta cant, cantidad, unidades, unidades netas
  const hasQty = r.some(v =>
    v.includes("cant") ||
    v.includes("cantidad") ||
    v.includes("unidades") ||
    v.includes("unidades netas")
  );

  return hasItem && (hasUnit || hasQty);
}

function findRecipeTitle(matrix: any[][], headerRowIdx: number) {
  for (let r = headerRowIdx - 1; r >= Math.max(0, headerRowIdx - 15); r--) {
    const row = matrix[r] || [];
    const candidates = row
      .filter(v => typeof v === "string")
      .map(v => v.trim())
      .filter(v => v.length >= 4 && hasLetters(v) && !isBadTitleCandidate(v));
    if (candidates.length) {
      const best = candidates.sort((a, b) => b.length - a.length)[0];
      return { nombre: best, titleRowIdx: r };
    }
  }
  return { nombre: `RECETA SIN NOMBRE (Fila ${headerRowIdx + 1})`, titleRowIdx: headerRowIdx };
}

function getTextBelowLabel(matrix: any[][], startRow: number, endRow: number, labels: string[]) {
  const targets = labels.map(normKey);
  for (let r = startRow; r <= endRow; r++) {
    const row = matrix[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = normKey(row[c]);
      if (!v) continue;
      if (targets.some(t => v.includes(t))) {
        const below = (matrix[r + 1] || [])[c];
        return (below ?? "").toString().trim();
      }
    }
  }
  return "";
}

function findCol(normHeader: string[], predicates: ((v: string) => boolean)[]) {
  for (const p of predicates) {
    const idx = normHeader.findIndex(p);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** 
 * Excluye solo hojas técnicas puras.
 */
function shouldIncludeSheet(name: string): boolean {
  const n = normKey(name);
  const excludeExact = new Set([
    "insumos",
    "rotacion",
    "rotación",
    "matriz carta",
    "index",
    "config",
    "dashboard",
    "resumen"
  ]);
  return !excludeExact.has(n);
}

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const families: Family[] = [];

        console.log("✅ Hojas detectadas en el Workbook:", workbook.SheetNames);

        for (const sheetName of workbook.SheetNames) {
          if (!shouldIncludeSheet(sheetName)) {
            console.log(`🚫 Hoja técnica omitida: ${sheetName}`);
            continue;
          }
          
          const sheet = workbook.Sheets[sheetName];
          const matrix = sheetToMatrixWithMerges(sheet);
          
          // 1. Detectar TODOS los encabezados en la hoja (multi-bloque)
          const headerRows: number[] = [];
          for (let i = 0; i < matrix.length; i++) {
            if (isHeaderRow(matrix[i])) headerRows.push(i);
          }

          const recipes: Recipe[] = [];
          
          // 2. Iterar por cada bloque detectado
          for (let i = 0; i < headerRows.length; i++) {
            const headerRowIdx = headerRows[i];
            const nextHeader = (i < headerRows.length - 1) ? headerRows[i + 1] : matrix.length;
            
            // Título robusto con fallback dinámico
            let { nombre, titleRowIdx } = findRecipeTitle(matrix, headerRowIdx);
            if (nombre.startsWith("RECETA SIN NOMBRE")) {
              nombre = `${sheetName} (Bloque ${i + 1})`;
            }

            const header = matrix[headerRowIdx] || [];
            const normHeader = header.map(normKey);

            // Búsqueda de columnas con soporte de sinónimos ampliado
            const colItem = findCol(normHeader, [
              v => v.includes("ingrediente"),
              v => /art.?culo/.test(v),
              v => v.includes("insumo"),
              v => v.includes("insumos"),
            ]);

            const colUnidad = findCol(normHeader, [
              v => v === "und",
              v => v.includes("unidad"),
              v => v.includes("u. medida"),
              v => v.includes("u medida"),
              v => v.includes("medida"),
              v => v.includes("unidad medida"),
            ]);

            const colCant = findCol(normHeader, [
              v => v.includes("cant"),
              v => v.includes("cantidad"),
              v => v.includes("unidades netas"),
              v => v.includes("unidades"),
            ]);

            if (colItem === -1 || colCant === -1) {
              console.warn(`⚠️ Bloque en "${sheetName}" ignorado: No se encontró columna de Insumo o Cantidad.`);
              continue;
            }

            const ingredients: Ingredient[] = [];
            // Parsear filas hasta el siguiente encabezado o hasta una fila vacía/total
            for (let r = headerRowIdx + 1; r < nextHeader; r++) {
              const item = (matrix[r]?.[colItem] ?? "").toString().trim();
              
              // Cortar si la fila está vacía o contiene palabras de cierre
              if (!item || normKey(item).includes("total")) break;
              
              ingredients.push({
                insumo: item,
                unidad: colUnidad !== -1 ? (matrix[r]?.[colUnidad] ?? "").toString().trim() : "",
                cantidad: (matrix[r]?.[colCant] ?? "").toString().trim()
              });
            }

            if (ingredients.length === 0) continue;

            // Contexto de descripción y procesos limitado al bloque o alrededores inmediatos
            const searchLimit = 40;
            const contextStart = Math.max(0, headerRowIdx - searchLimit);
            const contextEnd = Math.min(matrix.length - 1, nextHeader + searchLimit);

            const descripcion = getTextBelowLabel(matrix, contextStart, contextEnd, ["descripcion de la carta", "descripcion carta"]);
            const instrucciones = getTextBelowLabel(matrix, contextStart, contextEnd, ["proceso de elaboracion", "proceso de elaboración", "preparacion", "preparación"]);

            recipes.push({
              id: `${sheetName}-${headerRowIdx}-${i}`,
              familia: sheetName,
              nombre: nombre,
              ingredientes: ingredients,
              descripcion: descripcion || undefined,
              instrucciones: instrucciones || "Consultar procesos en matriz técnica de cocina.",
            });
          }

          if (recipes.length > 0) {
            families.push({ name: sheetName, recipes });
          } else {
            console.warn(`⚠️ Hoja "${sheetName}" procesada pero 0 recetas detectadas.`);
          }
        }

        // Ordenamiento alfabético final
        families.sort((a, b) => a.name.localeCompare(b.name, "es"));

        console.log(`✅ Carga finalizada exitosamente.`);
        console.table(families.map(f => ({ familia: f.name, recetas: f.recipes.length })));

        resolve(families);
      } catch (err) {
        console.error("❌ Error crítico en excelService:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
