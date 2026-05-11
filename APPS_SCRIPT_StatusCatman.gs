/**
 * Script separado para padronizar STATUS CATMAN.
 *
 * Regra:
 * - So mexe na linha quando a coluna C tiver valor.
 * - Se a coluna C estiver vazia, limpa STATUS CATMAN e remove dropdown.
 * - STATUS CATMAN fica sempre como dropdown:
 *   - Validado
 *   - Aguardando Validacao
 *
 * Como usar:
 * 1. Crie um novo arquivo .gs no Apps Script.
 * 2. Cole este codigo.
 * 3. Rode a funcao atualizarStatusCatmanDropdown().
 */

const STATUS_CATMAN_CONFIG = {
  SHEET_NAME: "Maker",
  HEADER_ID: "ID_ALIANCA",
  STATUS_HEADER: "STATUS CATMAN"
};

const STATUS_CATMAN_OPTIONS = ["Validado", "Aguardando Valida\u00e7\u00e3o"];

function atualizarStatusCatmanDropdown() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATUS_CATMAN_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoStatusCatman_(values);
  const headers = values[headerRow];
  const statusCatmanCol = encontrarColunaStatusCatman_(headers, [STATUS_CATMAN_CONFIG.STATUS_HEADER, "STATUS_CATMAN"]);
  const firstDataRow = headerRow + 2;
  const lastRow = sheet.getLastRow();

  if (statusCatmanCol < 0) throw new Error("Coluna STATUS CATMAN nao encontrada.");
  if (lastRow < firstDataRow) return;

  const bodyRows = values.slice(headerRow + 1);
  const statusRange = sheet.getRange(firstDataRow, statusCatmanCol + 1, bodyRows.length, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_CATMAN_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  const output = [];
  const validations = [];

  bodyRows.forEach((row) => {
    const valorColunaC = row[2] || "";

    if (!String(valorColunaC).trim()) {
      output.push([""]);
      validations.push([null]);
      return;
    }

    output.push([normalizarValorStatusCatman_(row[statusCatmanCol]) || "Aguardando Valida\u00e7\u00e3o"]);
    validations.push([statusRule]);
  });

  statusRange.setDataValidations(validations);
  statusRange.setValues(output);
  SpreadsheetApp.flush();
}

function statusCatmanAoEditar(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== STATUS_CATMAN_CONFIG.SHEET_NAME) return;

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoStatusCatman_(values);
  const headers = values[headerRow];
  const statusCatmanCol = encontrarColunaStatusCatman_(headers, [STATUS_CATMAN_CONFIG.STATUS_HEADER, "STATUS_CATMAN"]);
  const rowNumber = range.getRow();

  if (statusCatmanCol < 0) throw new Error("Coluna STATUS CATMAN nao encontrada.");
  if (rowNumber <= headerRow + 1) return;
  if (![3, statusCatmanCol + 1].includes(range.getColumn())) return;

  const valorColunaC = sheet.getRange(rowNumber, 3).getDisplayValue();
  const statusCell = sheet.getRange(rowNumber, statusCatmanCol + 1);

  if (!String(valorColunaC).trim()) {
    statusCell.clearContent();
    statusCell.clearDataValidations();
    return;
  }

  aplicarDropdownStatusCatman_(statusCell);
  statusCell.setValue(normalizarValorStatusCatman_(statusCell.getDisplayValue()) || "Aguardando Valida\u00e7\u00e3o");
}

function aplicarDropdownStatusCatman_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_CATMAN_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function normalizarValorStatusCatman_(value) {
  const normalized = normalizarStatusCatman_(value);
  if (!normalized) return "";

  if (["approved", "aprovado", "valido", "validado"].includes(normalized)) {
    return "Validado";
  }

  if (normalized.includes("aguardando") || ["pending", "pendente", "validar", "em analise"].includes(normalized)) {
    return "Aguardando Valida\u00e7\u00e3o";
  }

  return "";
}

function encontrarLinhaCabecalhoStatusCatman_(values) {
  const target = normalizarStatusCatman_(STATUS_CATMAN_CONFIG.HEADER_ID);
  const index = values.findIndex((row) => row.map(normalizarStatusCatman_).includes(target));
  return index >= 0 ? index : 0;
}

function encontrarColunaStatusCatman_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizarStatusCatman_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizarStatusCatman_(header)));
}

function normalizarStatusCatman_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
