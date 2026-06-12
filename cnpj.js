const CNPJ_CONFIG = {
  makerSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1726147303&single=true&output=csv",
  catmanSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1975482772&single=true&output=csv",
  filtersSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1292236262&single=true&output=csv",
  writeEndpoint: "https://script.google.com/macros/s/AKfycbxCDV1PwvgyaH4HnG6d3GkXNgWodZbLKEh8V8DatdGeChirm4L9AguH5ze4XqbtlrWBWg/exec",
  writeSecret: "1234"
};

const CNPJ_LEGACY_WRITE_ENDPOINT = "https://script.google.com/macros/s/AKfycbw-tLruP64EXOMQ0_OgAXy1mn4MRwNIOy3CZTdUvVwmrJQodW5kX0C-9XkMFKC2nG5KRw/exec";

const CNPJ_STORAGE_KEYS = {
  writeEndpoint: "sheets-dashboard.writeEndpoint",
  writeSecret: "sheets-dashboard.writeSecret"
};

const cnpjState = {
  writeEndpoint: "",
  writeSecret: "",
  records: [],
  filteredRecords: [],
  catmanOptions: [],
  filters: {
    search: "",
    quick: "missing"
  }
};

const cnpjEls = {
  connectionStatus: document.querySelector("#cnpjConnectionStatus"),
  refreshButton: document.querySelector("#cnpjRefreshButton"),
  writeEndpointInput: document.querySelector("#cnpjWriteEndpointInput"),
  writeSecretInput: document.querySelector("#cnpjWriteSecretInput"),
  saveConfigButton: document.querySelector("#cnpjSaveConfigButton"),
  searchInput: document.querySelector("#cnpjSearchInput"),
  clearFiltersButton: document.querySelector("#cnpjClearFiltersButton"),
  quickTabs: document.querySelectorAll("[data-cnpj-filter]"),
  metricTotal: document.querySelector("#cnpjMetricTotal"),
  metricMissing: document.querySelector("#cnpjMetricMissing"),
  metricFilled: document.querySelector("#cnpjMetricFilled"),
  metricCatman: document.querySelector("#cnpjMetricCatman"),
  tableBody: document.querySelector("#cnpjTableBody"),
  emptyState: document.querySelector("#cnpjEmptyState"),
  rowCount: document.querySelector("#cnpjRowCount"),
  writeStatus: document.querySelector("#cnpjWriteStatus")
};

document.addEventListener("DOMContentLoaded", initCnpjPage);

function initCnpjPage() {
  cnpjState.writeEndpoint = localStorage.getItem(CNPJ_STORAGE_KEYS.writeEndpoint) || CNPJ_CONFIG.writeEndpoint;
  cnpjState.writeSecret = localStorage.getItem(CNPJ_STORAGE_KEYS.writeSecret) || CNPJ_CONFIG.writeSecret;
  if (cnpjState.writeEndpoint === CNPJ_LEGACY_WRITE_ENDPOINT) {
    cnpjState.writeEndpoint = CNPJ_CONFIG.writeEndpoint;
    localStorage.setItem(CNPJ_STORAGE_KEYS.writeEndpoint, cnpjState.writeEndpoint);
  }
  cnpjEls.writeEndpointInput.value = cnpjState.writeEndpoint;
  cnpjEls.writeSecretInput.value = cnpjState.writeSecret;

  bindCnpjEvents();
  updateCnpjWriteStatus();
  void loadCnpjData();
}

function bindCnpjEvents() {
  cnpjEls.refreshButton.addEventListener("click", loadCnpjData);

  cnpjEls.saveConfigButton.addEventListener("click", () => {
    cnpjState.writeEndpoint = cnpjEls.writeEndpointInput.value.trim();
    cnpjState.writeSecret = cnpjEls.writeSecretInput.value.trim();
    localStorage.setItem(CNPJ_STORAGE_KEYS.writeEndpoint, cnpjState.writeEndpoint);
    localStorage.setItem(CNPJ_STORAGE_KEYS.writeSecret, cnpjState.writeSecret);
    updateCnpjWriteStatus("Configuração salva", "ok");
  });

  cnpjEls.searchInput.addEventListener("input", () => {
    cnpjState.filters.search = cnpjEls.searchInput.value.trim().toLowerCase();
    applyCnpjFiltersAndRender();
  });

  cnpjEls.clearFiltersButton.addEventListener("click", () => {
    cnpjState.filters = { search: "", quick: "" };
    cnpjEls.searchInput.value = "";
    cnpjEls.quickTabs.forEach((tab) => tab.classList.toggle("is-active", !tab.dataset.cnpjFilter));
    applyCnpjFiltersAndRender();
  });

  cnpjEls.quickTabs.forEach((button) => {
    button.addEventListener("click", () => {
      cnpjState.filters.quick = button.dataset.cnpjFilter || "";
      cnpjEls.quickTabs.forEach((tab) => tab.classList.toggle("is-active", tab === button));
      applyCnpjFiltersAndRender();
    });
  });
}

async function loadCnpjData() {
  setCnpjConnectionStatus("Carregando bases Maker e Catman...");

  try {
    const [makerPayload, catmanPayload, filtersMatrix] = await Promise.all([
      loadCsvObjects(CNPJ_CONFIG.makerSource),
      loadCsvObjects(CNPJ_CONFIG.catmanSource),
      loadCsvMatrix(CNPJ_CONFIG.filtersSource).catch((error) => {
        console.warn("Nao foi possivel carregar a aba filters para Catman.", error);
        return [];
      })
    ]);

    cnpjState.catmanOptions = extractCatmanOptions(filtersMatrix);
    cnpjState.records = buildCnpjRecords(makerPayload.rows, catmanPayload.rows);
    applyCnpjFiltersAndRender();
    setCnpjConnectionStatus(`Conectado ao Google Sheets, ${cnpjState.records.length} makers`);
  } catch (error) {
    console.error(error);
    cnpjState.records = [];
    applyCnpjFiltersAndRender();
    setCnpjConnectionStatus(`Falha ao carregar bases (${error.message || "erro desconhecido"})`);
  }
}

function buildCnpjRecords(makerRows, catmanRows) {
  const catmanByMaker = new Map();

  catmanRows.forEach((row) => {
    const maker = getRowValue(row, ["maker"]);
    if (maker) catmanByMaker.set(normalizeHeader(maker), row);
  });

  const seen = new Set();
  const records = [];

  makerRows.forEach((row) => {
    const maker = getRowValue(row, ["maker"]);
    const key = normalizeHeader(maker);
    if (!maker || seen.has(key)) return;
    seen.add(key);

    const catmanRow = catmanByMaker.get(key) || {};
    const cnpj = getFirstFilledValue(catmanRow, ["cnpj"]) || getRowValue(row, ["cnpj"]);

    records.push({
      maker,
      idAlianca: getFirstFilledValue(catmanRow, ["id_alianca", "id alianca", "id alianza"]) || getRowValue(row, ["id_alianca", "id alianca", "id alianza"]),
      catman: getFirstFilledValue(catmanRow, ["catman"]) || getFirstFilledValue(row, ["catman"]),
      cnpj,
      emailFornecedor: getFirstFilledValue(catmanRow, ["email fornecedor", "email"]),
      razaoSocial: getFirstFilledValue(catmanRow, ["razao social", "razão social"]),
      enderecoCompleto: getFirstFilledValue(catmanRow, ["endereco completo", "endereço completo", "endereco", "endereço"])
    });
  });

  return records.sort((a, b) => a.maker.localeCompare(b.maker, "pt-BR", { sensitivity: "base" }));
}

function applyCnpjFiltersAndRender() {
  let rows = cnpjState.records;

  if (cnpjState.filters.search) {
    rows = rows.filter((record) => Object.values(record).join(" ").toLowerCase().includes(cnpjState.filters.search));
  }

  if (cnpjState.filters.quick === "missing") {
    rows = rows.filter((record) => !String(record.cnpj || "").trim());
  }

  cnpjState.filteredRecords = rows;
  renderCnpjMetrics();
  renderCnpjTable();
}

function renderCnpjMetrics() {
  const total = cnpjState.records.length;
  const missing = cnpjState.records.filter((record) => !String(record.cnpj || "").trim()).length;
  const catmanFilled = cnpjState.records.filter((record) => String(record.catman || "").trim()).length;

  cnpjEls.metricTotal.textContent = String(total);
  cnpjEls.metricMissing.textContent = String(missing);
  cnpjEls.metricFilled.textContent = String(total - missing);
  cnpjEls.metricCatman.textContent = String(catmanFilled);
}

function renderCnpjTable() {
  const fragment = document.createDocumentFragment();
  cnpjEls.tableBody.innerHTML = "";

  cnpjState.filteredRecords.forEach((record) => {
    const tr = document.createElement("tr");
    tr.dataset.maker = record.maker;

    appendReadonlyCnpjCell(tr, toTitleCase(record.maker));
    appendCatmanCnpjCell(tr, record.catman);
    appendInputCnpjCell(tr, "cnpj", record.cnpj, "00.000.000/0000-00");
    appendInputCnpjCell(tr, "emailFornecedor", record.emailFornecedor, "email@fornecedor.com");
    appendInputCnpjCell(tr, "razaoSocial", record.razaoSocial, "Razão social");
    appendInputCnpjCell(tr, "enderecoCompleto", record.enderecoCompleto, "Endereço completo");

    fragment.append(tr);
  });

  cnpjEls.tableBody.append(fragment);
  cnpjEls.emptyState.hidden = cnpjState.filteredRecords.length > 0;
  cnpjEls.rowCount.textContent = `${cnpjState.filteredRecords.length} linhas`;
}

function appendReadonlyCnpjCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.append(cell);
}

function appendInputCnpjCell(row, field, value, placeholder) {
  const cell = document.createElement("td");
  const input = document.createElement("input");
  input.className = "note-input cnpj-input";
  input.dataset.field = field;
  input.value = value || "";
  input.placeholder = placeholder;
  input.addEventListener("change", () => saveCnpjRecord(getCnpjRecordFromRow(row), row));
  cell.append(input);
  row.append(cell);
}

function appendCatmanCnpjCell(row, value) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.className = "status-select person-select";
  select.dataset.field = "catman";
  select.append(new Option("-", ""));

  const options = uniqueSorted([...cnpjState.catmanOptions, value].filter(isSelectableOption));
  options.forEach((optionValue) => {
    select.append(new Option(toTitleCase(optionValue), optionValue));
  });

  select.value = value || "";
  select.addEventListener("change", () => saveCnpjRecord(getCnpjRecordFromRow(row), row));
  cell.append(select);
  row.append(cell);
}

function getCnpjRecordFromRow(rowElement) {
  const maker = rowElement.dataset.maker || "";
  return cnpjState.records.find((record) => record.maker === maker) || { maker };
}

async function saveCnpjRecord(record, rowElement) {
  if (!cnpjState.writeEndpoint || !cnpjState.writeSecret) {
    updateCnpjWriteStatus("Configure Apps Script URL e token", "error");
    return;
  }

  const values = {};
  rowElement.querySelectorAll("[data-field]").forEach((input) => {
    values[input.dataset.field] = input.value.trim();
  });

  const payload = {
    action: "upsert_catman",
    secret: cnpjState.writeSecret,
    record: {
      maker: record.maker,
      idAlianca: record.idAlianca,
      catman: values.catman,
      cnpj: values.cnpj,
      emailFornecedor: values.emailFornecedor,
      razaoSocial: values.razaoSocial,
      enderecoCompleto: values.enderecoCompleto
    }
  };

  updateCnpjWriteStatus(`Salvando ${record.maker}...`, "saving");

  try {
    await fetch(cnpjState.writeEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    Object.assign(record, payload.record);
    updateCnpjWriteStatus("Enviado ao Sheets, atualize para confirmar", "ok");
    applyCnpjFiltersAndRender();
  } catch (error) {
    console.error(error);
    updateCnpjWriteStatus("Falha ao enviar para o Sheets", "error");
  }
}

async function loadCsvObjects(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return matrixToObjects(parseCsv(await response.text()));
}

async function loadCsvMatrix(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseCsv(await response.text());
}

function extractCatmanOptions(matrix) {
  if (!matrix.length) return [];

  const payload = matrixToObjects(matrix);
  const catmanColumn = findPayloadColumn(payload.columns, ["catman"]);
  if (catmanColumn) {
    return uniqueSorted(payload.rows.map((row) => row[catmanColumn]).filter(isSelectableOption));
  }

  return uniqueSorted(matrix.map((row) => row[0]).filter(isCatmanOption));
}

function findPayloadColumn(columns, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return columns.find((column) => normalizedCandidates.includes(normalizeHeader(column))) || "";
}

function matrixToObjects(matrix) {
  const headerIndex = detectHeaderRow(matrix);
  const rawColumns = matrix[headerIndex] || [];
  const dataLines = matrix.slice(headerIndex + 1).filter((line) => line.some((value) => String(value || "").trim()));
  const keptColumns = rawColumns
    .map((header, index) => ({ header: String(header || "").trim(), index }))
    .filter((column) => column.header || dataLines.some((line) => String(line[column.index] || "").trim()));
  const columns = keptColumns.map((column) => column.header || `Coluna ${column.index + 1}`);

  return {
    columns,
    rows: dataLines.map((line) => {
      const row = {};
      keptColumns.forEach((column, index) => {
        row[columns[index]] = line[column.index] ?? "";
      });
      return row;
    })
  };
}

function detectHeaderRow(matrix) {
  const preferredHeaders = ["maker", "cnpj", "catman"];
  const directMatchIndex = matrix.findIndex((line) => {
    const normalizedLine = line.map(normalizeHeader);
    return preferredHeaders.filter((header) => normalizedLine.includes(header)).length >= 2;
  });
  if (directMatchIndex >= 0) return directMatchIndex;

  return matrix
    .slice(0, 10)
    .map((line, index) => ({ index, filled: line.filter((value) => String(value || "").trim()).length }))
    .sort((a, b) => b.filled - a.filled)[0]?.index || 0;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"' && quoted && nextChar === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function getRowValue(row, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  const key = Object.keys(row).find((column) => normalizedCandidates.includes(normalizeHeader(column)));
  return key ? row[key] : "";
}

function getFirstFilledValue(row, candidates) {
  for (const candidate of candidates) {
    const value = getRowValue(row, [candidate]);
    if (String(value || "").trim()) return value;
  }
  return "";
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toTitleCase(value) {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s(-])([a-zà-ú])/gi, (match, separator, letter) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`)
    .replace(/\b(ltda|sa|s\/a|me|epp|eireli)\b/gi, (match) => match.toLocaleUpperCase("pt-BR"));
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
  );
}

function isSelectableOption(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  return !["#n/a", "#ref!", "#value!", "#error!", "#div/0!", "#name?", "#num!", "#null!"].includes(text.toLowerCase());
}

function isCatmanOption(value) {
  const text = String(value || "").trim();
  if (!isSelectableOption(text)) return false;

  const normalized = normalizeHeader(text);
  return !["catman", "status catman", "status fpa", "forma pagamento"].includes(normalized);
}

function updateCnpjWriteStatus(message = "", status = "") {
  if (!message) {
    if (cnpjState.writeEndpoint && cnpjState.writeSecret) {
      message = "Escrita no Sheets configurada";
      status = "ok";
    } else if (cnpjState.writeEndpoint) {
      message = "Informe o token para salvar no Sheets";
      status = "error";
    } else {
      message = "Escrita não configurada";
      status = "error";
    }
  }

  cnpjEls.writeStatus.textContent = message;
  cnpjEls.writeStatus.classList.toggle("is-saving", status === "saving");
  cnpjEls.writeStatus.classList.toggle("is-ok", status === "ok");
  cnpjEls.writeStatus.classList.toggle("is-error", status === "error");
}

function setCnpjConnectionStatus(message) {
  cnpjEls.connectionStatus.textContent = message;
}
