"use strict";

const state = {
  bootstrap: null,
  dashboard: null,
  draft: null,
  authenticated: false,
  username: "",
  editor: false,
  setupImport: null,
  health: new Map(),
  widgets: new Map(),
  widgetSupport: [],
  system: null,
  search: "",
  collapsed: new Set(),
  editingItem: null,
  editorTab: "appearance",
  activePage: "home",
};

const app = document.getElementById("app");
const overlay = document.getElementById("overlay");
const toastElement = document.getElementById("toast");

const ICON_FILES = {
  qbittorrent: "qbittorrent.svg", prowlarr: "prowlarr.svg",
  radarr: "radarr.svg", sonarr: "sonarr.svg", seerr: "seerr.svg",
  jellyseerr: "seerr.svg", overseerr: "seerr.svg", bazarr: "bazarr.svg",
  tautulli: "tautulli.svg", pihole: "pihole.svg", dozzle: "dozzle.svg",
  uptimekuma: "uptime-kuma.svg", dockge: "dockge.svg",
  flaresolverr: "flaresolverr.svg", github: "github.svg",
  rogueforge: "rogueforge.jpg", roguedashboard: "roguedashboard-approved-128.png",
  rogueroutegpx: "rogueroute-gpx.svg", rogueroutegpxweb: "rogueroute-gpx.svg",
  roguerouteosrm: "rogueroute-osrm.svg", rogueroutegpxosrm: "rogueroute-osrm.svg",
  rogueroutemanager: "rogueroute-manager.svg", rogueroutegpxmanager: "rogueroute-manager.svg",
};

const ICON_REMOTE_OVERRIDES = {
  rogueforge: "https://raw.githubusercontent.com/RogueAssassin/RogueForge/main/static/branding/rogueforge.svg",
  roguedashboard: "/icons/roguedashboard-approved-128.png?v=1.4.0",
};

const THEME_PRESETS = {
  neon: ["#ff2bd6", "#00e5ff"], midnight: ["#7c5cff", "#1db7bd"],
  graphite: ["#aeb6c5", "#667085"], ocean: ["#24a8ff", "#38f2cf"],
  ember: ["#ff5d3d", "#ffbf36"], light: ["#6d4aff", "#0aa6b7"],
};

const INTEGRATION_DEFAULTS = {
  qbittorrent: { refs: ["RGDASH_QBITTORRENT_API_KEY", "RGDASH_QBITTORRENT_USERNAME", "RGDASH_QBITTORRENT_PASSWORD"], bindings: { api_key: "RGDASH_QBITTORRENT_API_KEY", username: "RGDASH_QBITTORRENT_USERNAME", password: "RGDASH_QBITTORRENT_PASSWORD" } },
  prowlarr: { refs: ["RGDASH_PROWLARR_KEY"], bindings: { key: "RGDASH_PROWLARR_KEY" } },
  radarr: { refs: ["RGDASH_RADARR_KEY"], bindings: { key: "RGDASH_RADARR_KEY" } },
  sonarr: { refs: ["RGDASH_SONARR_KEY"], bindings: { key: "RGDASH_SONARR_KEY" } },
  seerr: { refs: ["RGDASH_SEERR_KEY"], bindings: { key: "RGDASH_SEERR_KEY" } },
  bazarr: { refs: ["RGDASH_BAZARR_KEY"], bindings: { key: "RGDASH_BAZARR_KEY" } },
  tautulli: { refs: ["RGDASH_TAUTULLI_KEY"], bindings: { key: "RGDASH_TAUTULLI_KEY" } },
  pihole: { refs: ["RGDASH_PIHOLE_KEY"], bindings: { key: "RGDASH_PIHOLE_KEY" } },
  rogueforge: { refs: [], bindings: {} },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(value) : "";
  } catch {
    return "";
  }
}

function launchAttributes(item, href) {
  if (!href) return "";
  if (item.launchMode === "same-tab") return `href="${href}"`;
  if (item.launchMode === "copy") return `href="#" data-copy-url="${href}"`;
  return `href="${href}" target="_blank" rel="noreferrer"`;
}

function normalizedTags(item) {
  return Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === "string" && tag.trim()).map(tag => tag.trim()) : [];
}

function itemMatchesQuery(item, group, query) {
  if (!query) return true;
  const terms = query.split(/\s+/).filter(Boolean);
  const tags = normalizedTags(item).map(tag => tag.toLowerCase());
  const haystack = `${item.name} ${item.description || ""} ${group.name} ${tags.join(" ")}`.toLowerCase();
  return terms.every(term => {
    if (term === "fav:" || term === "favorite:" || term === "favourite:") return item.favorite === true;
    if (term.startsWith("tag:")) return tags.includes(term.slice(4));
    return haystack.includes(term);
  });
}

function commandItems(query = "") {
  const needle = query.trim().toLowerCase();
  const entries = [];
  for (const page of state.draft.pages || []) {
    entries.push({ kind: "Page", label: page.name, detail: "Switch dashboard page", action: () => { state.activePage = page.id; closeOverlay(); renderDashboard(); } });
  }
  for (const group of state.draft.groups || []) {
    for (const item of group.items || []) {
      const href = safeUrl(item.href);
      entries.push({
        kind: item.favorite ? "Favourite" : (item.type === "bookmark" ? "Bookmark" : "Service"),
        label: item.name,
        detail: [group.name, ...normalizedTags(item)].filter(Boolean).join(" · "),
        action: () => {
          closeOverlay();
          if (!href) return;
          if (item.launchMode === "copy") navigator.clipboard?.writeText(item.href).then(() => toast("URL copied"));
          else if (item.launchMode === "same-tab") location.href = item.href;
          else window.open(item.href, "_blank", "noopener,noreferrer");
        },
      });
    }
  }
  entries.push({ kind: "Action", label: state.authenticated ? "Customise dashboard" : "Administrator sign in", detail: "Open RogueDashboard administration", action: () => { closeOverlay(); state.authenticated ? openEditor() : openLogin(); } });
  return entries.filter(entry => !needle || `${entry.kind} ${entry.label} ${entry.detail}`.toLowerCase().includes(needle)).slice(0, 40);
}

function openCommandPalette(initial = "") {
  overlay.innerHTML = `<div class="modal-backdrop command-backdrop"><section class="modal command-modal">
    <header class="command-header"><span>⌕</span><input id="command-query" value="${escapeHtml(initial)}" placeholder="Search services, pages, tags or actions…" autocomplete="off"><kbd>Esc</kbd></header>
    <div class="command-results" id="command-results"></div>
  </section></div>`;
  const input = document.getElementById("command-query");
  const results = document.getElementById("command-results");
  const render = () => {
    const entries = commandItems(input.value);
    results.innerHTML = entries.map((entry, index) => `<button class="command-result" data-command="${index}"><span><small>${escapeHtml(entry.kind)}</small><strong>${escapeHtml(entry.label)}</strong><em>${escapeHtml(entry.detail)}</em></span><b>↵</b></button>`).join("") || `<div class="command-empty">No matching services or actions.</div>`;
    results.querySelectorAll("[data-command]").forEach(button => button.onclick = () => entries[Number(button.dataset.command)].action());
  };
  input.oninput = render;
  input.onkeydown = event => {
    if (event.key === "Enter") {
      const first = commandItems(input.value)[0];
      if (first) { event.preventDefault(); first.action(); }
    }
  };
  overlay.querySelector(".command-backdrop").onclick = event => { if (event.target === event.currentTarget) closeOverlay(); };
  render();
  requestAnimationFrame(() => input.focus());
}

function iconKey(value) {
  return String(value || "").split(/[\\/]/).pop().replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function iconCandidates(item) {
  const supplied = item.icon || "";
  if (/^(https?:|data:|\/custom\/|\/icons\/)/i.test(supplied)) return [safeUrl(supplied)].filter(Boolean);
  const keys = [iconKey(supplied), iconKey(item.widget?.type), iconKey(item.name)];
  const key = keys.find(candidate => ICON_FILES[candidate]);
  const file = key ? ICON_FILES[key] : "";
  if (!file) return [];
  const base = String(state.bootstrap?.assets?.baseUrl || "https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/app/static").replace(/\/$/, "");
  const remote = ICON_REMOTE_OVERRIDES[key] || `${base}/icons/${file}`;
  return [
    `/custom/icons/${file}`,
    remote,
    `/icons/${file}`,
  ];
}

function iconMarkupFor(item) {
  const candidates = iconCandidates(item);
  if (!candidates.length) return `<span>${escapeHtml(initials(item.name))}</span>`;
  const fallback = escapeHtml(JSON.stringify(candidates.slice(1)));
  return `<img src="${candidates[0]}" data-icon-fallbacks="${fallback}" alt="">`;
}

function bindIconFallbacks(root) {
  root.querySelectorAll("img[data-icon-fallbacks]").forEach(img => {
    img.addEventListener("error", () => {
      let remaining = [];
      try { remaining = JSON.parse(img.dataset.iconFallbacks || "[]"); } catch {}
      const next = remaining.shift();
      if (next) {
        img.dataset.iconFallbacks = JSON.stringify(remaining);
        img.src = next;
      } else {
        const fallback = document.createElement("span");
        fallback.textContent = initials(img.closest(".service-card")?.querySelector(".service-name strong")?.textContent || "?");
        img.replaceWith(fallback);
      }
    });
  });
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function toast(message) {
  toastElement.textContent = message;
  toastElement.hidden = false;
  clearTimeout(toastElement.timer);
  toastElement.timer = setTimeout(() => { toastElement.hidden = true; }, 3200);
}

async function load() {
  try {
    const bootstrap = await request("/api/bootstrap");
    state.bootstrap = bootstrap;
    state.authenticated = bootstrap.authenticated;
    state.username = bootstrap.username || "";
    state.dashboard = bootstrap.dashboard;
    state.draft = structuredClone(bootstrap.dashboard);
    if (!state.draft.pages?.some(page => page.id === state.activePage)) state.activePage = state.draft.pages?.[0]?.id || "home";
    if (bootstrap.setupRequired) renderSetup();
    else renderDashboard();
  } catch (error) {
    app.innerHTML = `<main class="center-stage"><section class="error-card"><div class="brand-mark"><img data-rgd-brand-image src="/icons/roguedashboard-approved-128.png?v=1.4.0" alt="RogueDashboard"></div><h1>Dashboard unavailable</h1><p>${escapeHtml(error.message)}</p><button class="button primary" id="retry">Try again</button></section></main>`;
    document.getElementById("retry").onclick = load;
  }
}

function renderSetup() {
  app.innerHTML = `
    <main class="setup-shell">
      <div class="setup-glow setup-glow-one"></div><div class="setup-glow setup-glow-two"></div>
      <section class="setup-card">
        <header class="setup-brand"><div class="brand-mark"><img data-rgd-brand-image src="/icons/roguedashboard-approved-128.png?v=1.4.0" alt="RogueDashboard"></div><div><strong>RogueDashboard</strong><span>Service dashboard</span></div></header>
        <div class="setup-progress"><span class="active"></span><span class="active"></span><span class="active"></span></div>
        <form class="setup-page" id="setup-form">
          <div class="setup-icon">◆</div><p class="eyebrow">WELCOME HOME</p>
          <h1>Your container services, without the configuration headache.</h1>
          <p class="lead">Name the dashboard, optionally import your previous configuration, then create the local administrator who can change it.</p>
          <label class="field"><span>Dashboard name</span><input id="setup-title" maxlength="100" value="${escapeHtml(state.draft.meta.title)}" required></label>
          <label class="upload-zone" id="setup-upload">
            <input id="setup-files" type="file" accept=".json,.zip,.yaml,.yml" multiple>
            <strong>Restore RogueDashboard JSON or choose legacy ZIP/YAML</strong><span>Credentials remain environment references</span>
          </label>
          <div id="setup-import-result"></div>
          <div class="form-grid">
            <label class="field full"><span>Administrator username</span><input id="setup-user" autocomplete="username" value="admin" minlength="2" required></label>
            <label class="field"><span>Password</span><input id="setup-password" type="password" autocomplete="new-password" minlength="10" required></label>
            <label class="field"><span>Confirm password</span><input id="setup-confirm" type="password" autocomplete="new-password" minlength="10" required></label>
          </div>
          <div class="notice error" id="setup-error" hidden></div>
          <button class="button primary large full-button" id="setup-submit">Open dashboard <span>→</span></button>
        </form>
      </section>
    </main>`;
  document.getElementById("setup-files").onchange = event => importForSetup(event.target.files);
  document.getElementById("setup-form").onsubmit = completeSetup;
}

async function importPayload(files) {
  const selected = [...files];
  if (!selected.length) throw new Error("Choose a legacy dashboard ZIP or YAML file first.");
  const zip = selected.find(file => file.name.toLowerCase().endsWith(".zip"));
  if (zip) {
    if (zip.size > 2_000_000) throw new Error("The configuration ZIP must be smaller than 2 MB.");
    const bytes = new Uint8Array(await zip.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 32768) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
    }
    return { zipBase64: btoa(binary) };
  }
  const result = {};
  for (const file of selected) {
    if (/\.(yaml|yml)$/i.test(file.name)) result[file.name.split(/[\\/]/).pop()] = await file.text();
  }
  return { files: result };
}

async function previewImport(files) {
  const selected = [...files];
  const jsonFile = selected.find(file => file.name.toLowerCase().endsWith(".json"));
  if (jsonFile) {
    if (jsonFile.size > 2_000_000) throw new Error("The dashboard backup must be smaller than 2 MB.");
    let dashboard;
    try { dashboard = JSON.parse(await jsonFile.text()); }
    catch { throw new Error("The selected JSON backup could not be parsed."); }
    return request("/api/import/dashboard", { method: "POST", body: JSON.stringify({ dashboard }) });
  }
  return request("/api/import/homepage", { method: "POST", body: JSON.stringify(await importPayload(files)) });
}

async function importForSetup(files) {
  const resultBox = document.getElementById("setup-import-result");
  resultBox.innerHTML = `<div class="notice info">Reading configuration…</div>`;
  try {
    const result = await previewImport(files);
    state.setupImport = result;
    state.draft = structuredClone(result.dashboard);
    document.getElementById("setup-title").value = result.dashboard.meta.title;
    const secretText = result.summary.secretReferences.length ? ` · ${result.summary.secretReferences.length} safe environment references` : "";
    resultBox.innerHTML = `<div class="notice good">Ready: ${result.summary.services} services, ${result.summary.bookmarks} bookmarks, ${result.summary.groups} groups${secretText}</div>${result.warnings.map(w => `<div class="notice warning">${escapeHtml(w)}</div>`).join("")}`;
  } catch (error) {
    resultBox.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
  }
}

async function completeSetup(event) {
  event.preventDefault();
  const errorBox = document.getElementById("setup-error");
  const password = document.getElementById("setup-password").value;
  const confirm = document.getElementById("setup-confirm").value;
  if (password !== confirm) {
    errorBox.textContent = "The passwords do not match.";
    errorBox.hidden = false;
    return;
  }
  const dashboard = structuredClone(state.draft);
  dashboard.meta.title = document.getElementById("setup-title").value.trim() || "My Container Dashboard";
  const button = document.getElementById("setup-submit");
  button.disabled = true;
  button.textContent = "Finishing setup…";
  try {
    await request("/api/setup", {
      method: "POST",
      body: JSON.stringify({ username: document.getElementById("setup-user").value, password, dashboard }),
    });
    await load();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    button.disabled = false;
    button.textContent = "Open dashboard →";
  }
}

function initials(name) {
  return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatBytes(value) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = Number(value || 0), unit = 0;
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit++; }
  return `${amount.toFixed(unit > 2 ? 1 : 0)} ${units[unit]}`;
}

function formatUptime(seconds) {
  const days = Math.floor((seconds || 0) / 86400);
  const hours = Math.floor(((seconds || 0) % 86400) / 3600);
  return days ? `${days}d ${hours}h` : `${hours}h`;
}

function renderDashboard() {
  const dashboard = state.draft;
  document.title = dashboard.meta.title;
  app.innerHTML = `
    <div class="app-shell theme-${escapeHtml(dashboard.meta.theme)} background-${escapeHtml(dashboard.meta.backgroundMode)} density-${escapeHtml(dashboard.meta.density)} ${state.editor ? "editing" : ""}" id="shell">
      <div class="dashboard-background" id="dashboard-background"></div><div class="ambient ambient-one"></div><div class="ambient ambient-two"></div>
      <main class="dashboard ${dashboard.meta.fullWidth ? "full-width" : ""}">
        <header class="topbar">
          <div class="brand-block"><div class="brand-mark small"><img data-rgd-brand-image src="/icons/roguedashboard-approved-128.png?v=1.4.0" alt=""></div><div><h1>${escapeHtml(dashboard.meta.title)}</h1><p>${escapeHtml(dashboard.meta.subtitle)}</p></div></div>
          <div class="topbar-actions"><div class="search-box"><span>⌕</span><input id="search" placeholder="Search apps, tags, fav:…" value="${escapeHtml(state.search)}"><button id="clear-search" aria-label="Clear search">×</button></div><button class="button glass command-button" id="commands" title="Command palette (Ctrl+K)">⌘ K</button><button class="button glass" id="customise">${state.authenticated ? "⚙ Customise" : "↪ Admin"}</button></div>
        </header>
        <nav class="page-tabs" aria-label="Dashboard pages">${(dashboard.pages || [{ id: "home", name: "Home" }]).map(page => `<button class="${page.id === state.activePage ? "active" : ""}" data-page="${escapeHtml(page.id)}">${escapeHtml(page.name)}</button>`).join("")}</nav>
        <section class="stat-strip" id="stats">
          <div class="hero-time"><span>◷</span><div><strong id="clock">--:--</strong><span id="date">Loading…</span></div></div>
          <div class="mini-stat"><span>◆</span><div><strong id="container-count">—</strong><span id="container-label">Live widgets</span></div></div>
          <div class="mini-stat"><span>●</span><div><strong id="online-count">—</strong><span>Services online</span></div></div>
          <div class="mini-stat"><span>▤</span><div><strong id="memory-count">—</strong><span id="memory-total">Memory</span></div></div>
          <div class="mini-stat"><span>⌁</span><div><strong id="load-count">—</strong><span id="uptime-count">System load</span></div></div>
        </section>
        <div class="result-count" id="result-count"></div><div class="groups" id="groups"></div>
        <footer class="page-footer"><span>RogueDashboard <strong>v${escapeHtml(state.bootstrap?.version || "1.4.0")}</strong></span><span>Service monitoring · local-first</span></footer>
      </main>
      ${state.editor ? editorMarkup() : ""}
    </div>`;
  const shell = document.getElementById("shell");
  shell.style.setProperty("--accent", dashboard.meta.accent);
  shell.style.setProperty("--accent-secondary", dashboard.meta.accentSecondary);
  shell.style.setProperty("--glow-strength", Number(dashboard.meta.glow || 0) / 100);
  shell.style.setProperty("--glow-opacity", Number(dashboard.meta.glow || 0) / 590);
  shell.style.setProperty("--glow-blur", `${Math.round(Number(dashboard.meta.glow || 0) * .38)}px`);
  shell.style.setProperty("--surface-opacity", `${Number(dashboard.meta.surfaceOpacity || 82)}%`);
  const background = document.getElementById("dashboard-background");
  if (dashboard.meta.background) background.style.setProperty("--custom-background", `url("${dashboard.meta.background.replace(/["\\\n\r]/g, "")}")`);
  document.getElementById("search").oninput = event => { state.search = event.target.value; renderGroups(); };
  document.getElementById("clear-search").onclick = () => { state.search = ""; document.getElementById("search").value = ""; renderGroups(); };
  document.getElementById("commands").onclick = () => openCommandPalette();\n  document.getElementById("customise").onclick = () => state.authenticated ? openEditor() : openLogin();
  document.querySelectorAll("[data-page]").forEach(button => button.onclick = () => {
    state.activePage = button.dataset.page;
    renderDashboard();
  });
  if (state.editor) bindEditor();
  renderGroups();
  updateClock();
  updateStats();
  refreshRuntime();
}

function renderGroups() {
  const container = document.getElementById("groups");
  if (!container) return;
  const query = state.search.trim().toLowerCase();
  let visibleCount = 0;
  const html = state.draft.groups.map((group, groupIndex) => {
    if ((group.pageId || state.draft.pages?.[0]?.id || "home") !== state.activePage) return "";
    const items = group.items.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => itemMatchesQuery(item, group, query));
    if (!items.length && (query || !state.editor)) return "";
    visibleCount += items.length;
    const collapsed = state.collapsed.has(group.id);
    const brandedLinks = group.id === "branded-links";
    return `<section class="service-group ${brandedLinks ? "branded-links-group" : ""}" data-group="${groupIndex}"><header class="group-header"><button class="group-title collapse-group" data-id="${escapeHtml(group.id)}"><span>${collapsed ? "›" : "⌄"}</span><h2>${escapeHtml(group.name)}</h2><span>${items.length}</span></button>${state.editor ? `<button class="button tiny add-card" data-group="${groupIndex}">+ Add card</button>` : ""}</header>${collapsed ? "" : `<div class="card-grid ${group.kind === "bookmarks" ? "bookmark-menu" : ""} ${state.draft.meta.equalHeights ? "equal" : ""}" style="--group-columns:${Math.min(group.columns, state.draft.meta.maxColumns)}">${items.map(({ item, itemIndex }) => cardMarkup(item, groupIndex, itemIndex, group.kind)).join("")}${state.editor && !items.length ? `<button class="empty-group add-card" data-group="${groupIndex}">+ Add the first card</button>` : ""}</div>`}</section>`;
  }).join("");
  container.innerHTML = html || `<section class="empty-search"><h2>No matching cards</h2><p>Try another search or add a service.</p></section>`;
  bindIconFallbacks(container);
  document.getElementById("result-count").textContent = query ? `${visibleCount} results for “${state.search}”` : "";
  container.querySelectorAll(".collapse-group").forEach(button => button.onclick = () => {
    state.collapsed.has(button.dataset.id) ? state.collapsed.delete(button.dataset.id) : state.collapsed.add(button.dataset.id);
    renderGroups();
  });
  container.querySelectorAll(".add-card").forEach(button => button.onclick = () => openItem(Number(button.dataset.group)));
  container.querySelectorAll(".card-edit").forEach(button => button.onclick = () => openItem(Number(button.dataset.group), Number(button.dataset.item)));
  container.querySelectorAll("[data-copy-url]").forEach(link => link.onclick = event => {
    event.preventDefault();
    navigator.clipboard?.writeText(link.dataset.copyUrl).then(() => toast("URL copied"));
  });
  if (state.editor) bindDragging(container);
}

function cardMarkup(item, groupIndex, itemIndex, groupKind) {
  const status = state.health.get(item.id);
  const widget = state.widgets.get(item.id);
  const statusState = status?.state || "unknown";
  const href = safeUrl(item.href);
  const iconMarkup = iconMarkupFor(item);
  const statusTitle = status?.message || (statusState === "unknown" ? "Waiting for health status" : statusState);
  const statusMarkup = item.statusStyle !== "none" && item.monitorUrl ? `<span class="status ${statusState} ${item.statusStyle === "badge" ? "badge" : ""}" title="${escapeHtml(statusTitle)}">${item.statusStyle === "badge" ? escapeHtml(statusState) : ""}</span>` : "";
  const latency = Number.isFinite(widget?.latencyMs) ? widget.latencyMs : status?.latencyMs;
  const latencyMarkup = state.draft.meta.showLatency && Number.isFinite(latency) ? `<span class="connection-latency ${widget?.state === "error" || statusState === "offline" ? "failed" : ""}">${latency} ms</span>` : "";
  const tags = normalizedTags(item);\n  const tagMarkup = tags.length ? `<div class="card-tags">${tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : "";\n  const launchHint = item.launchMode === "same-tab" ? "→" : item.launchMode === "copy" ? "⧉" : "↗";\n  return `<article class="service-card ${groupKind === "bookmarks" || item.type === "bookmark" ? "bookmark-card" : ""} ${state.editor ? "editable" : ""} ${widget?.state === "ok" ? "has-widget" : ""} ${item.favorite ? "is-favorite" : ""}" data-group="${groupIndex}" data-item="${itemIndex}" draggable="${state.editor}">${item.favorite ? `<span class="favorite-mark" title="Favourite">★</span>` : ""}${state.editor ? `<span class="drag-handle">⋮⋮</span>` : ""}${latencyMarkup}<a ${launchAttributes(item, href)}><div class="service-main"><div class="service-icon">${iconMarkup}</div><div class="service-copy"><div class="service-name"><strong>${escapeHtml(item.name)}</strong><span>${href ? launchHint : ""}</span></div><p>${escapeHtml(item.description || (item.type === "bookmark" ? "Bookmark" : "Open service"))}</p>${tagMarkup}</div>${statusMarkup}</div>${widgetCardMarkup(item, widget)}</a>${state.editor ? `<button class="card-edit" data-group="${groupIndex}" data-item="${itemIndex}" aria-label="Edit ${escapeHtml(item.name)}">✎</button>` : ""}</article>`;
}

function widgetCardMarkup(item, widget) {
  if (!item.widget) return "";
  if (widget?.state === "ok") {
    const columns = Math.max(1, Math.min(4, widget.metrics.length));
    return `<div class="widget-metrics" style="--widget-columns:${columns}">${widget.metrics.map(metric => `<span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.label)}</small></span>`).join("")}</div>`;
  }
  const labels = {
    configuration_required: "Setup needed",
    error: "API unavailable",
    unsupported: "Coming later",
  };
  const detail = widget?.missingRefs?.length ? `Missing: ${widget.missingRefs.join(", ")}` : widget?.message || "Waiting for the first refresh";
  return `<span class="widget-chip widget-${escapeHtml(widget?.state || "loading")}" title="${escapeHtml(detail)}">${escapeHtml(labels[widget?.state] || item.widget.type)}</span>`;
}

function connectionDiagnosticsMarkup() {
  const items = state.draft.groups.flatMap(group => group.items).filter(item => item.widget || item.monitorUrl);
  if (!items.length) return `<div class="notice info">No service connections are configured.</div>`;
  return `<div class="widget-diagnostics">${items.map(item => {
    const live = state.widgets.get(item.id);
    const probe = state.health.get(item.id);
    const stateName = live?.state === "ok" ? (probe?.state === "offline" ? "error" : "ok") : live?.state || probe?.state || "loading";
    const latency = Number.isFinite(live?.latencyMs) ? live.latencyMs : probe?.latencyMs;
    const loadedEnvironment = (live?.environment || []).filter(entry => entry.loaded).map(entry => entry.name);
    const environmentDetail = loadedEnvironment.length ? ` · .env loaded: ${loadedEnvironment.join(", ")}` : "";
    const detail = live?.missingRefs?.length ? `Missing ${live.missingRefs.join(", ")}` : `${live?.message || (live?.state === "ok" ? `${live.metrics.length} API metrics responding` : probe?.message || (probe?.state === "online" ? "Container endpoint responding" : "Waiting for connection test"))}${environmentDetail}`;
    const endpoint = item.widget?.url || item.monitorUrl || "No private URL";
    const action = stateName === "ok" || stateName === "online" ? "Connected" : stateName === "configuration_required" ? "Configure" : stateName === "error" || stateName === "offline" ? "Check" : "Pending";
    return `<div class="widget-diagnostic"><span class="widget-state-dot ${escapeHtml(stateName)}"></span><div><strong>${escapeHtml(item.name)}</strong><small title="${escapeHtml(`${endpoint} · ${detail}`)}">${escapeHtml(item.widget?.type || "health probe")} · ${escapeHtml(endpoint)} · ${escapeHtml(detail)}</small></div><span>${Number.isFinite(latency) ? `${latency} ms · ` : ""}${action}</span></div>`;
  }).join("")}</div><div class="notice info">Credentials use <strong>RGDASH_*</strong> names in <strong>.env</strong>. Changes take effect after restarting the <strong>roguedashboard</strong> service.</div>`;
}

function proxyDiagnosticsMarkup() {
  const proxy = state.bootstrap?.proxy || {};
  const host = proxy.requestHost || location.hostname;
  const external = host.includes(".") && !["localhost", "127.0.0.1"].includes(host);
  if (proxy.secure) return `<div class="notice good"><strong>Reverse proxy ready:</strong> HTTPS forwarding is detected for ${escapeHtml(host)}.</div>`;
  if (external) return `<div class="notice error"><strong>Proxy needs attention:</strong> ${escapeHtml(host)} reached the dashboard without X-Forwarded-Proto: https.</div>`;
  return `<div class="notice info"><strong>Local connection:</strong> open the public hostname to test Nginx/Cloudflare HTTPS forwarding.</div>`;
}

function bindDragging(container) {
  container.querySelectorAll(".service-card").forEach(card => {
    card.ondragstart = event => event.dataTransfer.setData("text/plain", JSON.stringify({ group: Number(card.dataset.group), item: Number(card.dataset.item) }));
    card.ondragover = event => event.preventDefault();
    card.ondrop = event => {
      event.preventDefault(); event.stopPropagation();
      const source = JSON.parse(event.dataTransfer.getData("text/plain"));
      moveItem(source.group, source.item, Number(card.dataset.group), Number(card.dataset.item));
    };
  });
  container.querySelectorAll(".service-group").forEach(group => {
    group.ondragover = event => event.preventDefault();
    group.ondrop = event => {
      event.preventDefault();
      const source = JSON.parse(event.dataTransfer.getData("text/plain"));
      moveItem(source.group, source.item, Number(group.dataset.group));
    };
  });
}

function moveItem(sourceGroup, sourceItem, targetGroup, targetItem) {
  const [item] = state.draft.groups[sourceGroup].items.splice(sourceItem, 1);
  let index = targetItem ?? state.draft.groups[targetGroup].items.length;
  if (sourceGroup === targetGroup && sourceItem < index) index--;
  state.draft.groups[targetGroup].items.splice(index, 0, item);
  renderGroups();
}

function editorMarkup() {
  const runtime = state.system?.runtime || {};
  const runtimeName = runtime.runtime || "Container";
  const runtimePlatform = [runtime.platform || "Linux", runtime.arch || ""].filter(Boolean).join(" ");
  return `<aside class="editor-panel">
    <header class="editor-header">
      <div class="editor-brand">
        <img src="/icons/roguedashboard-approved-128.png?v=1.4.0" alt="">
        <div><span class="eyebrow">LIVE CUSTOMISER</span><h2>Customise RogueDashboard</h2><p>Preview changes instantly, then save when everything looks right.</p></div>
      </div>
      <button class="icon-button" id="close-editor" aria-label="Close customiser">×</button>
    </header>
    <nav class="editor-tabs" aria-label="Customise sections">
      <button data-editor-tab="appearance" class="${state.editorTab === "appearance" ? "active" : ""}"><span class="tab-symbol">◈</span><span>Appearance</span></button>
      <button data-editor-tab="layout" class="${state.editorTab === "layout" ? "active" : ""}"><span class="tab-symbol">▦</span><span>Layout</span></button>
      <button data-editor-tab="connect" class="${state.editorTab === "connect" ? "active" : ""}"><span class="tab-symbol">↔</span><span>Connect</span></button>
      <button data-editor-tab="admin" class="${state.editorTab === "admin" ? "active" : ""}"><span class="tab-symbol">⌾</span><span>Admin</span></button>
    </nav>
    <div class="editor-content">
      <section class="editor-section editor-tab-panel ${state.editorTab === "appearance" ? "active" : ""}" data-editor-panel="appearance">
        <div class="editor-section-intro"><span class="eyebrow">IDENTITY</span><h3>Appearance</h3><p>Keep the dashboard visually consistent with the Rogue ecosystem while retaining your own title, colours and background.</p></div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Dashboard identity</strong><span>Shown in the browser header and main dashboard title.</span></div></div>
          <label class="field"><span>Dashboard title</span><input id="edit-title" value="${escapeHtml(state.draft.meta.title)}"></label>
          <label class="field"><span>Subtitle</span><input id="edit-subtitle" value="${escapeHtml(state.draft.meta.subtitle)}"></label>
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Theme & density</strong><span>Choose a base style, spacing and background treatment.</span></div></div>
          <div class="form-grid">
            <label class="field"><span>Theme preset</span><select id="edit-theme"><option value="neon">Electric Neon</option><option value="midnight">Midnight</option><option value="graphite">Graphite</option><option value="ocean">Ocean</option><option value="ember">Ember</option><option value="light">Daylight</option></select></label>
            <label class="field"><span>Card density</span><select id="edit-density"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>
            <label class="field full"><span>Background effect</span><select id="edit-background-mode"><option value="neon-grid">Neon grid</option><option value="aurora">Aurora glow</option><option value="mesh">Colour mesh</option><option value="solid">Solid</option><option value="image">Custom image</option></select></label>
          </div>
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Rogue colour system</strong><span>Fine-tune the purple/cyan accents and surface depth.</span></div></div>
          <label class="field color-field"><span>Primary accent</span><div><input id="edit-accent" type="color" value="${escapeHtml(state.draft.meta.accent)}"><input id="edit-accent-text" value="${escapeHtml(state.draft.meta.accent)}"></div></label>
          <label class="field color-field"><span>Secondary accent</span><div><input id="edit-accent-secondary" type="color" value="${escapeHtml(state.draft.meta.accentSecondary)}"><input id="edit-accent-secondary-text" value="${escapeHtml(state.draft.meta.accentSecondary)}"></div></label>
          <label class="field range-field"><span>Ambient glow <strong id="glow-value">${state.draft.meta.glow}%</strong></span><input id="edit-glow" type="range" min="0" max="100" value="${state.draft.meta.glow}"></label>
          <label class="field range-field"><span>Card opacity <strong id="opacity-value">${state.draft.meta.surfaceOpacity}%</strong></span><input id="edit-opacity" type="range" min="45" max="100" value="${state.draft.meta.surfaceOpacity}"></label>
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Custom background</strong><span>Use a local path or HTTPS URL when Custom image is selected.</span></div></div>
          <label class="field"><span>Background URL / local path</span><input id="edit-background" value="${escapeHtml(state.draft.meta.background)}" placeholder="/custom/backgrounds/my-background.jpg"><small>Custom files remain outside the container image and survive upgrades.</small></label>
          <button class="button secondary full-button" id="reset-appearance">Restore Rogue defaults</button>
        </div>
      </section>

      <section class="editor-section editor-tab-panel ${state.editorTab === "layout" ? "active" : ""}" data-editor-panel="layout">
        <div class="editor-section-intro"><span class="eyebrow">STRUCTURE</span><h3>Layout</h3><p>Organise pages, groups and cards with consistent spacing and predictable alignment.</p></div>
        <div class="editor-card">
          <div class="section-heading"><div><h3>Pages</h3><p>Create focused views without duplicating services.</p></div><button class="button small" id="add-page">+ Page</button></div>
          <div class="page-editor-list" id="page-editor-list"></div>
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Dashboard grid</strong><span>Controls the maximum width and card behaviour.</span></div></div>
          <label class="field"><span>Maximum columns</span><select id="edit-max-columns">${[1,2,3,4,5,6].map(value => `<option value="${value}" ${state.draft.meta.maxColumns === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
          <label class="toggle-row"><input id="edit-full" type="checkbox" ${state.draft.meta.fullWidth ? "checked" : ""}><span><strong>Full-width layout</strong><small>Use the available browser width while retaining dashboard gutters.</small></span></label>
          <label class="toggle-row"><input id="edit-equal" type="checkbox" ${state.draft.meta.equalHeights ? "checked" : ""}><span><strong>Equal-height cards</strong><small>Align rows even when widgets have different metric counts.</small></span></label>
          <label class="toggle-row"><input id="edit-latency" type="checkbox" ${state.draft.meta.showLatency ? "checked" : ""}><span><strong>Response-time badges</strong><small>Show the latest health/API latency on service cards.</small></span></label>
        </div>
        <div class="editor-card">
          <div class="section-heading"><div><h3>Groups</h3><p>Rename, reorder, assign pages and control columns.</p></div><button class="button small" id="add-group">+ Group</button></div>
          <div class="group-editor-list" id="group-editor-list"></div>
        </div>
      </section>

      <section class="editor-section editor-tab-panel ${state.editorTab === "connect" ? "active" : ""}" data-editor-panel="connect">
        <div class="editor-section-intro"><span class="eyebrow">INTEGRATIONS</span><h3>Connect</h3><p>Validate private endpoints, API widgets and environment-backed credentials without exposing secrets to the browser.</p></div>
        <div class="editor-card">
          <div class="section-heading"><div><h3>Connection centre</h3><p>Private network, proxy routing and API authentication health.</p></div><button class="button tiny" id="refresh-monitor">↻ Test now</button></div>
          ${proxyDiagnosticsMarkup()}
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Live integrations</strong><span>Shows which configured API widgets are communicating successfully.</span></div></div>
          <div id="widget-diagnostics">${connectionDiagnosticsMarkup()}</div>
        </div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>Backup & restore</strong><span>Configuration backups never include resolved secret values.</span></div></div>
          <label class="compact-upload"><input id="editor-import" type="file" accept=".json,.zip,.yaml,.yml" multiple><span>⇧ Restore RogueDashboard JSON or import legacy ZIP/YAML</span></label>
          <button class="button secondary full-button" id="export-json">⇩ Export JSON backup</button>
        </div>
      </section>

      <section class="editor-section editor-tab-panel ${state.editorTab === "admin" ? "active" : ""}" data-editor-panel="admin">
        <div class="editor-section-intro"><span class="eyebrow">SECURITY</span><h3>Admin</h3><p>Review the local administrator session, application runtime and recent security activity.</p></div>
        <div class="editor-card">
          <div class="editor-card-heading"><div><strong>RogueDashboard runtime</strong><span>Socket-free service monitoring. Container management remains in RogueForge.</span></div><span class="health-pill online">Healthy</span></div>
          <div class="admin-summary-grid">
            <div><span>Signed in as</span><strong>${escapeHtml(state.username || "administrator")}</strong></div>
            <div><span>Runtime</span><strong>${escapeHtml(runtimeName)}</strong></div>
            <div><span>Platform</span><strong>${escapeHtml(runtimePlatform)}</strong></div>
            <div><span>Version</span><strong>${escapeHtml(state.bootstrap?.version || "1.4.0")}</strong></div>
          </div>
        </div>
        <div class="editor-card">
          <div class="section-heading"><div><h3>Administrator sessions</h3><p>Review active sign-ins and revoke sessions you no longer recognise.</p></div><button class="button tiny" id="refresh-admin">↻ Refresh</button></div>
          <div class="admin-list" id="admin-sessions"><div class="notice info">Open this tab to load sessions.</div></div>
        </div>
        <div class="editor-card">
          <div class="section-heading"><div><h3>Action history</h3><p>The newest 100 administrative events stored locally.</p></div></div>
          <div class="admin-list" id="admin-audit"><div class="notice info">Open this tab to load action history.</div></div>
        </div>
      </section>
    </div>
    <footer class="editor-footer">
      <button class="button ghost danger-text" id="logout">Sign out</button>
      <div class="editor-footer-actions"><span>Changes are local until saved.</span><button class="button primary" id="save-dashboard">Save changes</button></div>
    </footer>
  </aside>`;
}

function openEditor() {
  state.editor = true;
  state.editorTab = "appearance";
  state.draft = structuredClone(state.dashboard);
  renderDashboard();
}

function bindEditor() {
  document.querySelectorAll("[data-editor-tab]").forEach(button => button.onclick = () => {
    state.editorTab = button.dataset.editorTab;
    document.querySelectorAll("[data-editor-tab]").forEach(entry => entry.classList.toggle("active", entry === button));
    document.querySelectorAll("[data-editor-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.editorPanel === state.editorTab));
    if (state.editorTab === "admin") loadAdministration();
  });
  document.getElementById("edit-theme").value = state.draft.meta.theme;
  document.getElementById("edit-density").value = state.draft.meta.density;
  document.getElementById("edit-background-mode").value = state.draft.meta.backgroundMode;
  document.getElementById("close-editor").onclick = () => { state.editor = false; state.draft = structuredClone(state.dashboard); renderDashboard(); };
  const fields = {
    "edit-title": "title", "edit-subtitle": "subtitle", "edit-background": "background",
    "edit-accent": "accent", "edit-accent-text": "accent",
    "edit-accent-secondary": "accentSecondary", "edit-accent-secondary-text": "accentSecondary",
  };
  Object.entries(fields).forEach(([id, key]) => document.getElementById(id).oninput = event => {
    state.draft.meta[key] = event.target.value;
    if (key === "title") document.querySelector(".brand-block h1").textContent = event.target.value || "My Container Dashboard";
    if (key === "subtitle") document.querySelector(".brand-block p").textContent = event.target.value;
    if (key === "accent" && /^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
      document.getElementById("shell").style.setProperty("--accent", event.target.value);
      document.getElementById(id === "edit-accent" ? "edit-accent-text" : "edit-accent").value = event.target.value;
    }
    if (key === "accentSecondary" && /^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
      document.getElementById("shell").style.setProperty("--accent-secondary", event.target.value);
      document.getElementById(id === "edit-accent-secondary" ? "edit-accent-secondary-text" : "edit-accent-secondary").value = event.target.value;
    }
    if (key === "background") document.getElementById("dashboard-background").style.setProperty("--custom-background", `url("${event.target.value.replace(/["\\\n\r]/g, "")}")`);
  });
  document.getElementById("edit-theme").onchange = event => {
    const shell = document.getElementById("shell");
    shell.classList.replace(`theme-${state.draft.meta.theme}`, `theme-${event.target.value}`);
    state.draft.meta.theme = event.target.value;
    [state.draft.meta.accent, state.draft.meta.accentSecondary] = THEME_PRESETS[event.target.value];
    document.getElementById("edit-accent").value = state.draft.meta.accent;
    document.getElementById("edit-accent-text").value = state.draft.meta.accent;
    document.getElementById("edit-accent-secondary").value = state.draft.meta.accentSecondary;
    document.getElementById("edit-accent-secondary-text").value = state.draft.meta.accentSecondary;
    shell.style.setProperty("--accent", state.draft.meta.accent);
    shell.style.setProperty("--accent-secondary", state.draft.meta.accentSecondary);
  };
  document.getElementById("edit-density").onchange = event => {
    document.getElementById("shell").classList.replace(`density-${state.draft.meta.density}`, `density-${event.target.value}`);
    state.draft.meta.density = event.target.value;
  };
  document.getElementById("edit-background-mode").onchange = event => {
    document.getElementById("shell").classList.replace(`background-${state.draft.meta.backgroundMode}`, `background-${event.target.value}`);
    state.draft.meta.backgroundMode = event.target.value;
  };
  document.getElementById("edit-glow").oninput = event => {
    state.draft.meta.glow = Number(event.target.value); document.getElementById("glow-value").textContent = `${event.target.value}%`;
    document.getElementById("shell").style.setProperty("--glow-strength", Number(event.target.value) / 100);
    document.getElementById("shell").style.setProperty("--glow-opacity", Number(event.target.value) / 590);
    document.getElementById("shell").style.setProperty("--glow-blur", `${Math.round(Number(event.target.value) * .38)}px`);
  };
  document.getElementById("edit-opacity").oninput = event => {
    state.draft.meta.surfaceOpacity = Number(event.target.value); document.getElementById("opacity-value").textContent = `${event.target.value}%`;
    document.getElementById("shell").style.setProperty("--surface-opacity", `${event.target.value}%`);
  };
  document.getElementById("reset-appearance").onclick = () => {
    Object.assign(state.draft.meta, { theme: "neon", accent: "#ff2bd6", accentSecondary: "#00e5ff", background: "", backgroundMode: "neon-grid", density: "compact", glow: 68, surfaceOpacity: 82 });
    state.editorTab = "appearance"; renderDashboard(); toast("Electric Neon defaults restored in the preview");
  };
  document.getElementById("edit-max-columns").onchange = event => { state.draft.meta.maxColumns = Number(event.target.value); renderGroups(); };
  document.getElementById("edit-full").onchange = event => { state.draft.meta.fullWidth = event.target.checked; document.querySelector(".dashboard").classList.toggle("full-width", event.target.checked); };
  document.getElementById("edit-equal").onchange = event => { state.draft.meta.equalHeights = event.target.checked; renderGroups(); };
  document.getElementById("edit-latency").onchange = event => { state.draft.meta.showLatency = event.target.checked; renderGroups(); };
  document.getElementById("add-group").onclick = addGroup;
  document.getElementById("add-page").onclick = addPage;
  document.getElementById("save-dashboard").onclick = saveDashboard;
  document.getElementById("logout").onclick = logout;
  document.getElementById("editor-import").onchange = importInEditor;
  document.getElementById("export-json").onclick = exportJson;
  document.getElementById("refresh-monitor").onclick = () => refreshRuntime(true);
  document.getElementById("refresh-admin").onclick = loadAdministration;
  renderGroupEditor();
  renderPageEditor();
}

async function loadAdministration() {
  const sessionsBox = document.getElementById("admin-sessions"), auditBox = document.getElementById("admin-audit");
  if (!sessionsBox || !auditBox) return;
  sessionsBox.innerHTML = `<div class="notice info">Loading sessions…</div>`;
  auditBox.innerHTML = `<div class="notice info">Loading action history…</div>`;
  const [sessions, audit] = await Promise.allSettled([request("/api/admin/sessions"), request("/api/admin/audit")]);
  if (sessions.status === "fulfilled") {
    sessionsBox.innerHTML = sessions.value.sessions.map(session => `<div class="admin-row"><div><strong>${session.current ? "Current session" : `Session ${escapeHtml(session.id)}`}</strong><span>Last seen ${escapeHtml(new Date(session.lastSeenAt).toLocaleString())} · expires ${escapeHtml(new Date(session.expiresAt * 1000).toLocaleDateString())}</span></div>${session.current ? `<span class="protected-chip">Current</span>` : `<button class="button tiny danger-text" data-revoke-session="${escapeHtml(session.id)}">Revoke</button>`}</div>`).join("") || `<div class="notice info">No active sessions.</div>`;
    sessionsBox.querySelectorAll("[data-revoke-session]").forEach(button => button.onclick = () => revokeSession(button.dataset.revokeSession));
  } else sessionsBox.innerHTML = `<div class="notice error">${escapeHtml(sessions.reason.message)}</div>`;
  if (audit.status === "fulfilled") {
    auditBox.innerHTML = audit.value.entries.map(entry => `<div class="admin-row"><span class="widget-state-dot ${entry.outcome === "success" ? "ok" : "error"}"></span><div><strong>${escapeHtml(entry.action)}</strong><span>${escapeHtml(entry.username)} · ${escapeHtml(entry.target)} · ${escapeHtml(new Date(entry.occurredAt).toLocaleString())}</span></div><span class="protected-chip">${escapeHtml(entry.outcome)}</span></div>`).join("") || `<div class="notice info">No administrative actions recorded yet.</div>`;
  } else auditBox.innerHTML = `<div class="notice error">${escapeHtml(audit.reason.message)}</div>`;
}

async function revokeSession(sessionId) {
  if (!confirm(`Revoke session ${sessionId}?`)) return;
  try {
    const result = await request("/api/admin/sessions/revoke", { method: "POST", body: JSON.stringify({ sessionId }) });
    toast(result.revoked ? "Session revoked" : "Session was already inactive");
    await loadAdministration();
  } catch (error) { toast(error.message); }
}

function renderPageEditor() {
  const list = document.getElementById("page-editor-list");
  if (!list) return;
  list.innerHTML = state.draft.pages.map((page, index) => `<div class="page-editor-row"><input data-page-name="${index}" value="${escapeHtml(page.name)}" aria-label="Page name"><button class="icon-button danger" data-page-delete="${index}" title="Delete page" ${state.draft.pages.length === 1 ? "disabled" : ""}>×</button></div>`).join("");
  list.querySelectorAll("[data-page-name]").forEach(input => input.oninput = () => {
    state.draft.pages[Number(input.dataset.pageName)].name = input.value || "Page";
    const tab = [...document.querySelectorAll("[data-page]")][Number(input.dataset.pageName)];
    if (tab) tab.textContent = input.value || "Page";
  });
  list.querySelectorAll("[data-page-delete]").forEach(button => button.onclick = () => deletePage(Number(button.dataset.pageDelete)));
}

function addPage() {
  if (state.draft.pages.length >= 20) return toast("A dashboard can contain up to 20 pages");
  const name = `Page ${state.draft.pages.length + 1}`;
  const page = { id: uniqueId(name), name };
  state.draft.pages.push(page);
  state.activePage = page.id;
  state.editorTab = "layout";
  renderDashboard();
}

function deletePage(index) {
  const page = state.draft.pages[index];
  if (!page || state.draft.pages.length === 1) return;
  const groups = state.draft.groups.filter(group => group.pageId === page.id);
  const cards = groups.reduce((total, group) => total + group.items.length, 0);
  if (cards && !confirm(`Delete ${page.name} and its ${cards} cards?`)) return;
  state.draft.groups = state.draft.groups.filter(group => group.pageId !== page.id);
  state.draft.pages.splice(index, 1);
  state.activePage = state.draft.pages[Math.max(0, index - 1)].id;
  state.editorTab = "layout";
  renderDashboard();
}

function renderGroupEditor() {
  const list = document.getElementById("group-editor-list");
  if (!list) return;
  const visible = state.draft.groups.map((group, index) => ({ group, index })).filter(({ group }) => (group.pageId || state.draft.pages[0].id) === state.activePage);
  list.innerHTML = visible.map(({ group, index }, position) => `<div class="group-editor-row"><span>▦</span><div><input data-name="${index}" value="${escapeHtml(group.name)}"><span>${group.items.length} cards</span></div><select data-columns="${index}">${[1,2,3,4,5,6].map(value => `<option value="${value}" ${group.columns === value ? "selected" : ""}>${value} cols</option>`).join("")}</select><div class="group-order"><button class="icon-button" data-move-up="${index}" title="Move up" ${position === 0 ? "disabled" : ""}>↑</button><button class="icon-button" data-move-down="${index}" title="Move down" ${position === visible.length - 1 ? "disabled" : ""}>↓</button></div><button class="icon-button danger" data-delete="${index}">×</button></div>`).join("");
  list.querySelectorAll("[data-name]").forEach(input => input.oninput = () => { state.draft.groups[Number(input.dataset.name)].name = input.value; renderGroups(); });
  list.querySelectorAll("[data-columns]").forEach(select => select.onchange = () => { state.draft.groups[Number(select.dataset.columns)].columns = Number(select.value); renderGroups(); });
  list.querySelectorAll("[data-move-up]").forEach(button => button.onclick = () => moveGroup(Number(button.dataset.moveUp), -1));
  list.querySelectorAll("[data-move-down]").forEach(button => button.onclick = () => moveGroup(Number(button.dataset.moveDown), 1));
  list.querySelectorAll("[data-delete]").forEach(button => button.onclick = () => {
    const index = Number(button.dataset.delete), group = state.draft.groups[index];
    if (group.items.length && !confirm(`Delete ${group.name} and its ${group.items.length} cards?`)) return;
    state.draft.groups.splice(index, 1); renderGroupEditor(); renderGroups();
  });
}

function moveGroup(index, direction) {
  const visible = state.draft.groups.map((group, groupIndex) => ({ group, groupIndex })).filter(({ group }) => (group.pageId || state.draft.pages[0].id) === state.activePage);
  const position = visible.findIndex(entry => entry.groupIndex === index);
  const target = visible[position + direction]?.groupIndex;
  if (position < 0 || target === undefined) return;
  [state.draft.groups[index], state.draft.groups[target]] = [state.draft.groups[target], state.draft.groups[index]];
  renderGroupEditor(); renderGroups();
}

function uniqueId(name) {
  const used = new Set([...(state.draft.pages || []).map(page => page.id), ...state.draft.groups.flatMap(group => [group.id, ...group.items.map(item => item.id)])]);
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  let id = base, suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  return id;
}

function addGroup() {
  const name = `New group ${state.draft.groups.length + 1}`;
  state.draft.groups.push({ id: uniqueId(name), name, kind: "services", columns: 3, collapsed: false, pageId: state.activePage, items: [] });
  renderGroupEditor(); renderGroups();
}

async function saveDashboard() {
  const button = document.getElementById("save-dashboard");
  button.disabled = true; button.textContent = "Saving…";
  try {
    const result = await request("/api/dashboard", { method: "PUT", body: JSON.stringify(state.draft) });
    state.dashboard = result.dashboard; state.draft = structuredClone(result.dashboard);
    toast("Dashboard saved"); renderDashboard();
  } catch (error) {
    toast(error.message); button.disabled = false; button.textContent = "Save changes";
  }
}

async function importInEditor(event) {
  try {
    const result = await previewImport(event.target.files);
    if (!confirm(`Replace this preview with ${result.summary.services} services and ${result.summary.bookmarks} bookmarks?`)) return;
    state.draft = structuredClone(result.dashboard); toast("Import applied. Save when the preview looks right."); renderDashboard();
  } catch (error) { toast(error.message); }
}

function exportJson() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state.draft, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "rogue-dashboard-backup.json"; link.click(); URL.revokeObjectURL(url);
}

function integrationHint(type) {
  const config = INTEGRATION_DEFAULTS[type];
  if (type === "qbittorrent") return "qBittorrent 5.2+: use RGDASH_QBITTORRENT_API_KEY. Username and password are the automatic fallback.";
  if (type === "rogueforge") return "RogueForge uses its read-only public status APIs. No credentials are stored. Default private URL: http://rogueforge:7810.";
  return config ? `Add ${config.refs.join(" and ")} to .env.` : "Health-check monitoring only; no API credentials required.";
}

function openItem(groupIndex, itemIndex) {
  state.editingItem = { groupIndex, itemIndex };
  const item = itemIndex === undefined ? { name: "", href: "", monitorUrl: "", description: "", icon: "", type: "service", statusStyle: "dot" } : state.draft.groups[groupIndex].items[itemIndex];
  overlay.innerHTML = `<div class="modal-backdrop"><section class="modal modal-wide"><header class="modal-header"><h2>${itemIndex === undefined ? "Add a card" : `Edit ${escapeHtml(item.name)}`}</h2><button class="icon-button" id="item-close">×</button></header><form class="modal-body" id="item-form"><div class="form-grid">
    <label class="field"><span>Name</span><input id="item-name" value="${escapeHtml(item.name)}" required autofocus></label>
    <label class="field"><span>Card type</span><select id="item-type"><option value="service">Service</option><option value="bookmark">Bookmark</option></select></label>
    <label class="field full"><span>Open URL</span><input id="item-href" value="${escapeHtml(item.href || "")}" placeholder="https://…"></label>
    <label class="field full"><span>Private health-check URL</span><input id="item-monitor" value="${escapeHtml(item.monitorUrl || "")}" placeholder="http://container:port"></label>
    <label class="field full"><span>Description</span><input id="item-description" value="${escapeHtml(item.description || "")}"></label>
    <label class="field"><span>Icon URL or local path</span><input id="item-icon" value="${escapeHtml(item.icon || "")}" placeholder="/custom/icons/my-service.svg"><small>Leave blank for local override → GitHub asset → bundled fallback.</small></label>
    <label class="field"><span>Status</span><select id="item-status"><option value="dot">Dot</option><option value="badge">Badge</option><option value="none">Hidden</option></select></label>
    <label class="field"><span>Open behaviour</span><select id="item-launch"><option value="new-tab">New tab</option><option value="same-tab">Same tab</option><option value="copy">Copy URL</option></select></label>
    <label class="field"><span>Favourite</span><select id="item-favorite"><option value="false">No</option><option value="true">Yes</option></select></label>
    <label class="field"><span>Tags</span><input id="item-tags" value="${escapeHtml(normalizedTags(item).join(", "))}" placeholder="media, network, rogue"></label>
    <label class="field"><span>Health method</span><select id="item-health-method"><option value="HEAD">HEAD</option><option value="GET">GET</option></select></label>
    <label class="field"><span>Health timeout</span><select id="item-health-timeout">${[2,3,4,5,6,8,10].map(value => `<option value="${value}">${value} seconds</option>`).join("")}</select></label>
    <label class="field"><span>Accepted HTTP from</span><input id="item-health-min" type="number" min="100" max="599" value="${Number(item.healthStatusMin || 200)}"></label>
    <label class="field"><span>Accepted HTTP to</span><input id="item-health-max" type="number" min="100" max="599" value="${Number(item.healthStatusMax || 499)}"></label>
    <label class="field"><span>Live integration</span><select id="item-integration"><option value="">Health check only</option>${Object.keys(INTEGRATION_DEFAULTS).map(type => `<option value="${type}">${type === "pihole" ? "Pi-hole" : type === "qbittorrent" ? "qBittorrent" : type === "rogueforge" ? "RogueForge" : type[0].toUpperCase() + type.slice(1)}</option>`).join("")}</select></label>
    <label class="field"><span>Private API URL</span><input id="item-widget-url" value="${escapeHtml(item.widget?.url || item.monitorUrl || "")}" placeholder="http://container:port"></label>
    <div class="notice info full" id="integration-env">${escapeHtml(integrationHint(item.widget?.type || ""))}</div>
  </div><div class="button-row spread">${itemIndex === undefined ? "<span></span>" : `<button type="button" class="button ghost danger-text" id="item-delete">Delete</button>`}<button class="button primary">Save card</button></div></form></section></div>`;
  document.getElementById("item-type").value = item.type;
  document.getElementById("item-status").value = item.statusStyle;
  document.getElementById("item-launch").value = item.launchMode || "new-tab";
  document.getElementById("item-favorite").value = item.favorite ? "true" : "false";
  document.getElementById("item-health-method").value = item.healthMethod || "HEAD";
  document.getElementById("item-health-timeout").value = String(item.healthTimeout || 4);
  document.getElementById("item-integration").value = item.widget?.type || "";
  document.getElementById("item-integration").onchange = event => {
    const selected = event.target.value;
    document.getElementById("integration-env").textContent = integrationHint(selected);
    const widgetUrl = document.getElementById("item-widget-url");
    const monitorUrl = document.getElementById("item-monitor");
    if (selected === "rogueforge") {
      if (!widgetUrl.value) widgetUrl.value = "http://rogueforge:7810";
      if (!monitorUrl.value) monitorUrl.value = "http://rogueforge:7810/health";
    } else if (selected && !widgetUrl.value) {
      widgetUrl.value = monitorUrl.value;
    }
  };
  document.getElementById("item-close").onclick = closeOverlay;
  document.getElementById("item-form").onsubmit = saveItem;
  if (itemIndex !== undefined) document.getElementById("item-delete").onclick = deleteItem;
}

function saveItem(event) {
  event.preventDefault();
  const { groupIndex, itemIndex } = state.editingItem;
  const previous = itemIndex === undefined ? null : state.draft.groups[groupIndex].items[itemIndex];
  const statusMin = Math.max(100, Math.min(599, Number(document.getElementById("item-health-min").value) || 200));
  const statusMax = Math.max(100, Math.min(599, Number(document.getElementById("item-health-max").value) || 499));
  const item = {
    id: previous?.id || uniqueId(document.getElementById("item-name").value),
    name: document.getElementById("item-name").value,
    type: document.getElementById("item-type").value,
    href: document.getElementById("item-href").value,
    monitorUrl: document.getElementById("item-monitor").value,
    description: document.getElementById("item-description").value,
    icon: document.getElementById("item-icon").value,
    statusStyle: document.getElementById("item-status").value,
    launchMode: document.getElementById("item-launch").value,
    favorite: document.getElementById("item-favorite").value === "true",
    tags: document.getElementById("item-tags").value.split(",").map(value => value.trim()).filter(Boolean).slice(0, 12),
    healthMethod: document.getElementById("item-health-method").value,
    healthTimeout: Number(document.getElementById("item-health-timeout").value),
    healthStatusMin: Math.min(statusMin, statusMax),
    healthStatusMax: Math.max(statusMin, statusMax),
  };
  if (previous?.containerName) item.containerName = previous.containerName;
  const integration = document.getElementById("item-integration").value;
  if (integration) {
    const defaults = INTEGRATION_DEFAULTS[integration];
    const previousWidget = previous?.widget?.type === integration ? previous.widget : {};
    const integrationUrl = document.getElementById("item-widget-url").value || item.monitorUrl || (integration === "rogueforge" ? "http://rogueforge:7810" : "");
    item.widget = { ...previousWidget, type: integration, url: integrationUrl, secretRefs: defaults.refs, secretBindings: defaults.bindings };
    if (integration === "rogueforge") {
      item.monitorUrl = item.monitorUrl || "http://rogueforge:7810/health";
      item.icon = item.icon || "rogueforge";
    }
    if (integration === "pihole") item.widget.version = 6;
  }
  if (itemIndex === undefined) state.draft.groups[groupIndex].items.push(item); else state.draft.groups[groupIndex].items[itemIndex] = item;
  closeOverlay(); renderGroupEditor(); renderGroups();
}

function deleteItem() {
  const { groupIndex, itemIndex } = state.editingItem;
  state.draft.groups[groupIndex].items.splice(itemIndex, 1); closeOverlay(); renderGroupEditor(); renderGroups();
}

function openLogin() {
  overlay.innerHTML = `<div class="modal-backdrop auth-backdrop">
    <section class="modal auth-modal">
      <div class="auth-visual">
        <img src="/icons/roguedashboard-approved-128.png?v=1.4.0" alt="RogueDashboard">
        <div><span class="eyebrow">ADMINISTRATION</span><h2>Welcome back</h2><p>Sign in locally to customise services, layouts and integrations.</p></div>
      </div>
      <div class="auth-content">
        <header class="modal-header auth-header"><div><span class="eyebrow">SECURE SESSION</span><h2>Administrator sign in</h2></div><button class="icon-button" id="login-close" aria-label="Close sign in">×</button></header>
        <form class="modal-body auth-form" id="login-form">
          <div class="auth-note"><span>●</span><div><strong>Local authentication</strong><small>Credentials are verified by RogueDashboard and are never sent to connected services.</small></div></div>
          <label class="field"><span>Username</span><input id="login-user" value="admin" autocomplete="username" required autofocus></label>
          <label class="field"><span>Password</span><input id="login-password" type="password" autocomplete="current-password" required></label>
          <div class="notice error" id="login-error" hidden></div>
          <button class="button primary full-button auth-submit" id="login-submit">Sign in to customise <span>→</span></button>
        </form>
      </div>
    </section>
  </div>`;
  document.getElementById("login-close").onclick = closeOverlay;
  document.getElementById("login-form").onsubmit = login;
}

async function login(event) {
  event.preventDefault();
  const button = document.getElementById("login-submit");
  const box = document.getElementById("login-error");
  box.hidden = true;
  button.disabled = true;
  button.textContent = "Signing in…";
  try {
    await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: document.getElementById("login-user").value.trim(),
        password: document.getElementById("login-password").value,
      }),
    });
    closeOverlay();
    await load();
    openEditor();
    toast("Administrator session connected");
  } catch (error) {
    box.textContent = error.message;
    box.hidden = false;
    button.disabled = false;
    button.innerHTML = 'Sign in to customise <span>→</span>';
  }
}

async function logout() {
  await request("/api/auth/logout", { method: "POST", body: "{}" }); state.editor = false; closeOverlay(); await load();
}

function closeOverlay() { overlay.innerHTML = ""; state.editingItem = null; }

function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock"), date = document.getElementById("date");
  if (clock) clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date) date.textContent = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

function updateStats() {
  const online = [...state.health.values()].filter(item => item.state === "online").length;
  const onlineCount = document.getElementById("online-count");
  if (onlineCount) onlineCount.textContent = state.health.size ? `${online}/${state.health.size}` : "—";

  const widgetValues = [...state.widgets.values()];
  const liveWidgets = widgetValues.filter(item => item.state === "ok").length;
  const widgetCount = document.getElementById("container-count");
  const widgetLabel = document.getElementById("container-label");
  if (widgetCount) {
    widgetCount.textContent = widgetValues.length ? `${liveWidgets}/${widgetValues.length}` : "—";
    widgetCount.title = widgetValues.length ? "Live integrations / configured integrations" : "No live integrations configured";
  }
  if (widgetLabel) widgetLabel.textContent = "Live widgets";

  if (!state.system) return;
  const memoryCount = document.getElementById("memory-count");
  const memoryTotal = document.getElementById("memory-total");
  const loadCount = document.getElementById("load-count");
  const uptimeCount = document.getElementById("uptime-count");
  if (memoryCount) memoryCount.textContent = formatBytes(state.system.memoryUsed);
  if (memoryTotal) memoryTotal.textContent = `of ${formatBytes(state.system.memoryTotal)} memory`;
  if (loadCount) loadCount.textContent = Number(state.system.load).toFixed(2);
  if (uptimeCount) uptimeCount.textContent = `${state.system.cpuCount} CPU · ${formatUptime(state.system.uptimeSeconds)} up`;
}

async function refreshRuntime(force = false) {
  const refreshButton = document.getElementById("refresh-monitor");
  if (force) {
    if (refreshButton) { refreshButton.disabled = true; refreshButton.textContent = "Testing…"; }
    try { await request("/api/monitor/refresh", { method: "POST", body: "{}" }); }
    catch (error) { toast(error.message); }
  }
  const [health, system, widgets] = await Promise.allSettled([
    request("/api/health"), request("/api/system"), request("/api/widgets"),
  ]);
  if (health.status === "fulfilled") state.health = new Map(health.value.map(item => [item.itemId, item]));
  if (system.status === "fulfilled") state.system = system.value;
  if (widgets.status === "fulfilled") {
    state.widgets = new Map(widgets.value.widgets.map(item => [item.itemId, item]));
    state.widgetSupport = widgets.value.supported;
  }
  updateStats(); renderGroups();
  const diagnostics = document.getElementById("widget-diagnostics");
  if (diagnostics) diagnostics.innerHTML = connectionDiagnosticsMarkup();
  if (refreshButton) { refreshButton.disabled = false; refreshButton.textContent = "↻ Test now"; }
}

document.addEventListener("keydown", event => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
  } else if (!typing && event.key === "/") {
    event.preventDefault();
    openCommandPalette();
  } else if (event.key === "Escape" && overlay.innerHTML) {
    closeOverlay();
  }
});

setInterval(updateClock, 1000);
setInterval(refreshRuntime, 30000);
load();
