const GOOGLE_SHEET = {
  source: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=0&single=true&output=csv",
  gid: "0",
  sheetName: "Maker",
  refreshMinutes: 0,
  clientId: "1090675917747-smvgs24cgi6n5qt6sv816khti52fvjsj.apps.googleusercontent.com",
  writeEndpoint: "https://script.google.com/macros/s/AKfycbw-tLruP64EXOMQ0_OgAXy1mn4MRwNIOy3CZTdUvVwmrJQodW5kX0C-9XkMFKC2nG5KRw/exec",
  writeSecret: "",
  filtersSource: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1292236262&single=true&output=csv",
  filtersSheetName: "filters"
};

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const CONFIG_VERSION = "maker-public-csv-v4";

const STORAGE_KEYS = {
  configVersion: "sheets-dashboard.configVersion",
  source: "sheets-dashboard.source",
  gid: "sheets-dashboard.gid",
  sheetName: "sheets-dashboard.sheetName",
  refreshMinutes: "sheets-dashboard.refreshMinutes",
  clientId: "sheets-dashboard.clientId",
  writeEndpoint: "sheets-dashboard.writeEndpoint",
  writeSecret: "sheets-dashboard.writeSecret",
  edits: "sheets-dashboard.edits"
};

const SAMPLE_COLUMNS = [
  "MAKER",
  "CNPJ",
  "MES",
  "ANO",
  "VALOR QUERY",
  "VALOR EXTENSO",
  "EXECUCAO",
  "DIFF",
  "STATUS FPA",
  "CATMAN",
  "Valor Final",
  "Status Catman",
  "Emissao",
  "Envio",
  "Previsao PGT",
  "Link",
  "Comprovante Link",
  "Status FP&A",
  "Obs"
];

const SAMPLE_ROWS = [
  {
    MAKER: "3 coracoes",
    CNPJ: "63.310.411/0001-01",
    MES: "4",
    ANO: "2026",
    "VALOR QUERY": "110.146,56",
    "VALOR EXTENSO": "quatro mil duzentos e oito reais e oitenta e cinco centavos",
    EXECUCAO: "110.276,77",
    DIFF: "-130,21",
    "STATUS FPA": "Joyce B Lopes",
    CATMAN: "Maria Silva",
    "Valor Final": "",
    "Status Catman": "Pendente",
    Emissao: "",
    Envio: "",
    "Previsao PGT": "",
    Link: "",
    "Comprovante Link": "",
    "Status FP&A": "In Progress",
    Obs: ""
  },
  {
    MAKER: "ambev",
    CNPJ: "07.526.557/0001-00",
    MES: "4",
    ANO: "2026",
    "VALOR QUERY": "70.046,56",
    "VALOR EXTENSO": "cento e dois mil seiscentos e oitenta reais e dez centavos",
    EXECUCAO: "70.303,22",
    DIFF: "-256,66",
    "STATUS FPA": "Bruno Mesquita",
    CATMAN: "Bruno Mesquita",
    "Valor Final": "",
    "Status Catman": "Validar",
    Emissao: "",
    Envio: "",
    "Previsao PGT": "",
    Link: "https://docs.google.com",
    "Comprovante Link": "",
    "Status FP&A": "Pendente",
    Obs: ""
  },
  {
    MAKER: "ambev - fortaleza",
    CNPJ: "07.526.557/0001-00",
    MES: "4",
    ANO: "2026",
    "VALOR QUERY": "2.832,82",
    "VALOR EXTENSO": "setenta mil e quarenta e seis reais e cinquenta e seis centavos",
    EXECUCAO: "2.834,49",
    DIFF: "-1,67",
    "STATUS FPA": "Bruno Mesquita",
    CATMAN: "Bruno Mesquita",
    "Valor Final": "",
    "Status Catman": "Aprovado",
    Emissao: "2026-04-15",
    Envio: "",
    "Previsao PGT": "2026-05-02",
    Link: "",
    "Comprovante Link": "",
    "Status FP&A": "Aprovado",
    Obs: "Conferir NF"
  },
  {
    MAKER: "ambev - recife",
    CNPJ: "07.526.557/0001-00",
    MES: "4",
    ANO: "2026",
    "VALOR QUERY": "1.617,09",
    "VALOR EXTENSO": "dois mil duzentos e noventa e quatro reais e noventa centavos",
    EXECUCAO: "1.622,93",
    DIFF: "-5,84",
    "STATUS FPA": "Bruno Mesquita",
    CATMAN: "Bruno Mesquita",
    "Valor Final": "",
    "Status Catman": "Enviado",
    Emissao: "2026-04-17",
    Envio: "2026-04-18",
    "Previsao PGT": "2026-05-05",
    Link: "",
    "Comprovante Link": "",
    "Status FP&A": "Enviado",
    Obs: ""
  },
  {
    MAKER: "bimbo",
    CNPJ: "33.402.892/0001-06",
    MES: "5",
    ANO: "2026",
    "VALOR QUERY": "18.920,10",
    "VALOR EXTENSO": "dezoito mil novecentos e vinte reais e dez centavos",
    EXECUCAO: "18.920,10",
    DIFF: "0,00",
    "STATUS FPA": "Camila Rocha",
    CATMAN: "Camila Rocha",
    "Valor Final": "18.920,10",
    "Status Catman": "Aprovado",
    Emissao: "2026-05-03",
    Envio: "2026-05-03",
    "Previsao PGT": "2026-05-20",
    Link: "https://docs.google.com",
    "Comprovante Link": "https://docs.google.com",
    "Status FP&A": "Pago",
    Obs: "OK"
  }
];

const GROUPS = {
  base: { label: "", className: "group-base" },
  control: { label: "Gestao E...", className: "group-control" },
  validacao: { label: "Validacao Comercial", className: "group-validacao" },
  debito: { label: "Nota de Debito", className: "group-debito" },
  comprovante: { label: "Comprovante", className: "group-comprovante" },
  status: { label: "Status FP&A", className: "group-status" }
};

const STATUS_OPTIONS = [
  "",
  "Pendente",
  "Em analise",
  "Validar",
  "Aprovado",
  "Reprovado",
  "Enviado",
  "Pago",
  "In Progress"
];

const STATUS_CATMAN_OPTIONS = [
  "",
  "Validado",
  "Aguardando Valida\u00e7\u00e3o"
];

const EDITABLE_TEXT_COLUMNS = [
  "valor final",
  "valor emissao nd",
  "valor_emissao_nd",
  "obs",
  "observacao",
  "emissao",
  "data emissao",
  "data_emissao",
  "data_envio",
  "envio",
  "previsao pgt",
  "previsao_pgto",
  "previsao pagamento",
  "link",
  "link_nd",
  "link comprovante",
  "link_comprovante",
  "comprovante link"
];

const state = {
  source: GOOGLE_SHEET.source,
  gid: GOOGLE_SHEET.gid,
  sheetName: GOOGLE_SHEET.sheetName,
  refreshMinutes: GOOGLE_SHEET.refreshMinutes,
  clientId: GOOGLE_SHEET.clientId,
  writeEndpoint: GOOGLE_SHEET.writeEndpoint,
  writeSecret: GOOGLE_SHEET.writeSecret,
  accessToken: "",
  tokenClient: null,
  googleIdentityPromise: null,
  refreshTimer: null,
  rows: [],
  columns: [],
  filteredRows: [],
  lookupOptions: {
    catman: [],
    statusCatman: [],
    statusFpa: []
  },
  edits: {},
  filters: {
    search: "",
    maker: "",
    month: "",
    year: "",
    catman: "",
    status: "",
    quick: ""
  },
  sort: {
    key: "",
    direction: "asc"
  }
};

const els = {
  connectionStatus: document.querySelector("#connectionStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  exportButton: document.querySelector("#exportButton"),
  configToggle: document.querySelector("#configToggle"),
  configPanel: document.querySelector("#configPanel"),
  sheetUrlInput: document.querySelector("#sheetUrlInput"),
  clientIdInput: document.querySelector("#clientIdInput"),
  gidInput: document.querySelector("#gidInput"),
  sheetNameInput: document.querySelector("#sheetNameInput"),
  refreshMinutesInput: document.querySelector("#refreshMinutesInput"),
  writeEndpointInput: document.querySelector("#writeEndpointInput"),
  writeSecretInput: document.querySelector("#writeSecretInput"),
  loadSheetButton: document.querySelector("#loadSheetButton"),
  sampleButton: document.querySelector("#sampleButton"),
  authButton: document.querySelector("#authButton"),
  signOutButton: document.querySelector("#signOutButton"),
  quickTabs: document.querySelectorAll("[data-quick-filter]"),
  metricRows: document.querySelector("#metricRows"),
  metricQuery: document.querySelector("#metricQuery"),
  metricExecution: document.querySelector("#metricExecution"),
  metricDiff: document.querySelector("#metricDiff"),
  searchInput: document.querySelector("#searchInput"),
  makerFilter: document.querySelector("#makerFilter"),
  monthFilter: document.querySelector("#monthFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  catmanFilter: document.querySelector("#catmanFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  tableHead: document.querySelector("#tableHead"),
  tableBody: document.querySelector("#tableBody"),
  emptyState: document.querySelector("#emptyState"),
  rowCount: document.querySelector("#rowCount"),
  writeStatus: document.querySelector("#writeStatus"),
  localEdits: document.querySelector("#localEdits")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  const shouldUseDefaultConfig = localStorage.getItem(STORAGE_KEYS.configVersion) !== CONFIG_VERSION;

  state.source = shouldUseDefaultConfig ? GOOGLE_SHEET.source : localStorage.getItem(STORAGE_KEYS.source) || GOOGLE_SHEET.source;
  state.gid = shouldUseDefaultConfig ? GOOGLE_SHEET.gid : localStorage.getItem(STORAGE_KEYS.gid) || GOOGLE_SHEET.gid || "";
  state.sheetName = shouldUseDefaultConfig ? GOOGLE_SHEET.sheetName : localStorage.getItem(STORAGE_KEYS.sheetName) || GOOGLE_SHEET.sheetName || "";
  state.refreshMinutes = shouldUseDefaultConfig ? GOOGLE_SHEET.refreshMinutes : Number(localStorage.getItem(STORAGE_KEYS.refreshMinutes) || GOOGLE_SHEET.refreshMinutes || 0);
  state.clientId = shouldUseDefaultConfig ? GOOGLE_SHEET.clientId : localStorage.getItem(STORAGE_KEYS.clientId) || GOOGLE_SHEET.clientId || "";
  state.writeEndpoint = shouldUseDefaultConfig ? GOOGLE_SHEET.writeEndpoint : localStorage.getItem(STORAGE_KEYS.writeEndpoint) || GOOGLE_SHEET.writeEndpoint || "";
  state.writeSecret = localStorage.getItem(STORAGE_KEYS.writeSecret) || GOOGLE_SHEET.writeSecret || "";
  state.edits = readJson(STORAGE_KEYS.edits, {});

  if (shouldUseDefaultConfig) {
    persistConfig();
  }

  els.sheetUrlInput.value = state.source;
  els.clientIdInput.value = state.clientId;
  els.gidInput.value = state.gid;
  els.sheetNameInput.value = state.sheetName;
  els.refreshMinutesInput.value = String(state.refreshMinutes || 0);
  els.writeEndpointInput.value = state.writeEndpoint;
  els.writeSecretInput.value = state.writeSecret;

  bindEvents();
  updateAuthUi();
  updateWriteStatus();
  setupAutoRefresh();

  if (state.source && shouldUseOAuthForSource() && isHttpOrigin()) {
    loadSampleData();
    setConnectionStatus("Entre com Google para carregar a planilha restrita");
  } else if (state.source && shouldUseOAuthForSource() && location.protocol === "file:") {
    loadSampleData();
    setConnectionStatus("Abra em localhost para usar OAuth");
  } else if (state.source) {
    loadFromConfiguredSheet();
  } else {
    loadSampleData();
  }
}

function bindEvents() {
  els.configToggle.addEventListener("click", () => {
    els.configPanel.classList.toggle("is-open");
  });

  els.refreshButton.addEventListener("click", () => {
    if (state.source && shouldUseOAuthForSource() && !state.accessToken && isHttpOrigin()) {
      requestGoogleAuth();
      return;
    }

    if (state.source) {
      loadFromConfiguredSheet();
    } else {
      loadSampleData();
    }
  });

  els.exportButton.addEventListener("click", exportFilteredCsv);

  els.authButton.addEventListener("click", requestGoogleAuth);
  els.signOutButton.addEventListener("click", signOutGoogle);
  els.quickTabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.quick = button.dataset.quickFilter || "";
      els.quickTabs.forEach((tab) => tab.classList.toggle("is-active", tab === button));
      applyFiltersAndRender();
    });
  });

  els.loadSheetButton.addEventListener("click", () => {
    state.source = els.sheetUrlInput.value.trim();
    state.clientId = els.clientIdInput.value.trim();
    state.gid = els.gidInput.value.trim();
    state.sheetName = els.sheetNameInput.value.trim();
    state.refreshMinutes = Number(els.refreshMinutesInput.value || 0);
    state.writeEndpoint = els.writeEndpointInput.value.trim();
    state.writeSecret = els.writeSecretInput.value.trim();
    persistConfig();
    setupAutoRefresh();
    updateAuthUi();
    updateWriteStatus();
    loadFromConfiguredSheet();
  });

  if (els.sampleButton) {
    els.sampleButton.addEventListener("click", () => {
      state.source = "";
      state.gid = "";
      state.sheetName = "";
      state.refreshMinutes = 0;
      state.writeEndpoint = GOOGLE_SHEET.writeEndpoint;
      state.writeSecret = "";
      state.accessToken = "";
      els.sheetUrlInput.value = "";
      els.gidInput.value = "";
      els.sheetNameInput.value = "";
      els.refreshMinutesInput.value = "0";
      els.writeEndpointInput.value = state.writeEndpoint;
      els.writeSecretInput.value = "";
      localStorage.removeItem(STORAGE_KEYS.source);
      localStorage.removeItem(STORAGE_KEYS.gid);
      localStorage.removeItem(STORAGE_KEYS.sheetName);
      localStorage.setItem(STORAGE_KEYS.refreshMinutes, "0");
      localStorage.setItem(STORAGE_KEYS.writeEndpoint, state.writeEndpoint);
      localStorage.removeItem(STORAGE_KEYS.writeSecret);
      setupAutoRefresh();
      updateAuthUi();
      updateWriteStatus();
      loadSampleData();
    });
  }

  els.searchInput.addEventListener("input", () => {
    state.filters.search = els.searchInput.value.trim().toLowerCase();
    applyFiltersAndRender();
  });

  els.makerFilter.addEventListener("change", () => {
    state.filters.maker = els.makerFilter.value;
    applyFiltersAndRender();
  });

  els.monthFilter.addEventListener("change", () => {
    state.filters.month = els.monthFilter.value;
    applyFiltersAndRender();
  });

  els.yearFilter.addEventListener("change", () => {
    state.filters.year = els.yearFilter.value;
    applyFiltersAndRender();
  });

  els.catmanFilter.addEventListener("change", () => {
    state.filters.catman = els.catmanFilter.value;
    applyFiltersAndRender();
  });

  els.statusFilter.addEventListener("change", () => {
    state.filters.status = els.statusFilter.value;
    applyFiltersAndRender();
  });

  els.clearFiltersButton.addEventListener("click", () => {
    state.filters = { search: "", maker: "", month: "", year: "", catman: "", status: "", quick: "" };
    els.searchInput.value = "";
    els.makerFilter.value = "";
    els.monthFilter.value = "";
    els.yearFilter.value = "";
    els.catmanFilter.value = "";
    els.statusFilter.value = "";
    els.quickTabs.forEach((tab) => tab.classList.toggle("is-active", !tab.dataset.quickFilter));
    applyFiltersAndRender();
  });
}

async function loadFromConfiguredSheet() {
  if (!state.source) {
    loadSampleData();
    return;
  }

  setConnectionStatus("Carregando planilha...");

  try {
    const payload = await loadSheetPayload(state.source, state.gid, state.sheetName);

    if (!payload.rows.length) {
      throw new Error("A planilha carregou sem linhas.");
    }

    await loadLookupOptions();
    setDataset(payload.columns, payload.rows);
    const location = state.sheetName ? `aba ${state.sheetName}` : state.gid ? `gid ${state.gid}` : "aba principal";
    const auto = state.refreshMinutes > 0 ? `, auto ${state.refreshMinutes} min` : "";
    setConnectionStatus(`Conectado ao Google Sheets (${location}), ${payload.rows.length} registros${auto}`);
  } catch (error) {
    console.error(error);

    if (state.accessToken && String(error.message || "").includes("401")) {
      state.accessToken = "";
      updateAuthUi();
      setConnectionStatus("Sessao expirada. Entre com Google novamente");
      return;
    }

    loadSampleData();
    setConnectionStatus("Falha ao conectar, usando exemplo");
    els.configPanel.classList.add("is-open");
  }
}

async function loadSheetPayload(input, gid, sheetName) {
  if (state.accessToken) {
    return loadViaSheetsApi(input, gid, sheetName, state.accessToken);
  }

  const source = buildSheetSource(input, gid, sheetName);

  try {
    const response = await fetch(source.csvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return csvToObjects(await response.text());
  } catch (fetchError) {
    if (!source.sheetId) {
      throw fetchError;
    }
    return loadViaGviz(source.sheetId, gid, sheetName);
  }
}

async function loadLookupOptions() {
  state.lookupOptions.catman = [];
  state.lookupOptions.statusCatman = [];
  state.lookupOptions.statusFpa = [];

  const filtersInput = GOOGLE_SHEET.filtersSource || state.source;
  const filtersSheetName = GOOGLE_SHEET.filtersSource ? "" : GOOGLE_SHEET.filtersSheetName;

  if (!filtersInput) {
    return;
  }

  try {
    const matrix = await loadSheetMatrix(filtersInput, "", filtersSheetName);
    const payload = matrixToObjects(matrix);
    const shouldUsePhysicalFilterColumns = !looksLikeMainDataSheet(matrix);

    if (shouldUsePhysicalFilterColumns) {
      state.lookupOptions.catman = extractMatrixColumnOptions(matrix, 0, isCatmanOption);
      state.lookupOptions.statusCatman = extractMatrixColumnOptions(matrix, 1, isStatusOption);
      state.lookupOptions.statusFpa = extractMatrixColumnOptions(matrix, 2, isStatusOption);
    } else {
      state.lookupOptions.catman = extractColumnOptions(payload, ["catman"]);
    }
  } catch (error) {
    console.warn("Nao foi possivel carregar a aba filters.", error);
  }
}

async function loadSheetMatrix(input, gid, sheetName) {
  if (state.accessToken) {
    const sheetId = extractSheetId(input);
    if (!sheetId) {
      throw new Error("ID da planilha invalido.");
    }

    const title = sheetName || await findSheetTitle(sheetId, gid, state.accessToken);
    const range = `${quoteSheetName(title)}!A:ZZ`;
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`, {
      headers: {
        Authorization: `Bearer ${state.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Sheets API HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  const source = buildSheetSource(input, gid, sheetName);
  const response = await fetch(source.csvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return parseCsv(await response.text());
}

function extractColumnOptions(payload, candidates) {
  const column = findPayloadColumn(payload.columns, candidates);
  if (!column) return [];

  return uniqueSorted(payload.rows.map((row) => row[column]).filter(isSelectableOption));
}

function extractMatrixColumnOptions(matrix, columnIndex, predicate = isSelectableOption) {
  return uniqueSorted(matrix.map((row) => row[columnIndex]).filter(predicate));
}

function looksLikeMainDataSheet(matrix) {
  return matrix.some((line) => {
    const normalizedLine = line.map(normalizeHeader);
    return ["maker", "cnpj", "valor query", "id_alianca"].filter((header) => normalizedLine.includes(header)).length >= 3;
  });
}

function findPayloadColumn(columns, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  const exact = columns.find((column) => normalizedCandidates.includes(normalizeHeader(column)));
  if (exact) return exact;

  return columns.find((column) => {
    const normalized = normalizeHeader(column);
    return !normalized.includes("status") && normalizedCandidates.some((candidate) => normalized.includes(candidate));
  }) || "";
}

async function requestGoogleAuth() {
  syncConfigFromInputs();

  if (!state.clientId) {
    els.configPanel.classList.add("is-open");
    setConnectionStatus("Informe o OAuth Client ID");
    return;
  }

  if (!isHttpOrigin()) {
    els.configPanel.classList.add("is-open");
    setConnectionStatus("OAuth precisa rodar em http://localhost");
    return;
  }

  try {
    await loadGoogleIdentity();
    state.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: state.clientId,
      scope: SHEETS_SCOPE,
      callback: async (response) => {
        if (response.error) {
          setConnectionStatus(`OAuth falhou: ${response.error}`);
          return;
        }

        state.accessToken = response.access_token;
        updateAuthUi();
        await loadFromConfiguredSheet();
      }
    });

    state.tokenClient.requestAccessToken({ prompt: state.accessToken ? "" : "consent" });
  } catch (error) {
    console.error(error);
    setConnectionStatus("Nao foi possivel iniciar o OAuth");
  }
}

function signOutGoogle() {
  if (state.accessToken && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(state.accessToken);
  }

  state.accessToken = "";
  updateAuthUi();
  loadSampleData();
  setConnectionStatus("Sessao Google encerrada");
}

function syncConfigFromInputs() {
  state.source = els.sheetUrlInput.value.trim();
  state.clientId = els.clientIdInput.value.trim();
  state.gid = els.gidInput.value.trim();
  state.sheetName = els.sheetNameInput.value.trim();
  state.refreshMinutes = Number(els.refreshMinutesInput.value || 0);
  state.writeEndpoint = els.writeEndpointInput.value.trim();
  state.writeSecret = els.writeSecretInput.value.trim();

  localStorage.setItem(STORAGE_KEYS.source, state.source);
  localStorage.setItem(STORAGE_KEYS.clientId, state.clientId);
  localStorage.setItem(STORAGE_KEYS.gid, state.gid);
  localStorage.setItem(STORAGE_KEYS.sheetName, state.sheetName);
  localStorage.setItem(STORAGE_KEYS.refreshMinutes, String(state.refreshMinutes || 0));
  localStorage.setItem(STORAGE_KEYS.writeEndpoint, state.writeEndpoint);
  localStorage.setItem(STORAGE_KEYS.writeSecret, state.writeSecret);
  localStorage.setItem(STORAGE_KEYS.configVersion, CONFIG_VERSION);
  setupAutoRefresh();
  updateWriteStatus();
}

function persistConfig() {
  localStorage.setItem(STORAGE_KEYS.source, state.source);
  localStorage.setItem(STORAGE_KEYS.clientId, state.clientId);
  localStorage.setItem(STORAGE_KEYS.gid, state.gid);
  localStorage.setItem(STORAGE_KEYS.sheetName, state.sheetName);
  localStorage.setItem(STORAGE_KEYS.refreshMinutes, String(state.refreshMinutes || 0));
  localStorage.setItem(STORAGE_KEYS.writeEndpoint, state.writeEndpoint || "");
  localStorage.setItem(STORAGE_KEYS.writeSecret, state.writeSecret || "");
  localStorage.setItem(STORAGE_KEYS.configVersion, CONFIG_VERSION);
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (state.googleIdentityPromise) {
    return state.googleIdentityPromise;
  }

  state.googleIdentityPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services nao carregou."));
    document.head.append(script);
  });

  return state.googleIdentityPromise;
}

async function loadViaSheetsApi(input, gid, sheetName, accessToken) {
  const sheetId = extractSheetId(input);
  if (!sheetId) {
    throw new Error("ID da planilha invalido.");
  }

  const title = sheetName || await findSheetTitle(sheetId, gid, accessToken);
  const range = `${quoteSheetName(title)}!A:ZZ`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Sheets API HTTP ${response.status}`);
  }

  const data = await response.json();
  const values = data.values || [];
  return matrixToObjects(values);
}

async function findSheetTitle(sheetId, gid, accessToken) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties(sheetId,title)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Sheets metadata HTTP ${response.status}`);
  }

  const data = await response.json();
  const sheets = data.sheets || [];

  if (gid) {
    const found = sheets.find((sheet) => String(sheet.properties.sheetId) === String(gid));
    if (found) return found.properties.title;
  }

  return sheets[0]?.properties?.title || "Sheet1";
}

function quoteSheetName(name) {
  const title = String(name || "").replace(/'/g, "''");
  return `'${title}'`;
}

function updateAuthUi() {
  const needsOAuth = shouldUseOAuthForSource();
  els.authButton.hidden = !needsOAuth;
  els.signOutButton.hidden = !needsOAuth || !state.accessToken;
  els.authButton.textContent = state.accessToken ? "Reconectar Google" : "Entrar Google";
}

function shouldUseOAuthForSource() {
  return Boolean(state.clientId && !isPublicSheetSource(state.source));
}

function isPublicSheetSource(input) {
  const value = String(input || "").toLowerCase();
  return value.includes("output=csv") || value.includes("/pub?") || value.includes("/pubhtml");
}

function isHttpOrigin() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function setupAutoRefresh() {
  window.clearInterval(state.refreshTimer);
  state.refreshTimer = null;

  if (!state.source || state.refreshMinutes <= 0) {
    return;
  }

  state.refreshTimer = window.setInterval(() => {
    loadFromConfiguredSheet();
  }, state.refreshMinutes * 60 * 1000);
}

function loadSampleData() {
  state.lookupOptions.catman = [];
  state.lookupOptions.statusCatman = [];
  state.lookupOptions.statusFpa = [];
  setDataset(SAMPLE_COLUMNS, SAMPLE_ROWS);
  setConnectionStatus("Usando base de exemplo");
}

function setDataset(columns, rows) {
  state.columns = buildColumns(columns);
  state.rows = rows.map((row, index) => normalizeRow(row, index));
  syncFilterOptions();
  applyFiltersAndRender();
}

function normalizeRow(row, index) {
  const normalized = {};
  state.columns.forEach((column) => {
    normalized[column.key] = row[column.original] ?? row[column.key] ?? "";
  });
  normalized.__id = makeRowId(normalized, index);
  return applyLocalEdits(normalized);
}

function buildColumns(sourceColumns) {
  const cleaned = sourceColumns.map((column, index) => {
    const label = String(column || `Coluna ${index + 1}`).trim();
    return {
      key: uniqueKey(slugify(label) || `coluna_${index + 1}`, index),
      original: label,
      label,
      displayLabel: getColumnDisplayLabel(label),
      group: inferGroup(label, index),
      type: inferType(label),
      editable: inferEditable(label),
      amber: inferAmber(label)
    };
  });

  return cleaned;
}

function getColumnDisplayLabel(label) {
  const normalized = normalizeHeader(label);
  if (normalized === "valor query") return "Valor Execu\u00e7\u00e3o";
  if (normalized === "execucao") return "Pagamento";
  if (normalized === "valor_pagamento" || normalized === "valor pagamento") return "Pagamento";
  return label;
}

function uniqueKey(base, index) {
  return `${base}_${index}`;
}

function inferGroup(label, index) {
  const normalized = normalizeHeader(label);

  if (["execucao", "diff", "status fpa"].includes(normalized) && index <= 8) {
    return "control";
  }

  if (["catman", "valor final", "status catman"].includes(normalized)) {
    return "validacao";
  }

  if (["emissao", "data emissao", "data_emissao", "data_envio", "envio", "previsao pgt", "previsao_pgto", "previsao pagamento", "link", "link_nd"].includes(normalized)) {
    return "debito";
  }

  if (normalized.includes("comprovante")) {
    return "comprovante";
  }

  if (normalized.includes("status fp&a") || normalized.includes("status fpna")) {
    return "status";
  }

  return "base";
}

function inferType(label) {
  const normalized = normalizeHeader(label);

  if (normalized.includes("link")) return "link";
  if (normalized.includes("extenso")) return "text";
  if (normalized.includes("valor") || normalized.includes("execucao") || normalized.includes("query")) return "currency";
  if (normalized === "diff" || normalized === "dif") return "diff";
  if (normalized === "mes" || normalized === "ano") return "number";
  if (normalized.includes("emissao") || normalized.includes("envio") || normalized.includes("previsao")) return "date";

  return "text";
}

function inferEditable(label) {
  const normalized = normalizeHeader(label);
  return normalized.includes("status") || normalized.includes("link") || EDITABLE_TEXT_COLUMNS.includes(normalized);
}

function inferAmber(label) {
  const normalized = normalizeHeader(label);
  return [
    "catman",
    "valor final",
    "valor emissao nd",
    "valor_emissao_nd",
    "status catman",
    "emissao",
    "data emissao",
    "data_emissao",
    "data_envio",
    "envio",
    "previsao pgt",
    "previsao_pgto",
    "link",
    "link_nd",
    "link comprovante",
    "link_comprovante",
    "comprovante link"
  ].includes(normalized);
}

function applyFiltersAndRender() {
  const makerKey = findColumnKey(["maker"]);
  const yearKey = findColumnKey(["ano", "year"]);
  const catmanKey = findCatmanKey();
  const monthKey = findColumnKey(["mes", "mês"]);
  const statusFpaKey = findStatusFpaKey();

  let rows = state.rows.filter((row) => {
    if (state.filters.search) {
      const haystack = state.columns.map((column) => String(row[column.key] || "")).join(" ").toLowerCase();
      if (!haystack.includes(state.filters.search)) return false;
    }

    if (state.filters.maker && String(row[makerKey] || "") !== state.filters.maker) return false;
    if (state.filters.month && String(row[monthKey] || "") !== state.filters.month) return false;
    if (state.filters.year && String(row[yearKey] || "") !== state.filters.year) return false;
    if (state.filters.catman && String(row[catmanKey] || "") !== state.filters.catman) return false;
    if (state.filters.status && String(row[statusFpaKey] || "") !== state.filters.status) return false;

    if (state.filters.quick) {
      const statusValue = normalizeHeader(row[statusFpaKey]);

      if (state.filters.quick === "pending") {
        if (statusValue !== "pending") return false;
      }

      if (state.filters.quick === "done") {
        if (statusValue !== "done") return false;
      }
    }

    return true;
  });

  if (state.sort.key) {
    rows = [...rows].sort((a, b) => compareValues(a[state.sort.key], b[state.sort.key], state.sort.key));
    if (state.sort.direction === "desc") {
      rows.reverse();
    }
  }

  state.filteredRows = rows;
  renderTable();
  renderMetrics();
}

function syncFilterOptions() {
  const makerKey = findColumnKey(["maker"]);
  const yearKey = findColumnKey(["ano", "year"]);
  const monthKey = findColumnKey(["mes", "mês"]);

  fillSelect(els.makerFilter, "Todos", uniqueSorted(state.rows.map((row) => row[makerKey]).filter(Boolean)), toTitleCase);
  fillSelect(els.monthFilter, "Todos", uniqueSorted(state.rows.map((row) => row[monthKey]).filter(Boolean)));
  fillSelect(els.yearFilter, "Todos", uniqueSorted(state.rows.map((row) => row[yearKey]).filter(Boolean)));
  fillSelect(els.catmanFilter, "Todos", getCatmanOptions(), toTitleCase);
  fillSelect(els.statusFilter, "All", state.lookupOptions.statusFpa, toDisplayCase);
}

function fillSelect(select, firstLabel, values, labelFormatter = (value) => value) {
  const currentValue = select.value;
  select.innerHTML = "";
  select.append(new Option(firstLabel, ""));
  values.forEach((value) => select.append(new Option(labelFormatter(value), value)));

  if (values.includes(currentValue)) {
    select.value = currentValue;
  }
}

function getCatmanOptions(currentValue = "") {
  const catmanKey = findCatmanKey();
  const rowOptions = catmanKey ? state.rows.map((row) => row[catmanKey]) : [];
  return uniqueSorted([...state.lookupOptions.catman, ...rowOptions, currentValue].filter(isSelectableOption));
}

function getStatusOptions(column, currentValue = "") {
  const normalized = normalizeHeader(column.label);
  let lookupOptions = [];

  if (normalized === "status catman") {
    return STATUS_CATMAN_OPTIONS;
  } else if (normalized.includes("status fp&a") || normalized.includes("status fpna")) {
    lookupOptions = state.lookupOptions.statusFpa;
  }

  const fallbackOptions = lookupOptions.length ? [] : STATUS_OPTIONS;
  return uniqueSorted([...lookupOptions, currentValue, ...fallbackOptions].filter(isSelectableOption));
}

function renderTable() {
  renderHead();
  renderBody();

  els.emptyState.hidden = state.filteredRows.length > 0;
  els.rowCount.textContent = `${state.filteredRows.length} linhas`;
  els.localEdits.textContent = `${Object.keys(state.edits).length} edicoes locais`;
}

function renderHead() {
  els.tableHead.innerHTML = "";

  const groupRow = document.createElement("tr");
  groupRow.className = "group-row";

  getGroupSpans().forEach((span) => {
    const th = document.createElement("th");
    const group = GROUPS[span.group] || GROUPS.base;
    th.colSpan = span.count;
    th.className = group.className;
    th.textContent = group.label;
    groupRow.append(th);
  });

  const columnRow = document.createElement("tr");
  columnRow.className = "column-row";

  state.columns.forEach((column) => {
    const th = document.createElement("th");
    const group = GROUPS[column.group] || GROUPS.base;
    th.className = group.className;
    th.scope = "col";
    th.setAttribute("aria-sort", state.sort.key === column.key ? state.sort.direction === "asc" ? "ascending" : "descending" : "none");

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = column.displayLabel || column.label;
    button.addEventListener("click", () => sortBy(column.key));

    th.append(button);
    columnRow.append(th);
  });

  els.tableHead.append(groupRow, columnRow);
}

function getGroupSpans() {
  const spans = [];

  state.columns.forEach((column) => {
    const last = spans.at(-1);
    if (last && last.group === column.group) {
      last.count += 1;
    } else {
      spans.push({ group: column.group, count: 1 });
    }
  });

  return spans;
}

function renderBody() {
  const fragment = document.createDocumentFragment();
  els.tableBody.innerHTML = "";

  state.filteredRows.forEach((row) => {
    const tr = document.createElement("tr");

    state.columns.forEach((column) => {
      const td = document.createElement("td");
      td.className = getCellClass(column, row[column.key]);

      if (column.editable) {
        td.append(renderEditableCell(row, column));
      } else {
        td.append(renderReadonlyCell(row, column));
      }

      tr.append(td);
    });

    fragment.append(tr);
  });

  els.tableBody.append(fragment);
}

function renderReadonlyCell(row, column) {
  const value = row[column.key] ?? "";
  const normalized = normalizeHeader(column.label);

  if (column.type === "link") {
    const fragment = document.createDocumentFragment();
    const link = normalizeUrl(value);
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Abrir";
      fragment.append(anchor);
    } else {
      fragment.append(document.createTextNode(""));
    }
    return fragment;
  }

  if (column.type === "currency" || column.type === "diff") {
    return document.createTextNode(formatCurrency(parseFlexibleNumber(value)));
  }

  if (normalized === "maker") {
    return document.createTextNode(toTitleCase(value));
  }

  if (normalized === "catman") {
    return document.createTextNode(toTitleCase(value));
  }

  return document.createTextNode(value);
}

function renderEditableCell(row, column) {
  const normalized = normalizeHeader(column.label);
  const value = row[column.key] ?? "";

  if (normalized === "catman") {
    const select = document.createElement("select");
    select.className = "status-select person-select";
    select.append(new Option("-", ""));
    getCatmanOptions(value).forEach((optionValue) => select.append(new Option(toTitleCase(optionValue), optionValue)));
    select.value = value;
    select.addEventListener("change", () => updateLocalEdit(row, column, select.value));
    return select;
  }

  if (normalized.includes("status")) {
    const select = document.createElement("select");
    select.className = "status-select";
    const selectValue = normalized === "status catman" ? normalizeCatmanStatusValue(value) : value;
    getStatusOptions(column, selectValue).forEach((optionValue) => select.append(new Option(toDisplayCase(optionValue) || "-", optionValue)));
    if (normalized !== "status catman" && ![...select.options].some((option) => option.value === selectValue)) {
      select.append(new Option(toDisplayCase(value), value));
    }
    select.value = selectValue;
    select.addEventListener("change", () => updateLocalEdit(row, column, select.value));
    return select;
  }

  const input = document.createElement("input");
  input.className = "note-input";
  input.value = value;
  input.type = normalized === "valor final" ? "text" : "text";
  input.addEventListener("change", () => updateLocalEdit(row, column, input.value));
  return input;
}

function updateLocalEdit(row, column, value) {
  row[column.key] = value;
  state.edits[row.__id] = {
    ...(state.edits[row.__id] || {}),
    [column.key]: value
  };

  localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(state.edits));
  renderMetrics();
  els.localEdits.textContent = `${Object.keys(state.edits).length} edicoes locais`;
  void sendSheetUpdate(row, column, value);
}

function applyLocalEdits(row) {
  const edits = state.edits[row.__id];
  if (!edits) return row;
  return { ...row, ...edits };
}

async function sendSheetUpdate(row, column, value) {
  updateWriteStatus();

  if (!state.writeEndpoint || !state.writeSecret) {
    setWriteStatus("Edição local, configure token para salvar no Sheets", "error");
    return;
  }

  const idKey = findColumnKey(["id_alianca", "id alianca"]);
  const idAlianca = String(row[idKey] || "").trim();

  if (!idAlianca) {
    setWriteStatus("Edição local, ID_ALIANCA não encontrado", "error");
    return;
  }

  const payload = {
    secret: state.writeSecret,
    idAlianca,
    column: column.label,
    value
  };

  setWriteStatus("Salvando no Google Sheets...", "saving");

  try {
    // Apps Script Web Apps do not reliably expose CORS headers to static sites.
    // no-cors lets the write reach Apps Script; the response is opaque, so we reload later to confirm.
    await fetch(state.writeEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    setWriteStatus("Enviado ao Sheets, atualize para confirmar", "ok");
  } catch (error) {
    console.error(error);
    setWriteStatus("Falha ao enviar para o Sheets", "error");
  }
}

function updateWriteStatus() {
  if (!els.writeStatus) return;

  if (state.writeEndpoint && state.writeSecret) {
    setWriteStatus("Escrita no Sheets configurada", "ok");
  } else if (state.writeEndpoint) {
    setWriteStatus("Informe o token para salvar no Sheets", "error");
  } else {
    setWriteStatus("Escrita não configurada", "");
  }
}

function setWriteStatus(message, status) {
  if (!els.writeStatus) return;
  els.writeStatus.textContent = message;
  els.writeStatus.classList.toggle("is-saving", status === "saving");
  els.writeStatus.classList.toggle("is-ok", status === "ok");
  els.writeStatus.classList.toggle("is-error", status === "error");
}

function renderMetrics() {
  const queryKey = findColumnKey(["valor query", "vlr query"]);
  const executionKey = findColumnKey(["valor_pagamento", "valor pagamento", "valor pgto"]) || findColumnKey(["execucao", "execução"]);
  const diffKey = findColumnKey(["diff", "dif"]);

  const totalQuery = sumByKey(state.filteredRows, queryKey);
  const totalExecution = sumByKey(state.filteredRows, executionKey);
  const totalDiff = diffKey ? sumByKey(state.filteredRows, diffKey) : totalQuery - totalExecution;

  els.metricRows.textContent = String(state.filteredRows.length);
  els.metricQuery.textContent = formatCurrency(totalQuery);
  els.metricExecution.textContent = formatCurrency(totalExecution);
  els.metricDiff.textContent = formatCurrency(totalDiff);
  els.metricDiff.style.color = totalDiff < 0 ? "var(--danger)" : "var(--success)";
}

function getCellClass(column, value) {
  const classes = [];
  const normalized = normalizeHeader(column.label);

  if (column.type === "currency") classes.push("cell-currency");
  if (column.type === "number") classes.push("cell-number");
  if (column.type === "link") classes.push("cell-link");
  if (normalized === "catman") classes.push("cell-person");
  if (column.amber) classes.push("cell-amber");
  if (column.type === "diff") {
    const number = parseFlexibleNumber(value);
    classes.push("cell-diff", number < 0 ? "negative" : number > 0 ? "positive" : "");
  }

  return classes.filter(Boolean).join(" ");
}

function sortBy(key) {
  if (state.sort.key === key) {
    state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
  } else {
    state.sort.key = key;
    state.sort.direction = "asc";
  }
  applyFiltersAndRender();
}

function compareValues(a, b, key) {
  const column = state.columns.find((item) => item.key === key);

  if (column && ["currency", "number", "diff"].includes(column.type)) {
    return parseFlexibleNumber(a) - parseFlexibleNumber(b);
  }

  return String(a || "").localeCompare(String(b || ""), "pt-BR", { numeric: true, sensitivity: "base" });
}

function exportFilteredCsv() {
  const rows = [state.columns.map((column) => column.displayLabel || column.label)];

  state.filteredRows.forEach((row) => {
    rows.push(state.columns.map((column) => row[column.key] ?? ""));
  });

  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "validacao-comercial.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvToObjects(csvText) {
  const matrix = parseCsv(csvText);
  return matrixToObjects(matrix);
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
  const preferredHeaders = ["maker", "cnpj", "mes", "valor query", "execucao", "diff"];
  const directMatchIndex = matrix.findIndex((line) => {
    const normalizedLine = line.map(normalizeHeader);
    return preferredHeaders.filter((header) => normalizedLine.includes(header)).length >= 3;
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

function buildSheetSource(input, gid, sheetName) {
  const trimmed = input.trim();
  const sheetId = extractSheetId(trimmed);
  const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : "";

  if (trimmed.includes("output=csv") || trimmed.includes("format=csv")) {
    return { csvUrl: withSheetParams(trimmed, gid, sheetName), sheetId };
  }

  if (trimmed.includes("/pubhtml") || trimmed.includes("/pub?")) {
    return {
      csvUrl: withSheetParams(ensureCsvOutput(trimmed.replace("/pubhtml", "/pub")), gid, sheetName),
      sheetId
    };
  }

  if (sheetId) {
    if (sheetName && !gid) {
      return {
        csvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${sheetParam}`,
        sheetId
      };
    }

    return {
      csvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(gid || "0")}`,
      sheetId
    };
  }

  return { csvUrl: trimmed, sheetId: "" };
}

function withSheetParams(url, gid, sheetName) {
  const parsed = new URL(url);
  if (gid) {
    parsed.searchParams.set("gid", gid);
    parsed.searchParams.delete("sheet");
  } else if (sheetName) {
    parsed.searchParams.delete("gid");
    parsed.searchParams.set("sheet", sheetName);
  }
  return parsed.toString();
}

function ensureCsvOutput(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("output", "csv");
  return parsed.toString();
}

function extractSheetId(input) {
  const fullMatch = input.match(/\/spreadsheets\/d\/(?!e\/)([a-zA-Z0-9-_]+)/);
  if (fullMatch) return fullMatch[1];

  if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) return input;

  return "";
}

function loadViaGviz(sheetId, gid, sheetName) {
  return new Promise((resolve, reject) => {
    const callbackName = `handleGviz_${Date.now()}`;
    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao carregar via Google Visualization."));
    }, 12000);

    window[callbackName] = (response) => {
      cleanup();

      if (response.status !== "ok") {
        reject(new Error(response.errors?.[0]?.detailed_message || "Google Visualization retornou erro."));
        return;
      }

      const columns = response.table.cols.map((column, index) => column.label || column.id || `Coluna ${index + 1}`);
      const rows = response.table.rows.map((row) => {
        const item = {};
        columns.forEach((column, index) => {
          const cell = row.c[index];
          item[column] = cell ? cell.f ?? cell.v ?? "" : "";
        });
        return item;
      });

      resolve({ columns, rows });
    };

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    script.onerror = () => {
      cleanup();
      reject(new Error("Nao foi possivel carregar a planilha via Google Visualization."));
    };

    const sheetSelector = gid ? `gid=${encodeURIComponent(gid)}` : `sheet=${encodeURIComponent(sheetName || "0")}`;
    script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?${sheetSelector}&tqx=responseHandler:${callbackName}`;
    document.head.append(script);
  });
}

function findColumnKey(candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  const exact = state.columns.find((column) => normalizedCandidates.includes(normalizeHeader(column.label)));
  if (exact) return exact.key;

  const partial = state.columns.find((column) =>
    normalizedCandidates.some((candidate) => normalizeHeader(column.label).includes(candidate))
  );

  return partial?.key || "";
}

function findCatmanKey() {
  const exact = state.columns.find((column) => normalizeHeader(column.label) === "catman");
  if (exact) return exact.key;

  const partial = state.columns.find((column) => {
    const normalized = normalizeHeader(column.label);
    return normalized.includes("catman") && !normalized.includes("status");
  });

  return partial?.key || "";
}

function findStatusFpaKey() {
  const exact = state.columns.find((column) => {
    const normalized = normalizeHeader(column.label);
    return normalized === "status fp&a" || normalized === "status fpna";
  });
  if (exact) return exact.key;

  const partial = state.columns.find((column) => {
    const normalized = normalizeHeader(column.label);
    return normalized.includes("status") && (normalized.includes("fp&a") || normalized.includes("fpna"));
  });

  return partial?.key || "";
}

function sumByKey(rows, key) {
  if (!key) return 0;
  return rows.reduce((total, row) => total + parseFlexibleNumber(row[key]), 0);
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

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
  );
}

function isSelectableOption(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  return !["#n/a", "#ref!", "#value!", "#error!", "#div/0!", "#name?", "#num!", "#null!"].includes(text.toLowerCase());
}

function isStatusOption(value) {
  const text = String(value || "").trim();
  if (!isSelectableOption(text)) return false;
  if (/^\d+([.,]\d+)?$/.test(text)) return false;
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(text)) return false;

  const normalized = normalizeHeader(text);
  return ![
    "status",
    "status catman",
    "status fpa",
    "status fp&a",
    "status fpna",
    "catman",
    "validacao comercial",
    "nota de debito",
    "comprovante"
  ].includes(normalized);
}

function isCatmanOption(value) {
  const text = String(value || "").trim();
  if (!isSelectableOption(text)) return false;

  return normalizeHeader(text) !== "catman";
}

function normalizeCatmanStatusValue(value) {
  const normalized = normalizeHeader(value);
  if (!normalized) return "";

  if (["approved", "aprovado", "valido", "validado"].includes(normalized)) {
    return "Validado";
  }

  if (normalized.includes("aguardando") || ["pending", "pendente", "validar"].includes(normalized)) {
    return "Aguardando Valida\u00e7\u00e3o";
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

function toDisplayCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const letters = text.replace(/[^\p{L}]/gu, "");
  const upperLetters = letters.replace(/[^\p{Lu}]/gu, "");
  const shouldTitleCase = letters && upperLetters.length / letters.length > 0.7;

  return shouldTitleCase ? toTitleCase(text) : text;
}

function slugify(value) {
  return normalizeHeader(value)
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return "";
}

function makeRowId(row, index) {
  const makerKey = findColumnKey(["maker"]);
  const cnpjKey = findColumnKey(["cnpj"]);
  const monthKey = findColumnKey(["mes", "mês"]);
  return [row[makerKey], row[cnpjKey], row[monthKey], index].map((part) => String(part || "").trim()).join("|");
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

function setConnectionStatus(message) {
  els.connectionStatus.textContent = message;
}
