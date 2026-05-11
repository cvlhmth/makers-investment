/**
 * Script separado para padronizar a coluna Forma de Pagamento.
 *
 * Regra:
 * - So mexe na linha quando a coluna C tiver valor.
 * - Se a coluna C estiver vazia, limpa Forma de Pagamento e remove dropdown.
 * - Forma de Pagamento fica sempre como dropdown:
 *   - Abatimento credito
 *   - Bonificacao
 *   - Deposito
 *   - Desconto em nota
 *   - Prejuizo
 *   - S/ execucao
 *
 * Como usar:
 * 1. Crie um novo arquivo .gs no Apps Script.
 * 2. Cole este codigo.
 * 3. Rode a funcao atualizarFormaPagamentoDropdown().
 */

const FORMA_PAGAMENTO_CONFIG = {
  SHEET_NAME: "Maker",
  HEADER_ID: "ID_ALIANCA",
  PAYMENT_HEADER: "Forma de Pagamento"
};

const FORMA_PAGAMENTO_OPTIONS = [
  "Abatimento cr\u00e9dito",
  "Bonifica\u00e7\u00e3o",
  "Dep\u00f3sito",
  "Desconto em nota",
  "Preju\u00edzo",
  "S/ execu\u00e7\u00e3o"
];

function atualizarFormaPagamentoDropdown() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FORMA_PAGAMENTO_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoFormaPagamento_(values);
  const headers = values[headerRow];
  const paymentCol = encontrarColunaFormaPagamento_(headers, [FORMA_PAGAMENTO_CONFIG.PAYMENT_HEADER, "FORMA_PAGAMENTO"]);
  const firstDataRow = headerRow + 2;
  const lastRow = sheet.getLastRow();

  if (paymentCol < 0) throw new Error("Coluna Forma de Pagamento nao encontrada.");
  if (lastRow < firstDataRow) return;

  const bodyRows = values.slice(headerRow + 1);
  const paymentRange = sheet.getRange(firstDataRow, paymentCol + 1, bodyRows.length, 1);
  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(FORMA_PAGAMENTO_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  const output = [];
  const validations = [];

  bodyRows.forEach((row) => {
    const valorColunaC = row[2] || "";

    if (!temValorColunaCFormaPagamento_(valorColunaC)) {
      output.push([""]);
      validations.push([null]);
      return;
    }

    output.push([normalizarValorFormaPagamento_(row[paymentCol])]);
    validations.push([paymentRule]);
  });

  paymentRange.setDataValidations(validations);
  paymentRange.setValues(output);
  SpreadsheetApp.flush();
}

function formaPagamentoAoEditar(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== FORMA_PAGAMENTO_CONFIG.SHEET_NAME) return;

  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = encontrarLinhaCabecalhoFormaPagamento_(values);
  const headers = values[headerRow];
  const paymentCol = encontrarColunaFormaPagamento_(headers, [FORMA_PAGAMENTO_CONFIG.PAYMENT_HEADER, "FORMA_PAGAMENTO"]);
  const rowNumber = range.getRow();

  if (paymentCol < 0) throw new Error("Coluna Forma de Pagamento nao encontrada.");
  if (rowNumber <= headerRow + 1) return;
  if (![3, paymentCol + 1].includes(range.getColumn())) return;

  const paymentCell = sheet.getRange(rowNumber, paymentCol + 1);
  const valorColunaC = sheet.getRange(rowNumber, 3).getDisplayValue();

  if (!temValorColunaCFormaPagamento_(valorColunaC)) {
    paymentCell.clearContent();
    paymentCell.clearDataValidations();
    return;
  }

  aplicarDropdownFormaPagamento_(paymentCell);
  paymentCell.setValue(normalizarValorFormaPagamento_(paymentCell.getDisplayValue()));
}

function aplicarDropdownFormaPagamento_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(FORMA_PAGAMENTO_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function normalizarValorFormaPagamento_(value) {
  const normalized = normalizarFormaPagamento_(value);
  if (!normalized) return "";

  const match = FORMA_PAGAMENTO_OPTIONS.find((option) => normalizarFormaPagamento_(option) === normalized);
  return match || "";
}

function temValorColunaCFormaPagamento_(value) {
  return Boolean(String(value || "").trim());
}

function encontrarLinhaCabecalhoFormaPagamento_(values) {
  const target = normalizarFormaPagamento_(FORMA_PAGAMENTO_CONFIG.HEADER_ID);
  const index = values.findIndex((row) => row.map(normalizarFormaPagamento_).includes(target));
  return index >= 0 ? index : 0;
}

function encontrarColunaFormaPagamento_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizarFormaPagamento_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizarFormaPagamento_(header)));
}

function normalizarFormaPagamento_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
