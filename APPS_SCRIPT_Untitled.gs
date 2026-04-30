/**
 * Untitled.gs
 *
 * Este arquivo e o unico que deve ter doGet() e doPost().
 * Ele continua editando a aba Maker e encaminha a criacao de NDs para o nd.gs.
 */

const MAKER_WRITE_CONFIG = {
  SPREADSHEET_ID: "16rLhvOn4V45_ypGWoaUXmxCRaPXBJej9EVrtByze-44",
  SHEET_NAME: "Maker",
  SECRET: "1234",
  ID_HEADER: "ID_ALIANCA",
  ALLOWED_COLUMNS: [
    "STATUS CATMAN",
    "STATUS FP&A",
    "DATA_EMISSAO",
    "DATA EMISSAO",
    "DATA_ENVIO",
    "PREVISAO_PGTO",
    "OBS",
    "VALOR FINAL",
    "VALOR EMISSAO ND",
    "VALOR_EMISSAO_ND",
    "VALOR EMISS\u00c3O ND",
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

    return makerUpdateCell_(payload);
  } catch (err) {
    return makerJson_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function makerUpdateCell_(payload) {
  if (String(payload.secret || "") !== String(makerGetSecret_())) {
    return makerJson_({ ok: false, error: "unauthorized" });
  }

  const idAlianca = String(payload.idAlianca || "").trim();
  const columnName = String(payload.column || "").trim();
  const value = payload.value == null ? "" : payload.value;

  if (!idAlianca || !columnName) {
    return makerJson_({ ok: false, error: "missing idAlianca or column" });
  }

  const allowed = MAKER_WRITE_CONFIG.ALLOWED_COLUMNS.map(makerNormalizeHeader_);
  if (!allowed.includes(makerNormalizeHeader_(columnName))) {
    return makerJson_({ ok: false, error: "column not allowed" });
  }

  const sheet = makerGetSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headerRow = makerFindHeaderRow_(values);
  const headers = values[headerRow];
  const idCol = makerFindColumn_(headers, MAKER_WRITE_CONFIG.ID_HEADER);
  const targetCol = makerFindColumn_(headers, columnName);

  if (idCol < 0 || targetCol < 0) {
    return makerJson_({ ok: false, error: "column not found" });
  }

  for (let row = headerRow + 1; row < values.length; row += 1) {
    if (String(values[row][idCol]).trim() === idAlianca) {
      sheet.getRange(row + 1, targetCol + 1).setValue(value);
      return makerJson_({ ok: true, row: row + 1, column: targetCol + 1 });
    }
  }

  return makerJson_({ ok: false, error: "idAlianca not found" });
}

function makerGetSheet_() {
  const spreadsheet = MAKER_WRITE_CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(MAKER_WRITE_CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) throw new Error("Planilha Maker nao encontrada.");

  const sheet = spreadsheet.getSheetByName(MAKER_WRITE_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");
  return sheet;
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
  const target = makerNormalizeHeader_(MAKER_WRITE_CONFIG.ID_HEADER);
  const index = values.findIndex((row) => row.map(makerNormalizeHeader_).includes(target));
  return index >= 0 ? index : 0;
}

function makerFindColumn_(headers, name) {
  const target = makerNormalizeHeader_(name);
  return headers.findIndex((header) => makerNormalizeHeader_(header) === target);
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
