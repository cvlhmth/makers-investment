/**
 * nd.gs
 *
 * Este arquivo NAO deve ter doGet() nem doPost().
 * O Untitled.gs recebe a chamada do site e chama ndWebDoPost() daqui.
 */

const ND_WEB_WRITE_SECRET = "";
const ND_WEB_MAKER_SPREADSHEET_ID = "16rLhvOn4V45_ypGWoaUXmxCRaPXBJej9EVrtByze-44";
const ND_WEB_ND_SHEET_GID = 1349527717;
const ND_WEB_ND_SHEET_FALLBACK_NAME = "ND";
const ND_WEB_FIRST_ND_NUMBER = 510;
const ND_WEB_SCRIPT_VERSION = "2026-04-30-specific-nd-key-v5";
const ND_WEB_ROOT_FOLDER_ID = "16xcdOEGPgRFU2Tevzlkr1c-mAXZZ8X1C";
const ND_WEB_TEMPLATE_DOC_ID = "1wH0cqY46CwKVc3AcmWJCGtXcXypcgt9tACqcf2Nh3WQ";
const ND_WEB_CATMAN_SHEET_NAME = "Catman";
const ND_WEB_CATMAN_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1975482772&single=true&output=csv";

const ND_WEB_MESES_EXTENSO = [
  "janeiro",
  "fevereiro",
  "mar\u00e7o",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];

const ND_WEB_MESES_NOMEADOS = [
  "01 - Janeiro",
  "02 - Fevereiro",
  "03 - Mar\u00e7o",
  "04 - Abril",
  "05 - Maio",
  "06 - Junho",
  "07 - Julho",
  "08 - Agosto",
  "09 - Setembro",
  "10 - Outubro",
  "11 - Novembro",
  "12 - Dezembro"
];

const ND_WEB_HEADERS = [
  "N_ND",
  "Nome",
  "VALOR EMISSAO ND",
  "VALOR POR EXTENSO",
  "REFER\u00caNCIA",
  "CNPJ",
  "CNPJ_2",
  "RAZ\u00c3O SOCIAL",
  "ORIGEM",
  "STATUS",
  "LINK",
  "CHAVE_ORIGEM",
  "CRIADO_EM",
  "PDF_STATUS",
  "PDF_ERRO",
  "SCRIPT_VERSION",
  "ENDERE\u00c7O",
  "DATA DE VENCIMENTO",
  "SAP",
  "ANO",
  "MES",
  "STATUS CATMAN"
];

function ndWebDoGet() {
  return ndWebJson_({
    ok: true,
    app: "Makers Investment ND Web App",
    version: ND_WEB_SCRIPT_VERSION
  });
}

function doGetNd(e) {
  return ndWebDoGet(e);
}

function ndWebDoPost(e, parsedPayload) {
  try {
    const payload = parsedPayload || JSON.parse((e && e.postData && e.postData.contents) || "{}");
    ndWebAssertSecret_(payload.secret);

    if (payload.action !== "create_nds") {
      return ndWebJson_({ ok: false, error: "Acao nao suportada pelo nd.gs." });
    }

    return ndWebJson_(ndWebCreateNds_(payload.rows || []));
  } catch (error) {
    return ndWebJson_({
      ok: false,
      error: String(error && error.message ? error.message : error),
      version: ND_WEB_SCRIPT_VERSION
    });
  }
}

function doPostNd(e) {
  return ndWebDoPost(e);
}

function autorizarMakersInvestmentNd() {
  const rootFolder = DriveApp.getFolderById(ND_WEB_ROOT_FOLDER_ID);
  const folderName = rootFolder.getName();
  const templateName = DriveApp.getFileById(ND_WEB_TEMPLATE_DOC_ID).getName();
  const spreadsheetName = SpreadsheetApp.openById(ND_WEB_MAKER_SPREADSHEET_ID).getName();
  const catmanCsvStatus = UrlFetchApp.fetch(ND_WEB_CATMAN_CSV_URL).getResponseCode();
  const tempFolder = rootFolder.createFolder("_teste_permissao_makers_investment");
  tempFolder.setTrashed(true);

  Logger.log("Pasta raiz: " + folderName);
  Logger.log("Template: " + templateName);
  Logger.log("Planilha: " + spreadsheetName);
  Logger.log("CSV Catman status: " + catmanCsvStatus);
  Logger.log("Permissao de criacao no Drive OK.");

  return {
    ok: true,
    folderName,
    templateName,
    spreadsheetName,
    catmanCsvStatus,
    driveWritePermission: true
  };
}

function ndWebCreateNds_(rows) {
  if (!Array.isArray(rows)) throw new Error("rows precisa ser uma lista.");

  const ss = SpreadsheetApp.openById(ND_WEB_MAKER_SPREADSHEET_ID);
  const sheet = ndWebGetSheetByGid_(ss, ND_WEB_ND_SHEET_GID)
    || ss.getSheetByName(ND_WEB_ND_SHEET_FALLBACK_NAME)
    || ss.insertSheet(ND_WEB_ND_SHEET_FALLBACK_NAME);

  const headerMap = ndWebEnsureHeaders_(sheet, ND_WEB_HEADERS);
  const values = sheet.getDataRange().getValues();
  const existingRows = values.slice(1);
  const existingKeys = ndWebCollectExistingKeys_(existingRows, headerMap);
  let nextNd = Math.max(ND_WEB_FIRST_ND_NUMBER, ndWebGetMaxNd_(existingRows, headerMap) + 1);
  const now = Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd HH:mm:ss");
  const rowsToAppend = [];
  const errors = [];
  let created = 0;
  let skipped = 0;

  rows.forEach((input, index) => {
    const rowInput = input || {};
    const valorNumber = ndWebParseNumber_(rowInput.valorValidado);
    const sourceKeys = Array.isArray(rowInput.sourceKeys)
      ? rowInput.sourceKeys.filter(ndWebIsSpecificRecordKey_)
      : [];
    const fallbackKeys = ndWebMakeRecordKeys_(rowInput);
    const allKeys = ndWebUnique_([].concat(sourceKeys, fallbackKeys));
    const alreadyExists = allKeys.some((key) => existingKeys.has(key));

    if (alreadyExists) {
      skipped += 1;
      return;
    }

    if (!String(rowInput.maker || "").trim()) {
      skipped += 1;
      errors.push({ index, error: "Maker vazio." });
      return;
    }

    if (!valorNumber) {
      skipped += 1;
      errors.push({ index, maker: rowInput.maker || "", error: "Valor Emissao ND vazio ou zero." });
      return;
    }

    const nNd = nextNd;
    nextNd += 1;

    const info = ndWebLookupMakerInfo_(ss, rowInput);
    const legacyRow = ndWebBuildLegacyPdfRow_(rowInput, nNd, info);
    let link = "";
    let rowStatus = "ERRO PDF";
    let pdfStatus = "NAO GERADO";
    let pdfError = "";

    try {
      link = ndWebCreateLegacyPdfForNd_(legacyRow, rowInput.ano);
      rowStatus = link ? "GERADO" : "SEM LINK";
      pdfStatus = link ? "GERADO" : "SEM LINK";
    } catch (error) {
      pdfError = String(error && error.message ? error.message : error);
      pdfStatus = "ERRO";
      console.error("PDF nao gerado para ND " + nNd + ": " + pdfError);
    }

    rowsToAppend.push(ndWebRowObjectToSheetRow_({
      N_ND: nNd,
      Nome: rowInput.maker || "",
      "VALOR EMISSAO ND": valorNumber,
      "VALOR POR EXTENSO": rowInput.valorFinalExtenso || "",
      "REFER\u00caNCIA": legacyRow[5],
      CNPJ: legacyRow[6],
      CNPJ_2: legacyRow[7],
      "RAZ\u00c3O SOCIAL": ndWebBuildRazaoSocialFormula_(rowInput.sourceType, rowsToAppend.length + sheet.getLastRow() + 1),
      ORIGEM: rowInput.sourceType || "maker",
      STATUS: rowStatus,
      LINK: link,
      CHAVE_ORIGEM: allKeys[0] || "",
      CRIADO_EM: now,
      PDF_STATUS: pdfStatus,
      PDF_ERRO: pdfError,
      SCRIPT_VERSION: ND_WEB_SCRIPT_VERSION,
      "ENDERE\u00c7O": legacyRow[9],
      "DATA DE VENCIMENTO": legacyRow[10],
      SAP: legacyRow[11],
      ANO: rowInput.ano || "",
      MES: rowInput.mes || "",
      "STATUS CATMAN": rowInput.statusCatman || "Validado"
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
    nextNd,
    errors,
    version: ND_WEB_SCRIPT_VERSION
  };
}

function ndWebBuildLegacyPdfRow_(input, nNd, info) {
  const year = input.ano || new Date().getFullYear();
  const reference = ndWebBuildReference_(input.mes, year, input.sourceType);
  const cnpj = input.cnpj || info.cnpj || "";
  const cnpj2 = ndWebCleanCnpj_(cnpj);
  const valorNumber = ndWebParseNumber_(input.valorValidado);
  const dueDate = ndWebCalculateDueDate_(new Date());

  return [
    "",
    nNd,
    input.maker || "",
    valorNumber,
    input.valorFinalExtenso || "",
    reference,
    cnpj,
    cnpj2,
    info.razao || input.maker || "",
    info.endereco || "",
    dueDate,
    input.sap || ""
  ];
}

function ndWebCreateLegacyPdfForNd_(linha, yearOverride) {
  if (!ND_WEB_ROOT_FOLDER_ID) throw new Error("ND_WEB_ROOT_FOLDER_ID vazio.");
  if (!ND_WEB_TEMPLATE_DOC_ID) throw new Error("ND_WEB_TEMPLATE_DOC_ID vazio.");

  const dataHoje = new Date();
  const year = yearOverride || dataHoje.getFullYear();
  const nNd = linha[1];
  const referencia = linha[5] || "";
  const cnpj = linha[6] || "";
  const razaoSocial = linha[8] || linha[2] || "Maker";
  const pastaRaiz = DriveApp.getFolderById(ND_WEB_ROOT_FOLDER_ID);
  const pastaDestino = ndWebGetTargetFolderForReference_(pastaRaiz, referencia);
  const nomeArq = "ND " + nNd + "." + year + "_" + ndWebSanitizeFilename_(razaoSocial) + "_" + ndWebSanitizeFilename_(cnpj);
  const arquivoExistente = pastaDestino.getFilesByName(nomeArq + ".pdf");

  if (arquivoExistente.hasNext()) {
    return arquivoExistente.next().getUrl();
  }

  const copia = DriveApp.getFileById(ND_WEB_TEMPLATE_DOC_ID).makeCopy(nomeArq, pastaDestino);
  const doc = DocumentApp.openById(copia.getId());
  const body = doc.getBody();
  const diasSemana = ["domingo", "segunda-feira", "ter\u00e7a-feira", "quarta-feira", "quinta-feira", "sexta-feira", "s\u00e1bado"];
  const dataExtenso = dataHoje.getDate() + " de " + ND_WEB_MESES_EXTENSO[dataHoje.getMonth()] + " de " + year;

  ndWebReplaceBodyText_(body, "{N_ND}", nNd);
  ndWebReplaceBodyText_(body, "{ANO}", year);
  ndWebReplaceBodyText_(body, "{nome_semana}", diasSemana[dataHoje.getDay()]);
  ndWebReplaceBodyText_(body, "{data_por_extenso}", dataExtenso);
  ndWebReplaceBodyText_(body, "{RAZ\u00c3O SOCIAL}", razaoSocial);
  ndWebReplaceBodyText_(body, "{CNPJ}", cnpj);
  ndWebReplaceBodyText_(body, "{ENDERE\u00c7O}", linha[9] || "");
  ndWebReplaceBodyText_(body, "{VALOR}", ndWebFormatCurrency_(linha[3]));
  ndWebReplaceBodyText_(body, "{VALOR POR EXTENSO}", linha[4] || "");
  ndWebReplaceBodyText_(body, "{DATA DE VENCIMENTO}", ndWebFormatDateOrToday_(linha[10], dataHoje));
  ndWebReplaceBodyText_(body, "{REFER\u00caNCIA}", referencia);
  ndWebReplaceBodyText_(body, "{SAP}", linha[11] || "");

  doc.saveAndClose();

  const pdfBlob = copia.getAs(MimeType.PDF).setName(nomeArq + ".pdf");
  const pdf = pastaDestino.createFile(pdfBlob);
  copia.setTrashed(true);
  return pdf.getUrl();
}

function ndWebLookupMakerInfo_(spreadsheet, input) {
  const fallback = {
    cnpj: input.cnpj || "",
    cnpj2: ndWebCleanCnpj_(input.cnpj || ""),
    razao: input.maker || "",
    endereco: ""
  };

  const catmanSheet = spreadsheet.getSheetByName(ND_WEB_CATMAN_SHEET_NAME);
  const catmanInfo = catmanSheet ? ndWebFindMakerInTable_(catmanSheet.getDataRange().getValues(), input, fallback) : null;
  if (catmanInfo) return catmanInfo;

  try {
    const csv = UrlFetchApp.fetch(ND_WEB_CATMAN_CSV_URL).getContentText();
    const csvRows = Utilities.parseCsv(csv);
    const csvInfo = ndWebFindMakerInTable_(csvRows, input, fallback);
    if (csvInfo) return csvInfo;
  } catch (error) {
    console.error("Nao foi possivel ler CSV Catman: " + String(error && error.message ? error.message : error));
  }

  const cnpjSheet = spreadsheet.getSheetByName("CNPJ");
  if (!cnpjSheet) return fallback;

  const makerKey = ndWebNormalizeHeader_(input.maker);
  const rows = cnpjSheet.getDataRange().getValues();
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (ndWebNormalizeHeader_(row[0]) === makerKey) {
      const cnpj = row[1] || fallback.cnpj;
      return {
        cnpj,
        cnpj2: ndWebCleanCnpj_(cnpj),
        razao: row[3] || fallback.razao,
        endereco: row[4] || fallback.endereco
      };
    }
  }
  return fallback;
}

function ndWebFindMakerInTable_(rows, input, fallback) {
  if (!rows || rows.length < 2) return null;

  const headers = rows[0].map(String);
  const makerCol = ndWebFindHeaderColumn_(headers, ["MAKER"]);
  const cnpjCol = ndWebFindHeaderColumn_(headers, ["CNPJ"]);
  const razaoCol = ndWebFindHeaderColumn_(headers, ["RAZAO SOCIAL", "RAZ\u00c3O SOCIAL"]);
  const enderecoCol = ndWebFindHeaderColumn_(headers, ["ENDERECO COMPLETO", "ENDERE\u00c7O COMPLETO", "ENDERECO", "ENDERE\u00c7O"]);
  const inputMaker = ndWebNormalizeHeader_(input.maker);

  if (makerCol < 0) return null;

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const sameMaker = inputMaker && makerCol >= 0 && ndWebNormalizeHeader_(row[makerCol]) === inputMaker;

    if (sameMaker) {
      const cnpj = cnpjCol >= 0 ? row[cnpjCol] || fallback.cnpj : fallback.cnpj;
      return {
        cnpj,
        cnpj2: ndWebCleanCnpj_(cnpj),
        razao: razaoCol >= 0 ? row[razaoCol] || fallback.razao : fallback.razao,
        endereco: enderecoCol >= 0 ? row[enderecoCol] || fallback.endereco : fallback.endereco
      };
    }
  }

  return null;
}

function ndWebFindHeaderColumn_(headers, candidates) {
  const normalizedCandidates = candidates.map(ndWebNormalizeHeader_);
  return headers.findIndex((header) => normalizedCandidates.includes(ndWebNormalizeHeader_(header)));
}

function ndWebGetTargetFolderForReference_(root, reference) {
  const normalizedReference = ndWebNormalizeHeader_(reference);
  let folderName = "Outros";

  for (let index = 0; index < ND_WEB_MESES_EXTENSO.length; index += 1) {
    if (normalizedReference.includes(ndWebNormalizeHeader_(ND_WEB_MESES_EXTENSO[index]))) {
      folderName = ND_WEB_MESES_NOMEADOS[index];
      break;
    }
  }

  const folders = root.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : root.createFolder(folderName);
}

function ndWebBuildReference_(month, year, sourceType) {
  const monthNumber = Number(String(month || "").replace(/[^\d]/g, ""));
  const monthName = monthNumber >= 1 && monthNumber <= 12 ? ND_WEB_MESES_EXTENSO[monthNumber - 1] : "";
  const monthText = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : month || "";
  return [ndWebNormalizeHeader_(sourceType) === "back" ? "Back Margin" : "Makers Investment", monthText, year].filter(Boolean).join(" ");
}

function ndWebBuildRazaoSocialFormula_(sourceType, rowNumber) {
  if (ndWebNormalizeHeader_(sourceType) === "back") {
    return '=if(B' + rowNumber + '="","", XLOOKUP(upper(B' + rowNumber + '),\'Contratos BM\'!B:B,\'Contratos BM\'!A:A))';
  }
  return '=if(B' + rowNumber + '="","", XLOOKUP(B' + rowNumber + ',Catman!D:D,Catman!H:H))';
}

function ndWebFormatDateOrToday_(value, fallbackDate) {
  if (value instanceof Date && !isNaN(value)) {
    return Utilities.formatDate(value, "GMT-3", "dd/MM/yyyy");
  }
  if (value !== "" && value != null) return String(value);
  return Utilities.formatDate(fallbackDate, "GMT-3", "dd/MM/yyyy");
}

function ndWebCalculateDueDate_(startDate) {
  const dueDate = new Date(startDate.getTime());
  dueDate.setDate(dueDate.getDate() + 30);

  const day = dueDate.getDay();
  if (day === 6) dueDate.setDate(dueDate.getDate() + 2);
  if (day === 0) dueDate.setDate(dueDate.getDate() + 1);

  return dueDate;
}

function ndWebCollectExistingKeys_(rows, headerMap) {
  const keys = new Set();

  rows.forEach((row) => {
    const sourceKey = ndWebValueByHeader_(row, headerMap, "CHAVE_ORIGEM");
    if (ndWebIsSpecificRecordKey_(sourceKey)) keys.add(String(sourceKey));

    ndWebMakeRecordKeys_({
      sourceType: ndWebValueByHeader_(row, headerMap, "ORIGEM"),
      maker: ndWebValueByHeader_(row, headerMap, "Nome") || ndWebValueByHeader_(row, headerMap, "MAKER"),
      ano: ndWebValueByHeader_(row, headerMap, "ANO"),
      mes: ndWebValueByHeader_(row, headerMap, "MES"),
      valorValidado: ndWebValueByHeader_(row, headerMap, "VALOR EMISSAO ND")
        || ndWebValueByHeader_(row, headerMap, "VALOR VALIDADO")
        || ndWebValueByHeader_(row, headerMap, "VALOR")
    }).forEach((key) => keys.add(key));
  });

  return keys;
}

function ndWebIsSpecificRecordKey_(key) {
  const value = String(key || "");
  return value.indexOf("id-year-month-value:") === 0 || value.indexOf("maker-year-month-value:") === 0 || value.indexOf("source-maker-year-month-value:") === 0;
}

function ndWebUnique_(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

function ndWebMakeRecordKeys_(input) {
  const keys = [];
  const maker = ndWebNormalizeHeader_(input.maker);
  const year = String(input.ano || "").trim();
  const month = String(input.mes || "").trim();
  const value = ndWebParseNumber_(input.valorValidado).toFixed(2);

  if (maker && year && month && value !== "0.00") {
    keys.push("source-maker-year-month-value:" + ndWebNormalizeHeader_(input.sourceType || "maker") + "|" + maker + "|" + year + "|" + month + "|" + value);
    keys.push("maker-year-month-value:" + maker + "|" + year + "|" + month + "|" + value);
  }

  return keys;
}

function ndWebGetMaxNd_(rows, headerMap) {
  const ndCol = headerMap[ndWebNormalizeHeader_("N_ND")];
  if (!ndCol) return 0;

  return rows.reduce((max, row) => {
    const number = Number(String(row[ndCol - 1] || "").replace(/[^\d]/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
}

function ndWebEnsureHeaders_(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]).setFontWeight("bold");
  }

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const normalized = headers.map(ndWebNormalizeHeader_);
  const missing = requiredHeaders.filter((header) => !normalized.includes(ndWebNormalizeHeader_(header)));

  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight("bold");
    headers = headers.concat(missing);
  }

  return headers.reduce((map, header, index) => {
    map[ndWebNormalizeHeader_(header)] = index + 1;
    return map;
  }, {});
}

function ndWebRowObjectToSheetRow_(object, headerMap) {
  const outputLength = Math.max.apply(null, Object.keys(headerMap).map((key) => headerMap[key]));
  const output = Array(outputLength).fill("");

  Object.keys(object).forEach((header) => {
    const col = headerMap[ndWebNormalizeHeader_(header)];
    if (col) output[col - 1] = object[header];
  });

  return output;
}

function ndWebValueByHeader_(row, headerMap, header) {
  const col = headerMap[ndWebNormalizeHeader_(header)];
  return col ? row[col - 1] : "";
}

function ndWebGetSheetByGid_(spreadsheet, gid) {
  const target = Number(gid);
  return spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === target) || null;
}

function ndWebReplaceBodyText_(body, token, value) {
  body.replaceText(ndWebEscapeRegExp_(token), String(value == null ? "" : value));
}

function ndWebAssertSecret_(secret) {
  let propertySecret = "";
  try {
    propertySecret = PropertiesService.getScriptProperties().getProperty("SECRET") || "";
  } catch (error) {
    propertySecret = "";
  }

  const makerSecret = typeof MAKER_WRITE_CONFIG !== "undefined" && MAKER_WRITE_CONFIG.SECRET
    ? MAKER_WRITE_CONFIG.SECRET
    : "";
  const configured = propertySecret || ND_WEB_WRITE_SECRET || makerSecret;

  if (!configured) throw new Error("Configure a propriedade SECRET no Apps Script.");
  if (String(secret || "") !== String(configured)) throw new Error("Token invalido.");
}

function ndWebParseNumber_(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  if (commaIndex > dotIndex) return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(cleaned.replace(/,/g, "")) || 0;
}

function ndWebCleanCnpj_(value) {
  return String(value || "").replace(/\D/g, "");
}

function ndWebFormatCurrency_(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(ndWebParseNumber_(value));
}

function ndWebSanitizeFilename_(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|#%{}~&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function ndWebNormalizeHeader_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function ndWebEscapeRegExp_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ndWebJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
