/**
 * Script separado para atualizar STATUS FP&A em lote.
 *
 * Como usar:
 * 1. Crie um novo arquivo .gs no Apps Script.
 * 2. Cole este código.
 * 3. Rode a função atualizarStatusFpaPorPagamento().
 */

const STATUS_FPA_CONFIG = {
  SHEET_NAME: "Maker",
  HEADER_ID: "ID_ALIANCA"
};

const STATUS_FPA_OPTIONS = ["Done", "In Progress", "Pending"];

function atualizarStatusFpaPorPagamento() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATUS_FPA_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoStatusFpa_(values);
  const headers = values[headerRow];
  const statusFpaCol = encontrarColunaStatusFpa_(headers, ["STATUS FP&A", "STATUS FPA", "STATUS FPNA"]);
  const statusCatmanCol = encontrarColunaStatusFpa_(headers, ["STATUS CATMAN"]);
  const valorPagamentoCol = encontrarColunaStatusFpa_(headers, ["VALOR_PAGAMENTO", "VALOR PAGAMENTO", "PAGAMENTO"]);
  const firstDataRow = headerRow + 2;
  const lastRow = sheet.getLastRow();

  if (statusFpaCol < 0) throw new Error("Coluna STATUS FP&A nao encontrada.");
  if (statusCatmanCol < 0) throw new Error("Coluna STATUS CATMAN nao encontrada.");
  if (valorPagamentoCol < 0) throw new Error("Coluna VALOR_PAGAMENTO nao encontrada.");
  if (lastRow < firstDataRow) return;

  const bodyRows = values.slice(headerRow + 1);

  bodyRows.forEach((row, index) => {
    const valorColunaC = row[2] || "";
    const statusCell = sheet.getRange(firstDataRow + index, statusFpaCol + 1);

    if (!temValorNaColunaCStatusFpa_(valorColunaC)) {
      statusCell.clearContent();
      statusCell.clearDataValidations();
      return;
    }

    const valorPagamento = row[valorPagamentoCol] || "";
    const statusCatman = row[statusCatmanCol] || "";
    const nextStatus = calcularStatusFpa_(valorPagamento, statusCatman);

    aplicarDropdownStatusFpa_(statusCell);
    statusCell.setValue(nextStatus);
  });

  SpreadsheetApp.flush();
}

function calcularStatusFpa_(valorPagamento, statusCatman) {
  const catman = normalizarStatusFpa_(statusCatman);
  const hasPayment = temValorPagamento_(valorPagamento);
  const isValidado = catman === "validado" || catman === "valido";

  if (isValidado && hasPayment) return "Done";
  if (isValidado && !hasPayment) return "In Progress";
  if (catman === "aguardando validacao" && !hasPayment) return "Pending";
  return "Pending";
}

function aplicarDropdownStatusFpa_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_FPA_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function temValorPagamento_(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  const cleaned = text.replace(/[^\d,.-]/g, "");
  if (!cleaned) return false;

  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  const number = commaIndex > dotIndex
    ? Number(cleaned.replace(/\./g, "").replace(",", "."))
    : Number(cleaned.replace(/,/g, ""));

  return Number.isFinite(number) && number !== 0;
}

function temValorNaColunaCStatusFpa_(value) {
  return Boolean(String(value || "").trim());
}

function encontrarLinhaCabecalhoStatusFpa_(values) {
  const target = normalizarStatusFpa_(STATUS_FPA_CONFIG.HEADER_ID);
  const index = values.findIndex((row) => row.map(normalizarStatusFpa_).includes(target));
  return index >= 0 ? index : 0;
}

function encontrarColunaStatusFpa_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizarStatusFpa_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizarStatusFpa_(header)));
}

function normalizarStatusFpa_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
