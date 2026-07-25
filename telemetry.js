(() => {
  "use strict";

  const CONFIG = {
    version: "1.9.0",
    project: "tigan-master-playtest",
    endpoint: "",
    batchSize: 50,
    uploadIntervalMs: 15000,
    retentionDays: 90,
    ...(window.TIGAN_TELEMETRY_CONFIG || {}),
  };
  const DB_NAME = "tigan_master_playtest_v18";
  const STORE_NAME = "events";
  const FALLBACK_EVENTS_KEY = "tigan_master_v18_telemetry_events_fallback";
  const CONSENT_KEY = "tigan_master_v18_telemetry_consent";
  const META_KEY = "tigan_master_v18_telemetry_meta";
  const DELETE_PENDING_KEY = "tigan_master_v18_remote_delete_pending";
  const sessionId = makeId("ses");
  const statusListeners = new Set();
  let databasePromise;
  let runtimeContext = {};
  let lastStatus = { state: "idle", message: "测试记录准备中" };
  let uploadTimer = 0;
  let sessionStarted = false;

  function makeId(prefix) {
    const value = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix}_${value}`;
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private browsing fallback */ }
  }

  function consent() {
    return {
      status: "unset",
      openText: false,
      testerCode: "",
      updatedAt: "",
      ...readJson(CONSENT_KEY, {}),
    };
  }

  function normalizeTesterCode(value) {
    return String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  }

  function participant(create = false) {
    let meta = readJson(META_KEY, null);
    if (!meta && create) {
      meta = { id: makeId("pt"), deleteToken: makeId("del"), createdAt: new Date().toISOString() };
      writeJson(META_KEY, meta);
    }
    return meta;
  }

  function setStatus(state, message) {
    lastStatus = { state, message };
    statusListeners.forEach((listener) => {
      try { listener(lastStatus); } catch { /* observer errors must not stop collection */ }
    });
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error("indexeddb_unavailable")); return; }
      const request = globalThis.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("uploadedAt", "uploadedAt");
        store.createIndex("ts", "ts");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function withStore(mode, operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      try { result = operation(store); } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function putEvent(event) {
    try {
      return await withStore("readwrite", (store) => store.put(event));
    } catch {
      const events = readJson(FALLBACK_EVENTS_KEY, []).filter((item) => item.id !== event.id);
      events.push(event);
      writeJson(FALLBACK_EVENTS_KEY, events.slice(-5000));
      return event.id;
    }
  }

  async function allEvents() {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return readJson(FALLBACK_EVENTS_KEY, []);
    }
  }

  async function markUploaded(ids, uploadedAt) {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        ids.forEach((id) => {
          const request = store.get(id);
          request.onsuccess = () => {
            if (!request.result) return;
            request.result.uploadedAt = uploadedAt;
            store.put(request.result);
          };
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      const target = new Set(ids);
      const events = readJson(FALLBACK_EVENTS_KEY, []).map((event) => target.has(event.id) ? { ...event, uploadedAt } : event);
      writeJson(FALLBACK_EVENTS_KEY, events);
    }
  }

  async function clearEvents() {
    try { await withStore("readwrite", (store) => store.clear()); } catch { /* fallback below */ }
    try { localStorage.removeItem(FALLBACK_EVENTS_KEY); } catch { /* private browsing */ }
  }

  function deviceClass() {
    const short = Math.min(window.innerWidth, window.innerHeight);
    const long = Math.max(window.innerWidth, window.innerHeight);
    if (short < 600) return "phone";
    if (long < 1200) return "tablet";
    return "desktop";
  }

  function safeProperties(properties) {
    const output = {};
    Object.entries(properties || {}).slice(0, 40).forEach(([key, value]) => {
      if (!/^[a-zA-Z0-9_]{1,40}$/.test(key)) return;
      if (typeof value === "string") output[key] = value.slice(0, 500);
      else if (typeof value === "number" && Number.isFinite(value)) output[key] = value;
      else if (typeof value === "boolean" || value === null) output[key] = value;
      else if (Array.isArray(value)) output[key] = value.slice(0, 12).map((item) => String(item).slice(0, 80));
    });
    return output;
  }

  async function track(name, properties = {}) {
    if (consent().status !== "granted") return null;
    if (!/^[a-z][a-z0-9_]{1,47}$/.test(name)) return null;
    const meta = participant(true);
    const event = {
      id: makeId("evt"),
      participantId: meta.id,
      sessionId,
      project: CONFIG.project,
      version: CONFIG.version,
      name,
      ts: new Date().toISOString(),
      uploadedAt: "",
      properties: safeProperties(properties),
      context: {
        device: deviceClass(),
        viewport: `${Math.round(window.innerWidth / 100) * 100}x${Math.round(window.innerHeight / 100) * 100}`,
        standalone: Boolean(matchMedia("(display-mode: standalone)").matches || navigator.standalone),
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        testerCode: consent().testerCode || "",
        ...runtimeContext,
      },
    };
    try {
      await putEvent(event);
      setStatus(CONFIG.endpoint ? "queued" : "local", CONFIG.endpoint ? "等待安全上传" : "已保存在当前设备");
      scheduleUpload(500);
      return event.id;
    } catch {
      setStatus("error", "当前浏览器无法保存测试记录");
      return null;
    }
  }

  function baseEndpoint() {
    return String(CONFIG.endpoint || "").trim().replace(/\/+$/, "").replace(/\/api\/events$/, "");
  }

  function eventEndpoint() {
    const base = baseEndpoint();
    return base ? `${base}/api/events` : "";
  }

  async function flush(options = {}) {
    if (consent().status !== "granted") return { uploaded: 0, reason: "disabled" };
    const endpoint = eventEndpoint();
    if (!endpoint) {
      setStatus("local", "尚未连接数据接收服务，记录保存在当前设备");
      return { uploaded: 0, reason: "no_endpoint" };
    }
    const events = (await allEvents()).filter((event) => !event.uploadedAt).slice(0, CONFIG.batchSize);
    if (!events.length) {
      setStatus("synced", "所有测试记录均已上传");
      return { uploaded: 0, reason: "empty" };
    }
    const meta = participant(true);
    setStatus("uploading", `正在上传 ${events.length} 条去标识化记录`);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant: { id: meta.id, deleteToken: meta.deleteToken, testerCode: consent().testerCode || "" },
          events,
        }),
        keepalive: Boolean(options.keepalive),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const uploadedAt = new Date().toISOString();
      await markUploaded(events.map((event) => event.id), uploadedAt);
      setStatus("synced", `最近同步：${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
      if ((await allEvents()).some((event) => !event.uploadedAt)) scheduleUpload(800);
      return { uploaded: events.length };
    } catch {
      setStatus("offline", "上传暂时失败，记录仍保存在当前设备");
      return { uploaded: 0, reason: "network" };
    }
  }

  function scheduleUpload(delay = CONFIG.uploadIntervalMs) {
    if (!CONFIG.endpoint || consent().status !== "granted") return;
    clearTimeout(uploadTimer);
    uploadTimer = window.setTimeout(() => flush(), delay);
  }

  async function cleanOldEvents() {
    const events = await allEvents();
    const cutoff = Date.now() - Number(CONFIG.retentionDays || 90) * 86400000;
    const keep = events
      .filter((event) => Date.parse(event.ts) >= cutoff)
      .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
      .slice(0, 5000);
    if (keep.length === events.length) return;
    await clearEvents();
    for (const event of keep) await putEvent(event);
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function csvCell(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  async function exportData(format = "json") {
    const events = await allEvents();
    const code = consent().testerCode || "anonymous";
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      const columns = ["event_id", "participant_id", "session_id", "time", "event_name", "version", "uploaded_at", "context", "properties"];
      const rows = events.map((event) => [
        event.id, event.participantId, event.sessionId, event.ts, event.name, event.version, event.uploadedAt, event.context, event.properties,
      ].map(csvCell).join(","));
      download(`题感大师_V1.9_${code}_${stamp}.csv`, `\uFEFF${columns.join(",")}\n${rows.join("\n")}`, "text/csv;charset=utf-8");
    } else {
      download(`题感大师_V1.9_${code}_${stamp}.json`, JSON.stringify({
        exportedAt: new Date().toISOString(),
        participantId: participant()?.id || "",
        consent: { ...consent(), openText: consent().openText },
        events,
      }, null, 2), "application/json;charset=utf-8");
    }
    return events.length;
  }

  async function stats() {
    const events = await allEvents();
    const uploaded = events.filter((event) => event.uploadedAt).length;
    return {
      participantId: participant()?.id || "",
      total: events.length,
      uploaded,
      pending: events.length - uploaded,
      connected: Boolean(CONFIG.endpoint),
      consent: consent(),
      status: lastStatus,
    };
  }

  function setConsent({ enabled, openText = false, testerCode = "" }) {
    const previous = consent();
    const returningParticipant = Boolean(participant(false));
    const next = {
      status: enabled ? "granted" : "denied",
      openText: Boolean(openText),
      testerCode: normalizeTesterCode(testerCode),
      updatedAt: new Date().toISOString(),
    };
    writeJson(CONSENT_KEY, next);
    if (enabled) {
      participant(true);
      setStatus(CONFIG.endpoint ? "queued" : "local", CONFIG.endpoint ? "去标识化记录已启用" : "去标识化记录已启用，将保存在当前设备");
      if (previous.status !== "granted") track("consent_granted", { open_text: next.openText, tester_code_set: Boolean(next.testerCode) });
      if (!sessionStarted) {
        sessionStarted = true;
        track("session_start", { entry: "launch", returning: returningParticipant });
        track("app_started", { entry: "launch", returning: returningParticipant });
      }
    } else {
      clearTimeout(uploadTimer);
      setStatus("disabled", "去标识化测试记录已关闭");
    }
    return next;
  }

  async function deleteData() {
    const meta = participant(false);
    const base = baseEndpoint();
    let remoteDeleted = true;
    if (base && meta) {
      try {
        const response = await fetch(`${base}/api/participants/${encodeURIComponent(meta.id)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteToken: meta.deleteToken }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        localStorage.removeItem(DELETE_PENDING_KEY);
      } catch {
        remoteDeleted = false;
        writeJson(DELETE_PENDING_KEY, { endpoint: base, participant: meta });
      }
    }
    await clearEvents();
    localStorage.removeItem(META_KEY);
    writeJson(CONSENT_KEY, { status: "denied", openText: false, testerCode: "", updatedAt: new Date().toISOString() });
    clearTimeout(uploadTimer);
    setStatus("disabled", remoteDeleted ? "测试记录已删除，后续收集已停止" : "本机记录已删除；远程删除将在联网后重试");
    return { remoteDeleted };
  }

  async function retryPendingDeletion() {
    const pending = readJson(DELETE_PENDING_KEY, null);
    if (!pending?.endpoint || !pending?.participant) return;
    try {
      const response = await fetch(`${pending.endpoint}/api/participants/${encodeURIComponent(pending.participant.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: pending.participant.deleteToken }),
      });
      if (response.ok) localStorage.removeItem(DELETE_PENDING_KEY);
    } catch { /* retry on a later launch */ }
  }

  function setContext(values = {}) {
    runtimeContext = { ...runtimeContext, ...safeProperties(values) };
  }

  function allowsOpenText() {
    const current = consent();
    return current.status === "granted" && current.openText;
  }

  async function init() {
    try {
      await retryPendingDeletion();
      try { await openDatabase(); } catch { /* localStorage fallback remains available */ }
      await cleanOldEvents();
      const current = consent();
      if (current.status === "granted") {
        setStatus(CONFIG.endpoint ? "queued" : "local", CONFIG.endpoint ? "去标识化记录已启用" : "记录保存在当前设备");
        sessionStarted = true;
        await track("session_start", { entry: "launch", returning: Boolean(participant(false)) });
        await track("app_started", { entry: "launch", returning: Boolean(participant(false)) });
        scheduleUpload(1000);
      } else if (current.status === "denied") {
        setStatus("disabled", "去标识化测试记录已关闭");
      } else {
        setStatus("consent", "等待选择是否参与去标识化测试");
      }
    } catch {
      setStatus("error", "测试数据存储初始化失败");
    }
    return stats();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush({ keepalive: true });
  });
  window.addEventListener("pagehide", () => flush({ keepalive: true }));
  window.addEventListener("error", (event) => track("client_error", {
    type: "error",
    message: String(event.message || "unknown").slice(0, 160),
  }));
  window.addEventListener("unhandledrejection", (event) => track("client_error", {
    type: "promise",
    message: String(event.reason?.message || event.reason || "unknown").slice(0, 160),
  }));

  window.TiganTelemetry = {
    config: Object.freeze({ ...CONFIG, endpoint: CONFIG.endpoint ? "configured" : "" }),
    init,
    track,
    flush,
    stats,
    getEvents: allEvents,
    exportData,
    deleteData,
    consent,
    setConsent,
    setContext,
    allowsOpenText,
    onStatus(listener) {
      statusListeners.add(listener);
      listener(lastStatus);
      return () => statusListeners.delete(listener);
    },
  };
})();
