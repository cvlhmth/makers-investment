/**
 * Script separado para atualizar STATUS_ND pela coluna de link.
 *
 * Regra:
 * - Se a coluna O tiver qualquer valor/link, STATUS_ND vira "Emitido".
 * - Se a coluna O estiver vazia, STATUS_ND vira "Pending".
 * - So mexe na linha quando a coluna C tiver valor, para evitar preencher linhas vazias.
 *
 * Como usar:
 * 1. Crie um novo arquivo .gs no Apps Script.
 * 2. Cole este codigo.
 * 3. Rode a funcao atualizarStatusNdPorLink().
 */

const STATUS_ND_CONFIG = {
  SHEET_NAME: "Maker",
  HEADER_ID: "ID_ALIANCA",
  STATUS_HEADER: "STATUS_ND",
  LINK_COLUMN_NUMBER: 15
};

const STATUS_ND_OPTIONS = ["Emitido", "Pending"];

function atualizarStatusNdPorLink() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATUS_ND_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoStatusNd_(values);
  const headers = values[headerRow];
  const statusNdCol = encontrarColunaStatusNd_(headers, [STATUS_ND_CONFIG.STATUS_HEADER, "STATUS ND"]);
  const firstDataRow = headerRow + 2;
  const lastRow = sheet.getLastRow();

  if (statusNdCol < 0) throw new Error("Coluna STATUS_ND nao encontrada.");
  if (lastRow < firstDataRow) return;

  const bodyRows = values.slice(headerRow + 1);

  bodyRows.forEach((row, index) => {
    const valorColunaC = row[2] || "";
    const rowNumber = firstDataRow + index;
    const statusCell = sheet.getRange(rowNumber, statusNdCol + 1);

    if (!temValorNaColunaCStatusNd_(valorColunaC)) {
      statusCell.clearContent();
      statusCell.clearDataValidations();
      return;
    }

    const valorColunaO = row[STATUS_ND_CONFIG.LINK_COLUMN_NUMBER - 1] || "";
    const nextStatus = String(valorColunaO || "").trim() ? "Emitido" : "Pending";

    aplicarDropdownStatusNd_(statusCell);
    statusCell.setValue(nextStatus);
  });

  SpreadsheetApp.flush();
}

function statusNdAoEditar(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== STATUS_ND_CONFIG.SHEET_NAME) return;
  if (range.getColumn() !== STATUS_ND_CONFIG.LINK_COLUMN_NUMBER) return;

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoStatusNd_(values);
  const headers = values[headerRow];
  const statusNdCol = encontrarColunaStatusNd_(headers, [STATUS_ND_CONFIG.STATUS_HEADER, "STATUS ND"]);
  const rowNumber = range.getRow();

  if (statusNdCol < 0) throw new Error("Coluna STATUS_ND nao encontrada.");
  if (rowNumber <= headerRow + 1) return;

  const valorColunaC = sheet.getRange(rowNumber, 3).getDisplayValue();
  const statusCell = sheet.getRange(rowNumber, statusNdCol + 1);

  if (!temValorNaColunaCStatusNd_(valorColunaC)) {
    statusCell.clearContent();
    statusCell.clearDataValidations();
    return;
  }

  const valorColunaO = range.getDisplayValue();
  const nextStatus = String(valorColunaO || "").trim() ? "Emitido" : "Pending";

  aplicarDropdownStatusNd_(statusCell);
  statusCell.setValue(nextStatus);
}

function aplicarDropdownStatusNd_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_ND_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function temValorNaColunaCStatusNd_(value) {
  const text = String(value || "").trim();
  return Boolean(text);
}

function encontrarLinhaCabecalhoStatusNd_(values) {
  const target = normalizarStatusNd_(STATUS_ND_CONFIG.HEADER_ID);
  const index = values.findIndex((row) => row.map(normalizarStatusNd_).includes(target));
  return index >= 0 ? index : 0;
}

function encontrarColunaStatusNd_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizarStatusNd_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizarStatusNd_(header)));
}

function normalizarStatusNd_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
