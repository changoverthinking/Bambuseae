import { cloneModelCatalog, getProviderAdapter } from "./providers/registry.js";

const config = Object.assign(
  {
    apiBaseUrl: "",
    googleOAuthEnabled: false,
    appName: "Bambuseae"
  },
  window.BAMBUSEAE_CONFIG || {}
);

const STORAGE_KEY = "bambuseae-state-v2";
const AUTH_SESSION_KEY = "bambuseae-auth-session-v1";
const REMEMBERED_AUTH_KEY = "bambuseae-remembered-auth-v1";
const ACCOUNTS_KEY = "bambuseae-local-accounts-v1";
const sessionKeys = Object.create(null);
const sessionModelNames = Object.create(null);
const app = document.querySelector("#app");
const modal = document.querySelector("#modal");
const toastRegion = document.querySelector("#toast-region");
let authMode = "login";

const defaultState = {
  authenticated: false,
  user: { name: "Khách dùng thử", email: "demo@bambuseae.local", initial: "K" },
  authProvider: null,
  rememberLogin: false,
  theme: "dark",
  workspaceOpen: true,
  activeView: "chat",
  activeProjectId: null,
  activeThreadId: null,
  activeModelId: "bambuseae-free",
  libraryFilter: "all",
  accountMenuOpen: false,
  autoFallback: true,
  fallbackThreshold: 10,
  lastHandoff: null,
  models: cloneModelCatalog(),
  skills: [
    {
      id: "continuity",
      name: "Mạch chuyện liên tục",
      description: "Giữ nhân vật, mục tiêu, quyết định và ngữ cảnh khi đổi AI.",
      instructions: "Luôn đọc bản tóm tắt dự án trước khi trả lời. Không tự ý thay đổi các quyết định đã chốt.",
      tags: ["ngữ cảnh", "handoff"],
      enabled: true,
      icon: "∞",
      scope: "Dùng chung"
    },
    {
      id: "creative-architect",
      name: "Kiến trúc sáng tạo",
      description: "Biến ý tưởng lớn thành cấu trúc rõ ràng, có thứ tự và dễ triển khai.",
      instructions: "Chia vấn đề thành các lớp. Nêu giả định, rủi ro và bước tiếp theo bằng ngôn ngữ dễ hiểu.",
      tags: ["lập kế hoạch", "sáng tạo"],
      enabled: true,
      icon: "◇",
      scope: "Dùng chung"
    },
    {
      id: "code-review",
      name: "Kiểm tra mã chuẩn",
      description: "Tìm lỗi, rủi ro bảo mật và đề xuất cách sửa có thể kiểm thử.",
      instructions: "Ưu tiên độ đúng, bảo mật và khả năng bảo trì. Khi sửa mã, giải thích ngắn gọn nguyên nhân.",
      tags: ["code", "bảo mật"],
      enabled: false,
      icon: "{}",
      scope: "Cá nhân"
    }
  ],
  plugins: [
    {
      id: "context-handoff",
      name: "Context Handoff",
      description: "Đóng gói ngữ cảnh và chuyển tiếp sang AI khác khi cần.",
      permission: "Chỉ đọc",
      enabled: true,
      icon: "⇢",
      scope: "Hệ thống"
    },
    {
      id: "token-monitor",
      name: "Token Monitor",
      description: "Ghi nhận token đầu vào, đầu ra, hạn mức và cảnh báo chuyển AI.",
      permission: "Số liệu sử dụng",
      enabled: true,
      icon: "◒",
      scope: "Hệ thống"
    },
    {
      id: "project-library",
      name: "Project Library",
      description: "Đọc Skill, file và ghi chú đã gắn với dự án hiện tại.",
      permission: "Đọc thư viện",
      enabled: true,
      icon: "▦",
      scope: "Dùng chung"
    }
  ],
  projects: [],
  threads: [],
  connections: [],
  usageLog: []
};

let state = loadState();

function readStorage(storage, key, fallback = null) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeStorage(storage, key) {
  try { storage.removeItem(key); } catch { /* storage có thể bị trình duyệt chặn */ }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readAccounts() {
  const accounts = readStorage(window.localStorage, ACCOUNTS_KEY, []);
  return Array.isArray(accounts) ? accounts : [];
}

function writeAccounts(accounts) {
  return writeStorage(window.localStorage, ACCOUNTS_KEY, accounts);
}

function findLocalAccount(email) {
  const normalizedEmail = normalizeEmail(email);
  return readAccounts().find((account) => normalizeEmail(account.email) === normalizedEmail) || null;
}

function readAuthSnapshot() {
  const snapshot = readStorage(window.sessionStorage, AUTH_SESSION_KEY) || readStorage(window.localStorage, REMEMBERED_AUTH_KEY);
  return snapshot?.email ? snapshot : null;
}

function accountProfile(account) {
  const name = String(account?.name || "Khách dùng thử").trim() || "Khách dùng thử";
  return {
    name,
    email: normalizeEmail(account?.email) || "demo@bambuseae.local",
    initial: name.slice(0, 1).toUpperCase()
  };
}

function makeAuthSnapshot(account) {
  return { ...accountProfile(account), provider: account?.provider || "local", at: new Date().toISOString() };
}

function setAuthSession(account, remember) {
  const snapshot = makeAuthSnapshot(account);
  writeStorage(window.sessionStorage, AUTH_SESSION_KEY, snapshot);
  if (remember) writeStorage(window.localStorage, REMEMBERED_AUTH_KEY, snapshot);
  else removeStorage(window.localStorage, REMEMBERED_AUTH_KEY);
  state.user = accountProfile(account);
  state.authProvider = snapshot.provider;
  state.rememberLogin = Boolean(remember);
  state.authenticated = true;
}

function clearAuthSession() {
  removeStorage(window.sessionStorage, AUTH_SESSION_KEY);
  removeStorage(window.localStorage, REMEMBERED_AUTH_KEY);
  state.authenticated = false;
  state.authProvider = null;
  state.rememberLogin = false;
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createPasswordSalt() {
  if (!globalThis.crypto?.getRandomValues) throw new Error("SECURE_CONTEXT_REQUIRED");
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle || !globalThis.TextEncoder) throw new Error("SECURE_CONTEXT_REQUIRED");
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

async function createPasswordRecord(password) {
  const salt = createPasswordSalt();
  return { salt, passwordHash: await hashPassword(password, salt) };
}

async function verifyPassword(account, password) {
  if (!account?.salt || !account?.passwordHash) return false;
  return (await hashPassword(password, account.salt)) === account.passwordHash;
}

function mergeModelCatalog(savedModels) {
  const catalog = structuredClone(defaultState.models);
  if (!Array.isArray(savedModels)) return catalog;
  const defaultIds = new Set(catalog.map((model) => model.id));
  const savedById = new Map(savedModels.filter((model) => model?.id).map((model) => [model.id, model]));
  return [
    ...catalog.map((model) => ({ ...model, ...(savedById.get(model.id) || {}) })),
    ...savedModels.filter((model) => model?.id && !defaultIds.has(model.id)).map((model) => ({ ...model }))
  ];
}

function clearUnverifiedUsage(model) {
  const next = { ...model };
  const trustedSources = new Set(["provider", "gateway", "session"]);
  if (!trustedSources.has(next.usageSource)) {
    next.used = null;
    next.limit = null;
  }
  return next;
}

function cleanUsageLog(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) => {
    const input = Number(entry?.input);
    const output = Number(entry?.output);
    const total = Number(entry?.total);
    return ["API", "API thật", "Gateway"].includes(entry?.source) && Number.isFinite(input) && Number.isFinite(output) && Number.isFinite(total);
  });
}

function normalizeThreads(threads, projects) {
  if (!Array.isArray(threads)) return [];
  const projectIds = new Set((Array.isArray(projects) ? projects : []).map((project) => project?.id));
  return threads.filter((thread) => thread?.id).map((thread) => {
    const projectId = projectIds.has(thread.projectId) ? thread.projectId : null;
    return {
      ...thread,
      projectId,
      memoryScope: thread.memoryScope === "project" && projectId ? "project" : "global",
      messages: Array.isArray(thread.messages) ? thread.messages : [],
      createdAtAt: Number(thread.createdAtAt) || 0,
      updatedAtAt: Number(thread.updatedAtAt) || Number(thread.createdAtAt) || 0
    };
  });
}

function normalizeModelRuntime(models) {
  return models.map((rawModel) => {
    const model = clearUnverifiedUsage(rawModel);
    if (model.webOnly) {
      return {
        ...model,
        available: true,
        remoteAvailable: false,
        status: model.apiConnectorId ? "Cần API để chạy trong app" : "Chỉ có web consumer",
        note: model.note || "Không lấy cookie web và không tạo phản hồi giả trong Bambuseae"
      };
    }
    if (model.local) {
      return {
        ...model,
        available: false,
        remoteAvailable: false,
        status: "Chưa cài runtime",
        note: model.note || "Chưa cài runtime AI cục bộ; Bambuseae không tạo phản hồi giả"
      };
    }
    if (model.shared) {
      return {
        ...model,
        remoteAvailable: false,
        status: config.apiBaseUrl ? "Đang kiểm tra gateway" : "Chưa có gateway",
        note: config.apiBaseUrl ? "Đang chờ gateway xác nhận model" : "Chưa có gateway; Bambuseae không tạo phản hồi giả"
      };
    }
    if (config.apiBaseUrl && sessionKeys[model.id]) return { ...model, remoteAvailable: false };
    return {
      ...model,
      available: false,
      remoteAvailable: false,
      status: "Chưa kết nối",
      note: config.apiBaseUrl ? "Nhập API key để mở AI trong phiên này" : "Cần API gateway và API key"
    };
  });
}

function normalizeTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const authSnapshot = readAuthSnapshot();
    const savedAccount = authSnapshot?.email ? findLocalAccount(authSnapshot.email) : null;
    const restoredUser = savedAccount
      ? accountProfile(savedAccount)
      : authSnapshot?.email
        ? accountProfile(authSnapshot)
        : structuredClone(defaultState.user);
    if (!saved) {
      return {
        ...structuredClone(defaultState),
        authenticated: Boolean(authSnapshot),
        user: restoredUser,
        authProvider: authSnapshot?.provider || null,
        rememberLogin: Boolean(readStorage(window.localStorage, REMEMBERED_AUTH_KEY)),
        models: normalizeModelRuntime(structuredClone(defaultState.models))
      };
    }
    return {
      ...structuredClone(defaultState),
      ...saved,
      authenticated: Boolean(authSnapshot),
      user: restoredUser,
      authProvider: authSnapshot?.provider || null,
      rememberLogin: Boolean(readStorage(window.localStorage, REMEMBERED_AUTH_KEY)),
      theme: normalizeTheme(saved.theme),
      models: normalizeModelRuntime(mergeModelCatalog(saved.models)),
      skills: saved.skills || structuredClone(defaultState.skills),
      plugins: saved.plugins || structuredClone(defaultState.plugins),
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      threads: normalizeThreads(saved.threads, saved.projects),
      usageLog: cleanUsageLog(saved.usageLog),
      connections: saved.connections || []
    };
  } catch {
    const fallbackState = structuredClone(defaultState);
    fallbackState.models = normalizeModelRuntime(fallbackState.models);
    return fallbackState;
  }
}

function saveState() {
  const snapshot = structuredClone(state);
  // Phiên đăng nhập được giữ riêng trong sessionStorage/localStorage marker.
  // Không để trạng thái authenticated cũ tự mở khóa sau khi reload.
  snapshot.authenticated = false;
  snapshot.authProvider = null;
  snapshot.rememberLogin = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function applyTheme() {
  const theme = normalizeTheme(state.theme);
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f4f8f3" : "#091116");
}

function themeButtonMarkup(className = "") {
  const isLight = state.theme === "light";
  const nextLabel = isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";
  return `<button class="button button-icon theme-toggle ${className}" type="button" data-action="toggle-theme" aria-label="${nextLabel}" title="${nextLabel}"><span aria-hidden="true">${isLight ? "☾" : "☼"}</span><span class="sr-only">${nextLabel}</span></button>`;
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme();
  saveState();
  render();
  toast(state.theme === "light" ? "Đã chuyển sang giao diện sáng." : "Đã chuyển sang giao diện tối.", "success");
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function formatText(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, Number(value) || 0));
}

function exactNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(Number(value) || 0)));
}

function nowTime() {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getModel(id) {
  return state.models.find((model) => model.id === id) || state.models[0];
}

function getApiConnector(model) {
  if (!model) return null;
  if (model.apiConnectorId) return state.models.find((item) => item.id === model.apiConnectorId) || null;
  return model.webOnly || model.local ? null : model;
}

function isInAppConnected(model) {
  const connector = getApiConnector(model);
  if (!connector || !config.apiBaseUrl || connector.local || connector.webOnly) return false;
  if (connector.shared) return connector.remoteAvailable === true;
  return Boolean(sessionKeys[connector.id] && connector.available);
}

function modelUsageStats(model) {
  const ownStats = usageStats(model);
  if (ownStats.hasQuota || ownStats.hasUsage || ownStats.hasLimit || !model?.apiConnectorId) return ownStats;
  return usageStats(getApiConnector(model));
}

function getProject(id = state.activeProjectId) {
  return state.projects.find((project) => project.id === id) || null;
}

function getThread(id = state.activeThreadId) {
  return state.threads.find((thread) => thread.id === id) || null;
}

function usageStats(model) {
  const parsedUsed = Number(model?.used);
  const parsedLimit = Number(model?.limit);
  const hasUsage = Number.isFinite(parsedUsed) && parsedUsed >= 0;
  const hasLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
  const hasQuota = hasUsage && hasLimit;
  const used = hasUsage ? parsedUsed : 0;
  const limit = hasLimit ? parsedLimit : 0;
  const usedPercent = hasQuota ? Math.min(100, (used / limit) * 100) : null;
  const remaining = hasQuota ? Math.max(0, limit - used) : null;
  const remainingPercent = hasQuota ? Math.max(0, 100 - usedPercent) : null;
  return { hasUsage, hasLimit, hasQuota, used, limit, usedPercent, remaining, remainingPercent };
}

function usageStatusLabel(model) {
  const stats = modelUsageStats(model);
  if (stats.hasQuota) return `quota ${exactNumber(stats.limit)} token`;
  if (stats.hasUsage && stats.hasLimit) return `đã dùng ${exactNumber(stats.used)} token · quota ${exactNumber(stats.limit)} token`;
  if (stats.hasUsage) return `đã dùng ${exactNumber(stats.used)} token · chưa có quota`;
  if (stats.hasLimit) return `quota ${exactNumber(stats.limit)} token · chưa có usage`;
  return "chưa có usage/quota thật";
}

function getFallbackModel(currentId) {
  return state.models.find((model) => model.id !== currentId && !model.local && isInAppConnected(model) && modelUsageStats(model).hasQuota && modelUsageStats(model).remaining > 0) || null;
}

function modelOptionList() {
  const groups = new Map();
  state.models.forEach((model) => {
    const group = groups.get(model.provider) || [];
    group.push(model);
    groups.set(model.provider, group);
  });
  return [...groups.entries()].map(([provider, models]) => `<optgroup label="${escapeHtml(provider)}">${models.map((model) => {
    const live = model.remoteAvailable === true && Boolean(config.apiBaseUrl);
    const inApp = isInAppConnected(model);
    const status = model.webOnly
      ? model.apiConnectorId ? (inApp ? "API trong app" : "cần API") : "chỉ có web"
      : model.local
      ? "cục bộ · không API"
      : model.shared
        ? config.apiBaseUrl
          ? live ? "đã kết nối" : "đang kiểm tra"
        : "chưa có gateway"
      : model.available
        ? config.apiBaseUrl ? "đã nhập key" : "chờ gateway"
        : "chưa kết nối";
    const disabled = model.webOnly ? "" : model.available ? "" : "disabled";
    return `<option value="${escapeHtml(model.id)}" ${model.id === state.activeModelId ? "selected" : ""} ${disabled}>${escapeHtml(model.name)} · ${status}</option>`;
  }).join("")}</optgroup>`).join("");
}

function renderBrand() {
  return `<div class="brand"><div class="brand-mark"><img src="./icon.svg" alt="" /></div><div><div class="brand-name">Bambuseae</div><span class="brand-sub">AI workspace</span></div></div>`;
}

function accountMenuMarkup(className = "") {
  const menuOpen = state.accountMenuOpen === true;
  return `<div class="account-control ${className}"><button class="account-trigger" type="button" data-action="toggle-account-menu" aria-expanded="${menuOpen}" aria-haspopup="menu"><div class="avatar ${className.includes("topbar") ? "top-avatar" : ""}">${escapeHtml(state.user.initial || "K")}</div><span class="profile-copy account-trigger-copy"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.email)}</span></span><span class="account-chevron" aria-hidden="true">⌄</span></button><div class="account-menu ${menuOpen ? "open" : ""}" role="menu"><div class="account-menu-head"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.email)}</span><small>${escapeHtml(authProviderLabel())}</small></div><button class="account-menu-item" type="button" data-action="view" data-view="settings">⚙ Cài đặt tài khoản</button><button class="account-menu-item account-menu-danger" type="button" data-action="demo-logout">↪ Đăng xuất / đổi tài khoản</button></div></div>`;
}

function modelPill(model) {
  if (!model) return "";
  return `<span class="model-chip"><span>${escapeHtml(model.name)}</span><span>· ${escapeHtml(model.tier)}</span></span>`;
}

function quotaMeter(model, compact = false) {
  const stats = usageStats(model);
  if (!stats.hasQuota) {
    const headline = stats.hasUsage && stats.hasLimit ? `Đã dùng ${exactNumber(stats.used)} token · quota ${exactNumber(stats.limit)} token` : stats.hasUsage ? `Đã dùng ${exactNumber(stats.used)} token theo API` : stats.hasLimit ? `Quota ${exactNumber(stats.limit)} token theo gateway` : "Chưa có usage thật";
    return `<div class="quota-unknown"><strong>${headline}</strong><span>${stats.hasUsage && stats.hasLimit ? "Đang chờ đủ usage/quota để tính phần trăm." : "Phần trăm chỉ xuất hiện khi gateway trả đủ usage và quota thật."}</span></div>`;
  }
  const warning = stats.remainingPercent <= state.fallbackThreshold;
  return `
    <div class="quota-row">
      <span class="quota-label">Hạn mức token</span>
      <span class="quota-numbers">${exactNumber(stats.used)} / ${exactNumber(stats.limit)}</span>
    </div>
    <div class="progress" aria-label="Đã dùng ${Math.round(stats.usedPercent)} phần trăm">
      <div class="progress-bar" style="--progress:${stats.usedPercent}%"></div>
    </div>
    <div class="quota-foot">
      <strong class="${warning ? "quota-warning" : ""}">${Math.round(stats.remainingPercent)}% còn lại</strong>
      <span>${compact ? "" : escapeHtml(model.reset)}</span>
    </div>`;
}

function renderSidebar() {
  const pinnedProjects = state.projects.filter((project) => project.pinned).slice(0, 3);
  const pinnedThreads = state.threads.filter((thread) => thread.pinned).slice(0, 4);
  const workspaceOpen = state.workspaceOpen !== false;
  return `
    <aside class="sidebar" id="sidebar">
      ${renderBrand()}
      <button class="button button-primary new-chat" data-action="new-chat"><span>＋</span> Đoạn chat mới</button>
      <section class="workspace-nav" aria-label="Không gian Bambuseae">
        <button class="workspace-toggle" type="button" data-action="toggle-workspace" aria-expanded="${workspaceOpen}"><span class="workspace-toggle-left"><span class="workspace-icon">⌘</span><strong>Không gian</strong></span><span class="workspace-toggle-right"><small>${state.projects.length} dự án</small><span aria-hidden="true">${workspaceOpen ? "⌃" : "⌄"}</span></span></button>
        <div class="workspace-panel ${workspaceOpen ? "open" : "collapsed"}">
          <nav aria-label="Công cụ trong Không gian">
            <div class="nav-list">
              ${navItem("recent", "◴", "Gần đây", state.threads.length)}
              ${navItem("pinned", "⚑", "Đã ghim", pinnedProjects.length + pinnedThreads.length)}
              ${navItem("projects", "⌂", "Dự án", state.projects.length)}
              ${navItem("library", "▦", "Thư viện", state.skills.length + state.plugins.length)}
              ${navItem("usage", "◒", "AI & hạn mức", state.models.length)}
            </div>
          </nav>
          <div class="sidebar-section">
            <div class="nav-label">Đã ghim</div>
            <div class="pinned-list">
              ${pinnedProjects.map((project) => `<button class="pinned-item" data-action="select-project" data-project-id="${escapeHtml(project.id)}"><span>◆</span><span><strong>${escapeHtml(project.name)}</strong><small>Dự án</small></span></button>`).join("")}
              ${pinnedThreads.map((thread) => `<button class="pinned-item" data-action="select-thread" data-thread-id="${escapeHtml(thread.id)}"><span>⚑</span><span><strong>${escapeHtml(thread.title)}</strong><small>Đoạn chat</small></span></button>`).join("")}
              ${pinnedProjects.length + pinnedThreads.length ? "" : `<div class="pinned-empty">Chưa có mục nào được ghim.</div>`}
            </div>
          </div>
        </div>
      </section>
      <div class="sidebar-footer">${accountMenuMarkup("sidebar-account")}</div>
    </aside>`;
}

function navItem(view, icon, label, count) {
  return `<button class="nav-item ${state.activeView === view ? "active" : ""}" data-action="view" data-view="${view}"><span class="nav-left"><span class="nav-icon">${icon}</span>${label}</span><span class="count">${count}</span></button>`;
}

function renderTopbar() {
  const demo = !config.apiBaseUrl;
  const liveCount = state.models.filter((model) => model.remoteAvailable === true).length;
  const localCount = state.models.filter((model) => model.local && model.available).length;
  const demoCount = state.models.filter((model) => model.shared && !model.local && model.available).length;
  const webCount = state.models.filter((model) => model.webOnly).length;
  const statusText = demo ? `Chưa có gateway · ${localCount} cục bộ · ${demoCount} AI chờ gateway · ${webCount} AI web` : `Gateway · ${liveCount}/${state.models.length} AI đã xác nhận · ${webCount} AI web`;
  const project = getProject();
  return `
    <header class="topbar">
      <div class="topbar-left"><button class="button button-icon mobile-menu" aria-label="Mở menu" data-action="toggle-sidebar">☰</button><span class="topbar-context">Không gian riêng · ${escapeHtml(project?.name || "Chưa có dự án")}</span><label class="topbar-model"><span>AI</span><select class="topbar-model-select" data-action="select-model" aria-label="Chọn AI nhanh">${modelOptionList()}</select></label></div>
      <div class="topbar-right"><span class="status-pill ${demo ? "demo" : ""}" title="${demo ? "GitHub Pages chỉ là giao diện tĩnh; hãy cấu hình apiBaseUrl để gọi AI thật." : "Trạng thái được đọc từ API gateway; key cá nhân vẫn chỉ giữ trong phiên."}">${statusText}</span>${themeButtonMarkup()}<button class="button button-icon" aria-label="Mở cài đặt" data-action="view" data-view="settings">⚙</button>${accountMenuMarkup("topbar-account")}</div>
    </header>`;
}

function renderShell() {
  return `<div class="app-shell">${renderSidebar()}<div class="content">${renderTopbar()}<main id="main-content" class="${state.activeView === "chat" ? "chat-page" : ""}">${renderView()}</main></div></div>`;
}

function renderView() {
  switch (state.activeView) {
    case "recent": return renderRecentView();
    case "projects": return renderProjectsView();
    case "library": return renderLibraryView();
    case "usage": return renderUsageView();
    case "settings": return renderSettingsView();
    case "pinned": return renderPinnedView();
    default: return renderChatView();
  }
}

function renderHeading(eyebrow, title, description, actions = "") {
  return `<div class="view-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="view-description">${escapeHtml(description)}</p></div><div class="head-actions">${actions}</div></div>`;
}

function renderChatView() {
  const project = getProject();
  const thread = getThread();
  const model = getModel(state.activeModelId);
  if (!thread) return renderEmptyWorkspaceChat(model, project);
  const stats = modelUsageStats(model);
  const tokenLabel = stats.hasQuota ? `${Math.round(stats.remainingPercent)}% token còn lại` : stats.hasUsage && stats.hasLimit ? `đã dùng ${exactNumber(stats.used)} token · quota ${exactNumber(stats.limit)} token` : stats.hasUsage ? `đã dùng ${exactNumber(stats.used)} token · chưa có quota` : "chưa có quota/usage thật";
  const handoff = state.lastHandoff && state.lastHandoff.threadId === thread.id ? state.lastHandoff : null;
  const connectionLabel = modelConnectionLabel(model);
  return `
    <section class="chat-focus" aria-label="Không gian chat">
      <header class="chat-focus-header"><div class="chat-focus-title"><div class="chat-context-line"><span class="eyebrow">Không gian hội thoại</span><span class="chat-context-separator">·</span><span class="chat-project-label">${escapeHtml(project?.name || "Chat độc lập")}</span></div><h1>${escapeHtml(thread.title)}</h1><div class="chat-meta"><span>${escapeHtml(model.name)}</span><span>· ${escapeHtml(connectionLabel)}</span><span>· ${escapeHtml(tokenLabel)}</span>${handoff ? `<span>· Đã chuyển từ ${escapeHtml(handoff.fromName)}</span>` : ""}</div></div><div class="chat-focus-actions"><button class="button button-quiet" data-action="handoff">⇢ Chuyển AI</button><button class="button button-gold" data-action="open-modal" data-modal="new-project">＋ Tạo dự án</button></div></header>
      <section class="card conversation conversation-focus" aria-label="Đoạn chat hiện tại"><div class="thread-bar"><div class="thread-title"><strong>${escapeHtml(thread.title)}</strong><span>${escapeHtml(project?.name || "Chat độc lập")} · ${memoryScopeLabel(thread)} · ${thread.messages.length} tin nhắn</span></div><div class="thread-actions"><button class="button button-icon button-quiet" aria-label="Ghim đoạn chat" data-action="toggle-thread-pin" data-thread-id="${escapeHtml(thread.id)}">${thread.pinned ? "⚑" : "⚐"}</button></div></div><div class="messages" id="messages">${thread.messages.length ? thread.messages.map(renderMessage).join("") : renderEmptyChat()}</div><div class="suggestion-row"><button class="suggestion" data-action="select-suggestion" data-text="Tóm tắt những điểm quan trọng của mạch chuyện hiện tại.">Tóm tắt mạch chuyện</button><button class="suggestion" data-action="handoff">Chuyển sang AI khác</button><button class="suggestion" data-action="open-modal" data-modal="new-skill">＋ Thêm Skill</button></div><form class="composer" data-form="composer"><textarea name="prompt" rows="1" placeholder="Viết yêu cầu tiếp theo…" aria-label="Nội dung yêu cầu"></textarea><div class="composer-tools"><select class="model-mini" data-action="select-model" aria-label="AI cho tin nhắn">${modelOptionList()}</select><button class="send-button" type="submit" aria-label="Gửi">↑</button></div></form></section>
    </section>`;
}

function memoryScopeLabel(thread) {
  return thread?.memoryScope === "project" ? "Bộ nhớ dự án" : "Bộ nhớ toàn bộ";
}

function renderRecentView() {
  const threads = state.threads.slice().sort((a, b) => Number(b.updatedAtAt || b.createdAtAt || 0) - Number(a.updatedAtAt || a.createdAtAt || 0));
  const content = threads.length
    ? `<div class="recent-thread-list">${threads.map(renderRecentThreadTile).join("")}</div>`
    : `<div class="card card-pad empty-project-state"><div class="empty-icon">◴</div><h2>Chưa có cuộc trò chuyện</h2><p>Bambuseae để trống từ đầu. Những cuộc trò chuyện bạn tạo sẽ xuất hiện tại đây.</p><button class="button button-primary" data-action="new-chat">＋ Tạo cuộc trò chuyện mới</button></div>`;
  return `${renderHeading("Không gian", "Gần đây", "Các cuộc trò chuyện cũ được giữ riêng, không tự tạo nhánh và không ghi đè lên nhau.", `<button class="button button-primary" data-action="new-chat">＋ Cuộc trò chuyện mới</button>`)}${content}`;
}

function renderRecentThreadTile(thread) {
  const project = getProject(thread.projectId);
  return `<article class="card recent-thread-tile"><div class="recent-thread-main"><div class="tile-icon">◌</div><div><h3>${escapeHtml(thread.title || "Cuộc trò chuyện mới")}</h3><p>${escapeHtml(project?.name || "Chat độc lập")} · ${memoryScopeLabel(thread)} · ${thread.messages.length} tin nhắn</p></div></div><div class="recent-thread-actions"><span class="tag">${escapeHtml(thread.updatedAt || "Mới tạo")}</span><button class="button button-primary" data-action="select-thread" data-thread-id="${escapeHtml(thread.id)}">Mở chat →</button></div></article>`;
}

function modelConnectionLabel(model) {
  if (model?.webOnly) {
    if (model.apiConnectorId && isInAppConnected(model)) return "AI thật trong Bambuseae qua API";
    if (model.apiConnectorId) return "Cần API chính thức để dùng trong app";
    return "Chỉ có tài khoản web · chưa có API tương đương";
  }
  if (model?.local) return "Chạy cục bộ · không cần API";
  if (model?.remoteAvailable === true) return "AI thật qua gateway";
  if (model?.shared && !config.apiBaseUrl) return "Chưa có gateway";
  if (model?.shared) return "Đang kiểm tra gateway";
  if (model?.available) return "Đã nhập key · chờ gateway";
  return "Chưa kết nối";
}

function renderEmptyWorkspaceChat(model, project) {
  const hasProject = Boolean(project);
  const title = hasProject ? "Chưa có đoạn chat" : "Không gian đang trống";
  const description = hasProject
    ? "Dự án này chưa có cuộc trò chuyện. Tạo một đoạn chat mới khi bạn sẵn sàng."
    : "Bambuseae không tự tạo dự án hoặc cuộc trò chuyện. Hãy bắt đầu theo cách của bạn.";
  const primaryAction = hasProject
    ? `<button class="button button-primary" data-action="new-chat">＋ Tạo đoạn chat</button>`
    : `<button class="button button-primary" data-action="new-chat">＋ Tạo cuộc trò chuyện</button>`;
  return `<section class="chat-focus" aria-label="Không gian chat trống"><header class="chat-focus-header"><div class="chat-focus-title"><div class="chat-context-line"><span class="eyebrow">Không gian hội thoại</span><span class="chat-context-separator">·</span><span class="chat-project-label">${escapeHtml(project?.name || "Chưa có dự án")}</span></div><h1>${title}</h1><div class="chat-meta"><span>${escapeHtml(model?.name || "Chưa chọn AI")}</span><span>· ${escapeHtml(modelConnectionLabel(model))}</span></div></div><div class="chat-focus-actions">${primaryAction}<button class="button button-gold" data-action="view" data-view="projects">Quản lý dự án</button></div></header><section class="card conversation conversation-focus empty-conversation" aria-label="Chưa có nội dung chat"><div class="empty-chat"><div><div class="empty-icon">✦</div><h2>${title}</h2><p>${description}</p><div class="empty-actions">${primaryAction}<button class="button button-quiet" data-action="view" data-view="library">Mở thư viện</button></div></div></div></section></section>`;
}

function renderMessage(message) {
  const model = message.modelId ? getModel(message.modelId) : null;
  const roleLabel = message.role === "user" ? "Bạn" : "Bambuseae";
  const sourceLabel = message.role === "user" ? "" : `${escapeHtml(model?.name || "AI")} · ${escapeHtml(message.source || "Mô phỏng")}`;
  const avatar = message.role === "user" ? "U" : `<img src="./icon.svg" alt="" />`;
  return `<article class="message ${message.role === "user" ? "user" : "assistant"}"><div class="message-avatar">${avatar}</div><div class="message-stack"><div class="message-meta"><span>${roleLabel}</span>${sourceLabel ? `<span>· ${sourceLabel}</span>` : ""}<span>${escapeHtml(message.time || "")}</span><button class="message-pin ${message.pinned ? "pinned" : ""}" aria-label="${message.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}" data-action="toggle-message-pin" data-message-id="${escapeHtml(message.id)}">${message.pinned ? "⚑" : "⚐"}</button></div><div class="message-bubble">${formatText(message.content)}</div></div></article>`;
}

function renderEmptyChat() {
  return `<div class="empty-chat"><div><div class="empty-icon">✦</div><h2>Bắt đầu một mạch mới</h2><p>Viết yêu cầu đầu tiên. Bambuseae sẽ dùng Skill, Plugin và ngữ cảnh của dự án này.</p></div></div>`;
}

function renderProjectsView() {
  const totalMessages = state.threads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const projectCards = state.projects.map(renderProjectTile).join("") || `<div class="card card-pad empty-project-state"><div class="empty-icon">⌂</div><h2>Chưa có dự án</h2><p>Bambuseae để trống từ đầu. Bạn có thể tạo dự án bất cứ lúc nào.</p><button class="button button-primary" data-action="open-modal" data-modal="new-project">＋ Tạo dự án đầu tiên</button></div>`;
  return `${renderHeading("Không gian làm việc", "Dự án của bạn", "Mỗi dự án giữ riêng hội thoại, Skill, Plugin và tài liệu liên quan.", `<button class="button button-primary" data-action="open-modal" data-modal="new-project">＋ Tạo dự án</button>`)}
    <div class="grid-4" style="margin-bottom:1rem"><article class="card stat-card stat-green"><span class="stat-label">Dự án</span><strong>${state.projects.length}</strong><small>đang quản lý</small></article><article class="card stat-card stat-gold"><span class="stat-label">Đoạn chat</span><strong>${state.threads.length}</strong><small>có thể ghim</small></article><article class="card stat-card stat-blue"><span class="stat-label">Tin nhắn</span><strong>${totalMessages}</strong><small>trong các Thread</small></article><article class="card stat-card"><span class="stat-label">Skill chung</span><strong>${state.skills.length}</strong><small>dùng cho mọi AI</small></article></div>
    <div class="project-card-grid">${projectCards}</div>`;
}

function renderProjectTile(project) {
  const threadCount = state.threads.filter((thread) => thread.projectId === project.id).length;
  const skillsCount = project.skillIds?.length || 0;
  return `<article class="card project-tile" style="--accent:${escapeHtml(project.color || "#9fe777")}"><div class="tile-top"><div class="tile-icon">⌂</div><button class="pin-button ${project.pinned ? "pinned" : ""}" aria-label="Ghim dự án" data-action="toggle-project-pin" data-project-id="${escapeHtml(project.id)}">${project.pinned ? "◆" : "◇"}</button></div><div class="tile-copy"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p></div><div class="tile-footer"><span>${threadCount} chat · ${skillsCount} Skill</span><span>${escapeHtml(project.updatedAt || "")}</span></div><div class="tile-actions"><button class="button button-primary" data-action="select-project" data-project-id="${escapeHtml(project.id)}">Mở dự án →</button><button class="button button-quiet" data-action="new-thread-in-project" data-project-id="${escapeHtml(project.id)}">＋ Thêm chat</button><button class="button button-danger" data-action="delete-project" data-project-id="${escapeHtml(project.id)}">Xóa</button></div></article>`;
}

function renderLibraryView() {
  const filter = state.libraryFilter;
  const showSkills = filter === "all" || filter === "skills";
  const showPlugins = filter === "all" || filter === "plugins";
  const showChats = filter === "all" || filter === "chats";
  return `${renderHeading("Kho dùng chung", "Thư viện Bambuseae", "Skill và Plugin ở đây có thể gắn vào mọi dự án và được chuyển cùng ngữ cảnh khi đổi AI.", `<button class="button button-primary" data-action="open-modal" data-modal="new-skill">＋ Thêm Skill</button><button class="button button-quiet" data-action="open-modal" data-modal="new-plugin">＋ Thêm Plugin</button>`)}
    <div class="filter-row" role="tablist" aria-label="Lọc thư viện"><button class="filter-button ${filter === "all" ? "active" : ""}" data-action="set-library-filter" data-filter="all">Tất cả</button><button class="filter-button ${filter === "skills" ? "active" : ""}" data-action="set-library-filter" data-filter="skills">Skill (${state.skills.length})</button><button class="filter-button ${filter === "plugins" ? "active" : ""}" data-action="set-library-filter" data-filter="plugins">Plugin (${state.plugins.length})</button><button class="filter-button ${filter === "chats" ? "active" : ""}" data-action="set-library-filter" data-filter="chats">Chat đã ghim (${state.threads.filter((thread) => thread.pinned).length})</button></div>
    ${showSkills ? `<section style="margin-bottom:1.5rem"><div class="section-head"><div><p class="section-title">Skill dùng chung</p><p>Hướng dẫn hành vi và chuyên môn cho mọi AI.</p></div></div><div class="library-grid">${state.skills.map(renderSkillTile).join("")}</div></section>` : ""}
    ${showPlugins ? `<section style="margin-bottom:1.5rem"><div class="section-head"><div><p class="section-title">Plugin dùng chung</p><p>Công cụ có quyền rõ ràng và cần xác nhận khi tác động dữ liệu.</p></div></div><div class="library-grid">${state.plugins.map(renderPluginTile).join("")}</div></section>` : ""}
    ${showChats ? `<section><div class="section-head"><div><p class="section-title">Đoạn chat đã ghim</p><p>Những mạch nội dung được lưu để mở lại nhanh.</p></div></div><div class="library-grid">${state.threads.filter((thread) => thread.pinned).map(renderChatTile).join("") || `<div class="card card-pad"><span class="empty-chip">Chưa có đoạn chat được ghim.</span></div>`}</div></section>` : ""}`;
}

function renderSkillTile(skill) {
  return `<article class="card library-tile" style="--accent:#9fe777"><div class="tile-top"><div class="tile-icon">${escapeHtml(skill.icon || "✦")}</div><label class="toggle"><input type="checkbox" data-action="toggle-skill" data-skill-id="${escapeHtml(skill.id)}" ${skill.enabled ? "checked" : ""} /> Bật</label></div><div class="tile-copy"><h3>${escapeHtml(skill.name)}</h3><p>${escapeHtml(skill.description)}</p></div><div class="tag-row">${(skill.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}<span class="tag">${escapeHtml(skill.scope || "Cá nhân")}</span></div></article>`;
}

function renderPluginTile(plugin) {
  return `<article class="card library-tile" style="--accent:#83c8e8"><div class="tile-top"><div class="tile-icon">${escapeHtml(plugin.icon || "◇")}</div><label class="toggle"><input type="checkbox" data-action="toggle-plugin" data-plugin-id="${escapeHtml(plugin.id)}" ${plugin.enabled ? "checked" : ""} /> Bật</label></div><div class="tile-copy"><h3>${escapeHtml(plugin.name)}</h3><p>${escapeHtml(plugin.description)}</p></div><div class="tag-row"><span class="tag plugin-chip">Quyền: ${escapeHtml(plugin.permission)}</span><span class="tag">${escapeHtml(plugin.scope || "Dùng chung")}</span></div></article>`;
}

function renderChatTile(thread) {
  const project = getProject(thread.projectId);
  return `<article class="card library-tile" style="--accent:#e4c36c"><div class="tile-top"><div class="tile-icon">⚑</div><button class="pin-button pinned" aria-label="Bỏ ghim đoạn chat" data-action="toggle-thread-pin" data-thread-id="${escapeHtml(thread.id)}">⚑</button></div><div class="tile-copy"><h3>${escapeHtml(thread.title)}</h3><p>${escapeHtml(project?.name || "Chat độc lập")} · ${memoryScopeLabel(thread)}<br>${thread.messages.length} tin nhắn · cập nhật ${escapeHtml(thread.updatedAt || "")}</p></div><div class="tile-actions"><button class="button button-primary button-wide" data-action="select-thread" data-thread-id="${escapeHtml(thread.id)}">Mở đoạn chat →</button></div></article>`;
}

function renderUsageView() {
  const available = state.models.filter((model) => model.available);
  const tracked = available.filter((model) => !model.webOnly);
  const measurable = tracked.filter((model) => usageStats(model).hasQuota);
  const observed = tracked.filter((model) => usageStats(model).hasUsage);
  const totalUsed = observed.reduce((sum, model) => sum + usageStats(model).used, 0);
  const totalRemaining = measurable.reduce((sum, model) => sum + usageStats(model).remaining, 0);
  const lowest = measurable.slice().sort((a, b) => usageStats(a).remainingPercent - usageStats(b).remainingPercent)[0];
  const totalUsedLabel = observed.length ? formatNumber(totalUsed) : "Chưa có";
  return `${renderHeading("Theo dõi sử dụng", "Hạn mức & token", "Theo dõi từng AI, nhận biết lúc sắp hết và chuyển sang mô hình dự phòng trước khi mạch chuyện bị ngắt.", `<button class="button button-gold" data-action="open-modal" data-modal="connection">＋ Kết nối AI</button>`)}
    <div class="grid-4" style="margin-bottom:1rem"><article class="card stat-card stat-green"><span class="stat-label">Token đã dùng</span><strong>${totalUsedLabel}</strong><small>${observed.length ? "usage thật từ API" : "chưa có AI trả usage"}</small></article><article class="card stat-card stat-blue"><span class="stat-label">Quota còn lại</span><strong>${measurable.length ? formatNumber(totalRemaining) : "Chưa có"}</strong><small>${measurable.length ? "chỉ khi gateway trả quota" : "không tự ước tính"}</small></article><article class="card stat-card stat-gold"><span class="stat-label">AI sắp hết nhất</span><strong>${lowest ? Math.round(usageStats(lowest).remainingPercent) : "—"}${lowest ? "%" : ""}</strong><small>${lowest ? escapeHtml(lowest.name) : "Chưa có quota thật"}</small></article><article class="card stat-card"><span class="stat-label">Cách đo</span><strong>${config.apiBaseUrl ? "API thật" : "Chưa kết nối"}</strong><small>${config.apiBaseUrl ? "chỉ lấy usage/quota gateway trả về" : "không tính demo"}</small></article></div>
    <section class="card card-pad model-catalog-panel"><div class="section-head"><div><p class="section-title">Danh mục AI</p><p>AI có API sẽ chạy trực tiếp trong Bambuseae qua gateway. AI web không có API tương đương sẽ không bị mở sang website khi bạn bấm gửi.</p></div><span class="tag">${state.models.length} lựa chọn · ${available.length} sẵn sàng</span></div><div class="model-catalog-grid">${state.models.map(renderModelCatalogCard).join("")}</div></section>
    <div class="section-head usage-detail-heading"><div><p class="section-title">Chi tiết AI đang bật</p><p>Chỉ hiển thị usage/quota do AI thật hoặc gateway trả về; không tính số liệu demo.</p></div></div>
    <section class="grid-2" style="margin-bottom:1rem">${tracked.map((model) => { const stats = usageStats(model); return `<article class="card card-pad"><div class="section-head"><div><p class="section-title">${escapeHtml(model.name)}</p><p>${escapeHtml(model.provider)} · ${escapeHtml(model.tier)}</p></div><span class="tag">${stats.hasQuota ? `${Math.round(stats.remainingPercent)}% còn` : "Chưa đủ số liệu"}</span></div>${quotaMeter(model)}<div class="metric-list" style="margin-top:.9rem"><div class="metric-line"><span>Đã dùng</span><strong>${stats.hasUsage ? `${exactNumber(stats.used)} token` : "Chưa có"}</strong></div><div class="metric-line"><span>Quota</span><strong>${stats.hasLimit ? `${exactNumber(stats.limit)} token` : "Chưa có"}</strong></div><div class="metric-line"><span>Làm mới</span><strong>${escapeHtml(model.reset || "Theo gateway")}</strong></div></div></article>`; }).join("") || `<div class="card card-pad"><span class="empty-chip">Chưa có AI API/cục bộ để đo token.</span></div>`}</section>
    <section class="card card-pad"><div class="section-head"><div><p class="section-title">Nhật ký gần đây</p><p>Input và output được ghi theo từng câu trả lời.</p></div><span class="tag">${state.usageLog.length} lượt</span></div><div class="table-wrap"><table><thead><tr><th>Thời gian</th><th>AI</th><th>Input</th><th>Output</th><th>Tổng</th><th>Nguồn</th></tr></thead><tbody>${state.usageLog.slice(0, 10).map((entry) => `<tr><td>${escapeHtml(entry.time)}</td><td>${escapeHtml(getModel(entry.modelId).name)}</td><td>${exactNumber(entry.input)}</td><td>${exactNumber(entry.output)}</td><td><strong>${exactNumber(entry.total)}</strong></td><td>${escapeHtml(entry.source)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderModelCatalogCard(model) {
  const connector = getApiConnector(model);
  const stats = modelUsageStats(model);
  const ready = model.webOnly ? isInAppConnected(model) : Boolean(model.available);
  const local = Boolean(model.local);
  const demo = model.shared && !config.apiBaseUrl;
  const live = model.remoteAvailable === true;
  const initials = String(model.provider || "AI").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const action = model.webOnly
    ? connector
      ? `<button class="button button-quiet" type="button" data-action="open-modal" data-modal="connection" data-model-id="${escapeHtml(connector.id)}">${ready ? "Quản lý API" : "Dùng trong Bambuseae"}</button>`
      : `<span class="catalog-inline-note">Chưa có API consumer</span>`
    : model.shared || local
    ? `<button class="button button-quiet" type="button" data-action="view" data-view="chat">Mở chat</button>`
    : `<button class="button button-quiet" type="button" data-action="open-modal" data-modal="connection" data-model-id="${escapeHtml(model.id)}">${ready ? "Quản lý" : "Kết nối"}</button>`;
  const statusLabel = model.webOnly ? connector ? (ready ? "AI thật trong app" : "Cần kết nối API") : "Chỉ có web" : local ? "Không cần API" : demo ? "Chưa có gateway" : live ? "AI thật" : model.shared ? "Đang kiểm tra" : ready ? "Đã nhập key" : "Chưa kết nối";
  const statusClass = (model.webOnly && !ready) || demo || !ready ? "demo" : "";
  const note = model.webOnly ? connector ? `${model.apiNote || "Kết nối API chính thức để dùng trực tiếp trong Bambuseae."} ${ready ? "Đã sẵn sàng gửi trong app." : "Chưa gửi nội dung đi khi chưa kết nối."}` : model.apiNote || "Nhà cung cấp này hiện chỉ có luồng web consumer trong danh mục." : local ? model.note || "Runtime cục bộ thật chưa được cài; không gửi nội dung ra ngoài trình duyệt." : demo ? "Chưa có gateway; Bambuseae không tạo phản hồi demo." : model.note || "Kết nối AI trong Cài đặt";
  const apiLink = !local && model.apiUrl ? officialApiLink(model) : "";
  const detail = model.webOnly ? `<p class="model-catalog-note">${escapeHtml(note)}</p>` : ready ? `${quotaMeter(model, true)}<p class="model-catalog-note">${escapeHtml(note)}</p>` : `<p class="model-catalog-note">${escapeHtml(note)}</p>`;
  const remainingLabel = model.webOnly && !connector ? "Không có API consumer trong app" : local ? "Chưa có runtime AI thật" : stats.hasQuota ? `${Math.round(stats.remainingPercent)}% token còn lại` : stats.hasUsage && stats.hasLimit ? `Đã dùng ${exactNumber(stats.used)} token · quota ${exactNumber(stats.limit)}` : stats.hasUsage ? `Đã dùng ${exactNumber(stats.used)} token · chưa có quota` : "Chưa có usage thật";
  return `<article class="model-catalog-card ${ready ? "ready" : ""}"><div class="model-catalog-head"><div class="provider-badge">${escapeHtml(initials)}</div><div class="model-catalog-copy"><strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(model.provider)} · ${escapeHtml(model.category)}</span></div><span class="status-pill ${statusClass}">${statusLabel}</span></div>${detail}<div class="model-catalog-footer"><span>${remainingLabel}</span><div class="model-catalog-actions">${apiLink}${action}</div></div></article>`;
}

function officialApiLink(model) {
  if (!model?.apiUrl) return "";
  return `<a class="api-link" href="${escapeHtml(model.apiUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(model.apiLabel || "Lấy API chính thức ↗")}</a>`;
}

function renderSettingsView() {
  return `${renderHeading("Thiết lập", "Cài đặt Bambuseae", "Kết nối AI, điều chỉnh cách chuyển tiếp và kiểm tra trạng thái bảo mật.", `<button class="button button-primary" data-action="open-modal" data-modal="connection">＋ Thêm kết nối</button>`)}
    <div class="settings-grid"><div class="settings-stack"><section class="card card-pad"><div class="section-head"><div><p class="section-title">Tài khoản</p><p>Google OAuth sẽ chạy qua backend và cookie phiên bảo mật.</p></div><span class="status-pill ${config.googleOAuthEnabled && config.apiBaseUrl ? "" : "demo"}">${config.googleOAuthEnabled && config.apiBaseUrl ? "Google đã cấu hình" : "Cần cấu hình backend"}</span></div><div class="connection-row"><div class="connection-icon">G</div><div class="connection-copy"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.email)} · ${escapeHtml(authProviderLabel())}</span></div><button class="button button-quiet" data-action="google-login">${state.authProvider === "google" ? "Đã liên kết Google" : "Liên kết Google"}</button></div><button class="button button-danger" data-action="demo-logout">Đăng xuất</button></section>
      <section class="card card-pad"><div class="section-head"><div><p class="section-title">Kết nối AI cần API</p><p>${config.apiBaseUrl ? "Gateway đã khai báo; AI thật sẽ được kiểm tra ở lần gửi đầu hoặc khi gateway trả trạng thái." : "Chưa có gateway; key cá nhân chỉ giữ tạm trong phiên trình duyệt."}</p></div></div>${state.models.filter((model) => !model.shared && !model.local && !model.webOnly).map((model) => `<div class="connection-row"><div class="connection-icon">${escapeHtml(model.provider.slice(0, 1))}</div><div class="connection-copy"><strong>${escapeHtml(model.name)}</strong><span>${model.remoteAvailable === true ? "AI thật qua gateway" : model.available ? "Đã nhập key · chờ gateway" : "Chưa kết nối"} · ${usageStatusLabel(model)}</span></div><div class="connection-actions">${officialApiLink(model)}<button class="button button-quiet" data-action="open-modal" data-modal="connection" data-model-id="${escapeHtml(model.id)}">${model.available ? "Kiểm tra" : "Kết nối"}</button></div></div>`).join("")}<div class="security-note" style="margin-top:.75rem"><strong>Không cần API:</strong> ${state.models.filter((model) => model.local).map((model) => escapeHtml(model.name)).join(", ") || "Chưa có model cục bộ"}. Các model này hiện là placeholder runtime offline, chưa được xem là AI thật.</div></section>
      <section class="card card-pad"><div class="section-head"><div><p class="section-title">AI web chạy trong Bambuseae</p><p>Không dùng iframe hay tự động hóa tài khoản web. Với AI có API chính thức, bạn kết nối một lần rồi chat ngay trong app; gói web Free không tự chuyển thành quota API.</p></div><span class="tag">${state.models.filter((model) => model.webOnly).length} AI</span></div><div class="web-ai-list">${state.models.filter((model) => model.webOnly).map((model) => { const connector = getApiConnector(model); const ready = isInAppConnected(model); return `<div class="connection-row"><div class="connection-icon">${escapeHtml(model.provider.slice(0, 1))}</div><div class="connection-copy"><strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(connector ? (ready ? "Đã sẵn sàng chạy trong Bambuseae qua API." : "Cần API key riêng để chạy trong Bambuseae.") : "Chỉ có luồng web consumer; chưa có API tương đương trong app.")}</span></div><div class="connection-actions">${officialApiLink(model)}${connector ? `<button class="button button-quiet" data-action="open-modal" data-modal="connection" data-model-id="${escapeHtml(connector.id)}">${ready ? "Quản lý API" : "Kết nối trong app"}</button>` : ""}</div></div>`; }).join("")}</div></section></div>
      <div class="settings-stack"><section class="card card-pad"><div class="section-head"><div><p class="section-title">Chuyển AI tự động</p><p>Giữ cùng Thread khi mô hình gần hoặc đã hết hạn mức.</p></div></div><div class="setting-row"><div class="setting-copy"><strong>Tự động chuyển AI</strong><span>Chuyển sang mô hình còn token khi cần.</span></div><input type="checkbox" data-setting="autoFallback" ${state.autoFallback ? "checked" : ""} aria-label="Tự động chuyển AI" /></div><div class="setting-row"><div class="setting-copy"><strong>Ngưỡng cảnh báo</strong><span>Bắt đầu cảnh báo khi còn dưới mức này.</span></div><div class="range-wrap"><input type="range" min="1" max="50" step="1" value="${state.fallbackThreshold}" data-setting="fallbackThreshold" aria-label="Ngưỡng cảnh báo" /><strong id="threshold-value">${state.fallbackThreshold}%</strong></div></div></section><section class="card card-pad"><div class="section-head"><div><p class="section-title">Bảo mật dữ liệu</p><p>Bản GitHub không chứa bí mật.</p></div></div><div class="security-note"><strong>Đang bảo vệ:</strong> config.js không có API key, khóa cá nhân không được lưu vào localStorage, và dữ liệu bản demo chỉ nằm trong trình duyệt này.</div><div class="security-note" style="margin-top:.6rem"><strong>Khi triển khai thật:</strong> dùng backend có Google OAuth, RLS theo tài khoản, mã hóa dữ liệu và gateway có giới hạn tốc độ. AI vẫn nhận nội dung cần xử lý để tạo câu trả lời.</div><button class="button button-danger" style="margin-top:.9rem" data-action="reset-demo">Xóa dữ liệu bản demo</button></section></div></div>`;
}

function renderPinnedView() {
  const projects = state.projects.filter((project) => project.pinned);
  const threads = state.threads.filter((thread) => thread.pinned);
  return `${renderHeading("Truy cập nhanh", "Đã ghim", "Các dự án và đoạn chat quan trọng được đặt ở một nơi.", `<button class="button button-quiet" data-action="view" data-view="chat">Về cuộc trò chuyện</button>`)}<div class="project-card-grid" style="margin-bottom:1.5rem">${projects.map(renderProjectTile).join("") || `<div class="card card-pad"><span class="empty-chip">Chưa có dự án được ghim.</span></div>`}</div><div class="library-grid">${threads.map(renderChatTile).join("") || `<div class="card card-pad"><span class="empty-chip">Chưa có đoạn chat được ghim.</span></div>`}</div>`;
}

function renderAuthTabs() {
  return `<div class="auth-tabs" role="tablist" aria-label="Tài khoản"><button class="auth-tab ${authMode === "login" ? "active" : ""}" type="button" role="tab" aria-selected="${authMode === "login"}" data-action="auth-mode" data-mode="login">Đăng nhập</button><button class="auth-tab ${authMode === "register" ? "active" : ""}" type="button" role="tab" aria-selected="${authMode === "register"}" data-action="auth-mode" data-mode="register">Đăng ký</button></div>`;
}

function renderRememberField() {
  return `<label class="remember-option"><input type="checkbox" name="remember" /><span><strong>Ghi nhớ đăng nhập</strong><small>Mật khẩu do trình duyệt quản lý; Bambuseae không lưu mật khẩu dạng rõ.</small></span></label>`;
}

function renderLocalLoginForm() {
  return `<form class="auth-form" data-form="local-login"><div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required /></div><div class="field"><label for="login-password">Mật khẩu</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required /></div><div class="auth-form-options">${renderRememberField()}<button class="link-button" type="button" data-action="auth-mode" data-mode="reset">Quên mật khẩu?</button></div><button class="button button-primary button-wide" type="submit">Đăng nhập</button></form>`;
}

function renderRegisterForm() {
  return `<form class="auth-form" data-form="local-register"><div class="field"><label for="register-name">Tên hiển thị</label><input id="register-name" name="name" type="text" autocomplete="name" placeholder="Tên của bạn" required /></div><div class="field"><label for="register-email">Email</label><input id="register-email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required /></div><div class="field"><label for="register-password">Mật khẩu</label><input id="register-password" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="Ít nhất 8 ký tự" required /></div><div class="field"><label for="register-password-confirm">Nhập lại mật khẩu</label><input id="register-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" placeholder="Nhập lại mật khẩu" required /></div><div class="auth-form-options">${renderRememberField()}</div><button class="button button-primary button-wide" type="submit">Tạo tài khoản</button></form>`;
}

function renderPasswordResetForm() {
  return `<form class="auth-form" data-form="password-reset"><div class="security-note"><strong>Đặt lại mật khẩu:</strong> tài khoản thật sẽ nhận liên kết xác minh qua email từ backend. Bản GitHub tĩnh không tự gửi email.</div><div class="field"><label for="reset-email">Email tài khoản</label><input id="reset-email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required /></div><button class="button button-primary button-wide" type="submit">Gửi yêu cầu đặt lại</button><button class="button button-quiet button-wide" type="button" data-action="auth-mode" data-mode="login">← Quay lại đăng nhập</button></form>`;
}

function authProviderLabel() {
  if (state.authProvider === "google") return "Đã liên kết Google";
  if (state.authProvider === "local") return state.rememberLogin ? "Email · đã ghi nhớ đăng nhập" : "Email · phiên hiện tại";
  return "Bản thử cục bộ";
}

function renderAuth() {
  const isRegister = authMode === "register";
  const isReset = authMode === "reset";
  const title = isRegister ? "Tạo tài khoản Bambuseae" : isReset ? "Khôi phục tài khoản" : "Đăng nhập Bambuseae";
  const description = isRegister ? "Tạo tài khoản để sẵn sàng đồng bộ dự án khi backend được cấu hình." : isReset ? "Nhập email đã đăng ký để nhận hướng dẫn khôi phục an toàn." : "Tài khoản thật sẽ đồng bộ dự án giữa điện thoại và máy tính sau khi cấu hình Google OAuth.";
  const authForm = isRegister ? renderRegisterForm() : isReset ? renderPasswordResetForm() : renderLocalLoginForm();
  const providerButton = isReset ? "" : `<button class="google-button" type="button" data-action="google-login">G  ${isRegister ? "Đăng ký bằng Google" : "Tiếp tục với Google"}</button><div class="divider">hoặc dùng email</div>`;
  return `<div class="auth-screen">${themeButtonMarkup("theme-toggle-floating")}<section class="auth-art">${renderBrand()}<p class="eyebrow">Một nơi cho mọi mạch suy nghĩ</p><h1>Đổi AI.<br><span>Không đổi ngữ cảnh.</span></h1><p>Chọn mô hình phù hợp, gắn Skill và Plugin, theo dõi token, rồi tiếp tục cùng dự án ngay cả khi AI hiện tại đã chạm giới hạn.</p><div class="auth-notes"><span class="auth-note">⇢ Context Handoff</span><span class="auth-note">◒ Token Monitor</span><span class="auth-note">▦ Project Library</span></div></section><section class="auth-card"><span class="status-pill demo">Bản thử cục bộ · dữ liệu trên thiết bị</span><h2>${title}</h2><p>${description}</p>${isReset ? "" : renderAuthTabs()}${providerButton}${authForm}${isReset ? "" : `<button class="button button-quiet button-wide demo-guest-button" type="button" data-action="demo-guest">Dùng thử không cần tài khoản</button>`}<p class="auth-footnote">Không nhập mật khẩu Gmail vào biểu mẫu này. Mật khẩu tài khoản Bambuseae chỉ được lưu dưới dạng mã băm trong bản demo; tài khoản thật cần backend, phiên HttpOnly và xác minh email.</p></section></div>`;
}

function render() {
  applyTheme();
  app.innerHTML = state.authenticated ? renderShell() : renderAuth();
  if (state.authenticated) {
    document.body.classList.remove("sidebar-open");
    const messages = document.querySelector("#messages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  }
}

function toast(message, tone = "") {
  const duplicate = [...toastRegion.querySelectorAll(".toast")].find((item) => item.dataset.message === message);
  if (duplicate) return;
  const element = document.createElement("div");
  element.className = `toast ${tone}`;
  element.dataset.message = message;
  element.textContent = message;
  toastRegion.appendChild(element);
  window.setTimeout(() => element.remove(), 4200);
}

function setActiveView(view) {
  state.activeView = view;
  state.accountMenuOpen = false;
  saveState();
  render();
}

function toggleWorkspace() {
  state.workspaceOpen = state.workspaceOpen === false;
  saveState();
  render();
}

function firstProjectThread(project) {
  return project ? state.threads.find((item) => item.projectId === project.id) || null : null;
}

function syncProjectThreadIds(project) {
  if (!project) return;
  project.threadIds = state.threads.filter((item) => item.projectId === project.id).map((item) => item.id);
}

function selectProject(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  state.activeProjectId = project.id;
  const firstThread = firstProjectThread(project);
  state.activeThreadId = firstThread?.id || null;
  state.activeView = "chat";
  state.accountMenuOpen = false;
  saveState();
  render();
}

function selectThread(threadId) {
  const thread = getThread(threadId);
  if (!thread) return;
  state.activeThreadId = thread.id;
  state.activeProjectId = thread.projectId;
  state.activeView = "chat";
  state.accountMenuOpen = false;
  saveState();
  render();
}

function createNewChat() {
  openModal("new-thread");
}

function createThread(title, projectId, memoryScope) {
  const project = projectId ? getProject(projectId) : null;
  const thread = {
    id: uid("thread"),
    projectId: project?.id || null,
    memoryScope: memoryScope === "project" && project ? "project" : "global",
    title: title || "Cuộc trò chuyện mới",
    pinned: false,
    createdAtAt: Date.now(),
    updatedAtAt: Date.now(),
    updatedAt: nowTime(),
    messages: []
  };
  state.threads.unshift(thread);
  syncProjectThreadIds(project);
  state.activeThreadId = thread.id;
  state.activeProjectId = project?.id || null;
  state.activeView = "chat";
  saveState();
  render();
  toast(project ? `Đã thêm cuộc trò chuyện vào dự án “${project.name}”.` : "Đã tạo cuộc trò chuyện độc lập.", "success");
}

function createProject(name, description) {
  const project = { id: uid("project"), name, description: description || "Chưa có mô tả.", pinned: false, color: "#9fe777", threadIds: [], skillIds: ["continuity"], pluginIds: ["context-handoff", "token-monitor"], updatedAt: "Vừa tạo" };
  state.projects.unshift(project);
  state.activeProjectId = project.id;
  state.activeThreadId = null;
  state.activeView = "chat";
  saveState();
  render();
  toast(`Đã tạo dự án “${name}”.`, "success");
}

function deleteProject(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  const threadIds = new Set(state.threads.filter((thread) => thread.projectId === project.id).map((thread) => thread.id));
  const wasActive = state.activeProjectId === project.id;
  if (!window.confirm(`Xóa dự án “${project.name}” và ${threadIds.size} đoạn chat bên trong? Không thể hoàn tác.`)) return;
  state.projects = state.projects.filter((item) => item.id !== project.id);
  state.threads = state.threads.filter((thread) => thread.projectId !== project.id);
  state.usageLog = state.usageLog.filter((entry) => !threadIds.has(entry.threadId));
  if (state.lastHandoff && threadIds.has(state.lastHandoff.threadId)) state.lastHandoff = null;
  if (wasActive || !state.projects.some((item) => item.id === state.activeProjectId)) {
    const nextProject = state.projects[0];
    const nextThread = firstProjectThread(nextProject) || state.threads[0] || null;
    state.activeProjectId = nextThread?.projectId || nextProject?.id || null;
    state.activeThreadId = nextThread?.id || null;
    if (state.activeView !== "projects" && state.activeView !== "pinned") state.activeView = "chat";
  } else if (!state.threads.some((thread) => thread.id === state.activeThreadId)) {
    const activeProject = getProject();
    state.activeThreadId = firstProjectThread(activeProject)?.id || null;
  }
  saveState();
  render();
  toast(`Đã xóa dự án “${project.name}”.`, "success");
}

function switchModel(modelId, reason = "Người dùng chọn") {
  const next = getModel(modelId);
  if (!next.available) {
    toast("AI này chưa được kết nối. Mở Cài đặt để thêm API key.", "warn");
    render();
    return;
  }
  const previous = getModel(state.activeModelId);
  state.activeModelId = next.id;
  state.lastHandoff = { fromName: previous.name, toName: next.name, reason, threadId: state.activeThreadId, time: nowTime() };
  saveState();
  render();
  if (previous.id !== next.id) toast(`Đã chuyển từ ${previous.name} sang ${next.name}. Ngữ cảnh vẫn giữ nguyên.`, "success");
}

function handoffToFallback() {
  const fallback = getFallbackModel(state.activeModelId);
  if (!fallback) {
    toast("Chưa có AI dự phòng còn hạn mức. Hãy kết nối thêm một AI cá nhân.", "warn");
    return;
  }
  switchModel(fallback.id, "Người dùng yêu cầu chuyển AI");
}

function toggleProjectPin(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  project.pinned = !project.pinned;
  saveState();
  render();
  toast(project.pinned ? "Đã ghim dự án." : "Đã bỏ ghim dự án.", "success");
}

function toggleThreadPin(threadId) {
  const thread = getThread(threadId);
  if (!thread) return;
  thread.pinned = !thread.pinned;
  saveState();
  render();
  toast(thread.pinned ? "Đã ghim đoạn chat." : "Đã bỏ ghim đoạn chat.", "success");
}

function toggleMessagePin(messageId) {
  const thread = getThread();
  if (!thread) return;
  const message = thread.messages.find((item) => item.id === messageId);
  if (!message) return;
  message.pinned = !message.pinned;
  saveState();
  render();
  toast(message.pinned ? "Đã ghim tin nhắn." : "Đã bỏ ghim tin nhắn.", "success");
}

async function callConfiguredApi(model, thread) {
  const connector = getApiConnector(model);
  if (!config.apiBaseUrl || model.local || !connector) return null;
  const project = getProject(thread.projectId);
  const messages = thread.messages.map((message) => ({ role: message.role, content: message.content }));
  const memoryScope = thread.memoryScope === "project" && project ? "project" : "global";
  const skillContext = state.skills.filter((skill) => (memoryScope === "global" || project?.skillIds?.includes(skill.id)) && skill.enabled).map((skill) => ({ name: skill.name, instructions: skill.instructions }));
  const pluginContext = state.plugins.filter((plugin) => (memoryScope === "global" || project?.pluginIds?.includes(plugin.id)) && plugin.enabled).map((plugin) => ({ name: plugin.name, permission: plugin.permission }));
  const adapter = getProviderAdapter(connector.id);
  const request = adapter.buildGatewayRequest({
    model: connector,
    messages,
    project: { id: project?.id || null, name: project?.name || "Chat độc lập", description: project?.description || "", memoryScope },
    memoryScope,
    skills: skillContext,
    plugins: pluginContext
  });
  request.body = {
    ...(request.body || {}),
    // API model id là cấu hình theo phiên; backend có thể dùng model mặc định
    // trong .env nếu người dùng để trống ô này.
    modelName: sessionModelNames[connector.id] || connector.modelName || ""
  };
  const headers = { "Content-Type": "application/json" };
  if (sessionKeys[connector.id]) headers["X-Bambuseae-Provider-Key"] = sessionKeys[connector.id];
  const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${request.path}`, {
    method: request.method,
    headers,
    credentials: "include",
    body: JSON.stringify(request.body)
  });
  if (!response.ok) throw new Error(`Gateway ${response.status}`);
  const payload = await response.json();
  const content = payload.message?.content || payload.choices?.[0]?.message?.content || payload.output_text;
  if (!content) throw new Error("Gateway không trả nội dung");
  return { content, usage: payload.usage || null, source: "API thật", connectionModelId: connector.id };
}

async function sendMessage(form) {
  const textarea = form.querySelector("textarea[name=prompt]");
  const prompt = textarea.value.trim();
  if (!prompt) return;
  let model = getModel(state.activeModelId);
  const thread = getThread();
  if (!thread) {
    toast("Hãy tạo một dự án và đoạn chat trước khi gửi.", "warn");
    return;
  }
  if (model.webOnly) {
    const connector = getApiConnector(model);
    if (connector && !isInAppConnected(model)) {
      openModal("connection", connector.id);
      toast(`${model.name} chỉ chạy trong Bambuseae sau khi kết nối API chính thức.`, "warn");
      return;
    }
    if (!connector) {
      toast(`${model.name} hiện chỉ có tài khoản web consumer; chưa có API tương đương để chạy trong Bambuseae.`, "warn");
      return;
    }
  }
  if (model.local) {
    toast("Runtime AI cục bộ chưa được cài; Bambuseae không tạo phản hồi giả. Hãy kết nối AI qua API gateway.", "warn");
    return;
  }
  if (!config.apiBaseUrl) {
    toast("Chưa có API gateway. Bambuseae không tạo phản hồi demo và chưa gửi nội dung đi.", "warn");
    return;
  }
  const currentStats = modelUsageStats(model);
  if (currentStats.hasQuota && currentStats.remaining <= 0) {
    const fallback = state.autoFallback ? getFallbackModel(model.id) : null;
    if (!fallback) {
      toast("AI hiện tại không còn đủ token. Hãy chọn AI khác trước khi gửi.", "warn");
      return;
    }
    state.lastHandoff = { fromName: model.name, toName: fallback.name, reason: "AI hết hạn mức", threadId: thread.id, time: nowTime() };
    state.activeModelId = fallback.id;
    model = fallback;
    toast(`AI cũ đã hết hạn mức. Bambuseae chuyển sang ${model.name}.`, "warn");
  }
  thread.messages.push({ id: uid("msg"), role: "user", content: prompt, time: nowTime(), pinned: false });
  if (["Đoạn chat mới", "Cuộc trò chuyện mới"].includes(thread.title)) thread.title = prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt;
  thread.updatedAt = nowTime();
  thread.updatedAtAt = Date.now();
  textarea.value = "";
  saveState();
  render();
  let result = null;
  try {
    result = await callConfiguredApi(model, thread);
    if (result) {
      model.remoteAvailable = true;
      model.status = "Đã kết nối qua gateway";
      model.note = "AI thật đang chạy qua gateway đã cấu hình";
      const connector = getApiConnector(model);
      if (connector && connector.id !== model.id) {
        connector.remoteAvailable = true;
        connector.status = "Đã kết nối qua gateway";
        connector.note = "AI thật đang chạy qua gateway đã cấu hình";
      }
    }
  } catch (error) {
    toast("Gateway/AI thật chưa trả lời. Không dùng phản hồi demo và không ghi usage giả.", "warn");
    return;
  }
  if (!result?.content) {
    toast("AI không trả nội dung. Không ghi phản hồi hoặc số liệu giả.", "warn");
    return;
  }
  const reply = result.content;
  const usage = result.usage || null;
  const inputTokens = Number(usage?.input_tokens ?? usage?.prompt_tokens);
  const outputTokens = Number(usage?.output_tokens ?? usage?.completion_tokens);
  const totalTokens = Number(usage?.total_tokens ?? (Number.isFinite(inputTokens) && Number.isFinite(outputTokens) ? inputTokens + outputTokens : NaN));
  const hasExactUsage = Number.isFinite(inputTokens) && Number.isFinite(outputTokens) && Number.isFinite(totalTokens) && totalTokens >= 0;
  const source = result.source || "API thật";
  thread.messages.push({ id: uid("msg"), role: "assistant", modelId: model.id, content: reply, time: nowTime(), source, pinned: false });
  if (hasExactUsage) {
    const usageModel = getModel(result.connectionModelId || model.id) || model;
    usageModel.used = usageStats(usageModel).used + totalTokens;
    usageModel.usageSource = "provider";
    if (usageModel.id !== model.id && model.apiConnectorId === usageModel.id) {
      model.used = usageModel.used;
      model.limit = usageModel.limit;
      model.usageSource = "provider";
    }
    state.usageLog.unshift({ id: uid("usage"), modelId: model.id, threadId: thread.id, input: inputTokens, output: outputTokens, total: totalTokens, source, time: nowTime() });
  } else {
    toast("AI đã trả lời nhưng không gửi trường usage. Bambuseae giữ nguyên trạng thái quota để tránh tính sai.", "warn");
  }
  if (state.autoFallback && hasExactUsage && modelUsageStats(model).hasQuota && modelUsageStats(model).remainingPercent <= state.fallbackThreshold) {
    const fallback = getFallbackModel(model.id);
    if (fallback) {
      state.lastHandoff = { fromName: model.name, toName: fallback.name, reason: "Còn dưới ngưỡng cảnh báo", threadId: thread.id, time: nowTime() };
      state.activeModelId = fallback.id;
    }
  }
  saveState();
  render();
}

function openModal(kind, modelId = "") {
  const targetModel = modelId ? getModel(modelId) : state.models.find((model) => !model.shared && !model.available) || state.models.find((model) => !model.shared);
  if (kind === "new-thread") {
    const currentProjectId = getProject()?.id || "";
    const projectOptions = [`<option value="">Chat độc lập</option>`, ...state.projects.map((project) => `<option value="${escapeHtml(project.id)}" ${project.id === currentProjectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`)].join("");
    const defaultScope = currentProjectId ? "project" : "global";
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Tạo cuộc trò chuyện mới</h2><p>Mỗi cuộc trò chuyện là một mạch riêng, không tự tạo nhánh và không ghi đè chat cũ.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-thread"><div class="field"><label for="thread-title">Tên cuộc trò chuyện</label><input id="thread-title" name="title" placeholder="Ví dụ: Ý tưởng mới" /></div><div class="field"><label for="thread-project">Nơi lưu</label><select id="thread-project" name="projectId">${projectOptions}</select></div><div class="field"><label for="thread-memory-scope">Phạm vi bộ nhớ</label><select id="thread-memory-scope" name="memoryScope"><option value="project" ${defaultScope === "project" ? "selected" : ""}>Chỉ dùng trong dự án</option><option value="global" ${defaultScope === "global" ? "selected" : ""}>Dùng trong toàn bộ Bambuseae</option></select><small class="field-help">Bộ nhớ dự án không lấy dữ liệu từ dự án khác. Bộ nhớ toàn bộ dùng các Skill/Plugin chung và dữ liệu bạn chủ động cung cấp.</small></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Tạo cuộc trò chuyện</button></div></form></div>`;
  } else if (kind === "new-project") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Tạo dự án mới</h2><p>Dự án được tạo trống; bạn tự thêm đoạn chat khi sẵn sàng.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-project"><div class="field"><label for="project-name">Tên dự án</label><input id="project-name" name="name" placeholder="Ví dụ: Dự án truyện mới" required /></div><div class="field"><label for="project-description">Mô tả</label><textarea id="project-description" name="description" placeholder="Mục tiêu chính của dự án"></textarea></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Tạo dự án</button></div></form></div>`;
  } else if (kind === "new-skill") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Thêm Skill dùng chung</h2><p>Skill sẽ có thể gắn vào mọi dự án và AI.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-skill"><div class="field"><label for="skill-name">Tên Skill</label><input id="skill-name" name="name" placeholder="Ví dụ: Biên tập viên tiếng Nhật" required /></div><div class="field"><label for="skill-description">Mô tả</label><input id="skill-description" name="description" placeholder="Skill này giúp AI làm gì?" required /></div><div class="field"><label for="skill-instructions">Hướng dẫn cho AI</label><textarea id="skill-instructions" name="instructions" placeholder="Quy tắc, phong cách, định dạng kết quả…" required></textarea></div><div class="field"><label for="skill-tags">Thẻ, cách nhau bằng dấu phẩy</label><input id="skill-tags" name="tags" placeholder="viết, dịch, chuyên môn" /></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Thêm Skill</button></div></form></div>`;
  } else if (kind === "new-plugin") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Thêm Plugin</h2><p>Plugin cần mô tả quyền trước khi dùng.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-plugin"><div class="field"><label for="plugin-name">Tên Plugin</label><input id="plugin-name" name="name" placeholder="Ví dụ: Đọc thư mục tài liệu" required /></div><div class="field"><label for="plugin-description">Mô tả</label><input id="plugin-description" name="description" placeholder="Plugin thực hiện việc gì?" required /></div><div class="field"><label for="plugin-permission">Quyền truy cập</label><select id="plugin-permission" name="permission"><option>Chỉ đọc</option><option>Đọc và ghi</option><option>Gọi Internet</option><option>Cần xác nhận mỗi lần</option></select></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Thêm Plugin</button></div></form></div>`;
  } else {
    const apiModels = state.models.filter((model) => !model.shared && !model.local && !model.webOnly);
    const rememberedModelName = targetModel ? sessionModelNames[targetModel.id] || targetModel.modelName || "" : "";
    const gatewayNote = config.apiBaseUrl
      ? "Gateway đã được khai báo; chỉ usage/quota do nhà cung cấp hoặc gateway trả về mới được hiển thị là số liệu thật."
      : "Chưa có gateway. GitHub Pages không thể gọi AI thật trực tiếp; lúc này key chỉ được giữ tạm trong phiên và không nên dùng trên thiết bị lạ.";
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>${targetModel?.available ? "Cập nhật kết nối" : "Kết nối AI cá nhân"}</h2><p>API key chỉ nằm trong bộ nhớ phiên, không được lưu vào GitHub.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="connection"><div class="field"><label for="connection-model">AI</label><select id="connection-model" name="modelId" data-action="select-connection-model">${apiModels.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === targetModel?.id ? "selected" : ""}>${escapeHtml(model.name)}</option>`).join("")}</select></div><div class="connection-guide" id="connection-guide">${officialApiLink(targetModel) || ""}<span>${escapeHtml(targetModel?.apiNote || "Mở trang chính thức để tạo API key.")}</span></div><div class="field"><label for="connection-model-name">Model ID thật <span class="field-optional">(tùy chọn)</span></label><input id="connection-model-name" name="modelName" type="text" autocomplete="off" value="${escapeHtml(rememberedModelName)}" placeholder="Ví dụ: gpt-4o-mini hoặc gemini-2.5-flash" /><small class="field-help">Nhập mã model trên trang API nếu backend bật cho phép model theo phiên. Để trống nếu bạn đã đặt BAMBUSEAE_*_MODEL trong backend.</small></div><div class="field"><label for="connection-key">API key</label><input id="connection-key" name="key" type="password" autocomplete="off" placeholder="Dán key tại đây; không đưa vào mã nguồn" required /></div><div class="security-note"><strong>Hạn mức:</strong> Không tự nhập số giả. Bambuseae chỉ hiển thị phần trăm khi gateway trả quota thật. ${gatewayNote}</div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Lưu kết nối phiên này</button></div></form></div>`;
  }
  modal.showModal();
}

function closeModal() {
  if (modal.open) modal.close();
}

function setAuthMode(mode) {
  authMode = ["login", "register", "reset"].includes(mode) ? mode : "login";
  render();
}

function enterGuestMode() {
  setAuthSession({ name: "Khách dùng thử", email: "demo@bambuseae.local", provider: "demo" }, false);
  saveState();
  render();
  toast("Đã vào Bambuseae ở chế độ dùng thử.", "success");
}

function startGoogleAuth() {
  if (config.apiBaseUrl && config.googleOAuthEnabled !== false) {
    const mode = state.authenticated ? "link" : authMode === "register" ? "register" : "login";
    const redirect = encodeURIComponent(`${window.location.origin}${window.location.pathname}`);
    const authPath = config.googleOAuthPath || "/auth/google/start";
    window.location.href = `${config.apiBaseUrl.replace(/\/$/, "")}${authPath}?mode=${mode}&redirect=${redirect}`;
    return;
  }
  toast(config.apiBaseUrl ? "Google OAuth đang bị tắt trong config.js." : "Chưa có API gateway cho Google OAuth. Hãy cấu hình apiBaseUrl và backend OAuth trước.", "warn");
}

function consumeOAuthResult() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get("oauth");
  if (!result) return;
  const nextUrl = `${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, document.title, nextUrl);
  if (result === "success") toast("Google đã xác thực/liên kết. Đang đồng bộ phiên tài khoản…", "success");
  else toast(`Google OAuth chưa hoàn tất: ${params.get("reason") || "hãy thử lại"}.`, "warn");
}

async function hydrateRemoteModels() {
  if (!config.apiBaseUrl) return;
  try {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/api/models`, { credentials: "include" });
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload.models)) return;
    const remoteById = new Map(payload.models.filter((model) => model?.id).map((model) => [model.id, model]));
    let changed = false;
    state.models = state.models.map((model) => {
      if (model.local) return model;
      const remote = remoteById.get(model.id);
      if (!remote) {
        if (model.shared && model.available) {
          changed = true;
          return { ...model, available: false, remoteAvailable: false, status: "Gateway chưa công bố", note: "Gateway chưa bật model này" };
        }
        return model;
      }
      const next = { ...model };
      if (typeof remote.available === "boolean") {
        next.remoteAvailable = remote.available;
        next.available = remote.available;
      }
      if (Number.isFinite(Number(remote.used))) {
        next.used = Number(remote.used);
        next.usageSource = "gateway";
      }
      if (Number.isFinite(Number(remote.limit))) {
        next.limit = Number(remote.limit);
        next.usageSource = "gateway";
      }
      if (remote.reset) next.reset = String(remote.reset);
      if (remote.status) next.status = String(remote.status);
      if (remote.note) next.note = String(remote.note);
      if (JSON.stringify(next) !== JSON.stringify(model)) changed = true;
      return next;
    });
    const active = getModel(state.activeModelId);
    if (active && !active.available) {
      const next = state.models.find((model) => model.available);
      if (next) {
        state.activeModelId = next.id;
        changed = true;
      }
    }
    if (changed) {
      saveState();
      render();
    }
  } catch {
    // Gateway chưa online thì giao diện vẫn giữ trạng thái chưa kết nối.
  }
}

async function hydrateRemoteSession() {
  if (!config.apiBaseUrl) return;
  try {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/api/session`, { credentials: "include" });
    if (!response.ok) return;
    const payload = await response.json();
    const user = payload.user || payload.profile;
    if (!user?.email) return;
    setAuthSession({ name: user.name || user.email.split("@")[0], email: user.email, provider: user.provider || "google" }, false);
    saveState();
    render();
  } catch {
    // Người dùng vẫn có thể dùng bản thử khi backend chưa hoạt động.
  }
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "toggle-account-menu") {
    state.accountMenuOpen = !state.accountMenuOpen;
    render();
    return;
  }
  if (action === "view") return setActiveView(target.dataset.view);
  if (action === "toggle-theme") return toggleTheme();
  if (action === "toggle-workspace") return toggleWorkspace();
  if (action === "auth-mode") return setAuthMode(target.dataset.mode);
  if (action === "demo-guest") return enterGuestMode();
  if (action === "toggle-sidebar") return document.body.classList.toggle("sidebar-open");
  if (action === "new-chat") return createNewChat();
  if (action === "new-thread-in-project") {
    const project = getProject(target.dataset.projectId);
    if (!project) return;
    state.activeProjectId = project.id;
    openModal("new-thread");
    return;
  }
  if (action === "open-modal") return openModal(target.dataset.modal, target.dataset.modelId || "");
  if (action === "close-modal") return closeModal();
  if (action === "select-project") return selectProject(target.dataset.projectId);
  if (action === "delete-project") return deleteProject(target.dataset.projectId);
  if (action === "select-thread") return selectThread(target.dataset.threadId);
  if (action === "toggle-project-pin") return toggleProjectPin(target.dataset.projectId);
  if (action === "toggle-thread-pin") return toggleThreadPin(target.dataset.threadId);
  if (action === "toggle-message-pin") return toggleMessagePin(target.dataset.messageId);
  if (action === "handoff") return handoffToFallback();
  if (action === "set-library-filter") { state.libraryFilter = target.dataset.filter; saveState(); return render(); }
  if (action === "select-suggestion") { const textarea = document.querySelector("textarea[name=prompt]"); if (textarea) { textarea.value = target.dataset.text; textarea.focus(); } return; }
  if (action === "toggle-skill") { const skill = state.skills.find((item) => item.id === target.dataset.skillId); if (skill) { skill.enabled = !skill.enabled; saveState(); render(); } return; }
  if (action === "toggle-plugin") { const plugin = state.plugins.find((item) => item.id === target.dataset.pluginId); if (plugin) { plugin.enabled = !plugin.enabled; saveState(); render(); } return; }
  if (action === "google-login") {
    startGoogleAuth();
    return;
  }
  if (action === "demo-logout") {
    if (config.apiBaseUrl) {
      void fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/auth/logout`, { credentials: "include" }).catch(() => {});
    }
    clearAuthSession();
    state.user = structuredClone(defaultState.user);
    state.accountMenuOpen = false;
    authMode = "login";
    saveState();
    render();
    toast("Đã đăng xuất khỏi Bambuseae.", "success");
    return;
  }
  if (action === "reset-demo") {
    if (window.confirm("Xóa toàn bộ dữ liệu bản demo và tài khoản cục bộ trên thiết bị này?")) {
      removeStorage(window.localStorage, STORAGE_KEY);
      removeStorage(window.localStorage, ACCOUNTS_KEY);
      clearAuthSession();
      window.location.reload();
    }
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.dataset.action === "select-model") return switchModel(target.value);
  if (target.dataset.action === "select-connection-model") {
    const model = getModel(target.value);
    const guide = document.querySelector("#connection-guide");
    if (guide) guide.innerHTML = `${officialApiLink(model)}<span>${escapeHtml(model?.apiNote || "Mở trang chính thức để tạo API key.")}</span>`;
    const modelName = document.querySelector("#connection-model-name");
    if (modelName) modelName.value = model ? sessionModelNames[model.id] || model.modelName || "" : "";
    return;
  }
  if (target.dataset.action === "select-project") return selectProject(target.value);
  if (target.dataset.setting === "autoFallback") { state.autoFallback = target.checked; saveState(); render(); return; }
  if (target.dataset.setting === "fallbackThreshold") { state.fallbackThreshold = Number(target.value); saveState(); const output = document.querySelector("#threshold-value"); if (output) output.textContent = `${target.value}%`; return; }
}

async function handleSubmit(event) {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const type = form.dataset.form;
  if (type === "local-login") {
    const email = normalizeEmail(data.get("email"));
    const password = String(data.get("password") || "");
    if (!email || !password) {
      toast("Hãy nhập đầy đủ email và mật khẩu.", "warn");
      return;
    }
    const account = findLocalAccount(email);
    if (!account) {
      toast("Chưa tìm thấy tài khoản này. Hãy chọn Đăng ký để tạo tài khoản.", "warn");
      authMode = "register";
      render();
      return;
    }
    if (account.provider === "google" && !account.passwordHash) {
      toast("Tài khoản này dùng Google. Hãy bấm “Tiếp tục với Google”.", "warn");
      return;
    }
    let valid = false;
    try {
      valid = await verifyPassword(account, password);
    } catch {
      toast("Trình duyệt cần HTTPS để kiểm tra mật khẩu an toàn.", "warn");
      return;
    }
    if (!valid) {
      toast("Email hoặc mật khẩu chưa đúng.", "warn");
      return;
    }
    setAuthSession(account, data.get("remember") === "on");
    saveState();
    render();
    toast("Đăng nhập Bambuseae thành công.", "success");
    return;
  }
  if (type === "local-register") {
    const name = String(data.get("name") || "").trim();
    const email = normalizeEmail(data.get("email"));
    const password = String(data.get("password") || "");
    const passwordConfirm = String(data.get("passwordConfirm") || "");
    if (name.length < 2) {
      toast("Tên hiển thị cần có ít nhất 2 ký tự.", "warn");
      return;
    }
    if (!email || !email.includes("@")) {
      toast("Email chưa đúng định dạng.", "warn");
      return;
    }
    if (password.length < 8) {
      toast("Mật khẩu cần có ít nhất 8 ký tự.", "warn");
      return;
    }
    if (password !== passwordConfirm) {
      toast("Hai ô mật khẩu chưa giống nhau.", "warn");
      return;
    }
    if (findLocalAccount(email)) {
      toast("Email này đã được đăng ký. Hãy chuyển sang Đăng nhập.", "warn");
      authMode = "login";
      render();
      return;
    }
    let passwordRecord;
    try {
      passwordRecord = await createPasswordRecord(password);
    } catch {
      toast("Không thể tạo mật khẩu an toàn. Hãy mở Bambuseae bằng HTTPS.", "warn");
      return;
    }
    const account = { id: uid("account"), name, email, provider: "local", createdAt: new Date().toISOString(), ...passwordRecord };
    const accounts = [...readAccounts(), account];
    if (!writeAccounts(accounts)) {
      toast("Không thể lưu tài khoản trên trình duyệt này.", "warn");
      return;
    }
    setAuthSession(account, data.get("remember") === "on");
    saveState();
    render();
    toast("Đăng ký và đăng nhập thành công.", "success");
    return;
  }
  if (type === "password-reset") {
    const email = normalizeEmail(data.get("email"));
    if (!email) {
      toast("Hãy nhập email tài khoản.", "warn");
      return;
    }
    if (!config.apiBaseUrl) {
      toast("Đặt lại mật khẩu thật cần backend gửi email xác minh. Bản GitHub tĩnh chưa thể tự xác minh.", "warn");
      return;
    }
    try {
      const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error(`AUTH_${response.status}`);
      authMode = "login";
      render();
      toast("Đã gửi hướng dẫn khôi phục đến email nếu tài khoản tồn tại.", "success");
    } catch {
      toast("Backend chưa phản hồi yêu cầu khôi phục mật khẩu.", "warn");
    }
    return;
  }
  if (type === "composer") return sendMessage(form);
  if (type === "new-thread") {
    closeModal();
    return createThread(String(data.get("title") || "Cuộc trò chuyện mới").trim(), String(data.get("projectId") || ""), String(data.get("memoryScope") || "global"));
  }
  if (type === "new-project") { closeModal(); return createProject(String(data.get("name") || "Dự án mới").trim(), String(data.get("description") || "").trim()); }
  if (type === "new-skill") {
    const skill = { id: uid("skill"), name: String(data.get("name") || "Skill mới").trim(), description: String(data.get("description") || "").trim(), instructions: String(data.get("instructions") || "").trim(), tags: String(data.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean), enabled: true, icon: "✦", scope: "Cá nhân" };
    state.skills.unshift(skill);
    const project = getProject();
    if (project) project.skillIds = [...new Set([...(project.skillIds || []), skill.id])];
    closeModal(); saveState(); render(); toast(`Đã thêm Skill “${skill.name}”.`, "success");
    return;
  }
  if (type === "new-plugin") {
    const plugin = { id: uid("plugin"), name: String(data.get("name") || "Plugin mới").trim(), description: String(data.get("description") || "").trim(), permission: String(data.get("permission") || "Chỉ đọc"), enabled: true, icon: "◇", scope: "Cá nhân" };
    state.plugins.unshift(plugin);
    const project = getProject();
    if (project) project.pluginIds = [...new Set([...(project.pluginIds || []), plugin.id])];
    closeModal(); saveState(); render(); toast(`Đã thêm Plugin “${plugin.name}”.`, "success");
    return;
  }
  if (type === "connection") {
    const model = getModel(String(data.get("modelId")));
    const key = String(data.get("key") || "").trim();
    if (!model || !key) return;
    const modelName = String(data.get("modelName") || "").trim();
    sessionKeys[model.id] = key;
    if (modelName) sessionModelNames[model.id] = modelName;
    else delete sessionModelNames[model.id];
    const gatewayConfigured = Boolean(config.apiBaseUrl);
    model.available = gatewayConfigured;
    delete model.remoteAvailable;
    model.status = "Đã nhập key · chờ gateway";
    model.used = null;
    model.limit = null;
    model.usageSource = "unavailable";
    model.note = gatewayConfigured ? "Key chỉ giữ trong phiên; gateway sẽ xác nhận AI ở /api/models" : "Key chỉ được giữ tạm; cần cấu hình apiBaseUrl để gọi AI thật";
    const existing = state.connections.find((connection) => connection.modelId === model.id);
    if (existing) existing.updatedAt = nowTime();
    else state.connections.push({ id: uid("connection"), modelId: model.id, updatedAt: nowTime() });
    closeModal(); saveState(); render();
    toast(gatewayConfigured ? `${model.name} đã nhận key; đang chờ gateway xác nhận.` : `${model.name} chưa kết nối: Bambuseae chưa có gateway.`, gatewayConfigured ? "success" : "warn");
    if (gatewayConfigured) void hydrateRemoteModels();
  }
}

document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("submit", handleSubmit);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
render();
consumeOAuthResult();
void hydrateRemoteSession();
void hydrateRemoteModels();
