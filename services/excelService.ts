
import { Recipe, Family, Ingredient } from '../types';

declare const XLSX: any;

/**
 * Normaliza strings para comparaciones robustas (quita acentos, espacios extra y pasa a minúsculas)
 */
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

/**
 * Filtra candidatos a título que son en realidad parte del header o basura
 */
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

/**
 * Convierte hoja a matriz manejando celdas combinadas (merges)
 */
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
 * ✅ A) Detector de headers (más tolerante)
 */
function isHeaderRow(row: any[]) {
  const r = (row || []).map(normKey);

  const hasItem = r.some(v =>
    v.includes("ingrediente") ||
    v.includes("insumo") ||
    v.includes("insumos") ||
    /art.?culo/.test(v)
  );

  const hasUnit = r.some(v =>
    v === "und" ||
    v.includes("unidad") ||
    v.includes("u. medida") ||
    v.includes("u medida") ||
    v.includes("medida")
  );

  const hasQty = r.some(v =>
    v.includes("cant") ||
    v.includes("cantidad") ||
    v.includes("unidades") ||
    v.includes("unidades netas")
  );

  return hasItem && (hasUnit || hasQty);
}

/**
 * ✅ B) Encuentra TODOS los headers repetidos
 */
function findHeaderRows(matrix: any[][]) {
  const rows: number[] = [];
  for (let i = 0; i < matrix.length; i++) {
    if (isHeaderRow(matrix[i])) rows.push(i);
  }
  return rows;
}

/**
 * Busca el título de la receta arriba del header
 */
function findRecipeTitle(matrix: any[][], headerRowIdx: number) {
  // Buscar hasta 15 filas hacia arriba
  for (let r = headerRowIdx - 1; r >= Math.max(0, headerRowIdx - 15); r--) {
    const row = matrix[r] || [];
    const candidates = row
      .filter(v => typeof v === "string")
      .map(v => v.trim())
      .filter(v => v.length >= 3 && hasLetters(v) && !isBadTitleCandidate(v));
    
    if (candidates.length) {
      // Tomar el más largo (usualmente es el nombre completo)
      const best = candidates.sort((a, b) => b.length - a.length)[0];
      return { nombre: best };
    }
  }
  return { nombre: "RECETA SIN NOMBRE" };
}

function findCol(normHeader: string[], predicates: ((v: string) => boolean)[]) {
  for (const p of predicates) {
    const idx = normHeader.findIndex(p);
    if (idx !== -1) return idx;
  }
  return -1;
}

function getTextBelowLabel(matrix: any[][], startRow: number, endRow: number, labels: string[]) {
  const targets = labels.map(normKey);
  for (let r = startRow; r <= endRow; r++) {
    const row = matrix[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = normKey(row[c]);
      if (!v) continue;
      if (targets.some(t => v.includes(t))) {
        // El texto suele estar justo debajo o a la derecha (aquí buscamos debajo)
        const below = (matrix[r + 1] || [])[c];
        return (below ?? "").toString().trim();
      }
    }
  }
  return "";
}

/**
 * ✅ 2) Parsear múltiples recetas por hoja
 */
function parseFamilySheet(sheetName: string, sheet: any): Recipe[] {
  const matrix = sheetToMatrixWithMerges(sheet);
  const headerRows = findHeaderRows(matrix);
  const recipes: Recipe[] = [];

  for (let i = 0; i < headerRows.length; i++) {
    const headerRowIdx = headerRows[i];
    const nextHeader = (i < headerRows.length - 1) ? headerRows[i + 1] : matrix.length;

    const header = matrix[headerRowIdx] || [];
    const normHeader = header.map(normKey);

    const colItem = findCol(normHeader, [
      v => v.includes("ingrediente"),
      v => v.includes("insumo"),
      v => v.includes("insumos"),
      v => /art.?culo/.test(v),
    ]);

    const colUnidad = findCol(normHeader, [
      v => v === "und",
      v => v.includes("unidad"),
      v => v.includes("u. medida"),
      v => v.includes("u medida"),
      v => v.includes("medida"),
    ]);

    const colCant = findCol(normHeader, [
      v => v.includes("cant"),
      v => v.includes("cantidad"),
      v => v.includes("unidades netas"),
      v => v.includes("unidades"),
    ]);

    // Salta si no encuentra columnas críticas
    if (colItem === -1 || colCant === -1) continue;

    // Título robusto
    let { nombre } = findRecipeTitle(matrix, headerRowIdx);
    if (nombre.startsWith("RECETA SIN NOMBRE")) {
      nombre = `${sheetName} (BLOQUE ${i + 1})`;
    }

    // Ingredientes
    const ingredients: Ingredient[] = [];
    for (let r = headerRowIdx + 1; r < nextHeader; r++) {
      const item = (matrix[r]?.[colItem] ?? "").toString().trim();

      // Si la celda está vacía, probablemente terminó la tabla
      if (!item) break;
      
      // Evita filas de TOTAL o totales intermedios
      if (normKey(item).includes("total")) break;

      const unidad = colUnidad !== -1 ? (matrix[r]?.[colUnidad] ?? "").toString().trim() : "";
      const cantidad = (matrix[r]?.[colCant] ?? "");

      ingredients.push({
        insumo: item,
        unidad,
        cantidad,
      });
    }

    if (!ingredients.length) continue;

    // Metadatos (Descripción y Proceso) dentro del rango del bloque
    const blockStart = Math.max(0, headerRowIdx - 20);
    const blockEnd = Math.min(matrix.length - 1, nextHeader + 30);

    const descripcion = getTextBelowLabel(
      matrix, blockStart, blockEnd, ["descripcion de la carta", "descripcion carta"]
    );

    const instrucciones = getTextBelowLabel(
      matrix, blockStart, blockEnd, ["proceso de elaboracion", "proceso de elaboración", "preparacion", "preparación"]
    );

    recipes.push({
      id: `${sheetName}::${headerRowIdx}`,
      familia: sheetName,
      nombre: nombre,
      descripcion: descripcion || undefined,
      instrucciones: instrucciones || "Consultar procesos técnicos en matriz.",
      ingredientes: ingredients,
    });
  }

  return recipes;
}

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const families: Family[] = [];

        for (const sheetName of workbook.SheetNames) {
          // Ignorar solo hojas de sistema muy obvias
          const n = normKey(sheetName);
          if (["config", "dashboard", "parametros", "resumen"].includes(n)) continue;

          const sheet = workbook.Sheets[sheetName];
          const recipes = parseFamilySheet(sheetName, sheet);

          if (recipes.length > 0) {
            families.push({ name: sheetName, recipes });
          }
        }

        families.sort((a, b) => a.name.localeCompare(b.name, "es"));

        // ✅ 3) Diagnóstico automático
        console.log("📊 RESUMEN DE IMPORTACIÓN MALANGA:");
        console.table(families.map(f => ({ 
          Familia: f.name, 
          "Cant. Recetas": f.recipes.length,
          "Ejemplo": f.recipes[0]?.nombre 
        })));

        resolve(families);
      } catch (err) {
        console.error("❌ Error fatal en parseo:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
