import { cloneModelCatalog, getProviderAdapter } from "./providers/registry.js";

const config = Object.assign(
  {
    apiBaseUrl: "",
    googleOAuthEnabled: false,
    appName: "Bambuseae"
  },
  window.BAMBUSEAE_CONFIG || {}
);

const STORAGE_KEY = "bambuseae-state-v1";
const AUTH_SESSION_KEY = "bambuseae-auth-session-v1";
const REMEMBERED_AUTH_KEY = "bambuseae-remembered-auth-v1";
const ACCOUNTS_KEY = "bambuseae-local-accounts-v1";
const sessionKeys = Object.create(null);
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
  activeView: "chat",
  activeProjectId: "project-aig",
  activeThreadId: "thread-world",
  activeModelId: "bambuseae-free",
  libraryFilter: "all",
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
  projects: [
    {
      id: "project-aig",
      name: "Auloria: Immortal Genesis",
      description: "Thiết kế game 2D pixel tu tiên và hệ thống thế giới.",
      pinned: true,
      color: "#9fe777",
      threadIds: ["thread-world", "thread-combat"],
      skillIds: ["continuity", "creative-architect"],
      pluginIds: ["context-handoff", "token-monitor", "project-library"],
      updatedAt: "Hôm nay, 09:12"
    },
    {
      id: "project-bambuseae",
      name: "Bambuseae Core",
      description: "Xây dựng trung tâm AI, kho Skill và cơ chế chuyển mô hình.",
      pinned: true,
      color: "#e4c36c",
      threadIds: ["thread-bambuseae"],
      skillIds: ["continuity"],
      pluginIds: ["context-handoff", "token-monitor"],
      updatedAt: "Hôm qua, 18:40"
    },
    {
      id: "project-japanese",
      name: "NionVN",
      description: "Ứng dụng học tiếng Nhật offline và dữ liệu JLPT.",
      pinned: false,
      color: "#83c8e8",
      threadIds: [],
      skillIds: ["continuity"],
      pluginIds: ["project-library"],
      updatedAt: "28/08/2026"
    }
  ],
  threads: [
    {
      id: "thread-world",
      projectId: "project-aig",
      title: "Xây dựng 12 thế giới chính",
      pinned: true,
      updatedAt: "09:12",
      messages: [
        {
          id: "msg-1",
          role: "assistant",
          modelId: "bambuseae-free",
          content: "Tôi đã nạp ngữ cảnh của dự án Auloria: Immortal Genesis. Các Skill Mạch chuyện liên tục và Kiến trúc sáng tạo đang hoạt động. Bạn có thể đổi AI bất cứ lúc nào; Bambuseae sẽ giữ lại mạch nội dung.",
          time: "09:08",
          source: "Mô phỏng",
          pinned: false
        },
        {
          id: "msg-2",
          role: "user",
          content: "Hãy tiếp tục khung 12 thế giới chính và liên kết chúng với 5 thời đại.",
          time: "09:09",
          pinned: false
        },
        {
          id: "msg-3",
          role: "assistant",
          modelId: "bambuseae-free",
          content: "Được. Tôi sẽ giữ nguyên các mốc đã chốt, sau đó tách mỗi thế giới thành bản đồ, làng, thế lực và tuyến nhiệm vụ. Nếu AI hiện tại sắp hết hạn mức, bạn có thể chuyển sang Bambuseae Swift mà không cần mở đoạn chat mới.",
          time: "09:12",
          source: "Mô phỏng",
          pinned: true
        }
      ]
    },
    {
      id: "thread-combat",
      projectId: "project-aig",
      title: "Hệ thống chiến đấu nguyên tố",
      pinned: false,
      updatedAt: "Hôm qua",
      messages: []
    },
    {
      id: "thread-bambuseae",
      projectId: "project-bambuseae",
      title: "Kiến trúc trung tâm AI",
      pinned: true,
      updatedAt: "18:40",
      messages: [
        {
          id: "msg-b1",
          role: "assistant",
          modelId: "bambuseae-fast",
          content: "Bambuseae dùng một lịch sử hội thoại chuẩn ở lớp ứng dụng. Mỗi AI chỉ là một adapter, vì vậy đổi nhà cung cấp không làm mất Thread ID, Skill hay Project Context.",
          time: "18:40",
          source: "Mô phỏng",
          pinned: false
        }
      ]
    }
  ],
  connections: [],
  usageLog: [
    { id: "usage-1", modelId: "bambuseae-free", threadId: "thread-world", input: 98, output: 156, total: 254, source: "Mô phỏng", time: "09:12" },
    { id: "usage-2", modelId: "bambuseae-free", threadId: "thread-world", input: 44, output: 104, total: 148, source: "Mô phỏng", time: "09:09" },
    { id: "usage-3", modelId: "bambuseae-fast", threadId: "thread-bambuseae", input: 81, output: 114, total: 195, source: "Mô phỏng", time: "18:40" }
  ]
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
        rememberLogin: Boolean(readStorage(window.localStorage, REMEMBERED_AUTH_KEY))
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
      models: mergeModelCatalog(saved.models),
      skills: saved.skills || structuredClone(defaultState.skills),
      plugins: saved.plugins || structuredClone(defaultState.plugins),
      projects: saved.projects || structuredClone(defaultState.projects),
      threads: saved.threads || structuredClone(defaultState.threads),
      usageLog: saved.usageLog || structuredClone(defaultState.usageLog),
      connections: saved.connections || []
    };
  } catch {
    return structuredClone(defaultState);
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

function estimateTokens(text = "") {
  return Math.max(1, Math.ceil(String(text).trim().length / 4));
}

function nowTime() {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getModel(id) {
  return state.models.find((model) => model.id === id) || state.models[0];
}

function getProject(id = state.activeProjectId) {
  return state.projects.find((project) => project.id === id) || state.projects[0];
}

function getThread(id = state.activeThreadId) {
  return state.threads.find((thread) => thread.id === id) || state.threads[0];
}

function usageStats(model) {
  const used = Math.max(0, Number(model?.used) || 0);
  const limit = Math.max(1, Number(model?.limit) || 1);
  const usedPercent = Math.min(100, (used / limit) * 100);
  const remaining = Math.max(0, limit - used);
  const remainingPercent = Math.max(0, 100 - usedPercent);
  return { used, limit, usedPercent, remaining, remainingPercent };
}

function getFallbackModel(currentId) {
  return state.models.find((model) => model.id !== currentId && model.available && usageStats(model).remaining > 0) || null;
}

function modelOptionList() {
  return state.models.map((model) => {
    const status = model.available ? "sẵn sàng" : "chưa kết nối";
    return `<option value="${escapeHtml(model.id)}" ${model.id === state.activeModelId ? "selected" : ""} ${model.available ? "" : "disabled"}>${escapeHtml(model.name)} · ${status}</option>`;
  }).join("");
}

function renderBrand() {
  return `<div class="brand"><div class="brand-mark"><img src="./icon.svg" alt="" /></div><div><div class="brand-name">Bambuseae</div><span class="brand-sub">AI workspace</span></div></div>`;
}

function modelPill(model) {
  if (!model) return "";
  return `<span class="model-chip"><span>${escapeHtml(model.name)}</span><span>· ${escapeHtml(model.tier)}</span></span>`;
}

function quotaMeter(model, compact = false) {
  const stats = usageStats(model);
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
  return `
    <aside class="sidebar" id="sidebar">
      ${renderBrand()}
      <button class="button button-primary new-chat" data-action="new-chat"><span>＋</span> Đoạn chat mới</button>
      <div class="nav-label">Không gian</div>
      <nav aria-label="Điều hướng chính">
        <div class="nav-list">
          ${navItem("chat", "◌", "Cuộc trò chuyện", state.threads.length)}
          ${navItem("pinned", "⚑", "Đã ghim", pinnedProjects.length + pinnedThreads.length)}
          ${navItem("projects", "⌂", "Dự án", state.projects.length)}
          ${navItem("library", "▦", "Thư viện", state.skills.length + state.plugins.length)}
          ${navItem("usage", "◒", "Hạn mức AI", state.models.filter((model) => model.available).length)}
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
      <div class="sidebar-footer">
        <div class="profile-mini">
          <div class="avatar">${escapeHtml(state.user.initial || "K")}</div>
          <div class="profile-copy"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.email)}</span></div>
          <button class="button button-icon button-quiet" aria-label="Mở cài đặt" data-action="view" data-view="settings">⚙</button>
        </div>
      </div>
    </aside>`;
}

function navItem(view, icon, label, count) {
  return `<button class="nav-item ${state.activeView === view ? "active" : ""}" data-action="view" data-view="${view}"><span class="nav-left"><span class="nav-icon">${icon}</span>${label}</span><span class="count">${count}</span></button>`;
}

function renderTopbar() {
  const demo = !config.apiBaseUrl;
  return `
    <header class="topbar">
      <div class="topbar-left"><button class="button button-icon mobile-menu" aria-label="Mở menu" data-action="toggle-sidebar">☰</button><span class="topbar-context">Không gian riêng · ${escapeHtml(getProject().name)}</span></div>
      <div class="topbar-right"><span class="status-pill ${demo ? "demo" : ""}">${demo ? "Bản mô phỏng cục bộ" : "API gateway đã kết nối"}</span>${themeButtonMarkup()}<button class="button button-icon" aria-label="Mở cài đặt" data-action="view" data-view="settings">⚙</button><div class="avatar top-avatar">${escapeHtml(state.user.initial || "K")}</div></div>
    </header>`;
}

function renderShell() {
  return `<div class="app-shell">${renderSidebar()}<div class="content">${renderTopbar()}<main id="main-content">${renderView()}</main></div></div>`;
}

function renderView() {
  switch (state.activeView) {
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
  const stats = usageStats(model);
  const skills = state.skills.filter((skill) => project.skillIds?.includes(skill.id) && skill.enabled);
  const plugins = state.plugins.filter((plugin) => project.pluginIds?.includes(plugin.id) && plugin.enabled);
  const handoff = state.lastHandoff && state.lastHandoff.threadId === thread.id ? state.lastHandoff : null;
  return `
    ${renderHeading("Không gian hội thoại", "Tiếp tục mạch chuyện", "Chọn AI, giữ nguyên ngữ cảnh và làm việc trong cùng một dự án.", `<button class="button button-gold" data-action="open-modal" data-modal="new-project">＋ Tạo dự án</button>`)}
    <section class="overview-grid" aria-label="AI đang hoạt động">
      <article class="card model-overview">
        <div class="model-overview-main"><div class="model-orb"><img src="./icon.svg" alt="" /></div><div class="model-overview-copy"><strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(model.provider)} · ${escapeHtml(model.category)} · ${escapeHtml(model.status)}</span></div></div>
        <div><label class="quota-label" for="chat-model-select">Chọn AI cho câu tiếp theo</label><select id="chat-model-select" class="model-select" data-action="select-model" aria-label="Chọn AI">${modelOptionList()}</select></div>
        <div class="quota-strip">${quotaMeter(model)}</div>
        <div class="model-handoff"><span class="tag">${stats.remainingPercent <= state.fallbackThreshold ? "⚠ sắp hết hạn mức" : "✓ có thể tiếp tục"}</span><button class="button button-quiet" data-action="handoff">Chuyển AI dự phòng →</button></div>
      </article>
      <article class="card card-pad">
        <div class="section-head"><div><p class="section-title">Quy tắc chuyển AI</p><p>Tự động giữ mạch khi gặp giới hạn.</p></div><span class="tag">${state.autoFallback ? "Tự động" : "Thủ công"}</span></div>
        <div class="metric-list"><div class="metric-line"><span>Ngưỡng cảnh báo</span><strong>${state.fallbackThreshold}% còn lại</strong></div><div class="metric-line"><span>AI dự phòng</span><strong>${escapeHtml(getFallbackModel(model.id)?.name || "Chưa có")}</strong></div><div class="metric-line"><span>Thread hiện tại</span><strong>${escapeHtml(thread.title)}</strong></div></div>
        <button class="button button-quiet button-wide" data-action="view" data-view="usage">Xem toàn bộ hạn mức</button>
      </article>
    </section>
    <div class="workspace-grid">
      <section class="card conversation" aria-label="Đoạn chat hiện tại">
        <div class="thread-bar"><div class="thread-title"><strong>${escapeHtml(thread.title)}</strong><span>${escapeHtml(project.name)} · ${thread.messages.length} tin nhắn${handoff ? ` · Đã chuyển từ ${escapeHtml(handoff.fromName)}` : ""}</span></div><div class="thread-actions"><button class="button button-icon button-quiet" aria-label="Ghim đoạn chat" data-action="toggle-thread-pin" data-thread-id="${escapeHtml(thread.id)}">${thread.pinned ? "⚑" : "⚐"}</button><button class="button button-icon button-quiet" aria-label="Tách đoạn chat mới" data-action="branch-thread">↗</button></div></div>
        <div class="messages" id="messages">${thread.messages.length ? thread.messages.map(renderMessage).join("") : renderEmptyChat()}</div>
        <div class="suggestion-row"><button class="suggestion" data-action="select-suggestion" data-text="Tóm tắt những điểm quan trọng của mạch chuyện hiện tại.">Tóm tắt mạch chuyện</button><button class="suggestion" data-action="handoff">Chuyển sang AI khác</button><button class="suggestion" data-action="open-modal" data-modal="new-skill">＋ Thêm Skill</button></div>
        <form class="composer" data-form="composer"><textarea name="prompt" rows="1" placeholder="Viết yêu cầu tiếp theo…" aria-label="Nội dung yêu cầu"></textarea><div class="composer-tools"><select class="model-mini" data-action="select-model" aria-label="AI cho tin nhắn">${modelOptionList()}</select><button class="send-button" type="submit" aria-label="Gửi">↑</button></div></form>
      </section>
      <aside class="inspector" aria-label="Thông tin dự án">
        <section class="card project-card"><div class="project-row"><div><div class="project-name">${escapeHtml(project.name)}</div><p class="project-desc">${escapeHtml(project.description)}</p></div><button class="pin-button ${project.pinned ? "pinned" : ""}" aria-label="Ghim dự án" data-action="toggle-project-pin" data-project-id="${escapeHtml(project.id)}">${project.pinned ? "◆" : "◇"}</button></div><select class="project-select" data-action="select-project" aria-label="Chọn dự án">${state.projects.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === project.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></section>
        <section class="card inspector-card"><div class="section-head"><p class="section-title">Skill đang dùng</p><button class="button button-icon button-quiet" aria-label="Mở thư viện Skill" data-action="view" data-view="library">＋</button></div><div class="chip-list">${skills.length ? skills.map((skill) => `<span class="tag skill-chip">${escapeHtml(skill.icon)} ${escapeHtml(skill.name)}</span>`).join("") : `<span class="empty-chip">Chưa gắn Skill</span>`}</div></section>
        <section class="card inspector-card"><div class="section-head"><p class="section-title">Plugin đang dùng</p><button class="button button-icon button-quiet" aria-label="Mở thư viện Plugin" data-action="view" data-view="library">＋</button></div><div class="chip-list">${plugins.length ? plugins.map((plugin) => `<span class="tag plugin-chip">${escapeHtml(plugin.icon)} ${escapeHtml(plugin.name)}</span>`).join("") : `<span class="empty-chip">Chưa gắn Plugin</span>`}</div></section>
      </aside>
    </div>`;
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
  return `${renderHeading("Không gian làm việc", "Dự án của bạn", "Mỗi dự án giữ riêng hội thoại, Skill, Plugin và tài liệu liên quan.", `<button class="button button-primary" data-action="open-modal" data-modal="new-project">＋ Tạo dự án</button>`)}
    <div class="grid-4" style="margin-bottom:1rem"><article class="card stat-card stat-green"><span class="stat-label">Dự án</span><strong>${state.projects.length}</strong><small>đang quản lý</small></article><article class="card stat-card stat-gold"><span class="stat-label">Đoạn chat</span><strong>${state.threads.length}</strong><small>có thể ghim</small></article><article class="card stat-card stat-blue"><span class="stat-label">Tin nhắn</span><strong>${totalMessages}</strong><small>trong các Thread</small></article><article class="card stat-card"><span class="stat-label">Skill chung</span><strong>${state.skills.length}</strong><small>dùng cho mọi AI</small></article></div>
    <div class="project-card-grid">${state.projects.map(renderProjectTile).join("")}</div>`;
}

function renderProjectTile(project) {
  const threadCount = state.threads.filter((thread) => thread.projectId === project.id).length;
  const skillsCount = project.skillIds?.length || 0;
  return `<article class="card project-tile" style="--accent:${escapeHtml(project.color || "#9fe777")}"><div class="tile-top"><div class="tile-icon">⌂</div><button class="pin-button ${project.pinned ? "pinned" : ""}" aria-label="Ghim dự án" data-action="toggle-project-pin" data-project-id="${escapeHtml(project.id)}">${project.pinned ? "◆" : "◇"}</button></div><div class="tile-copy"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p></div><div class="tile-footer"><span>${threadCount} chat · ${skillsCount} Skill</span><span>${escapeHtml(project.updatedAt || "")}</span></div><div class="tile-actions"><button class="button button-primary button-wide" data-action="select-project" data-project-id="${escapeHtml(project.id)}">Mở dự án →</button></div></article>`;
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
  return `<article class="card library-tile" style="--accent:#e4c36c"><div class="tile-top"><div class="tile-icon">⚑</div><button class="pin-button pinned" aria-label="Bỏ ghim đoạn chat" data-action="toggle-thread-pin" data-thread-id="${escapeHtml(thread.id)}">⚑</button></div><div class="tile-copy"><h3>${escapeHtml(thread.title)}</h3><p>${escapeHtml(project?.name || "Dự án")}<br>${thread.messages.length} tin nhắn · cập nhật ${escapeHtml(thread.updatedAt || "")}</p></div><div class="tile-actions"><button class="button button-primary button-wide" data-action="select-thread" data-thread-id="${escapeHtml(thread.id)}">Mở đoạn chat →</button></div></article>`;
}

function renderUsageView() {
  const available = state.models.filter((model) => model.available);
  const totalUsed = available.reduce((sum, model) => sum + usageStats(model).used, 0);
  const totalLimit = available.reduce((sum, model) => sum + usageStats(model).limit, 0);
  const lowest = available.slice().sort((a, b) => usageStats(a).remainingPercent - usageStats(b).remainingPercent)[0];
  return `${renderHeading("Theo dõi sử dụng", "Hạn mức & token", "Theo dõi từng AI, nhận biết lúc sắp hết và chuyển sang mô hình dự phòng trước khi mạch chuyện bị ngắt.", `<button class="button button-gold" data-action="open-modal" data-modal="connection">＋ Kết nối AI</button>`)}
    <div class="grid-4" style="margin-bottom:1rem"><article class="card stat-card stat-green"><span class="stat-label">Token đã dùng</span><strong>${formatNumber(totalUsed)}</strong><small>trên các AI đang bật</small></article><article class="card stat-card stat-blue"><span class="stat-label">Token còn lại</span><strong>${formatNumber(Math.max(0, totalLimit - totalUsed))}</strong><small>theo hạn mức hiện tại</small></article><article class="card stat-card stat-gold"><span class="stat-label">AI sắp hết nhất</span><strong>${lowest ? Math.round(usageStats(lowest).remainingPercent) : 0}%</strong><small>${lowest ? escapeHtml(lowest.name) : "Chưa có dữ liệu"}</small></article><article class="card stat-card"><span class="stat-label">Cách đo</span><strong>${config.apiBaseUrl ? "API" : "Demo"}</strong><small>${config.apiBaseUrl ? "nhật ký gateway" : "ước tính cục bộ"}</small></article></div>
    <section class="grid-2" style="margin-bottom:1rem">${available.map((model) => `<article class="card card-pad"><div class="section-head"><div><p class="section-title">${escapeHtml(model.name)}</p><p>${escapeHtml(model.provider)} · ${escapeHtml(model.tier)}</p></div><span class="tag">${Math.round(usageStats(model).remainingPercent)}% còn</span></div>${quotaMeter(model)}<div class="metric-list" style="margin-top:.9rem"><div class="metric-line"><span>Đã dùng</span><strong>${exactNumber(usageStats(model).used)} token</strong></div><div class="metric-line"><span>Còn lại</span><strong>${exactNumber(usageStats(model).remaining)} token</strong></div><div class="metric-line"><span>Làm mới</span><strong>${escapeHtml(model.reset)}</strong></div></div></article>`).join("")}</section>
    <section class="card card-pad"><div class="section-head"><div><p class="section-title">Nhật ký gần đây</p><p>Input và output được ghi theo từng câu trả lời.</p></div><span class="tag">${state.usageLog.length} lượt</span></div><div class="table-wrap"><table><thead><tr><th>Thời gian</th><th>AI</th><th>Input</th><th>Output</th><th>Tổng</th><th>Nguồn</th></tr></thead><tbody>${state.usageLog.slice(0, 10).map((entry) => `<tr><td>${escapeHtml(entry.time)}</td><td>${escapeHtml(getModel(entry.modelId).name)}</td><td>${exactNumber(entry.input)}</td><td>${exactNumber(entry.output)}</td><td><strong>${exactNumber(entry.total)}</strong></td><td>${escapeHtml(entry.source)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderSettingsView() {
  return `${renderHeading("Thiết lập", "Cài đặt Bambuseae", "Kết nối AI, điều chỉnh cách chuyển tiếp và kiểm tra trạng thái bảo mật.", `<button class="button button-primary" data-action="open-modal" data-modal="connection">＋ Thêm kết nối</button>`)}
    <div class="settings-grid"><div class="settings-stack"><section class="card card-pad"><div class="section-head"><div><p class="section-title">Tài khoản</p><p>Google OAuth sẽ được bật khi có API gateway.</p></div><span class="status-pill ${config.googleOAuthEnabled ? "" : "demo"}">${config.googleOAuthEnabled ? "Google đã cấu hình" : "Chưa cấu hình"}</span></div><div class="connection-row"><div class="connection-icon">G</div><div class="connection-copy"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.email)} · ${escapeHtml(authProviderLabel())}</span></div><button class="button button-quiet" data-action="google-login">${state.authProvider === "google" ? "Đã liên kết Google" : "Liên kết Google"}</button></div><button class="button button-danger" data-action="demo-logout">Đăng xuất</button></section>
      <section class="card card-pad"><div class="section-head"><div><p class="section-title">Kết nối AI</p><p>Khóa cá nhân chỉ giữ trong phiên trình duyệt của bản V1.</p></div></div>${state.models.filter((model) => !model.shared).map((model) => `<div class="connection-row"><div class="connection-icon">${escapeHtml(model.provider.slice(0, 1))}</div><div class="connection-copy"><strong>${escapeHtml(model.name)}</strong><span>${model.available ? "Đã ghi nhận trong phiên" : "Chưa kết nối"} · hạn mức ${exactNumber(model.limit)} token</span></div><button class="button button-quiet" data-action="open-modal" data-modal="connection" data-model-id="${escapeHtml(model.id)}">${model.available ? "Cập nhật" : "Kết nối"}</button></div>`).join("")}</section></div>
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
  saveState();
  render();
}

function selectProject(projectId) {
  const project = getProject(projectId);
  state.activeProjectId = project.id;
  const firstThread = state.threads.find((thread) => thread.projectId === project.id);
  if (firstThread) state.activeThreadId = firstThread.id;
  state.activeView = "chat";
  saveState();
  render();
}

function selectThread(threadId) {
  const thread = getThread(threadId);
  state.activeThreadId = thread.id;
  state.activeProjectId = thread.projectId;
  state.activeView = "chat";
  saveState();
  render();
}

function createNewChat() {
  const project = getProject();
  const thread = { id: uid("thread"), projectId: project.id, title: "Đoạn chat mới", pinned: false, updatedAt: nowTime(), messages: [] };
  state.threads.unshift(thread);
  project.threadIds = [thread.id, ...(project.threadIds || [])];
  state.activeThreadId = thread.id;
  state.activeView = "chat";
  saveState();
  render();
  toast("Đã tạo đoạn chat mới trong dự án hiện tại.", "success");
}

function createProject(name, description) {
  const project = { id: uid("project"), name, description: description || "Chưa có mô tả.", pinned: false, color: "#9fe777", threadIds: [], skillIds: ["continuity"], pluginIds: ["context-handoff", "token-monitor"], updatedAt: "Vừa tạo" };
  const thread = { id: uid("thread"), projectId: project.id, title: "Đoạn chat khởi đầu", pinned: false, updatedAt: nowTime(), messages: [] };
  project.threadIds.push(thread.id);
  state.projects.unshift(project);
  state.threads.unshift(thread);
  state.activeProjectId = project.id;
  state.activeThreadId = thread.id;
  state.activeView = "chat";
  saveState();
  render();
  toast(`Đã tạo dự án “${name}”.`, "success");
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
  project.pinned = !project.pinned;
  saveState();
  render();
  toast(project.pinned ? "Đã ghim dự án." : "Đã bỏ ghim dự án.", "success");
}

function toggleThreadPin(threadId) {
  const thread = getThread(threadId);
  thread.pinned = !thread.pinned;
  saveState();
  render();
  toast(thread.pinned ? "Đã ghim đoạn chat." : "Đã bỏ ghim đoạn chat.", "success");
}

function toggleMessagePin(messageId) {
  const thread = getThread();
  const message = thread.messages.find((item) => item.id === messageId);
  if (!message) return;
  message.pinned = !message.pinned;
  saveState();
  render();
  toast(message.pinned ? "Đã ghim tin nhắn." : "Đã bỏ ghim tin nhắn.", "success");
}

function branchThread() {
  const source = getThread();
  const project = getProject(source.projectId);
  const branch = { id: uid("thread"), projectId: source.projectId, title: `Nhánh: ${source.title}`, pinned: false, updatedAt: nowTime(), messages: source.messages.map((message) => ({ ...message, id: uid("msg") })) };
  state.threads.unshift(branch);
  project.threadIds = [branch.id, ...(project.threadIds || []).filter((id) => id !== branch.id)];
  state.activeThreadId = branch.id;
  state.activeView = "chat";
  saveState();
  render();
  toast("Đã tách thành một đoạn chat mới nhưng vẫn giữ ngữ cảnh.", "success");
}

function generateDemoReply(prompt, model) {
  const project = getProject();
  const skills = state.skills.filter((skill) => project.skillIds?.includes(skill.id) && skill.enabled).map((skill) => skill.name).join(", ");
  const fallbackNote = state.lastHandoff?.threadId === state.activeThreadId ? `\n\nTôi đang tiếp tục cùng Thread sau khi chuyển từ ${state.lastHandoff.fromName}; không cần nhắc lại nội dung cũ.` : "";
  return `Đã nhận yêu cầu trong dự án “${project.name}” bằng ${model.name}.\n\nTôi đang áp dụng: ${skills || "ngữ cảnh dự án"}. Bản mô phỏng đã ghi nhận câu hỏi vào lịch sử; khi API gateway được cấu hình, nội dung này sẽ được gửi tới AI thật.${fallbackNote}`;
}

async function callConfiguredApi(model, thread) {
  if (!config.apiBaseUrl) return null;
  const project = getProject(thread.projectId);
  const messages = thread.messages.map((message) => ({ role: message.role, content: message.content }));
  const skillContext = state.skills.filter((skill) => project.skillIds?.includes(skill.id) && skill.enabled).map((skill) => ({ name: skill.name, instructions: skill.instructions }));
  const pluginContext = state.plugins.filter((plugin) => project.pluginIds?.includes(plugin.id) && plugin.enabled).map((plugin) => ({ name: plugin.name, permission: plugin.permission }));
  const adapter = getProviderAdapter(model.id);
  const request = adapter.buildGatewayRequest({
    model,
    messages,
    project: { id: project.id, name: project.name, description: project.description },
    skills: skillContext,
    plugins: pluginContext
  });
  const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${request.path}`, {
    method: request.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request.body)
  });
  if (!response.ok) throw new Error(`Gateway ${response.status}`);
  const payload = await response.json();
  const content = payload.message?.content || payload.choices?.[0]?.message?.content || payload.output_text;
  if (!content) throw new Error("Gateway không trả nội dung");
  return { content, usage: payload.usage || null, source: "API" };
}

async function sendMessage(form) {
  const textarea = form.querySelector("textarea[name=prompt]");
  const prompt = textarea.value.trim();
  if (!prompt) return;
  let model = getModel(state.activeModelId);
  const thread = getThread();
  const inputEstimate = estimateTokens(prompt);
  if (usageStats(model).remaining < inputEstimate) {
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
  if (thread.title === "Đoạn chat mới" || thread.title === "Đoạn chat khởi đầu") thread.title = prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt;
  thread.updatedAt = nowTime();
  textarea.value = "";
  saveState();
  render();
  let result = null;
  if (config.apiBaseUrl) {
    try {
      result = await callConfiguredApi(model, thread);
    } catch (error) {
      toast("Gateway chưa trả lời, đang dùng phản hồi mô phỏng để không làm gián đoạn Thread.", "warn");
    }
  }
  const reply = result?.content || generateDemoReply(prompt, model);
  const usage = result?.usage || {};
  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? inputEstimate);
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? estimateTokens(reply));
  const totalTokens = Number(usage.total_tokens ?? (inputTokens + outputTokens));
  model.used = Math.min(model.limit, usageStats(model).used + totalTokens);
  thread.messages.push({ id: uid("msg"), role: "assistant", modelId: model.id, content: reply, time: nowTime(), source: result?.source || "Mô phỏng", pinned: false });
  state.usageLog.unshift({ id: uid("usage"), modelId: model.id, threadId: thread.id, input: inputTokens, output: outputTokens, total: totalTokens, source: result?.source || "Mô phỏng", time: nowTime() });
  if (state.autoFallback && usageStats(model).remainingPercent <= state.fallbackThreshold) {
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
  if (kind === "new-project") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Tạo dự án mới</h2><p>Dự án sẽ có một đoạn chat khởi đầu.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-project"><div class="field"><label for="project-name">Tên dự án</label><input id="project-name" name="name" placeholder="Ví dụ: Dự án truyện mới" required /></div><div class="field"><label for="project-description">Mô tả</label><textarea id="project-description" name="description" placeholder="Mục tiêu chính của dự án"></textarea></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Tạo dự án</button></div></form></div>`;
  } else if (kind === "new-skill") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Thêm Skill dùng chung</h2><p>Skill sẽ có thể gắn vào mọi dự án và AI.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-skill"><div class="field"><label for="skill-name">Tên Skill</label><input id="skill-name" name="name" placeholder="Ví dụ: Biên tập viên tiếng Nhật" required /></div><div class="field"><label for="skill-description">Mô tả</label><input id="skill-description" name="description" placeholder="Skill này giúp AI làm gì?" required /></div><div class="field"><label for="skill-instructions">Hướng dẫn cho AI</label><textarea id="skill-instructions" name="instructions" placeholder="Quy tắc, phong cách, định dạng kết quả…" required></textarea></div><div class="field"><label for="skill-tags">Thẻ, cách nhau bằng dấu phẩy</label><input id="skill-tags" name="tags" placeholder="viết, dịch, chuyên môn" /></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Thêm Skill</button></div></form></div>`;
  } else if (kind === "new-plugin") {
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Thêm Plugin</h2><p>Plugin cần mô tả quyền trước khi dùng.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="new-plugin"><div class="field"><label for="plugin-name">Tên Plugin</label><input id="plugin-name" name="name" placeholder="Ví dụ: Đọc thư mục tài liệu" required /></div><div class="field"><label for="plugin-description">Mô tả</label><input id="plugin-description" name="description" placeholder="Plugin thực hiện việc gì?" required /></div><div class="field"><label for="plugin-permission">Quyền truy cập</label><select id="plugin-permission" name="permission"><option>Chỉ đọc</option><option>Đọc và ghi</option><option>Gọi Internet</option><option>Cần xác nhận mỗi lần</option></select></div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Thêm Plugin</button></div></form></div>`;
  } else {
    const limit = targetModel?.limit || 250000;
    modal.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>${targetModel?.available ? "Cập nhật kết nối" : "Kết nối AI cá nhân"}</h2><p>API key chỉ nằm trong bộ nhớ phiên bản V1, không được lưu vào GitHub.</p></div><button class="button button-icon button-quiet" data-action="close-modal" aria-label="Đóng">×</button></div><form data-form="connection"><div class="field"><label for="connection-model">AI</label><select id="connection-model" name="modelId">${state.models.filter((model) => !model.shared).map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === targetModel?.id ? "selected" : ""}>${escapeHtml(model.name)}</option>`).join("")}</select></div><div class="field"><label for="connection-key">API key</label><input id="connection-key" name="key" type="password" autocomplete="off" placeholder="Dán key tại đây; không đưa vào mã nguồn" required /></div><div class="field"><label for="connection-limit">Hạn mức token bạn muốn theo dõi</label><input id="connection-limit" name="limit" type="number" min="1" value="${limit}" required /></div><div class="security-note"><strong>Lưu ý:</strong> bản GitHub tĩnh chưa thể xác minh API key hoặc đồng bộ an toàn; bản V1 chỉ ghi nhận key trong bộ nhớ phiên. Muốn dùng thật cho nhiều tài khoản, hãy cấu hình API gateway riêng.</div><div class="form-actions"><button class="button button-quiet" type="button" data-action="close-modal">Hủy</button><button class="button button-primary" type="submit">Lưu kết nối phiên này</button></div></form></div>`;
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
  if (config.googleOAuthEnabled && config.apiBaseUrl) {
    const mode = state.authenticated ? "link" : authMode === "register" ? "register" : "login";
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `${config.apiBaseUrl.replace(/\/$/, "")}/auth/google/start?mode=${mode}&redirect=${redirect}`;
    return;
  }
  toast("Google OAuth chưa được cấu hình. Hãy dùng email bản thử hoặc cấu hình backend trong config.js.", "warn");
}

async function hydrateRemoteSession() {
  if (!config.apiBaseUrl || state.authenticated) return;
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
  if (action === "view") return setActiveView(target.dataset.view);
  if (action === "toggle-theme") return toggleTheme();
  if (action === "auth-mode") return setAuthMode(target.dataset.mode);
  if (action === "demo-guest") return enterGuestMode();
  if (action === "toggle-sidebar") return document.body.classList.toggle("sidebar-open");
  if (action === "new-chat") return createNewChat();
  if (action === "open-modal") return openModal(target.dataset.modal, target.dataset.modelId || "");
  if (action === "close-modal") return closeModal();
  if (action === "select-project") return selectProject(target.dataset.projectId);
  if (action === "select-thread") return selectThread(target.dataset.threadId);
  if (action === "toggle-project-pin") return toggleProjectPin(target.dataset.projectId);
  if (action === "toggle-thread-pin") return toggleThreadPin(target.dataset.threadId);
  if (action === "toggle-message-pin") return toggleMessagePin(target.dataset.messageId);
  if (action === "handoff") return handoffToFallback();
  if (action === "branch-thread") return branchThread();
  if (action === "set-library-filter") { state.libraryFilter = target.dataset.filter; saveState(); return render(); }
  if (action === "select-suggestion") { const textarea = document.querySelector("textarea[name=prompt]"); if (textarea) { textarea.value = target.dataset.text; textarea.focus(); } return; }
  if (action === "toggle-skill") { const skill = state.skills.find((item) => item.id === target.dataset.skillId); if (skill) { skill.enabled = !skill.enabled; saveState(); render(); } return; }
  if (action === "toggle-plugin") { const plugin = state.plugins.find((item) => item.id === target.dataset.pluginId); if (plugin) { plugin.enabled = !plugin.enabled; saveState(); render(); } return; }
  if (action === "google-login") {
    startGoogleAuth();
    return;
  }
  if (action === "demo-logout") {
    clearAuthSession();
    state.user = structuredClone(defaultState.user);
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
  if (type === "new-project") { closeModal(); return createProject(String(data.get("name") || "Dự án mới").trim(), String(data.get("description") || "").trim()); }
  if (type === "new-skill") {
    const skill = { id: uid("skill"), name: String(data.get("name") || "Skill mới").trim(), description: String(data.get("description") || "").trim(), instructions: String(data.get("instructions") || "").trim(), tags: String(data.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean), enabled: true, icon: "✦", scope: "Cá nhân" };
    state.skills.unshift(skill);
    const project = getProject();
    project.skillIds = [...new Set([...(project.skillIds || []), skill.id])];
    closeModal(); saveState(); render(); toast(`Đã thêm Skill “${skill.name}”.`, "success");
    return;
  }
  if (type === "new-plugin") {
    const plugin = { id: uid("plugin"), name: String(data.get("name") || "Plugin mới").trim(), description: String(data.get("description") || "").trim(), permission: String(data.get("permission") || "Chỉ đọc"), enabled: true, icon: "◇", scope: "Cá nhân" };
    state.plugins.unshift(plugin);
    const project = getProject();
    project.pluginIds = [...new Set([...(project.pluginIds || []), plugin.id])];
    closeModal(); saveState(); render(); toast(`Đã thêm Plugin “${plugin.name}”.`, "success");
    return;
  }
  if (type === "connection") {
    const model = getModel(String(data.get("modelId")));
    const key = String(data.get("key") || "").trim();
    if (!model || !key) return;
    sessionKeys[model.id] = key;
    model.available = true;
    model.status = "Đã ghi nhận trong phiên";
    model.limit = Math.max(1, Number(data.get("limit")) || model.limit);
    model.note = "Đã ghi nhận trong phiên; cần gateway để gọi thật";
    const existing = state.connections.find((connection) => connection.modelId === model.id);
    if (existing) existing.updatedAt = nowTime();
    else state.connections.push({ id: uid("connection"), modelId: model.id, updatedAt: nowTime() });
    closeModal(); saveState(); render(); toast(`${model.name} đã được ghi nhận trong phiên này.`, "success");
  }
}

document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("submit", handleSubmit);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
render();
void hydrateRemoteSession();
