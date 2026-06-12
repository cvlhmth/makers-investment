const PROVISION_CONFIG = {
  makerSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1726147303&single=true&output=csv",
  backSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=567184749&single=true&output=csv",
  defaultFx: 5
};

const PROVISION_STORAGE_KEYS = {
  fxPrefix: "makers-investment.provision.fx."
};

const provisionState = {
  rows: [],
  backRows: [],
  monthlyRows: [],
  backMonthlyRows: [],
  filteredRows: [],
  filteredBackRows: [],
  filters: {
    year: ""
  }
};

const provisionEls = {
  connectionStatus: document.querySelector("#provisionConnectionStatus"),
  refreshButton: document.querySelector("#provisionRefreshButton"),
  exportButton: document.querySelector("#provisionExportButton"),
  yearFilter: document.querySelector("#provisionYearFilter"),
  clearFiltersButton: document.querySelector("#provisionClearFiltersButton"),
  metricMonths: document.querySelector("#provisionMetricMonths"),
  metricExecution: document.querySelector("#provisionMetricExecution"),
  metricZero: document.querySelector("#provisionMetricZero"),
  metricReceived: document.querySelector("#provisionMetricReceived"),
  tableBody: document.querySelector("#provisionTableBody"),
  backTableBody: document.querySelector("#backProvisionTableBody"),
  emptyState: document.querySelector("#provisionEmptyState"),
  backEmptyState: document.querySelector("#backProvisionEmptyState"),
  rowCount: document.querySelector("#provisionRowCount"),
  backRowCount: document.querySelector("#backProvisionRowCount"),
  fxStatus: document.querySelector("#provisionFxStatus")
};

document.addEventListener("DOMContentLoaded", initProvisionPage);

function initProvisionPage() {
  provisionEls.refreshButton.addEventListener("click", loadProvisionData);
  provisionEls.exportButton.addEventListener("click", exportProvisionCsv);
  provisionEls.yearFilter.addEventListener("change", () => {
    provisionState.filters.year = provisionEls.yearFilter.value;
    applyProvisionFiltersAndRender();
  });
  provisionEls.clearFiltersButton.addEventListener("click", () => {
    provisionState.filters.year = "";
    provisionEls.yearFilter.value = "";
    applyProvisionFiltersAndRender();
  });

  void loadProvisionData();
}

async function loadProvisionData() {
  setProvisionConnectionStatus("Carregando bases Maker e Back Margin...");

  try {
    const [makerPayload, backPayload] = await Promise.all([
      loadProvisionCsvObjects(PROVISION_CONFIG.makerSource),
      loadProvisionCsvObjects(PROVISION_CONFIG.backSource)
    ]);
    provisionState.rows = makerPayload.rows;
    provisionState.backRows = backPayload.rows;
    provisionState.monthlyRows = buildProvisionMonthlyRows(makerPayload.rows, "maker");
    provisionState.backMonthlyRows = buildProvisionMonthlyRows(backPayload.rows, "back");
    syncProvisionFilters();
    applyProvisionFiltersAndRender();
    setProvisionConnectionStatus(`Conectado ao Google Sheets, ${makerPayload.rows.length} registros Maker e ${backPayload.rows.length} registros Back Margin`);
  } catch (error) {
    console.error(error);
    provisionState.rows = [];
    provisionState.backRows = [];
    provisionState.monthlyRows = [];
    provisionState.backMonthlyRows = [];
    applyProvisionFiltersAndRender();
    setProvisionConnectionStatus("Falha ao carregar as bases Maker e Back Margin");
  }
}

function buildProvisionMonthlyRows(rows, sourceKey = "maker") {
  const buckets = new Map();

  rows.forEach((row) => {
    const year = getProvisionRowValue(row, ["ano", "year"]);
    const month = getProvisionRowValue(row, ["mes", "mês", "month"]);
    const value = parseProvisionNumber(getFirstProvisionValue(row, [
      "valor emissao nd",
      "valor_emissao_nd",
      "valor emissão nd",
      "valor query",
      "vlr query",
      "valor_pagamento",
      "valor pagamento",
      "pagamento"
    ]));
    const payment = parseProvisionNumber(getFirstProvisionValue(row, [
      "valor_pagamento",
      "valor pagamento",
      "valor pgto",
      "pagamento"
    ]));

    if (!year || !month || !value) return;

    const normalizedYear = String(year).trim();
    const normalizedMonth = normalizeProvisionMonth(month);
    const key = `${normalizedYear}-${normalizedMonth}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        fxKey: sourceKey === "back" ? `back-${key}` : key,
        year: normalizedYear,
        month: normalizedMonth,
        execution: 0,
        zero: 0,
        received: 0
      });
    }

    const bucket = buckets.get(key);
    bucket.execution += value;

    if (payment > 0) {
      bucket.received += value;
    } else {
      bucket.zero += value;
    }
  });

  return [...buckets.values()]
    .map((row) => ({
      ...row,
      fx: getProvisionFx(row.fxKey),
      usd: getProvisionFx(row.fxKey) > 0 ? row.execution / getProvisionFx(row.fxKey) : 0
    }))
    .sort((a, b) => Number(a.year) - Number(b.year) || Number(a.month) - Number(b.month));
}

function syncProvisionFilters() {
  const years = uniqueProvisionValues([
    ...provisionState.monthlyRows,
    ...provisionState.backMonthlyRows
  ].map((row) => row.year).filter(Boolean));
  const currentValue = provisionEls.yearFilter.value;
  provisionEls.yearFilter.innerHTML = "";
  provisionEls.yearFilter.append(new Option("Todos", ""));
  years.forEach((year) => provisionEls.yearFilter.append(new Option(year, year)));
  if (years.includes(currentValue)) {
    provisionEls.yearFilter.value = currentValue;
  }
}

function applyProvisionFiltersAndRender() {
  let rows = provisionState.monthlyRows;
  let backRows = provisionState.backMonthlyRows;

  if (provisionState.filters.year) {
    rows = rows.filter((row) => row.year === provisionState.filters.year);
    backRows = backRows.filter((row) => row.year === provisionState.filters.year);
  }

  provisionState.filteredRows = rows;
  provisionState.filteredBackRows = backRows;
  renderProvisionMetrics();
  renderProvisionTable(provisionEls.tableBody, provisionState.filteredRows, provisionEls.emptyState, provisionEls.rowCount);
  renderProvisionTable(provisionEls.backTableBody, provisionState.filteredBackRows, provisionEls.backEmptyState, provisionEls.backRowCount);
}

function renderProvisionMetrics() {
  const rows = provisionState.filteredRows;
  provisionEls.metricMonths.textContent = String(rows.length);
  provisionEls.metricExecution.textContent = formatProvisionCurrency(sumProvision(rows, "execution"), "BRL");
  provisionEls.metricZero.textContent = formatProvisionCurrency(sumProvision(rows, "zero"), "BRL");
  provisionEls.metricReceived.textContent = formatProvisionCurrency(sumProvision(rows, "received"), "BRL");
}

function renderProvisionTable(tableBody, rows, emptyState, rowCount) {
  const fragment = document.createDocumentFragment();
  tableBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.append(
      createProvisionCell(row.year, "cell-number"),
      createProvisionCell(getProvisionMonthLabel(row.month)),
      createProvisionFxCell(row),
      createProvisionCell(formatProvisionCurrency(row.execution, "BRL"), "cell-currency"),
      createProvisionCell(formatProvisionCurrency(row.usd, "USD"), "cell-currency"),
      createProvisionCell(formatProvisionCurrency(row.zero, "BRL"), "cell-currency"),
      createProvisionCell(formatProvisionCurrency(row.received, "BRL"), "cell-currency")
    );
    fragment.append(tr);
  });

  if (rows.length) {
    fragment.append(createProvisionTotalRow(rows));
  }

  tableBody.append(fragment);
  emptyState.hidden = rows.length > 0;
  rowCount.textContent = `${rows.length} meses`;
}

function createProvisionTotalRow(rows) {
  const tr = document.createElement("tr");
  tr.className = "provision-total-row";
  tr.append(
    createProvisionCell("Total"),
    createProvisionCell(""),
    createProvisionCell(""),
    createProvisionCell(formatProvisionCurrency(sumProvision(rows, "execution"), "BRL"), "cell-currency"),
    createProvisionCell(formatProvisionCurrency(sumProvision(rows, "usd"), "USD"), "cell-currency"),
    createProvisionCell(formatProvisionCurrency(sumProvision(rows, "zero"), "BRL"), "cell-currency"),
    createProvisionCell(formatProvisionCurrency(sumProvision(rows, "received"), "BRL"), "cell-currency")
  );
  return tr;
}

function createProvisionCell(value, className = "") {
  const td = document.createElement("td");
  if (className) td.className = className;
  td.textContent = value;
  return td;
}

function createProvisionFxCell(row) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.className = "fx-input";
  input.type = "number";
  input.min = "0";
  input.step = "0.0001";
  input.inputMode = "decimal";
  input.value = String(row.fx || "");
  input.addEventListener("change", () => {
    const nextFx = Math.max(0, parseProvisionNumber(input.value));
    localStorage.setItem(PROVISION_STORAGE_KEYS.fxPrefix + row.fxKey, String(nextFx || ""));
    const updateFxRow = (item) => {
      if (item.fxKey !== row.fxKey) return item;
      return {
        ...item,
        fx: nextFx,
        usd: nextFx > 0 ? item.execution / nextFx : 0
      };
    };
    provisionState.monthlyRows = provisionState.monthlyRows.map(updateFxRow);
    provisionState.backMonthlyRows = provisionState.backMonthlyRows.map(updateFxRow);
    provisionEls.fxStatus.textContent = `FX salvo para ${getProvisionMonthLabel(row.month)}/${row.year}`;
    applyProvisionFiltersAndRender();
  });
  td.append(input);
  return td;
}

function exportProvisionCsv() {
  const rows = [["Maker"], ["Ano", "Mes", "FX", "Valor Execucao", "Valor USD", "Zerados", "Recebidos"]];
  provisionState.filteredRows.forEach((row) => {
    rows.push([
      row.year,
      row.month,
      row.fx,
      row.execution,
      row.usd,
      row.zero,
      row.received
    ]);
  });
  rows.push([]);
  rows.push(["Back Margin"]);
  rows.push(["Ano", "Mes", "FX", "Valor Execucao", "Valor USD", "Zerados", "Recebidos"]);
  provisionState.filteredBackRows.forEach((row) => {
    rows.push([
      row.year,
      row.month,
      row.fx,
      row.execution,
      row.usd,
      row.zero,
      row.received
    ]);
  });

  const csv = rows.map((row) => row.map(escapeProvisionCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "provisao-makers.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadProvisionCsvObjects(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar CSV: ${response.status}`);
  const text = await response.text();
  const matrix = parseProvisionCsv(text);
  const headerRowIndex = detectProvisionHeaderRow(matrix);
  const columns = matrix[headerRowIndex].map((column) => String(column || "").trim());
  const rows = matrix.slice(headerRowIndex + 1).map((line) => {
    const item = {};
    columns.forEach((column, index) => {
      item[column] = line[index] ?? "";
    });
    return item;
  });

  return { columns, rows };
}

function parseProvisionCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((line) => line.some((value) => String(value || "").trim()));
}

function detectProvisionHeaderRow(matrix) {
  const preferredHeaders = ["maker", "ano", "mes"];
  const index = matrix.findIndex((line) => {
    const normalizedLine = line.map(normalizeProvisionHeader);
    return preferredHeaders.filter((header) => normalizedLine.includes(header)).length >= 2;
  });
  return index >= 0 ? index : 0;
}

function getProvisionRowValue(row, candidates) {
  const key = findProvisionRowKey(row, candidates);
  return key ? row[key] : "";
}

function getFirstProvisionValue(row, candidates) {
  for (const candidate of candidates) {
    const value = getProvisionRowValue(row, [candidate]);
    if (String(value || "").trim()) return value;
  }
  return "";
}

function findProvisionRowKey(row, candidates) {
  const keys = Object.keys(row);
  const normalizedCandidates = candidates.map(normalizeProvisionHeader);
  const exact = keys.find((key) => normalizedCandidates.includes(normalizeProvisionHeader(key)));
  if (exact) return exact;

  return keys.find((key) => {
    const normalizedKey = normalizeProvisionHeader(key);
    return normalizedCandidates.some((candidate) => normalizedKey.includes(candidate));
  }) || "";
}

function normalizeProvisionHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeProvisionMonth(value) {
  const raw = String(value || "").trim();
  const numeric = Number(raw.replace(/[^\d]/g, ""));
  if (numeric >= 1 && numeric <= 12) return String(numeric).padStart(2, "0");
  return raw || "00";
}

function getProvisionMonthLabel(month) {
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const index = Number(month) - 1;
  return names[index] || month;
}

function getProvisionFx(key) {
  const stored = localStorage.getItem(PROVISION_STORAGE_KEYS.fxPrefix + key);
  const parsed = parseProvisionNumber(stored);
  return parsed > 0 ? parsed : PROVISION_CONFIG.defaultFx;
}

function parseProvisionNumber(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  if (commaIndex > dotIndex) return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(cleaned.replace(/,/g, "")) || 0;
}

function formatProvisionCurrency(value, currency) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function sumProvision(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function uniqueProvisionValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort();
}

function escapeProvisionCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function setProvisionConnectionStatus(message) {
  provisionEls.connectionStatus.textContent = message;
}
