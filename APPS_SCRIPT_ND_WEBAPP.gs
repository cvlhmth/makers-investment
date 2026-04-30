/**
 * Web App para o Makers Investment.
 *
 * O site estatico envia:
 * - edicoes normais do dashboard: { secret, idAlianca, column, value }
 * - criacao de NDs: { action: "create_nds", secret, rows: [...] }
 *
 * Antes de publicar:
 * 1. Cole este arquivo no Apps Script ligado a sua conta Google.
 * 2. Em Project Settings > Script properties, crie SECRET com o mesmo token usado no site.
 * 3. Deploy > Web app > Execute as: Me > Who has access: Anyone/Anyone within Rappi.
 */

const WRITE_SECRET = "";
const MAKER_SPREADSHEET_ID = "16rLhvOn4V45_ypGWoaUXmxCRaPXBJej9EVrtByze-44";
const MAKER_SHEET_NAME = "Maker";
const ND_SHEET_GID = 1349527717;
const ND_SHEET_FALLBACK_NAME = "ND";
const FIRST_ND_NUMBER = 358;

// Pasta raiz nova informada por voce.
const ROOT_FOLDER_ID = "16xcdOEGPgRFU2Tevzlkr1c-mAXZZ8X1C";

// Template do seu script atual. Troque se criar outro modelo.
const TEMPLATE_DOC_ID = "1cf3NvNgY4JT7mfTNd_G1VowKQo-ZhOds815zGdEidRA";

const ND_HEADERS = [
  "STATUS",
  "N_ND",
  "MAKER",
  "ANO",
  "MES",
  "VALOR VALIDADO",
  "VALOR FINAL EXTENSO",
  "ID_ALIANCA",
  "CNPJ",
  "STATUS CATMAN",
  "CHAVE_ORIGEM",
  "CRIADO_EM",
  "LINK"
];

function doGet() {
  return json_({
    ok: true,
    app: "Makers Investment ND Web App"
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    assertSecret_(payload.secret);

    if (payload.action === "create_nds") {
      return json_(createNds_(payload.rows || []));
    }

    return json_(updateMakerCell_(payload));
  } catch (error) {
    return json_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function createNds_(rows) {
  const ss = SpreadsheetApp.openById(MAKER_SPREADSHEET_ID);
  const sheet = getSheetByGid_(ss, ND_SHEET_GID) || ss.getSheetByName(ND_SHEET_FALLBACK_NAME) || ss.insertSheet(ND_SHEET_FALLBACK_NAME);
  const headerMap = ensureHeaders_(sheet, ND_HEADERS);
  const values = sheet.getDataRange().getValues();
  const existingRows = values.slice(1);
  const existingKeys = collectExistingKeys_(existingRows, headerMap);
  let nextNd = Math.max(FIRST_ND_NUMBER, getMaxNd_(existingRows, headerMap) + 1);
  const now = Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd HH:mm:ss");
  const rowsToAppend = [];
  let created = 0;
  let skipped = 0;

  rows.forEach((input) => {
    const sourceKeys = Array.isArray(input.sourceKeys) ? input.sourceKeys.filter(Boolean) : [];
    const fallbackKeys = makeRecordKeys_(input);
    const allKeys = sourceKeys.length ? sourceKeys : fallbackKeys;
    const alreadyExists = allKeys.some((key) => existingKeys.has(key));

    if (alreadyExists) {
      skipped += 1;
      return;
    }

    const nNd = nextNd;
    nextNd += 1;

    let link = "";
    try {
      link = createPdfForNd_(input, nNd);
    } catch (error) {
      console.error("PDF nao gerado para ND " + nNd + ": " + error.message);
    }

    rowsToAppend.push(rowObjectToSheetRow_({
      STATUS: "GERADO",
      N_ND: nNd,
      MAKER: input.maker || "",
      ANO: input.ano || "",
      MES: input.mes || "",
      "VALOR VALIDADO": parseNumber_(input.valorValidado),
      "VALOR FINAL EXTENSO": input.valorFinalExtenso || "",
      ID_ALIANCA: input.idAlianca || "",
      CNPJ: input.cnpj || "",
      "STATUS CATMAN": input.statusCatman || "Valido",
      CHAVE_ORIGEM: allKeys[0] || "",
      CRIADO_EM: now,
      LINK: link
    }, headerMap));

    allKeys.forEach((key) => existingKeys.add(key));
    created += 1;
  });

  if (rowsToAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }

  return {
    ok: true,
    created,
    skipped,
    nextNd
  };
}

function updateMakerCell_(payload) {
  const idAlianca = String(payload.idAlianca || "").trim();
  const columnLabel = String(payload.column || "").trim();

  if (!idAlianca) throw new Error("idAlianca nao informado.");
  if (!columnLabel) throw new Error("Coluna nao informada.");

  const ss = SpreadsheetApp.openById(MAKER_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(MAKER_SHEET_NAME);
  if (!sheet) throw new Error("Aba Maker nao encontrada.");

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error("Aba Maker sem dados.");

  const headers = values[0].map(String);
  const idCol = findHeaderIndex_(headers, ["id_alianca", "id alianca", "id alianza"]);
  const targetCol = findHeaderIndex_(headers, [columnLabel]);

  if (idCol < 0) throw new Error("Coluna ID_ALIANCA nao encontrada.");
  if (targetCol < 0) throw new Error("Coluna destino nao encontrada: " + columnLabel);

  const rowIndex = values.findIndex((row, index) => index > 0 && String(row[idCol]).trim() === idAlianca);
  if (rowIndex < 0) throw new Error("ID_ALIANCA nao encontrado: " + idAlianca);

  sheet.getRange(rowIndex + 1, targetCol + 1).setValue(payload.value || "");

  return {
    ok: true,
    updated: 1
  };
}

function createPdfForNd_(input, nNd) {
  if (!ROOT_FOLDER_ID || !TEMPLATE_DOC_ID) return "";

  const year = input.ano || new Date().getFullYear();
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = getOrCreateFolder_(root, String(year));
  const fileBaseName = "ND " + nNd + "." + year + "_" + sanitizeFilename_(input.maker || "Maker");
  const existingPdf = folder.getFilesByName(fileBaseName + ".pdf");

  if (existingPdf.hasNext()) {
    return existingPdf.next().getUrl();
  }

  const template = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const copy = template.makeCopy(fileBaseName, folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  const today = new Date();
  const dateText = Utilities.formatDate(today, "GMT-3", "dd/MM/yyyy");
  const reference = "Makers Investment " + (input.mes || "") + " " + year;

  replaceBodyText_(body, "{N_ND}", nNd);
  replaceBodyText_(body, "{ANO}", year);
  replaceBodyText_(body, "{MAKER}", input.maker || "");
  replaceBodyText_(body, "{RAZÃO SOCIAL}", input.razaoSocial || input.maker || "");
  replaceBodyText_(body, "{CNPJ}", input.cnpj || "");
  replaceBodyText_(body, "{VALOR}", formatCurrency_(input.valorValidado));
  replaceBodyText_(body, "{VALOR POR EXTENSO}", input.valorFinalExtenso || "");
  replaceBodyText_(body, "{REFERÊNCIA}", reference);
  replaceBodyText_(body, "{DATA DE VENCIMENTO}", input.dataVencimento || dateText);
  replaceBodyText_(body, "{data_por_extenso}", dateText);
  replaceBodyText_(body, "{SAP}", input.sap || "");
  replaceBodyText_(body, "{ENDEREÇO}", input.endereco || "");

  doc.saveAndClose();

  const pdfBlob = copy.getAs(MimeType.PDF).setName(fileBaseName + ".pdf");
  const pdf = folder.createFile(pdfBlob);
  copy.setTrashed(true);
  return pdf.getUrl();
}

function collectExistingKeys_(rows, headerMap) {
  const keys = new Set();

  rows.forEach((row) => {
    const sourceKey = valueByHeader_(row, headerMap, "CHAVE_ORIGEM");
    if (sourceKey) keys.add(String(sourceKey));

    makeRecordKeys_({
      idAlianca: valueByHeader_(row, headerMap, "ID_ALIANCA"),
      maker: valueByHeader_(row, headerMap, "MAKER"),
      ano: valueByHeader_(row, headerMap, "ANO"),
      valorValidado: valueByHeader_(row, headerMap, "VALOR VALIDADO") || valueByHeader_(row, headerMap, "VALOR")
    }).forEach((key) => keys.add(key));
  });

  return keys;
}

function makeRecordKeys_(input) {
  const keys = [];
  const idAlianca = String(input.idAlianca || "").trim();
  const maker = normalizeHeader_(input.maker);
  const year = String(input.ano || "").trim();
  const value = parseNumber_(input.valorValidado).toFixed(2);

  if (idAlianca) keys.push("id:" + idAlianca);
  if (maker && year && value !== "0.00") keys.push("maker-year-value:" + maker + "|" + year + "|" + value);
  if (maker && value !== "0.00") keys.push("maker-value:" + maker + "|" + value);

  return keys;
}

function getMaxNd_(rows, headerMap) {
  const ndCol = headerMap[normalizeHeader_("N_ND")];
  if (!ndCol) return 0;

  return rows.reduce((max, row) => {
    const number = Number(String(row[ndCol - 1] || "").replace(/[^\d]/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
}

function ensureHeaders_(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]).setFontWeight("bold");
  }

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const normalized = headers.map(normalizeHeader_);
  const missing = requiredHeaders.filter((header) => !normalized.includes(normalizeHeader_(header)));

  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight("bold");
    headers = headers.concat(missing);
  }

  return headers.reduce((map, header, index) => {
    map[normalizeHeader_(header)] = index + 1;
    return map;
  }, {});
}

function rowObjectToSheetRow_(object, headerMap) {
  const outputLength = Math.max.apply(null, Object.keys(headerMap).map((key) => headerMap[key]));
  const output = Array(outputLength).fill("");

  Object.keys(object).forEach((header) => {
    const col = headerMap[normalizeHeader_(header)];
    if (col) output[col - 1] = object[header];
  });

  return output;
}

function valueByHeader_(row, headerMap, header) {
  const col = headerMap[normalizeHeader_(header)];
  return col ? row[col - 1] : "";
}

function getSheetByGid_(spreadsheet, gid) {
  const target = Number(gid);
  return spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === target) || null;
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function findHeaderIndex_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizeHeader_(header)));
}

function replaceBodyText_(body, token, value) {
  body.replaceText(escapeRegExp_(token), String(value == null ? "" : value));
}

function assertSecret_(secret) {
  const configured = PropertiesService.getScriptProperties().getProperty("SECRET") || WRITE_SECRET;
  if (!configured) throw new Error("Configure a propriedade SECRET no Apps Script.");
  if (String(secret || "") !== String(configured)) throw new Error("Token invalido.");
}

function parseNumber_(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  if (commaIndex > dotIndex) return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(cleaned.replace(/,/g, "")) || 0;
}

function formatCurrency_(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(parseNumber_(value));
}

function sanitizeFilename_(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|#%{}~&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizeHeader_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegExp_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
