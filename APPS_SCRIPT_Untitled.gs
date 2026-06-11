/**
 * Untitled.gs
 *
 * Este arquivo e o unico que deve ter doGet() e doPost().
 * Ele continua editando a aba Maker e encaminha a criacao de NDs para o nd.gs.
 */

const MAKER_WRITE_CONFIG = {
  SPREADSHEET_ID: "16rLhvOn4V45_ypGWoaUXmxCRaPXBJej9EVrtByze-44",
  SHEET_NAME: "Maker",
  BACK_SHEET_NAME: "Back",
  CATMAN_SHEET_NAME: "Catman",
  SECRET: "1234",
  ANCHOR_HEADER: "MAKER",
  ALLOWED_COLUMNS: [
    "STATUS CATMAN",
    "STATUS FP&A",
    "DATA_EMISSAO",
    "DATA EMISSAO",
    "DATA_ENVIO",
    "DATA_PAGAMENTO",
    "DATA PAGAMENTO",
    "PREVISAO_PGTO",
    "OBS",
    "VALOR FINAL",
    "VALOR EMISSAO ND",
    "VALOR_EMISSAO_ND",
    "VALOR EMISS\u00c3O ND",
    "VALOR PAGAMENTO",
    "VALOR_PAGAMENTO",
    "FORMA DE PAGAMENTO",
    "FORMA_PAGAMENTO",
    "EMISS\u00c3O",
    "ENVIO",
    "PREVIS\u00c3O PGT",
    "LINK",
    "LINK_ND",
    "LINK COMPROVANTE",
    "LINK_COMPROVANTE",
    "COMPROVANTE LINK"
  ]
};

const MAKER_STATUS_FPA_OPTIONS = ["Done", "In Progress", "Pending"];
const MAKER_STATUS_CATMAN_OPTIONS = ["Validado", "Aguardando Valida\u00e7\u00e3o"];
const MAKER_PAYMENT_METHOD_OPTIONS = [
  "Abatimento cr\u00e9dito",
  "Bonifica\u00e7\u00e3o",
  "Dep\u00f3sito",
  "Desconto em nota",
  "Preju\u00edzo",
  "S/ execu\u00e7\u00e3o"
];

function doGet(e) {
  if (typeof ndWebDoGet === "function") return ndWebDoGet(e);
  if (typeof doGetNd === "function") return doGetNd(e);
  return makerJson_({ ok: true, app: "Maker write API" });
}

function doPost(e) {
  try {
    const payload = makerParsePayload_(e);

    if (payload.action === "create_nds") {
      if (typeof ndWebDoPost === "function") return ndWebDoPost(e, payload);
      if (typeof doPostNd === "function") return doPostNd(e);
      return makerJson_({ ok: false, error: "Arquivo nd.gs nao carregado." });
    }

    if (payload.action === "upsert_catman") {
      return makerUpsertCatman_(payload);
    }

    return makerUpdateCell_(payload);
  } catch (err) {
    return makerJson_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function sincronizarMakersCatman() {
  const result = makerSyncMissingCatman_();
  Logger.log(JSON.stringify(result));
  return result;
}

function makerSyncMissingCatman_() {
  const spreadsheet = MAKER_WRITE_CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(MAKER_WRITE_CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  const makerSheet = spreadsheet.getSheetByName(MAKER_WRITE_CONFIG.SHEET_NAME);
  if (!makerSheet) throw new Error("Aba Maker nao encontrada.");

  let catmanSheet = spreadsheet.getSheetByName(MAKER_WRITE_CONFIG.CATMAN_SHEET_NAME);
  if (!catmanSheet) catmanSheet = spreadsheet.insertSheet(MAKER_WRITE_CONFIG.CATMAN_SHEET_NAME);

  const catmanHeaderMap = makerEnsureCatmanHeaders_(catmanSheet, ["MAKER"]);
  const catmanMakerCol = catmanHeaderMap[makerNormalizeHeader_("MAKER")];
  if (!catmanMakerCol) throw new Error("Coluna MAKER nao encontrada na aba Catman.");

  const catmanValues = catmanSheet.getDataRange().getDisplayValues();
  const existingMakers = new Set();
  for (let row = 1; row < catmanValues.length; row += 1) {
    const makerKey = makerNormalizeHeader_(catmanValues[row][catmanMakerCol - 1]);
    if (makerKey) existingMakers.add(makerKey);
  }

  const makerValues = makerSheet.getDataRange().getDisplayValues();
  const makerHeaderRow = makerFindHeaderRow_(makerValues);
  const makerHeaders = makerValues[makerHeaderRow] || [];
  const makerCol = makerFindColumnByCandidates_(makerHeaders, ["MAKER"]);
  if (makerCol < 0) throw new Error("Coluna MAKER nao encontrada na aba Maker.");

  const lastColumn = Math.max(catmanSheet.getLastColumn(), catmanMakerCol);
  const rowsToAppend = [];
  let skipped = 0;
  let blankMakers = 0;

  for (let row = makerHeaderRow + 1; row < makerValues.length; row += 1) {
    const maker = String(makerValues[row][makerCol] || "").trim();
    if (!maker) {
      blankMakers += 1;
      continue;
    }

    const makerKey = makerNormalizeHeader_(maker);
    if (existingMakers.has(makerKey)) {
      skipped += 1;
      continue;
    }

    existingMakers.add(makerKey);

    const outputRow = new Array(lastColumn).fill("");
    outputRow[catmanMakerCol - 1] = maker;
    rowsToAppend.push(outputRow);
  }

  if (rowsToAppend.length) {
    const startRow = Math.max(catmanSheet.getLastRow() + 1, 2);
    catmanSheet.getRange(startRow, 1, rowsToAppend.length, lastColumn).setValues(rowsToAppend);
  }

  return {
    ok: true,
    inserted: rowsToAppend.length,
    skipped,
    blankMakers
  };
}

function makerUpsertCatman_(payload) {
  if (String(payload.secret || "") !== String(makerGetSecret_())) {
    return makerJson_({ ok: false, error: "unauthorized" });
  }

  const record = payload.record || {};
  const maker = String(record.maker || "").trim();
  if (!maker) return makerJson_({ ok: false, error: "missing maker" });

  const spreadsheet = MAKER_WRITE_CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(MAKER_WRITE_CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = spreadsheet.getSheetByName(MAKER_WRITE_CONFIG.CATMAN_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(MAKER_WRITE_CONFIG.CATMAN_SHEET_NAME);

  const requiredHeaders = ["MAKER", "ID_ALIANCA", "CATMAN", "CNPJ", "EMAIL FORNECEDOR", "RAZAO SOCIAL", "ENDERECO COMPLETO"];
  const headerMap = makerEnsureCatmanHeaders_(sheet, requiredHeaders);
  const values = sheet.getDataRange().getDisplayValues();
  const makerCol = headerMap[makerNormalizeHeader_("MAKER")];
  if (!makerCol) return makerJson_({ ok: false, error: "column MAKER not found" });

  let targetRow = 0;
  for (let row = 1; row < values.length; row += 1) {
    if (makerNormalizeHeader_(values[row][makerCol - 1]) === makerNormalizeHeader_(maker)) {
      targetRow = row + 1;
      break;
    }
  }

  const created = !targetRow;
  if (!targetRow) targetRow = Math.max(sheet.getLastRow() + 1, 2);

  makerSetCatmanValue_(sheet, targetRow, headerMap, "MAKER", maker);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "ID_ALIANCA", record.idAlianca);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "CATMAN", record.catman);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "CNPJ", record.cnpj);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "EMAIL FORNECEDOR", record.emailFornecedor);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "RAZAO SOCIAL", record.razaoSocial);
  makerSetCatmanValue_(sheet, targetRow, headerMap, "ENDERECO COMPLETO", record.enderecoCompleto);

  return makerJson_({ ok: true, created, updated: !created, row: targetRow, maker });
}

function makerUpdateCell_(payload) {
  if (String(payload.secret || "") !== String(makerGetSecret_())) {
    return makerJson_({ ok: false, error: "unauthorized" });
  }

  const maker = String(payload.maker || "").trim();
  const columnName = String(payload.column || "").trim();
  const value = payload.value == null ? "" : payload.value;
  const sheetName = makerResolveEditableSheetName_(payload.sheetName);

  if (!maker || !columnName) {
    return makerJson_({ ok: false, error: "missing maker or column" });
  }

  const allowed = MAKER_WRITE_CONFIG.ALLOWED_COLUMNS.map(makerNormalizeHeader_);
  if (!allowed.includes(makerNormalizeHeader_(columnName))) {
    return makerJson_({ ok: false, error: "column not allowed" });
  }

  const sheet = makerGetSheet_(sheetName);
  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = makerFindHeaderRow_(values);
  const headers = values[headerRow];
  const idCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  const targetCol = makerFindColumn_(headers, columnName);

  if (idCol < 0 || targetCol < 0) {
    return makerJson_({ ok: false, error: "column not found" });
  }

  for (let row = headerRow + 1; row < values.length; row += 1) {
    if (makerNormalizeHeader_(values[row][idCol]) === makerNormalizeHeader_(maker)) {
      sheet.getRange(row + 1, targetCol + 1).setValue(value);
      const statusCatman = makerSyncStatusCatman_(sheet, row + 1, headers, columnName);
      const paymentMethod = makerSyncPaymentMethod_(sheet, row + 1, headers, columnName);
      const statusFpa = makerSyncStatusFpa_(sheet, row + 1, headers);
      return makerJson_({ ok: true, row: row + 1, column: targetCol + 1, statusCatman, paymentMethod, statusFpa });
    }
  }

  return makerJson_({ ok: false, error: "maker not found" });
}

function makerSyncStatusCatman_(sheet, rowNumber, headers, changedColumnName) {
  if (makerNormalizeHeader_(changedColumnName) !== "status catman") return "";

  const statusCatmanCol = makerFindColumnByCandidates_(headers, ["STATUS CATMAN", "STATUS_CATMAN"]);
  if (statusCatmanCol < 0) return "";

  const statusCell = sheet.getRange(rowNumber, statusCatmanCol + 1);
  const anchorValue = makerGetAnchorValue_(sheet, rowNumber, headers);

  if (!makerHasColumnCValue_(anchorValue)) {
    statusCell.clearContent();
    statusCell.clearDataValidations();
    return "";
  }

  const nextStatus = makerNormalizeStatusCatmanValue_(statusCell.getDisplayValue()) || "Aguardando Valida\u00e7\u00e3o";
  makerApplyStatusCatmanDropdown_(statusCell);
  statusCell.setValue(nextStatus);
  return nextStatus;
}

function makerSyncPaymentMethod_(sheet, rowNumber, headers, changedColumnName) {
  const changedColumn = makerNormalizeHeader_(changedColumnName);
  if (changedColumn !== "forma de pagamento" && changedColumn !== "forma_pagamento") return "";

  const paymentMethodCol = makerFindColumnByCandidates_(headers, ["FORMA DE PAGAMENTO", "FORMA_PAGAMENTO"]);
  if (paymentMethodCol < 0) return "";

  const paymentCell = sheet.getRange(rowNumber, paymentMethodCol + 1);
  const columnCValue = makerGetAnchorValue_(sheet, rowNumber, headers);

  if (!makerHasColumnCValue_(columnCValue)) {
    paymentCell.clearContent();
    paymentCell.clearDataValidations();
    return "";
  }

  const nextMethod = makerNormalizePaymentMethodValue_(paymentCell.getDisplayValue());
  makerApplyPaymentMethodDropdown_(paymentCell);
  paymentCell.setValue(nextMethod);
  return nextMethod;
}

function makerSyncStatusFpa_(sheet, rowNumber, headers) {
  const statusFpaCol = makerFindColumnByCandidates_(headers, ["STATUS FP&A", "STATUS FPA", "STATUS FPNA"]);
  const statusCatmanCol = makerFindColumnByCandidates_(headers, ["STATUS CATMAN"]);
  const valorPagamentoCol = makerFindColumnByCandidates_(headers, ["VALOR_PAGAMENTO", "VALOR PAGAMENTO", "PAGAMENTO"]);

  if (statusFpaCol < 0) return "";

  const statusCell = sheet.getRange(rowNumber, statusFpaCol + 1);
  const columnCValue = makerGetAnchorValue_(sheet, rowNumber, headers);

  if (!makerHasColumnCValue_(columnCValue)) {
    statusCell.clearContent();
    statusCell.clearDataValidations();
    return "";
  }

  makerApplyStatusFpaDropdown_(statusCell);
  const statusCatman = statusCatmanCol >= 0
    ? sheet.getRange(rowNumber, statusCatmanCol + 1).getDisplayValue()
    : "";
  const valorPagamento = valorPagamentoCol >= 0
    ? sheet.getRange(rowNumber, valorPagamentoCol + 1).getDisplayValue()
    : "";
  const nextStatus = makerGetStatusFpaByRule_(valorPagamento, statusCatman);
  if (!nextStatus) return "";

  statusCell.setValue(nextStatus);
  return nextStatus;
}

function makerGetStatusFpaByRule_(valorPagamento, statusCatman) {
  const catman = makerNormalizeHeader_(statusCatman);
  const hasPayment = makerHasPaymentValue_(valorPagamento);
  const isValidado = catman === "validado" || catman === "valido";

  if (hasPayment) return "Done";
  if (isValidado && !hasPayment) return "In Progress";
  if (catman === "aguardando validacao" && !hasPayment) return "Pending";
  return "Pending";
}

function makerApplyStatusCatmanDropdown_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(MAKER_STATUS_CATMAN_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function makerApplyStatusFpaDropdown_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(MAKER_STATUS_FPA_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function makerApplyPaymentMethodDropdown_(range) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(MAKER_PAYMENT_METHOD_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

function aplicarDropdownStatusCatmanMaker() {
  const sheet = makerGetSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = makerFindHeaderRow_(values);
  const headers = values[headerRow];
  const anchorCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  const statusCatmanCol = makerFindColumnByCandidates_(headers, ["STATUS CATMAN", "STATUS_CATMAN"]);

  if (anchorCol < 0) throw new Error("Coluna MAKER nao encontrada.");
  if (statusCatmanCol < 0) throw new Error("Coluna STATUS CATMAN nao encontrada.");

  const firstDataRow = headerRow + 2;
  const totalRows = sheet.getLastRow() - firstDataRow + 1;
  if (totalRows <= 0) return;

  const bodyRows = values.slice(headerRow + 1);
  const statusRange = sheet.getRange(firstDataRow, statusCatmanCol + 1, totalRows, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(MAKER_STATUS_CATMAN_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  const output = [];
  const validations = [];

  bodyRows.forEach((row) => {
    const columnCValue = row[anchorCol] || "";

    if (!String(columnCValue || "").trim()) {
      output.push([""]);
      validations.push([null]);
      return;
    }

    output.push([makerNormalizeStatusCatmanValue_(row[statusCatmanCol]) || "Aguardando Valida\u00e7\u00e3o"]);
    validations.push([statusRule]);
  });

  statusRange.setDataValidations(validations);
  statusRange.setValues(output);
}

function aplicarDropdownStatusFpaMaker() {
  const sheet = makerGetSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = makerFindHeaderRow_(values);
  const headers = values[headerRow];
  const anchorCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  const statusFpaCol = makerFindColumnByCandidates_(headers, ["STATUS FP&A", "STATUS FPA", "STATUS FPNA"]);
  const statusCatmanCol = makerFindColumnByCandidates_(headers, ["STATUS CATMAN"]);
  const valorPagamentoCol = makerFindColumnByCandidates_(headers, ["VALOR_PAGAMENTO", "VALOR PAGAMENTO", "PAGAMENTO"]);

  if (anchorCol < 0) throw new Error("Coluna MAKER nao encontrada.");
  if (statusFpaCol < 0) throw new Error("Coluna STATUS FP&A nao encontrada.");

  const firstDataRow = headerRow + 2;
  const totalRows = sheet.getLastRow() - firstDataRow + 1;
  if (totalRows <= 0) return;

  const bodyRows = values.slice(headerRow + 1);

  bodyRows.forEach((row, index) => {
    const rowNumber = firstDataRow + index;
    const statusCell = sheet.getRange(rowNumber, statusFpaCol + 1);
    const columnCValue = row[anchorCol] || "";

    if (!makerHasColumnCValue_(columnCValue)) {
      statusCell.clearContent();
      statusCell.clearDataValidations();
      return;
    }

    const statusCatman = statusCatmanCol >= 0
      ? sheet.getRange(rowNumber, statusCatmanCol + 1).getDisplayValue()
      : "";
    const valorPagamento = valorPagamentoCol >= 0
      ? sheet.getRange(rowNumber, valorPagamentoCol + 1).getDisplayValue()
      : "";
    const nextStatus = makerGetStatusFpaByRule_(valorPagamento, statusCatman);

    makerApplyStatusFpaDropdown_(statusCell);
    statusCell.setValue(nextStatus);
  });
}

function aplicarDropdownFormaPagamentoMaker() {
  const sheet = makerGetSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = makerFindHeaderRow_(values);
  const headers = values[headerRow];
  const anchorCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  const paymentMethodCol = makerFindColumnByCandidates_(headers, ["FORMA DE PAGAMENTO", "FORMA_PAGAMENTO"]);

  if (anchorCol < 0) throw new Error("Coluna MAKER nao encontrada.");
  if (paymentMethodCol < 0) throw new Error("Coluna Forma de Pagamento nao encontrada.");

  const firstDataRow = headerRow + 2;
  const totalRows = sheet.getLastRow() - firstDataRow + 1;
  if (totalRows <= 0) return;

  const bodyRows = values.slice(headerRow + 1);
  const paymentRange = sheet.getRange(firstDataRow, paymentMethodCol + 1, totalRows, 1);
  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(MAKER_PAYMENT_METHOD_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  const output = [];
  const validations = [];

  bodyRows.forEach((row) => {
    const columnCValue = row[anchorCol] || "";

    if (!makerHasColumnCValue_(columnCValue)) {
      output.push([""]);
      validations.push([null]);
      return;
    }

    output.push([makerNormalizePaymentMethodValue_(row[paymentMethodCol])]);
    validations.push([paymentRule]);
  });

  paymentRange.setDataValidations(validations);
  paymentRange.setValues(output);
}

function makerNormalizeStatusCatmanValue_(value) {
  const normalized = makerNormalizeHeader_(value);
  if (!normalized) return "";

  if (["approved", "aprovado", "valido", "validado"].includes(normalized)) {
    return "Validado";
  }

  if (normalized.includes("aguardando") || ["pending", "pendente", "validar", "em analise"].includes(normalized)) {
    return "Aguardando Valida\u00e7\u00e3o";
  }

  return "";
}

function makerNormalizePaymentMethodValue_(value) {
  const normalized = makerNormalizeHeader_(value);
  if (!normalized) return "";

  const match = MAKER_PAYMENT_METHOD_OPTIONS.find((option) => makerNormalizeHeader_(option) === normalized);
  return match || "";
}

function makerHasPaymentValue_(value) {
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

function makerHasColumnCValue_(value) {
  return Boolean(String(value || "").trim());
}

function makerGetAnchorValue_(sheet, rowNumber, headers) {
  const anchorCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  if (anchorCol < 0) return "";
  return sheet.getRange(rowNumber, anchorCol + 1).getDisplayValue();
}

function makerEnsureCatmanHeaders_(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]).setFontWeight("bold");
  }

  let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0].map(String);
  const normalizedHeaders = headers.map(makerNormalizeHeader_);
  const missingHeaders = requiredHeaders.filter((header) => !normalizedHeaders.includes(makerNormalizeHeader_(header)));

  if (missingHeaders.length) {
    sheet.getRange(1, headers.length + 1, 1, missingHeaders.length).setValues([missingHeaders]).setFontWeight("bold");
    headers = headers.concat(missingHeaders);
  }

  return headers.reduce((map, header, index) => {
    if (makerNormalizeHeader_(header)) map[makerNormalizeHeader_(header)] = index + 1;
    return map;
  }, {});
}

function makerSetCatmanValue_(sheet, rowNumber, headerMap, header, value) {
  const col = headerMap[makerNormalizeHeader_(header)];
  if (col) sheet.getRange(rowNumber, col).setValue(value == null ? "" : value);
}

function makerGetSheet_(sheetName) {
  const spreadsheet = MAKER_WRITE_CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(MAKER_WRITE_CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) throw new Error("Planilha Maker nao encontrada.");

  const targetSheetName = sheetName || MAKER_WRITE_CONFIG.SHEET_NAME;
  const sheet = spreadsheet.getSheetByName(targetSheetName);
  if (!sheet) throw new Error("Aba " + targetSheetName + " nao encontrada.");
  return sheet;
}

function makerResolveEditableSheetName_(sheetName) {
  const requested = String(sheetName || MAKER_WRITE_CONFIG.SHEET_NAME).trim();
  const allowed = [MAKER_WRITE_CONFIG.SHEET_NAME, MAKER_WRITE_CONFIG.BACK_SHEET_NAME];
  return allowed.find((name) => makerNormalizeHeader_(name) === makerNormalizeHeader_(requested)) || MAKER_WRITE_CONFIG.SHEET_NAME;
}

function makerGetSecret_() {
  try {
    const propertySecret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (propertySecret) return propertySecret;
  } catch (error) {
    // Se PropertiesService nao estiver disponivel em algum teste local, usa o fallback.
  }
  return MAKER_WRITE_CONFIG.SECRET;
}

function makerParsePayload_(e) {
  return JSON.parse((e && e.postData && e.postData.contents) || "{}");
}

function makerFindHeaderRow_(values) {
  const target = makerNormalizeHeader_(MAKER_WRITE_CONFIG.ANCHOR_HEADER);
  const index = values.findIndex((row) => row.map(makerNormalizeHeader_).includes(target));
  return index >= 0 ? index : 0;
}

function makerFindColumn_(headers, name) {
  const target = makerNormalizeHeader_(name);
  return headers.findIndex((header) => makerNormalizeHeader_(header) === target);
}

function makerFindColumnByCandidates_(headers, candidates) {
  const normalizedCandidates = candidates.map(makerNormalizeHeader_);
  return headers.findIndex((header) => normalizedCandidates.includes(makerNormalizeHeader_(header)));
}

function makerNormalizeHeader_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function makerJson_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
