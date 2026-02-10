
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
    "descripcion", "carta", "proceso", "elaboracion", "preparacion", "foto"
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

function isHeaderRow(row: any[]) {
  const r = (row || []).map(normKey);
  const hasItem = r.some(v => v.includes("ingrediente") || /art.?culo/.test(v));
  const hasUnit = r.some(v => v === "und" || v.includes("unidad"));
  const hasQty  = r.some(v => v.includes("cant") || v.includes("cantidad") || v.includes("unidades"));
  return hasItem && (hasUnit || hasQty);
}

function findRecipeTitle(matrix: any[][], headerRowIdx: number) {
  for (let r = headerRowIdx - 1; r >= Math.max(0, headerRowIdx - 20); r--) {
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
  return { nombre: `RECETA (FILA ${headerRowIdx + 1})`, titleRowIdx: headerRowIdx };
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

export const parseRecipesFromExcel = async (file: File): Promise<Family[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const EXCLUDE = new Set(["INSUMOS", "MATRIZ CARTA", "ROTACION", "INDEX", "CONFIG"]);
        const families: Family[] = [];

        for (const sheetName of workbook.SheetNames) {
          if (EXCLUDE.has(sheetName)) continue;
          
          const sheet = workbook.Sheets[sheetName];
          const matrix = sheetToMatrixWithMerges(sheet);
          const headerRows: number[] = [];
          for (let i = 0; i < matrix.length; i++) {
            if (isHeaderRow(matrix[i])) headerRows.push(i);
          }

          const recipes: Recipe[] = [];
          for (let i = 0; i < headerRows.length; i++) {
            const headerRowIdx = headerRows[i];
            const nextHeader = (i < headerRows.length - 1) ? headerRows[i + 1] : matrix.length;
            const blockEnd = Math.max(headerRowIdx + 1, nextHeader - 1);
            
            const { nombre, titleRowIdx } = findRecipeTitle(matrix, headerRowIdx);
            const blockStart = Math.min(titleRowIdx, headerRowIdx);
            const header = matrix[headerRowIdx] || [];
            const normHeader = header.map(normKey);

            const colItem = findCol(normHeader, [v => v.includes("ingrediente"), v => /art.?culo/.test(v)]);
            const colUnidad = findCol(normHeader, [v => v === "und", v => v.includes("unidad")]);
            const colCant = findCol(normHeader, [v => v.includes("cant"), v => v.includes("cantidad"), v => v.includes("unidades")]);
            const colCosto = findCol(normHeader, [v => v.includes("costo linea"), v => v.includes("subtotal"), v => v.includes("costo")]);

            const ingredients: Ingredient[] = [];
            for (let r = headerRowIdx + 1; r <= blockEnd; r++) {
              const item = (matrix[r]?.[colItem] ?? "").toString().trim();
              if (!item) break;
              ingredients.push({
                insumo: item,
                unidad: colUnidad !== -1 ? (matrix[r]?.[colUnidad] ?? "").toString().trim() : "",
                cantidad: colCant !== -1 ? (matrix[r]?.[colCant] ?? "") : "",
                costo_linea: colCosto !== -1 ? parseFloat(matrix[r]?.[colCosto]) || 0 : undefined
              });
            }

            if (ingredients.length === 0) continue;

            const descripcion = getTextBelowLabel(matrix, blockStart, Math.min(blockEnd, blockStart + 100), ["descripcion de la carta", "descripcion carta"]);
            const instrucciones = getTextBelowLabel(matrix, blockStart, Math.min(blockEnd, blockStart + 150), ["proceso de elaboracion", "preparacion", "preparación"]);

            recipes.push({
              id: `${sheetName}-${headerRowIdx}-${Date.now()}`,
              familia: sheetName,
              nombre: nombre,
              ingredientes: ingredients,
              descripcion: descripcion || undefined,
              instrucciones: instrucciones || "Consultar matriz de procesos para detalles específicos.",
              fotoUrl: undefined // No se pueden extraer imágenes pegadas directamente
            });
          }
          if (recipes.length > 0) families.push({ name: sheetName, recipes });
        }
        resolve(families);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
