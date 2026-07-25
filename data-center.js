(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const DATA = window.TIGAN_DATA;
  const TELEMETRY = window.TiganTelemetry;
  const DASHBOARD_DB = "tigan_master_data_center_v19";
  const DASHBOARD_STORE = "imported_events";
  const FALLBACK_KEY = "tigan_master_v19_dashboard_imports";
  const state = { events: new Map(), imported: new Set(), toastTimer: 0 };
  let databasePromise;

  const screenNames = {
    launchScreen: "启动页", subjectScreen: "选科界面", modeScreen: "模式界面", homeScreen: "认知中枢",
    gameScreen: "牌局", mapScreen: "探索地图", profileScreen: "个人中心",
  };
  const eventNames = {
    app_started: "启动", session_start: "会话开始", screen_view: "访问界面", subject_selected: "浏览学科",
    subject_confirmed: "确认学科", mode_selected: "浏览模式", training_configured: "确认训练", grade_selected: "选择年级", round_started: "开始牌局", bond_verified: "验证羁绊",
    hint_offered: "出现提示", hint_accepted: "接受提示", hint_declined: "拒绝提示",
    answers_revealed_after_failures: "五败揭晓", round_completed: "完成牌局", round_abandoned: "中途退出", user_rank_changed: "称号升级",
    playtest_survey: "体验评分", client_error: "运行错误",
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error("indexeddb_unavailable")); return; }
      const request = indexedDB.open(DASHBOARD_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(DASHBOARD_STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function loadStoredImports() {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = db.transaction(DASHBOARD_STORE, "readonly").objectStore(DASHBOARD_STORE).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return readJson(FALLBACK_KEY, []);
    }
  }

  async function saveImports(events) {
    if (!events.length) return;
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(DASHBOARD_STORE, "readwrite");
        const store = transaction.objectStore(DASHBOARD_STORE);
        events.forEach((event) => store.put(event));
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      const merged = new Map(readJson(FALLBACK_KEY, []).map((event) => [event.id, event]));
      events.forEach((event) => merged.set(event.id, event));
      try { localStorage.setItem(FALLBACK_KEY, JSON.stringify([...merged.values()].slice(-10000))); } catch { /* import remains in memory */ }
    }
  }

  async function clearStoredImports() {
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(DASHBOARD_STORE, "readwrite");
        transaction.objectStore(DASHBOARD_STORE).clear();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } catch { /* fallback below */ }
    try { localStorage.removeItem(FALLBACK_KEY); } catch { /* ignore */ }
  }

  function parseObject(value) {
    if (value && typeof value === "object") return value;
    try { return JSON.parse(value || "{}"); } catch { return {}; }
  }

  function normalizeEvent(raw, fallbackIndex = 0) {
    if (!raw || typeof raw !== "object") return null;
    const properties = parseObject(raw.properties ?? raw.properties_json);
    const context = parseObject(raw.context ?? raw.context_json);
    const participantId = String(raw.participantId || raw.participant_id || "");
    const sessionId = String(raw.sessionId || raw.session_id || "");
    const name = String(raw.name || raw.event_name || "");
    const ts = String(raw.ts || raw.time || raw.event_time || raw.received_at || "");
    if (!name || !Number.isFinite(Date.parse(ts))) return null;
    const id = String(raw.id || raw.event_id || `${participantId}-${sessionId}-${name}-${Date.parse(ts)}-${fallbackIndex}`);
    return {
      id,
      participantId,
      sessionId,
      project: String(raw.project || "tigan-master-playtest"),
      version: String(raw.version || ""),
      name,
      ts: new Date(ts).toISOString(),
      uploadedAt: String(raw.uploadedAt || raw.uploaded_at || ""),
      properties,
      context,
    };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(cell); cell = ""; }
      else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += char;
    }
    if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map((value) => value.replace(/^\uFEFF/, "").trim());
    return rows.filter((cells) => cells.some(Boolean)).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
  }

  async function eventsFromFile(file) {
    const text = await file.text();
    let rawEvents;
    if (file.name.toLowerCase().endsWith(".csv")) rawEvents = parseCsv(text);
    else {
      const parsed = JSON.parse(text);
      rawEvents = Array.isArray(parsed) ? parsed : Array.isArray(parsed.events) ? parsed.events : [];
    }
    return rawEvents.map(normalizeEvent).filter(Boolean);
  }

  function addEvents(events, imported = false) {
    let added = 0;
    events.forEach((event, index) => {
      const normalized = normalizeEvent(event, index);
      if (!normalized) return;
      if (!state.events.has(normalized.id)) added += 1;
      state.events.set(normalized.id, normalized);
      if (imported) state.imported.add(normalized.id);
    });
    return added;
  }

  async function importFiles(files) {
    const importedEvents = [];
    const errors = [];
    for (const file of files) {
      try { importedEvents.push(...await eventsFromFile(file)); } catch { errors.push(file.name); }
    }
    const added = addEvents(importedEvents, true);
    await saveImports(importedEvents);
    refreshFilterOptions();
    render();
    toast(`已导入 ${added} 条新事件${errors.length ? `；${errors.length} 个文件无法读取` : ""}。`);
  }

  async function loadDeviceEvents(showToast = true) {
    let events = [];
    try { events = await TELEMETRY?.getEvents?.() || []; } catch { /* no local collector */ }
    const added = addEvents(events, false);
    refreshFilterOptions();
    render();
    if (showToast) toast(`已读取当前设备 ${events.length} 条记录，其中 ${added} 条为新增。`);
    return events.length;
  }

  function dimension(event, key) {
    return event.properties?.[key] ?? event.context?.[key] ?? "";
  }

  function rankValue(event) {
    const explicit = dimension(event, "user_rank");
    if (explicit) return String(explicit);
    const level = Number(dimension(event, "user_level"));
    const title = dimension(event, "user_title");
    return level && title ? `LV.${String(level).padStart(2, "0")} · ${title}` : "";
  }

  function activeFilters() {
    return {
      participant: $("participantFilter").value,
      subject: $("subjectFilter").value,
      mode: $("modeFilter").value,
      grade: $("gradeFilter").value,
      rank: $("rankFilter").value,
      from: $("dateFrom").value ? new Date(`${$("dateFrom").value}T00:00:00`).getTime() : 0,
      to: $("dateTo").value ? new Date(`${$("dateTo").value}T23:59:59.999`).getTime() : Infinity,
    };
  }

  function filteredEvents() {
    const filters = activeFilters();
    return [...state.events.values()].filter((event) => {
      const time = Date.parse(event.ts);
      if (filters.participant && event.participantId !== filters.participant) return false;
      if (filters.subject && dimension(event, "subject") !== filters.subject) return false;
      if (filters.mode && dimension(event, "mode") !== filters.mode) return false;
      if (filters.grade && dimension(event, "grade") !== filters.grade) return false;
      if (filters.rank && rankValue(event) !== filters.rank) return false;
      return time >= filters.from && time <= filters.to;
    });
  }

  function refreshFilterOptions() {
    const preserve = $("participantFilter").value;
    const preserveRank = $("rankFilter").value;
    const participants = [...new Set([...state.events.values()].map((event) => event.participantId).filter(Boolean))].sort();
    const ranks = [...new Set([...state.events.values()].map(rankValue).filter(Boolean))].sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
    $("participantFilter").innerHTML = `<option value="">全部参与者</option>${participants.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id.slice(-12))}</option>`).join("")}`;
    $("rankFilter").innerHTML = `<option value="">全部称号等级</option>${ranks.map((rank) => `<option value="${escapeHtml(rank)}">${escapeHtml(rank)}</option>`).join("")}`;
    if (participants.includes(preserve)) $("participantFilter").value = preserve;
    if (ranks.includes(preserveRank)) $("rankFilter").value = preserveRank;
  }

  function percent(numerator, denominator) {
    return denominator ? `${(numerator / denominator * 100).toFixed(1)}%` : "—";
  }

  function average(values) {
    const numbers = values.map(Number).filter(Number.isFinite);
    return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
  }

  function durationText(milliseconds) {
    if (!Number.isFinite(milliseconds)) return "—";
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) return `${seconds}秒`;
    return `${Math.floor(seconds / 60)}分${String(seconds % 60).padStart(2, "0")}秒`;
  }

  function byName(events, name) {
    return events.filter((event) => event.name === name);
  }

  function startEvents(events) {
    const explicit = byName(events, "app_started");
    if (!explicit.length) return byName(events, "session_start");
    const explicitSessions = new Set(explicit.map((event) => event.sessionId).filter(Boolean));
    const legacy = byName(events, "session_start").filter((event) => !event.sessionId || !explicitSessions.has(event.sessionId));
    return [...explicit, ...legacy];
  }

  function countBy(items, keyFn) {
    const counts = new Map();
    items.forEach((item) => {
      const key = keyFn(item);
      if (key !== "" && key !== undefined && key !== null) counts.set(String(key), (counts.get(String(key)) || 0) + 1);
    });
    return counts;
  }

  function renderBarList(element, entries, labelFn = (key) => key, valueSuffix = "") {
    const list = [...entries].sort((a, b) => b[1] - a[1]);
    if (!list.length) { element.innerHTML = `<div class="bar-empty">暂无数据</div>`; return; }
    const max = Math.max(...list.map((item) => item[1]), 1);
    element.innerHTML = list.map(([key, value]) => `<div class="bar-item"><label title="${escapeHtml(labelFn(key))}">${escapeHtml(labelFn(key))}</label><i><em style="width:${value / max * 100}%"></em></i><b>${value}${valueSuffix}</b></div>`).join("");
  }

  function renderKpis(events) {
    const starts = startEvents(events);
    const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean));
    const participants = new Set(events.map((event) => event.participantId).filter(Boolean));
    const roundStarts = byName(events, "round_started");
    const completed = byName(events, "round_completed");
    const abandoned = byName(events, "round_abandoned");
    const hintOffered = byName(events, "hint_offered");
    const hintAccepted = byName(events, "hint_accepted");
    const reveals = byName(events, "answers_revealed_after_failures");
    $("kpiStarts").textContent = starts.length;
    $("kpiSessions").textContent = `${sessions.size}个会话`;
    $("kpiParticipants").textContent = participants.size;
    $("kpiCompletion").textContent = percent(completed.length, roundStarts.length);
    $("kpiRounds").textContent = `${completed.length} / ${roundStarts.length}局`;
    $("kpiDuration").textContent = durationText(average(completed.map((event) => event.properties.elapsed_ms)));
    const attempts = average(completed.map((event) => event.properties.attempts));
    $("kpiAttempts").textContent = attempts === null ? "—" : attempts.toFixed(2);
    $("kpiHintRate").textContent = percent(hintAccepted.length, hintOffered.length);
    $("kpiHints").textContent = `${hintAccepted.length} / ${hintOffered.length}次`;
    $("kpiRevealRate").textContent = percent(reveals.length, roundStarts.length);
    $("kpiReveals").textContent = `${reveals.length}次`;
    $("kpiAbandonRate").textContent = percent(abandoned.length, roundStarts.length);
    $("kpiAbandons").textContent = `${abandoned.length}次`;
  }

  function renderAccess(events) {
    const views = byName(events, "screen_view").sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const visits = countBy(views, (event) => event.properties.screen);
    const transitions = new Map();
    const previousBySession = new Map();
    const sessionPaths = new Map();
    views.forEach((event) => {
      const current = event.properties.screen;
      const previous = event.properties.previous_screen || previousBySession.get(event.sessionId);
      if (previous && current && previous !== current) {
        const key = `${previous}→${current}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
      if (current) previousBySession.set(event.sessionId, current);
      const sessionKey = event.sessionId || `${event.participantId}:no-session`;
      const path = sessionPaths.get(sessionKey) || { sessionId: event.sessionId, participantId: event.participantId, firstTs: event.ts, lastTs: event.ts, screens: [] };
      path.lastTs = event.ts;
      if (current && path.screens[path.screens.length - 1] !== current) path.screens.push(current);
      sessionPaths.set(sessionKey, path);
    });
    $("screenViewCount").textContent = `${views.length}次界面访问`;
    renderBarList($("transitionList"), [...transitions.entries()].slice().sort((a, b) => b[1] - a[1]).slice(0, 10), (key) => key.split("→").map((id) => screenNames[id] || id).join(" → "));
    renderBarList($("screenVisitList"), visits, (key) => screenNames[key] || key);
    const recentPaths = [...sessionPaths.values()].sort((a, b) => Date.parse(b.lastTs) - Date.parse(a.lastTs)).slice(0, 30);
    $("sessionPathTable").innerHTML = recentPaths.length ? recentPaths.map((path) => `<tr><td>${new Date(path.firstTs).toLocaleString("zh-CN")}</td><td>${escapeHtml((path.participantId || "—").slice(-12))}</td><td>${escapeHtml((path.sessionId || "—").slice(-10))}</td><td class="path-cell">${path.screens.map((id) => escapeHtml(screenNames[id] || id)).join(" → ")}</td></tr>`).join("") : `<tr><td colspan="4">暂无界面路径数据</td></tr>`;
  }

  function confirmedSubjectEvents(events) {
    const confirmed = byName(events, "subject_confirmed");
    const confirmedSessions = new Set(confirmed.map((event) => event.sessionId).filter(Boolean));
    const legacySelections = byName(events, "subject_selected").filter((event) => {
      if (event.sessionId && confirmedSessions.has(event.sessionId)) return false;
      return !String(event.version || "").startsWith("1.9");
    });
    return confirmed.length ? [...confirmed, ...legacySelections] : byName(events, "subject_selected");
  }

  function subjectStats(events) {
    const selectionEvents = confirmedSubjectEvents(events);
    const totalSelections = selectionEvents.length;
    return DATA.subjects.map((subject) => {
      const selections = selectionEvents.filter((event) => dimension(event, "subject") === subject.id).length;
      const starts = events.filter((event) => event.name === "round_started" && dimension(event, "subject") === subject.id);
      const completed = events.filter((event) => event.name === "round_completed" && dimension(event, "subject") === subject.id);
      const failures = events.filter((event) => event.name === "bond_verified" && dimension(event, "subject") === subject.id && event.properties.success === false);
      return {
        id: subject.id, name: subject.name, selections, selectionRate: totalSelections ? selections / totalSelections : 0,
        starts: starts.length, completed: completed.length, successRate: starts.length ? completed.length / starts.length : 0,
        failures: failures.length, attempts: average(completed.map((event) => event.properties.attempts)),
      };
    });
  }

  function rateClass(rate) {
    if (rate >= .7) return "metric-good";
    if (rate >= .45) return "metric-warn";
    return "metric-bad";
  }

  function renderSubjects(events) {
    $("subjectTable").innerHTML = subjectStats(events).map((item) => `<tr><td>${item.name}</td><td>${item.selections}</td><td>${(item.selectionRate * 100).toFixed(1)}%</td><td>${item.starts}</td><td>${item.completed}</td><td class="${rateClass(item.successRate)}">${item.starts ? `${(item.successRate * 100).toFixed(1)}%` : "—"}</td><td class="${item.failures ? "metric-bad" : ""}">${item.failures}</td><td>${item.attempts === null ? "—" : item.attempts.toFixed(2)}</td></tr>`).join("");
  }

  function renderVerifications(events) {
    const verifications = byName(events, "bond_verified").sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
    $("verificationCount").textContent = `${verifications.length}次验证`;
    $("verificationTable").innerHTML = verifications.length ? verifications.slice(0, 120).map((event) => {
      const subjectId = dimension(event, "subject");
      const subject = DATA.subjects.find((item) => item.id === subjectId);
      const cards = Array.isArray(event.properties.selected_cards) ? event.properties.selected_cards : [];
      const success = event.properties.success === true;
      return `<tr><td>${new Date(event.ts).toLocaleString("zh-CN")}</td><td>${escapeHtml((event.participantId || "—").slice(-12))}</td><td>${escapeHtml(rankValue(event) || "旧数据未记录")}</td><td>${escapeHtml(subject?.name || subjectId || "—")}</td><td>${escapeHtml(String(event.properties.round_id || "—").slice(-18))}</td><td>${Number(event.properties.attempt) || "—"}</td><td>${Number(event.properties.selected_count) || cards.length || "—"}</td><td><span class="result-chip ${success ? "is-success" : ""}">${success ? "成功" : "失败"}</span></td><td class="card-id-list">${cards.length ? cards.map(escapeHtml).join(" · ") : "旧数据未记录"}</td><td>${durationText(Number(event.properties.elapsed_ms))}</td></tr>`;
    }).join("") : `<tr><td colspan="10">暂无羁绊验证数据</td></tr>`;
  }

  function renderModes(events) {
    $("modeTable").innerHTML = DATA.modes.map((mode) => {
      const starts = events.filter((event) => event.name === "round_started" && dimension(event, "mode") === mode.id);
      const completed = events.filter((event) => event.name === "round_completed" && dimension(event, "mode") === mode.id);
      const failures = events.filter((event) => event.name === "bond_verified" && dimension(event, "mode") === mode.id && event.properties.success === false);
      const rate = starts.length ? completed.length / starts.length : 0;
      return `<tr><td>${escapeHtml(mode.name)}</td><td>${starts.length}</td><td>${completed.length}</td><td class="${rateClass(rate)}">${starts.length ? `${(rate * 100).toFixed(1)}%` : "—"}</td><td>${failures.length}</td></tr>`;
    }).join("");
    $("gradeTable").innerHTML = ["高一", "高二", "高三"].map((grade) => {
      const starts = events.filter((event) => event.name === "round_started" && dimension(event, "grade") === grade);
      const completed = events.filter((event) => event.name === "round_completed" && dimension(event, "grade") === grade);
      const rate = starts.length ? completed.length / starts.length : 0;
      return `<tr><td>${grade}</td><td>${starts.length}</td><td>${completed.length}</td><td class="${rateClass(rate)}">${starts.length ? `${(rate * 100).toFixed(1)}%` : "—"}</td><td>${durationText(average(completed.map((event) => event.properties.elapsed_ms)))}</td></tr>`;
    }).join("");
  }

  function renderRanks(events) {
    const groups = new Map();
    events.forEach((event) => {
      const rank = rankValue(event);
      if (!rank) return;
      const current = groups.get(rank) || {
        level: Number(dimension(event, "user_level")) || Number(rank.match(/\d+/)?.[0] || 0),
        title: dimension(event, "user_title") || rank.split("·").slice(1).join("·").trim(),
        participants: new Set(), events: 0, starts: 0, completed: 0,
      };
      if (event.participantId) current.participants.add(event.participantId);
      current.events += 1;
      if (event.name === "round_started") current.starts += 1;
      if (event.name === "round_completed") current.completed += 1;
      groups.set(rank, current);
    });
    const rows = [...groups.entries()].sort((a, b) => a[1].level - b[1].level);
    $("rankTable").innerHTML = rows.length ? rows.map(([rank, item]) => `<tr><td>${escapeHtml(rank.split("·")[0].trim())}</td><td>${escapeHtml(item.title || "—")}</td><td>${item.participants.size}</td><td>${item.events}</td><td>${item.starts}</td><td>${item.completed}</td><td class="${rateClass(item.starts ? item.completed / item.starts : 0)}">${item.starts ? percent(item.completed, item.starts) : "—"}</td></tr>`).join("") : `<tr><td colspan="7">旧数据未记录称号等级；新产生的事件会自动出现在这里。</td></tr>`;
  }

  function topicIdsForFailure(event) {
    if (Array.isArray(event.properties.selected_topic_ids) && event.properties.selected_topic_ids.length) return event.properties.selected_topic_ids;
    const subject = DATA.subjects.find((item) => item.id === dimension(event, "subject"));
    const cards = Array.isArray(event.properties.selected_cards) ? event.properties.selected_cards : [];
    if (!subject) return [];
    return [...new Set(cards.map((cardId) => subject.topics.find((topic) => String(cardId).startsWith(`${subject.id}-${topic.id}-`))?.id).filter(Boolean))];
  }

  function renderErrors(events) {
    const failures = events.filter((event) => event.name === "bond_verified" && event.properties.success === false);
    const blocks = new Map();
    failures.forEach((event) => {
      const subjectId = dimension(event, "subject");
      const topicIds = topicIdsForFailure(event);
      (topicIds.length ? topicIds : ["unknown"]).forEach((topicId) => {
        const key = `${subjectId}:${topicId}`;
        const current = blocks.get(key) || { count: 0, participants: new Set() };
        current.count += 1;
        if (event.participantId) current.participants.add(event.participantId);
        blocks.set(key, current);
      });
    });
    const ranked = [...blocks.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 12);
    $("failedVerifyCount").textContent = `${failures.length}次错误验证`;
    if (!ranked.length) { $("errorBlockList").innerHTML = `<div class="bar-empty">暂无错误验证数据</div>`; return; }
    const max = Math.max(...ranked.map((item) => item[1].count), 1);
    $("errorBlockList").innerHTML = ranked.map(([key, value], index) => {
      const [subjectId, topicId] = key.split(":");
      const subject = DATA.subjects.find((item) => item.id === subjectId);
      const topic = subject?.topics.find((item) => item.id === topicId);
      return `<div class="rank-item"><i>${String(index + 1).padStart(2, "0")}</i><span><b>${escapeHtml(topic?.title || "未识别板块")}</b><small>${escapeHtml(subject?.name || subjectId || "未知学科")} · ${value.participants.size}名参与者涉及</small></span><em><i style="width:${value.count / max * 100}%"></i></em><strong>${value.count}次</strong></div>`;
    }).join("");
  }

  function renderScales(events) {
    const starts = byName(events, "round_started");
    renderBarList($("cardCountList"), countBy(starts, (event) => event.properties.card_count), (key) => `${key}张牌`, "局");
    renderBarList($("relationSizeList"), countBy(starts, (event) => event.properties.primary_relation_size || event.properties.valid_bond_sizes?.[0]), (key) => `${key}张关系`, "局");
  }

  function renderSurvey(events) {
    const surveys = byName(events, "playtest_survey");
    const metrics = [
      ["pattern_feeling", "scorePattern", "barPattern"],
      ["fun", "scoreFun", "barFun"],
      ["clarity", "scoreClarity", "barClarity"],
      ["difficulty", "scoreDifficulty", "barDifficulty"],
      ["continue_intent", "scoreContinue", "barContinue"],
    ];
    metrics.forEach(([property, valueId, barId]) => {
      const score = average(surveys.map((event) => event.properties[property]));
      $(valueId).textContent = score === null ? "—" : score.toFixed(2);
      $(barId).style.width = `${score === null ? 0 : score / 5 * 100}%`;
    });
    $("surveyCount").textContent = `${surveys.length}份问卷`;
    renderBarList($("favoriteModeList"), countBy(surveys, (event) => event.properties.favorite_mode), (key) => DATA.modes.find((mode) => mode.id === key)?.name || key);
    const comments = surveys.filter((event) => event.properties.comment_text).sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 8);
    $("surveyComments").innerHTML = comments.length ? comments.map((event) => `<article class="comment-item"><p>${escapeHtml(event.properties.comment_text)}</p><small>${new Date(event.ts).toLocaleString("zh-CN")} · ${escapeHtml(dimension(event, "subject") || "未标注学科")}</small></article>`).join("") : `<div class="bar-empty">没有获得授权的开放文字；评分仍会正常统计。</div>`;
  }

  function renderLogs(events) {
    const errors = byName(events, "client_error").sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
    $("runtimeErrorCount").textContent = `${errors.length}条`;
    $("runtimeErrorList").innerHTML = errors.length ? errors.slice(0, 40).map((event) => `<article class="log-item"><time>${new Date(event.ts).toLocaleString("zh-CN")}</time><b>${escapeHtml(screenNames[event.context.screen] || event.context.screen || "未知界面")}</b><p>${escapeHtml(event.properties.message || "未知错误")}</p></article>`).join("") : `<div class="bar-empty">没有记录到运行错误</div>`;
    const recent = [...events].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 80);
    $("recentEventList").innerHTML = recent.length ? recent.map((event) => {
      const detail = event.name === "screen_view" ? screenNames[event.properties.screen] || event.properties.screen
        : event.name === "bond_verified" ? `${event.properties.success ? "成功" : "失败"} · 选择${event.properties.selected_count || 0}张`
          : dimension(event, "subject") || dimension(event, "mode") || "";
      return `<article class="log-item"><time>${new Date(event.ts).toLocaleString("zh-CN")}</time><b>${escapeHtml(eventNames[event.name] || event.name)}</b><p>${escapeHtml(detail)}</p></article>`;
    }).join("") : `<div class="bar-empty">暂无事件</div>`;
  }

  function render() {
    const allCount = state.events.size;
    const events = filteredEvents();
    const participants = new Set(events.map((event) => event.participantId).filter(Boolean)).size;
    $("datasetStatus").textContent = `当前汇总 ${allCount} 条去重事件；筛选后 ${events.length} 条，涉及 ${participants} 名测试参与者。`;
    $("emptyState").hidden = events.length > 0;
    $("dashboardContent").hidden = events.length === 0;
    if (!events.length) return;
    renderKpis(events);
    renderAccess(events);
    renderSubjects(events);
    renderVerifications(events);
    renderModes(events);
    renderRanks(events);
    renderErrors(events);
    renderScales(events);
    renderSurvey(events);
    renderLogs(events);
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportSummary() {
    const events = filteredEvents();
    const starts = byName(events, "round_started");
    const completed = byName(events, "round_completed");
    const rows = [
      ["类别", "维度", "指标", "数值"],
      ["总体", "全部", "事件数", events.length],
      ["总体", "全部", "参与者数", new Set(events.map((event) => event.participantId).filter(Boolean)).size],
      ["总体", "全部", "启动次数", startEvents(events).length],
      ["总体", "全部", "开始牌局", starts.length],
      ["总体", "全部", "完成牌局", completed.length],
      ["总体", "全部", "完成率", percent(completed.length, starts.length)],
      ["总体", "全部", "平均完成时间毫秒", Math.round(average(completed.map((event) => event.properties.elapsed_ms)) || 0)],
      ["总体", "全部", "平均成功前尝试次数", (average(completed.map((event) => event.properties.attempts)) || 0).toFixed(2)],
      ["总体", "全部", "羁绊验证次数", byName(events, "bond_verified").length],
      ["总体", "全部", "提示接受率", percent(byName(events, "hint_accepted").length, byName(events, "hint_offered").length)],
      ["总体", "全部", "五败揭晓率", percent(byName(events, "answers_revealed_after_failures").length, starts.length)],
      ["总体", "全部", "中途退出率", percent(byName(events, "round_abandoned").length, starts.length)],
      ["总体", "全部", "运行错误数", byName(events, "client_error").length],
    ];
    subjectStats(events).forEach((item) => {
      rows.push(["学科", item.name, "选择次数", item.selections], ["学科", item.name, "选择率", `${(item.selectionRate * 100).toFixed(1)}%`], ["学科", item.name, "成功率", item.starts ? `${(item.successRate * 100).toFixed(1)}%` : "—"], ["学科", item.name, "错误验证", item.failures]);
    });
    DATA.modes.forEach((mode) => {
      const modeStarts = starts.filter((event) => dimension(event, "mode") === mode.id);
      const modeCompleted = completed.filter((event) => dimension(event, "mode") === mode.id);
      rows.push(["模式", mode.name, "开始牌局", modeStarts.length], ["模式", mode.name, "成功率", percent(modeCompleted.length, modeStarts.length)]);
    });
    ["高一", "高二", "高三"].forEach((grade) => {
      const gradeStarts = starts.filter((event) => dimension(event, "grade") === grade);
      const gradeCompleted = completed.filter((event) => dimension(event, "grade") === grade);
      rows.push(["年级", grade, "开始牌局", gradeStarts.length], ["年级", grade, "成功率", percent(gradeCompleted.length, gradeStarts.length)]);
    });
    const ranks = new Map();
    events.forEach((event) => {
      const rank = rankValue(event);
      if (!rank) return;
      const current = ranks.get(rank) || { participants: new Set(), events: 0 };
      if (event.participantId) current.participants.add(event.participantId);
      current.events += 1;
      ranks.set(rank, current);
    });
    ranks.forEach((item, rank) => rows.push(["称号等级", rank, "到达人数", item.participants.size], ["称号等级", rank, "事件数", item.events]));
    countBy(starts, (event) => event.properties.card_count).forEach((count, size) => rows.push(["牌局结构", `${size}张牌`, "牌局数", count]));
    countBy(starts, (event) => event.properties.primary_relation_size || event.properties.valid_bond_sizes?.[0]).forEach((count, size) => rows.push(["牌局结构", `${size}张关系`, "牌局数", count]));
    const surveys = byName(events, "playtest_survey");
    [
      ["规律感", "pattern_feeling"], ["趣味", "fun"], ["规则清晰度", "clarity"],
      ["难度", "difficulty"], ["继续游玩意愿", "continue_intent"],
    ].forEach(([label, field]) => rows.push(["体验评分", "全部问卷", label, (average(surveys.map((event) => event.properties[field])) || 0).toFixed(2)]));
    const errorBlocks = new Map();
    byName(events, "bond_verified").filter((event) => event.properties.success === false).forEach((event) => {
      const subjectId = dimension(event, "subject");
      topicIdsForFailure(event).forEach((topicId) => {
        const key = `${subjectId}:${topicId}`;
        errorBlocks.set(key, (errorBlocks.get(key) || 0) + 1);
      });
    });
    [...errorBlocks.entries()].sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
      const [subjectId, topicId] = key.split(":");
      const subject = DATA.subjects.find((item) => item.id === subjectId);
      const topic = subject?.topics.find((item) => item.id === topicId);
      rows.push(["错误板块", subject?.name || subjectId, topic?.title || topicId, count]);
    });
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `题感大师_V1.9_数据汇总_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("当前筛选范围的汇总CSV已导出。");
  }

  function toast(message) {
    const element = $("dashboardToast");
    element.textContent = message;
    element.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => element.classList.remove("is-visible"), 3000);
  }

  function populateStaticFilters() {
    $("subjectFilter").innerHTML += DATA.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`).join("");
    $("modeFilter").innerHTML += DATA.modes.map((mode) => `<option value="${mode.id}">${escapeHtml(mode.name)}</option>`).join("");
  }

  function bindEvents() {
    $("importData").addEventListener("click", () => $("fileInput").click());
    $("fileInput").addEventListener("change", (event) => importFiles([...event.target.files]).finally(() => { event.target.value = ""; }));
    $("loadDeviceData").addEventListener("click", () => loadDeviceEvents(true));
    $("exportSummary").addEventListener("click", exportSummary);
    $("clearImported").addEventListener("click", async () => {
      if (!window.confirm("确定清空数据中心中导入的测试数据吗？这不会删除玩家设备上的原始记录。")) return;
      await clearStoredImports();
      state.events.clear();
      state.imported.clear();
      await loadDeviceEvents(false);
      toast("已清空导入数据，仅保留当前设备可读取的记录。");
    });
    ["participantFilter", "subjectFilter", "modeFilter", "gradeFilter", "rankFilter", "dateFrom", "dateTo"].forEach((id) => $(id).addEventListener("change", render));
    $("resetFilters").addEventListener("click", () => {
      ["participantFilter", "subjectFilter", "modeFilter", "gradeFilter", "rankFilter", "dateFrom", "dateTo"].forEach((id) => { $(id).value = ""; });
      render();
    });
    const zone = $("dropZone");
    ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove("is-over"); }));
    zone.addEventListener("drop", (event) => importFiles([...event.dataTransfer.files]));
    zone.addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); $("fileInput").click(); } });
  }

  async function init() {
    populateStaticFilters();
    bindEvents();
    const imported = (await loadStoredImports()).map(normalizeEvent).filter(Boolean);
    addEvents(imported, true);
    await loadDeviceEvents(false);
    refreshFilterOptions();
    render();
  }

  init();
})();
