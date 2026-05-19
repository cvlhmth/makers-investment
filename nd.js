const ND_CONFIG = {
  makerSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=0&single=true&output=csv",
  ndHistorySource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1349527717&single=true&output=csv",
  writeEndpoint: "https://script.google.com/macros/s/AKfycbxCDV1PwvgyaH4HnG6d3GkXNgWodZbLKEh8V8DatdGeChirm4L9AguH5ze4XqbtlrWBWg/exec",
  legacyWriteEndpoint: "https://script.google.com/macros/s/AKfycbw-tLruP64EXOMQ0_OgAXy1mn4MRwNIOy3CZTdUvVwmrJQodW5kX0C-9XkMFKC2nG5KRw/exec",
  firstNd: 358
};

const ND_STORAGE_KEYS = {
  writeEndpoint: "sheets-dashboard.writeEndpoint",
  writeSecret: "sheets-dashboard.writeSecret"
};

const ND_STATUS = {
  ready: "ready",
  created: "created",
  blocked: "blocked"
};

const ndState = {
  writeEndpoint: "",
  writeSecret: "",
  sourceRows: [],
  historyRows: [],
  records: [],
  filteredRecords: [],
  historyKeys: new Set(),
  nextNd: ND_CONFIG.firstNd,
  filters: {
    search: "",
    year: "",
    status: "",
    quick: ""
  }
};

const ndEls = {
  connectionStatus: document.querySelector("#ndConnectionStatus"),
  refreshButton: document.querySelector("#ndRefreshButton"),
  exportButton: document.querySelector("#ndExportButton"),
  createButton: document.querySelector("#ndCreateButton"),
  writeEndpointInput: document.querySelector("#ndWriteEndpointInput"),
  writeSecretInput: document.querySelector("#ndWriteSecretInput"),
  saveConfigButton: document.querySelector("#ndSaveConfigButton"),
  searchInput: document.querySelector("#ndSearchInput"),
  yearFilter: document.querySelector("#ndYearFilter"),
  statusFilter: document.querySelector("#ndStatusFilter"),
  clearFiltersButton: document.querySelector("#ndClearFiltersButton"),
  quickTabs: document.querySelectorAll("[data-nd-filter]"),
  metricReady: document.querySelector("#ndMetricReady"),
  metricCreated: document.querySelector("#ndMetricCreated"),
  metricBlocked: document.querySelector("#ndMetricBlocked"),
  metricNext: document.querySelector("#ndMetricNext"),
  tableBody: document.querySelector("#ndTableBody"),
  emptyState: document.querySelector("#ndEmptyState"),
  rowCount: document.querySelector("#ndRowCount"),
  writeStatus: document.querySelector("#ndWriteStatus"),
  historyStatus: document.querySelector("#ndHistoryStatus")
};

document.addEventListener("DOMContentLoaded", initNdPage);

function initNdPage() {
  const savedEndpoint = localStorage.getItem(ND_STORAGE_KEYS.writeEndpoint) || "";
  ndState.writeEndpoint = !savedEndpoint || savedEndpoint === ND_CONFIG.legacyWriteEndpoint ? ND_CONFIG.writeEndpoint : savedEndpoint;
  ndState.writeSecret = localStorage.getItem(ND_STORAGE_KEYS.writeSecret) || "";
  localStorage.setItem(ND_STORAGE_KEYS.writeEndpoint, ndState.writeEndpoint);

  ndEls.writeEndpointInput.value = ndState.writeEndpoint;
  ndEls.writeSecretInput.value = ndState.writeSecret;

  bindNdEvents();
  updateNdWriteStatus();
  void loadNdData();
}

function bindNdEvents() {
  ndEls.refreshButton.addEventListener("click", loadNdData);
  ndEls.exportButton.addEventListener("click", exportReadyNdCsv);
  ndEls.createButton.addEventListener("click", createNds);

  ndEls.saveConfigButton.addEventListener("click", () => {
    ndState.writeEndpoint = ndEls.writeEndpointInput.value.trim();
    ndState.writeSecret = ndEls.writeSecretInput.value.trim();
    localStorage.setItem(ND_STORAGE_KEYS.writeEndpoint, ndState.writeEndpoint);
    localStorage.setItem(ND_STORAGE_KEYS.writeSecret, ndState.writeSecret);
    updateNdWriteStatus("Configuracao salva", "ok");
  });

  ndEls.searchInput.addEventListener("input", () => {
    ndState.filters.search = ndEls.searchInput.value.trim().toLowerCase();
    applyNdFiltersAndRender();
  });

  ndEls.yearFilter.addEventListener("change", () => {
    ndState.filters.year = ndEls.yearFilter.value;
    applyNdFiltersAndRender();
  });

  ndEls.statusFilter.addEventListener("change", () => {
    ndState.filters.status = ndEls.statusFilter.value;
    applyNdFiltersAndRender();
  });

  ndEls.clearFiltersButton.addEventListener("click", () => {
    ndState.filters = { search: "", year: "", status: "", quick: "" };
    ndEls.searchInput.value = "";
    ndEls.yearFilter.value = "";
    ndEls.statusFilter.value = "";
    ndEls.quickTabs.forEach((tab) => tab.classList.toggle("is-active", !tab.dataset.ndFilter));
    applyNdFiltersAndRender();
  });

  ndEls.quickTabs.forEach((button) => {
    button.addEventListener("click", () => {
      ndState.filters.quick = button.dataset.ndFilter || "";
      ndEls.quickTabs.forEach((tab) => tab.classList.toggle("is-active", tab === button));
      applyNdFiltersAndRender();
    });
  });
}

async function loadNdData() {
  setNdConnectionStatus("Carregando base Maker e historico de NDs...");
  setNdHistoryStatus("Carregando historico...", "saving");

  try {
    const [makerPayload, historyPayload] = await Promise.all([
      loadCsvObjects(ND_CONFIG.makerSource),
      loadCsvObjects(ND_CONFIG.ndHistorySource).catch((error) => {
        console.warn("Nao foi possivel carregar o historico de NDs.", error);
        return { columns: [], rows: [] };
      })
    ]);

    ndState.sourceRows = makerPayload.rows;
    ndState.historyRows = historyPayload.rows;
    ndState.historyKeys = buildHistoryKeys(historyPayload.rows);
    ndState.nextNd = Math.max(ND_CONFIG.firstNd, getMaxNdNumber(historyPayload.rows) + 1);
    ndState.records = buildNdRecords(makerPayload.rows);

    syncNdFilters();
    applyNdFiltersAndRender();
    setNdConnectionStatus(`Conectado ao Google Sheets, ${makerPayload.rows.length} registros Maker`);
    setNdHistoryStatus(`${historyPayload.rows.length} registros no historico`, "ok");
  } catch (error) {
    console.error(error);
    setNdConnectionStatus("Falha ao carregar a base Maker");
    setNdHistoryStatus("Historico nao carregado", "error");
    ndState.records = [];
    applyNdFiltersAndRender();
  }
}

function buildNdRecords(rows) {
  const records = rows.map((row, index) => {
    const maker = getRowValue(row, ["maker"]);
    const idAlianca = getRowValue(row, ["id_alianca", "id alianca", "id alianza"]);
    const year = getRowValue(row, ["ano", "year"]);
    const month = getRowValue(row, ["mes", "mês", "month"]);
    const cnpj = getRowValue(row, ["cnpj"]);
    const statusCatman = getRowValue(row, ["status catman"]);
    const valorValidado = getFirstFilledValue(row, [
      "valor emissao nd",
      "valor emissão nd",
      "valor validado",
      "valor final",
      "valor final validado",
      "valor execucao",
      "valor execução",
      "execucao",
      "execução",
      "valor query"
    ]);
    const valorFinalExtenso = getFirstFilledValue(row, [
      "valor final extenso",
      "valor por extenso",
      "valor extenso"
    ]);
    const valueNumber = parseFlexibleNumber(valorValidado);
    const sourceKeys = makeRecordKeys({ maker, year, month, valorValidado });
    const alreadyCreated = sourceKeys.some((key) => ndState.historyKeys.has(key));
    const eligible = isApprovedCatman(statusCatman);
    const missing = [];

    if (!eligible) missing.push("Status Catman pendente");
    if (!maker) missing.push("Maker vazio");
    if (!year) missing.push("Ano vazio");
    if (!valueNumber) missing.push("Valor emissao ND vazio");
    if (!valorFinalExtenso) missing.push("Valor por extenso vazio");

    let status = ND_STATUS.blocked;
    if (alreadyCreated) {
      status = ND_STATUS.created;
    } else if (!missing.length) {
      status = ND_STATUS.ready;
    }

    return {
      index,
      idAlianca,
      maker,
      year,
      month,
      cnpj,
      statusCatman,
      valorValidado,
      valorFinalExtenso,
      valueNumber,
      sourceKeys,
      status,
      reason: status === ND_STATUS.created ? "Ja existe no historico" : missing.join(", ")
    };
  });

  let nextNd = ndState.nextNd;
  records.forEach((record) => {
    if (record.status === ND_STATUS.ready) {
      record.nNd = nextNd;
      nextNd += 1;
    } else {
      record.nNd = "";
    }
  });

  return records;
}

function applyNdFiltersAndRender() {
  let rows = ndState.records;

  if (ndState.filters.search) {
    rows = rows.filter((record) => {
      const haystack = [
        record.nNd,
        record.maker,
        record.cnpj,
        record.year,
        record.month,
        record.statusCatman,
        record.valorValidado,
        record.valorFinalExtenso,
        record.reason
      ].join(" ").toLowerCase();
      return haystack.includes(ndState.filters.search);
    });
  }

  if (ndState.filters.year) {
    rows = rows.filter((record) => String(record.year) === ndState.filters.year);
  }

  if (ndState.filters.status) {
    rows = rows.filter((record) => record.status === ndState.filters.status);
  }

  if (ndState.filters.quick) {
    rows = rows.filter((record) => record.status === ndState.filters.quick);
  }

  ndState.filteredRecords = rows;
  renderNdMetrics();
  renderNdTable();
}

function syncNdFilters() {
  const years = uniqueSorted(ndState.records.map((record) => record.year).filter(Boolean));
  fillSelect(ndEls.yearFilter, "Todos", years);
  fillSelect(ndEls.statusFilter, "Todos", [
    { label: "Prontas", value: ND_STATUS.ready },
    { label: "Ja criadas", value: ND_STATUS.created },
    { label: "Pendentes", value: ND_STATUS.blocked }
  ]);
}

function fillSelect(select, firstLabel, values) {
  const currentValue = select.value;
  select.innerHTML = "";
  select.append(new Option(firstLabel, ""));

  values.forEach((item) => {
    if (typeof item === "string") {
      select.append(new Option(item, item));
      return;
    }
    select.append(new Option(item.label, item.value));
  });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function renderNdMetrics() {
  const ready = ndState.records.filter((record) => record.status === ND_STATUS.ready).length;
  const created = ndState.records.filter((record) => record.status === ND_STATUS.created).length;
  const blocked = ndState.records.filter((record) => record.status === ND_STATUS.blocked).length;

  ndEls.metricReady.textContent = String(ready);
  ndEls.metricCreated.textContent = String(created);
  ndEls.metricBlocked.textContent = String(blocked);
  ndEls.metricNext.textContent = String(ndState.nextNd);
  ndEls.createButton.title = ready === 0
    ? "Nenhuma ND pronta. Confira Status Catman, Valor Emissao ND e Valor por extenso."
    : `Criar ${ready} NDs prontas`;
}

function renderNdTable() {
  const fragment = document.createDocumentFragment();
  ndEls.tableBody.innerHTML = "";

  ndState.filteredRecords.forEach((record) => {
    const tr = document.createElement("tr");
    tr.className = `nd-row nd-row-${record.status}`;

    appendNdCell(tr, record.nNd || "-");
    appendNdCell(tr, toTitleCase(record.maker));
    appendNdCell(tr, record.year || "-");
    appendNdCell(tr, record.month || "-");
    appendNdCell(tr, formatCurrency(record.valueNumber));
    appendNdCell(tr, record.valorFinalExtenso || "-");
    appendNdCell(tr, displayCatmanStatus(record.statusCatman));

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `nd-status-badge is-${record.status}`;
    badge.textContent = getNdStatusLabel(record);
    statusCell.append(badge);
    if (record.reason) {
      const reason = document.createElement("span");
      reason.className = "nd-status-reason";
      reason.textContent = record.reason;
      statusCell.append(reason);
    }
    tr.append(statusCell);

    fragment.append(tr);
  });

  ndEls.tableBody.append(fragment);
  ndEls.emptyState.hidden = ndState.filteredRecords.length > 0;
  ndEls.rowCount.textContent = `${ndState.filteredRecords.length} linhas`;
}

function appendNdCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.append(cell);
}

async function createNds() {
  const readyRecords = ndState.records.filter((record) => record.status === ND_STATUS.ready);

  if (!readyRecords.length) {
    updateNdWriteStatus("Nenhuma ND pronta: precisa Status Catman Validado, Valor Emissao ND e Valor por extenso", "error");
    return;
  }

  if (!ndState.writeEndpoint || !ndState.writeSecret) {
    updateNdWriteStatus("Configure Apps Script URL e token para criar NDs", "error");
    return;
  }

  const rows = readyRecords.map((record) => ({
    nNd: record.nNd,
    maker: record.maker,
    ano: record.year,
    mes: record.month,
    cnpj: record.cnpj,
    valorValidado: record.valorValidado,
    valorFinalExtenso: record.valorFinalExtenso,
    statusCatman: displayCatmanStatus(record.statusCatman),
    sourceKeys: record.sourceKeys
  }));

  updateNdWriteStatus(`Enviando ${rows.length} NDs ao Apps Script...`, "saving");

  try {
    await fetch(ndState.writeEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "create_nds",
        secret: ndState.writeSecret,
        rows
      })
    });

    updateNdWriteStatus("Enviado ao Apps Script, atualize para confirmar no Sheets", "ok");
  } catch (error) {
    console.error(error);
    updateNdWriteStatus("Falha ao enviar NDs ao Apps Script", "error");
  }
}

function exportReadyNdCsv() {
  const rows = [["N_ND", "MAKER", "ANO", "MES", "VALOR EMISSAO ND", "VALOR FINAL EXTENSO", "STATUS CATMAN", "CNPJ"]];

  ndState.records
    .filter((record) => record.status === ND_STATUS.ready)
    .forEach((record) => {
      rows.push([
        record.nNd,
        record.maker,
        record.year,
        record.month,
        record.valorValidado,
        record.valorFinalExtenso,
        displayCatmanStatus(record.statusCatman),
        record.cnpj
      ]);
    });

  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nds-prontas.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadCsvObjects(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return csvToObjects(await response.text());
}

function csvToObjects(csvText) {
  return matrixToObjects(parseCsv(csvText));
}

function matrixToObjects(matrix) {
  const headerIndex = detectHeaderRow(matrix);
  const rawColumns = matrix[headerIndex] || [];
  const dataLines = matrix.slice(headerIndex + 1).filter((line) => line.some((value) => String(value || "").trim()));
  const keptColumns = rawColumns
    .map((header, index) => ({ header: String(header || "").trim(), index }))
    .filter((column) => column.header || dataLines.some((line) => String(line[column.index] || "").trim()));
  const columns = keptColumns.map((column) => column.header || `Coluna ${column.index + 1}`);

  const rows = dataLines.map((line) => {
    const row = {};
    keptColumns.forEach((column, index) => {
      row[columns[index]] = line[column.index] ?? "";
    });
    return row;
  });

  return { columns, rows };
}

function detectHeaderRow(matrix) {
  const preferredHeaders = ["maker", "cnpj", "status catman", "valor final", "n_nd", "n nd"];
  const directMatchIndex = matrix.findIndex((line) => {
    const normalizedLine = line.map(normalizeHeader);
    return preferredHeaders.filter((header) => normalizedLine.includes(header)).length >= 2;
  });

  if (directMatchIndex >= 0) {
    return directMatchIndex;
  }

  return matrix
    .slice(0, 10)
    .map((line, index) => ({
      index,
      filled: line.filter((value) => String(value || "").trim()).length
    }))
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
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
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

function buildHistoryKeys(rows) {
  const keys = new Set();

  rows.forEach((row) => {
    makeRecordKeys({
      maker: getRowValue(row, ["maker"]),
      year: getFirstFilledValue(row, ["ano", "year"]),
      month: getFirstFilledValue(row, ["mes", "mês", "month"]),
      valorValidado: getFirstFilledValue(row, ["valor emissao nd", "valor emissão nd", "valor validado", "valor", "valor final", "valor query"])
    }).forEach((key) => keys.add(key));

    const sourceKey = getRowValue(row, ["chave origem", "source key", "source_key"]);
    if (isSpecificRecordKey(sourceKey)) {
      keys.add(sourceKey);
    }
  });

  return keys;
}

function makeRecordKeys({ maker, year, month, valorValidado }) {
  const keys = [];
  const normalizedMaker = normalizeHeader(maker);
  const normalizedYear = String(year || "").trim();
  const normalizedMonth = String(month || "").trim();
  const normalizedValue = parseFlexibleNumber(valorValidado).toFixed(2);

  if (normalizedMaker && normalizedYear && normalizedMonth && normalizedValue !== "0.00") {
    keys.push(`maker-year-month-value:${normalizedMaker}|${normalizedYear}|${normalizedMonth}|${normalizedValue}`);
  }

  return keys;
}

function isSpecificRecordKey(key) {
  const value = String(key || "");
  return value.startsWith("id-year-month-value:") || value.startsWith("maker-year-month-value:");
}

function getMaxNdNumber(rows) {
  return rows.reduce((max, row) => {
    const raw = getFirstFilledValue(row, ["n_nd", "n nd", "numero nd", "numero", "nd"]);
    const number = Number(String(raw || "").replace(/[^\d]/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
}

function getRowValue(row, candidates) {
  const key = findRowKey(row, candidates);
  return key ? row[key] : "";
}

function getFirstFilledValue(row, candidates) {
  for (const candidate of candidates) {
    const value = getRowValue(row, [candidate]);
    if (String(value || "").trim()) {
      return value;
    }
  }
  return "";
}

function findRowKey(row, candidates) {
  const keys = Object.keys(row);
  const normalizedCandidates = candidates.map(normalizeHeader);
  const exact = keys.find((key) => normalizedCandidates.includes(normalizeHeader(key)));
  if (exact) return exact;

  return keys.find((key) => {
    const normalizedKey = normalizeHeader(key);
    return normalizedCandidates.some((candidate) => normalizedKey.includes(candidate));
  }) || "";
}

function isApprovedCatman(value) {
  const normalized = normalizeHeader(value);
  return ["approved", "aprovado", "valido", "validado"].includes(normalized);
}

function displayCatmanStatus(value) {
  const normalized = normalizeHeader(value);
  if (["approved", "aprovado", "valido", "validado"].includes(normalized)) {
    return "Validado";
  }
  if (normalized.includes("aguardando") || ["pending", "pendente", "validar"].includes(normalized)) {
    return "Aguardando Valida\u00e7\u00e3o";
  }
  return value || "-";
}

function getNdStatusLabel(record) {
  if (record.status === ND_STATUS.ready) return "Pronta";
  if (record.status === ND_STATUS.created) return "Ja criada";
  return "Pendente";
}

function parseFlexibleNumber(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");

  if (commaIndex > dotIndex) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }

  return Number(cleaned.replace(/,/g, "")) || 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
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
    .replace(/(^|[\s(-])([a-z\u00e0-\u00fa])/gi, (match, separator, letter) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`)
    .replace(/\b(ltda|sa|s\/a|me|epp|eireli)\b/gi, (match) => match.toLocaleUpperCase("pt-BR"));
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
  );
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function setNdConnectionStatus(message) {
  ndEls.connectionStatus.textContent = message;
}

function setNdHistoryStatus(message, status = "") {
  ndEls.historyStatus.textContent = message;
  ndEls.historyStatus.classList.toggle("is-saving", status === "saving");
  ndEls.historyStatus.classList.toggle("is-ok", status === "ok");
  ndEls.historyStatus.classList.toggle("is-error", status === "error");
}

function updateNdWriteStatus(message, status = "") {
  if (!message) {
    if (ndState.writeEndpoint && ndState.writeSecret) {
      message = "Escrita no Sheets configurada";
      status = "ok";
    } else if (ndState.writeEndpoint) {
      message = "Informe o token para criar NDs";
      status = "error";
    } else {
      message = "Escrita nao configurada";
    }
  }

  ndEls.writeStatus.textContent = message;
  ndEls.writeStatus.classList.toggle("is-saving", status === "saving");
  ndEls.writeStatus.classList.toggle("is-ok", status === "ok");
  ndEls.writeStatus.classList.toggle("is-error", status === "error");
}
