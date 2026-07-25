(() => {
  "use strict";

  const DATA = window.TIGAN_DATA;
  const TELEMETRY = window.TiganTelemetry;
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "tigan_master_demo_v2_0_save";
  const LEGACY_STORAGE_KEY = "tigan_master_demo_v1_9_save";
  const screenIds = ["launchScreen", "subjectScreen", "modeScreen", "homeScreen", "gameScreen", "mapScreen", "profileScreen"];
  const titles = ["题目观察者", "星牌解读者", "关系解码者", "羁绊研究员", "认知星图师", "题感大师"];
  const modeColors = ["#78e7ff", "#bf86ff", "#f0c06d", "#ff8dc9"];
  const mapStyleNames = {
    history: "史证航图 · 真题认知边界", chinese: "文体花冠 · 语境意象星云", math: "公理晶簇 · 数形证明矩阵",
    english: "语篇双螺旋 · 语法语义桥链", physics: "力能轨道 · 多场引力系统", chemistry: "反应晶格 · 微粒转化网络",
    biology: "生命树冠 · 细胞至生态层级", politics: "四域议会 · 制度实践关系场", geography: "经纬星球 · 自然人文空间层",
  };
  const mapBlueprints = {
    history: {
      note: "从时间与主体线索出发，经史料互证、制度职能和题型比较，进入范围陷阱，最终汇合到来源边界与因果边界。",
      positions: [[12,72],[24,55],[38,38],[52,24],[63,42],[74,58],[62,76],[86,42]],
      links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[2,5],[4,6]],
    },
    chinese: {
      note: "以语境词义为花心，向诗歌、叙事、论说、语言运用和古文五片文体花瓣展开。",
      positions: [[33,17],[68,18],[19,51],[76,57],[50,44],[43,65],[24,30],[58,58],[67,44],[34,78],[12,68],[79,33],[85,46],[87,70],[52,79],[41,31],[31,68],[40,55],[57,31],[64,76]],
      links: [[4,0],[0,6],[6,15],[4,2],[2,10],[2,16],[2,17],[4,1],[1,18],[1,11],[18,7],[18,8],[8,12],[4,3],[3,13],[3,19],[4,5],[5,14],[5,9],[8,19]],
    },
    math: {
      note: "集合与逻辑构成公理基座，函数、代数、几何、概率四组晶面最终在数学建模节点汇合。",
      positions: [[17,40],[31,31],[83,31],[18,70],[22,58],[38,55],[43,42],[58,31],[53,66],[70,55],[84,70],[35,74],[17,15],[39,15],[61,15],[72,41],[51,80],[69,69],[35,84],[82,84]],
      links: [[12,13],[13,14],[14,16],[13,0],[0,1],[0,6],[6,10],[14,7],[7,15],[15,2],[13,4],[4,5],[5,8],[8,17],[5,9],[12,3],[3,11],[11,18],[10,19],[17,19],[18,19],[16,19]],
    },
    english: {
      note: "左链组织时态、语态与从句，右链组织语境、阅读与写作；横向桥键表示语言形式必须服务篇章意义。",
      positions: [[29,12],[21,20],[27,29],[20,38],[75,12],[81,20],[74,29],[80,38],[27,47],[20,56],[73,47],[81,56],[28,65],[20,74],[29,82],[74,65],[81,74],[73,82],[55,75],[52,88]],
      links: [[0,1],[1,2],[2,3],[3,8],[8,9],[9,12],[12,13],[13,14],[4,5],[5,6],[6,7],[7,10],[10,11],[11,15],[15,16],[16,17],[17,18],[18,19],[0,4],[2,6],[3,7],[8,10],[9,11],[12,15],[13,16],[14,17]],
    },
    physics: {
      note: "实验设计与误差构成观测核心，力学、电磁、波动热学和微观物理分布在不同能级轨道。",
      positions: [[28,29],[27,66],[18,43],[68,26],[80,38],[77,56],[66,68],[50,12],[82,17],[50,83],[18,62],[50,46],[30,17],[16,30],[42,22],[61,18],[83,72],[68,83],[39,80],[50,59]],
      links: [[11,19],[11,0],[0,12],[0,2],[0,13],[13,14],[1,10],[10,2],[11,3],[3,15],[3,4],[4,5],[5,6],[6,16],[11,7],[7,8],[11,9],[9,18],[11,17],[19,1],[19,6],[19,18]],
    },
    chemistry: {
      note: "原子结构与化学键搭成晶格，电子、质子、平衡、能量和实验分析沿六角反应通道迁移。",
      positions: [[19,22],[38,22],[57,22],[76,22],[28,38],[47,38],[66,38],[85,38],[19,54],[38,54],[57,54],[76,54],[28,70],[47,70],[66,70],[85,70],[19,84],[38,84],[57,84],[76,84]],
      links: [[12,13],[13,4],[4,0],[0,5],[5,14],[14,2],[2,11],[2,15],[8,9],[9,15],[1,8],[1,10],[10,6],[6,18],[6,7],[7,19],[13,3],[3,16],[16,17],[17,4],[18,19],[5,8],[11,14]],
    },
    biology: {
      note: "从细胞结构与能量代谢生长出遗传、稳态调节和生态演化三层树冠，呈现生命系统的层级性。",
      positions: [[39,58],[52,58],[35,36],[48,36],[27,57],[66,41],[50,83],[77,27],[67,25],[77,52],[28,83],[51,72],[17,64],[27,68],[41,22],[53,20],[79,67],[64,82],[65,11],[82,82]],
      links: [[13,12],[13,11],[13,0],[13,1],[0,4],[1,4],[11,3],[3,2],[2,14],[14,15],[3,18],[5,8],[5,7],[5,16],[9,5],[6,17],[6,19],[17,10],[10,2],[19,10],[12,5],[1,6]],
    },
    politics: {
      note: "经济、政治、文化与哲学四个议事星域围绕实践与联系枢纽展开，显示制度主体和社会发展的相互作用。",
      positions: [[19,24],[31,34],[76,25],[87,37],[78,49],[25,72],[41,19],[52,12],[50,47],[88,70],[18,47],[31,55],[11,34],[17,58],[34,23],[70,37],[86,56],[38,78],[50,61],[62,79]],
      links: [[8,18],[18,7],[18,6],[18,19],[0,1],[1,11],[11,12],[12,13],[13,14],[1,10],[2,3],[3,4],[3,15],[15,16],[4,16],[5,17],[17,19],[6,7],[7,8],[8,19],[9,16],[18,10],[18,3],[18,17]],
    },
    geography: {
      note: "自然圈层铺在经纬球面，人文区位沿空间流动带展开，地理信息技术在观测极点统合各类空间证据。",
      positions: [[20,22],[36,18],[52,20],[67,25],[77,46],[67,60],[55,70],[39,67],[24,57],[15,41],[34,36],[82,61],[50,10],[66,12],[84,25],[29,80],[15,70],[45,84],[64,84],[86,80]],
      links: [[12,0],[0,13],[13,10],[10,1],[1,14],[14,2],[2,3],[3,16],[16,15],[15,8],[8,9],[9,0],[4,5],[5,6],[6,7],[7,11],[11,18],[18,17],[17,19],[19,4],[7,8],[6,15],[19,14]],
    },
  };
  const subjectVisuals = {
    history: { sigil: "卷", marks: ["证", "界", "因"], copy: "史料 · 边界 · 命题" },
    chinese: { sigil: "墨", marks: ["文", "意", "境"], copy: "语境 · 结构 · 表达" },
    math: { sigil: "∑", marks: ["数", "形", "证"], copy: "数量 · 结构 · 推演" },
    english: { sigil: "A", marks: ["语", "篇", "境"], copy: "CONTEXT · LOGIC · TONE" },
    physics: { sigil: "⚛", marks: ["力", "能", "场"], copy: "过程 · 守恒 · 建模" },
    chemistry: { sigil: "⚗", marks: ["微", "变", "衡"], copy: "微粒 · 反应 · 条件" },
    biology: { sigil: "叶", marks: ["生", "稳", "传"], copy: "结构 · 调节 · 演化" },
    politics: { sigil: "衡", marks: ["制", "权", "责"], copy: "主体 · 制度 · 价值" },
    geography: { sigil: "◎", marks: ["空", "区", "流"], copy: "空间 · 区位 · 过程" },
  };
  const subjectConstellations = {
    history: { points: [[.08,.70],[.24,.52],[.39,.34],[.55,.18],[.66,.42],[.78,.62],[.62,.80],[.92,.40]], links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[2,5]] },
    chinese: { points: [[.16,.18],[.35,.30],[.56,.19],[.72,.35],[.54,.49],[.32,.58],[.18,.80],[.47,.72]], links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7]] },
    math: { points: [[.13,.76],[.49,.12],[.86,.76],[.49,.76],[.31,.46],[.68,.46],[.49,.50]], links: [[0,1],[1,2],[2,0],[0,3],[1,3],[2,3],[4,5],[4,6],[5,6]] },
    english: { points: [[.12,.28],[.27,.17],[.37,.38],[.24,.62],[.61,.34],[.77,.17],[.90,.32],[.74,.63]], links: [[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,6],[6,7],[7,4]] },
    physics: { points: [[.10,.52],[.26,.28],[.48,.18],[.72,.31],[.90,.50],[.70,.68],[.47,.82],[.25,.68],[.49,.50]], links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[2,8],[4,8],[6,8]] },
    chemistry: { points: [[.49,.10],[.80,.28],[.82,.62],[.50,.84],[.17,.62],[.18,.28],[.50,.48]], links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[2,6],[4,6]] },
    biology: { points: [[.49,.83],[.48,.63],[.35,.48],[.20,.32],[.08,.16],[.60,.45],[.77,.28],[.90,.12],[.69,.65]], links: [[0,1],[1,2],[2,3],[3,4],[1,5],[5,6],[6,7],[1,8]] },
    politics: { points: [[.50,.12],[.50,.34],[.18,.40],[.82,.40],[.09,.66],[.28,.66],[.72,.66],[.91,.66],[.50,.84]], links: [[0,1],[1,2],[1,3],[2,4],[2,5],[4,5],[3,6],[3,7],[6,7],[1,8]] },
    geography: { points: [[.08,.63],[.22,.46],[.40,.36],[.60,.39],[.78,.26],[.92,.12],[.74,.66],[.50,.78],[.28,.73]], links: [[0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[6,7],[7,8],[8,0]] },
  };
  const subtleHints = {
    history: "先圈出任务词，再核对材料能代表多大范围、能否支撑因果。",
    chinese: "先比较表达作用与语境边界，不要从相同字词直接连线。",
    math: "先判断各题调用的是同一种数量关系，还是只有符号看起来相似。",
    english: "Try tracing context and discourse purpose before matching repeated words.",
    physics: "先画出过程的起点与终点，再看守恒关系是否真的属于同一层次。",
    chemistry: "先区分现象、微粒解释与反应条件，看看哪些牌停留在同一层。",
    biology: "先找共同的生命层次，再比较结构、功能与调节方向。",
    politics: "先锁定行为主体与制度关系，不要只按材料里的相同名词分组。",
    geography: "先统一观察尺度，再追踪要素在空间中的方向和过程。",
  };

  const defaults = () => ({
    version: "2.0", nickname: "星轨观察者", grade: "高二", guideSeen: false, music: true, sound: true, reduceMotion: false,
    xp: 0, rounds: 0, bonds: 0, pseudo: 0, selectedSubject: "history", selectedMode: "hard",
    usedRounds: {}, discoveries: {}, recent: [], decodeNotes: [],
  });
  const state = {
    save: loadSave(), screen: "launchScreen", round: null, journeyRounds: 0, selected: new Set(), locked: false,
    mapSubject: "history", mapOrigin: "homeScreen", challengeDone: false, masterChoice: -1, reflectionSaved: false, audio: null, stars: [], toastTimer: 0,
    roundFailures: 0, hintOffered: false, hintAccepted: false, answerRevealed: false, currentTopic: null,
    roundStartedAt: 0, roundAttempt: 0,
    mapPositions: [], mapLinks: [],
  };
  const roundBanks = Object.fromEntries(DATA.subjects.map((subject) => [
    subject.id,
    DATA.groups.filter((group) => group.subjectId === subject.id).map((group) => ({
      ...group,
      totalCount: group.cards.length,
      targetCount: group.allowedCombinations[0]?.cardIds.length || 2,
      cards: group.cards.map((card) => ({ ...card, topicId: group.topic.id })),
    })),
  ]));

  function loadSave() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
      return parsed ? { ...defaults(), ...parsed, version: "2.0", usedRounds: parsed.usedRounds || {}, discoveries: parsed.discoveries || {}, recent: parsed.recent || [], decodeNotes: parsed.decodeNotes || [] } : defaults();
    } catch { return defaults(); }
  }
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save)); } catch { /* local file privacy mode */ } }
  function lowerFirst(text) { return text ? text.charAt(0).toLowerCase() + text.slice(1) : text; }
  function subjectById(id = state.save.selectedSubject) { return DATA.subjects.find((item) => item.id === id) || DATA.subjects[0]; }
  function modeById(id = state.save.selectedMode) { return DATA.modes.find((item) => item.id === id) || DATA.modes[0]; }
  function usedRounds(id) { return state.save.usedRounds[id] || []; }
  function discovered(subjectId, topicId) { return Number(state.save.discoveries[`${subjectId}:${topicId}`] || 0); }
  function pad(value) { return String(value).padStart(2, "0"); }
  function levelInfo() { const level = Math.max(1, Math.floor(state.save.xp / 100) + 1); return { level, title: titles[Math.min(titles.length - 1, Math.floor((level - 1) / 2))], within: state.save.xp % 100 }; }
  function levelTelemetry(info = levelInfo()) { return { user_level: info.level, user_title: info.title, user_rank: `LV.${pad(info.level)} · ${info.title}` }; }
  function dayKey() { const now = new Date(); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
  function seeded(seed) { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }
  function shuffle(items, random = Math.random) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }

  function showScreen(id, options = {}) {
    if (id === state.screen) return;
    const current = $(state.screen);
    const next = $(id);
    if (!next) return;
    current?.classList.add("is-leaving");
    next.hidden = false;
    requestAnimationFrame(() => next.classList.add("is-active"));
    window.setTimeout(() => {
      const previousScreen = state.screen;
      current?.classList.remove("is-active", "is-leaving");
      if (current) current.hidden = true;
      state.screen = id;
      TELEMETRY?.setContext({ screen: id });
      TELEMETRY?.track("screen_view", { screen: id, previous_screen: previousScreen });
      setMusicMode(id === "gameScreen" ? "focus" : "drift");
      if (id === "launchScreen") scheduleLaunchGlitch(); else stopLaunchGlitch();
      if (options.scrollTop !== false) next.scrollTop = 0;
      if (id === "subjectScreen") renderSubjects();
      if (id === "modeScreen") renderModes();
      if (id === "homeScreen") renderHome();
      if (id === "mapScreen") renderMap();
      if (id === "profileScreen") renderProfile();
    }, 520);
  }

  function renderSubjects() {
    const current = subjectById();
    const visual = subjectVisuals[current.id];
    $("subjectConstellation").innerHTML = DATA.subjects.map((subject) => {
      const look = subjectVisuals[subject.id];
      return `<button class="subject-star ${subject.id === current.id ? "is-selected" : ""}" style="--subject-color:${subject.color}" data-subject="${subject.id}" type="button"><i class="subject-logo"><canvas class="subject-constellation-mark" data-constellation="${subject.id}" aria-hidden="true"></canvas><em>${look.sigil}</em><u></u></i><span><b>${subject.name}</b><small>${subject.english}</small></span><strong>100</strong></button>`;
    }).join("");
    $("subjectGlyph").textContent = current.glyph;
    $("subjectName").textContent = current.name;
    $("subjectEnglish").textContent = current.english;
    $("subjectIntro").textContent = visual.copy;
    $("previewSigil").textContent = visual.sigil;
    $("subjectEmblemPreview").style.setProperty("--subject-color", current.color);
    $("subjectEmblemPreview").dataset.marks = visual.marks.join(" · ");
    $("previewConstellation").dataset.constellation = current.id;
    drawSubjectConstellations();
  }
  function drawSubjectConstellations() {
    document.querySelectorAll("[data-constellation]").forEach((canvas) => {
      const subject = subjectById(canvas.dataset.constellation);
      const pattern = subjectConstellations[subject.id];
      const size = canvas.id === "previewConstellation" ? 182 : 70;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = size * ratio; canvas.height = size * ratio;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = subject.color; ctx.globalAlpha = .62; ctx.lineWidth = canvas.id === "previewConstellation" ? 1.25 : .9;
      ctx.shadowColor = subject.color; ctx.shadowBlur = canvas.id === "previewConstellation" ? 12 : 6;
      pattern.links.forEach(([from, to]) => {
        ctx.beginPath(); ctx.moveTo(pattern.points[from][0] * size, pattern.points[from][1] * size); ctx.lineTo(pattern.points[to][0] * size, pattern.points[to][1] * size); ctx.stroke();
      });
      pattern.points.forEach(([x, y], index) => {
        const px = x * size, py = y * size, radius = (canvas.id === "previewConstellation" ? 2.5 : 1.55) + (index % 4 === 0 ? 1 : 0);
        ctx.globalAlpha = .96; ctx.fillStyle = index % 3 === 0 ? "#fff2c6" : "#dffaff";
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = .34; ctx.beginPath(); ctx.moveTo(px - radius * 3, py); ctx.lineTo(px + radius * 3, py); ctx.moveTo(px, py - radius * 3); ctx.lineTo(px, py + radius * 3); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
  }
  function chooseSubject(id) {
    state.save.selectedSubject = id;
    state.mapSubject = id;
    TELEMETRY?.setContext({ subject: id });
    persist();
    renderSubjects();
    clickTone(460, .034);
    TELEMETRY?.track("subject_selected", { subject: id });
  }

  function renderModes() {
    const subject = subjectById();
    const current = modeById();
    $("modeSubjectLabel").textContent = `${subject.name}星域已连接`;
    $("modeGates").innerHTML = DATA.modes.map((mode, index) => `<button class="mode-gate ${mode.id === current.id ? "is-selected" : ""}" style="--gate:${modeColors[index]}" data-mode="${mode.id}" type="button"><i>${mode.icon}</i><span><small>${mode.english}</small><b>${mode.name}</b><em>${escapeHtml(mode.description)}</em></span><strong>${escapeHtml(mode.rule)}</strong></button>`).join("");
    $("modeName").textContent = current.name;
    $("modeDescription").textContent = current.description;
  }
  function chooseMode(id) {
    state.save.selectedMode = id;
    TELEMETRY?.setContext({ mode: id });
    persist();
    renderModes();
    clickTone(560, .034);
    TELEMETRY?.track("mode_selected", { mode: id, subject: state.save.selectedSubject });
  }

  function renderHome() {
    const subject = subjectById();
    const mode = modeById();
    const level = levelInfo();
    $("homeNickname").textContent = state.save.nickname;
    $("homeLevel").textContent = `LV.${pad(level.level)} · ${level.title}`;
    $("homeAvatar").textContent = state.save.nickname.slice(0, 1) || "观";
    $("sessionRounds").textContent = state.journeyRounds;
    $("todayDiscoveries").textContent = state.save.recent.filter((item) => item.day === dayKey()).length;
    $("homeXp").textContent = state.save.xp;
    $("selectedSubjectGlyph").textContent = subject.glyph;
    $("selectedSubjectName").textContent = subject.name;
    $("selectedModeName").textContent = mode.name;
    $("selectedModeDescription").textContent = mode.description;
  }

  function startRound() {
    const subject = subjectById();
    const mode = modeById();
    const bank = roundBanks[subject.id].filter((round) => round.difficulty === mode.difficulty);
    let used = usedRounds(subject.id);
    if (!bank.some((round) => !used.includes(round.id))) {
      used = [];
      state.save.usedRounds[subject.id] = [];
      toast(`${subject.name}当前难度的题组已完成一轮，牌库重新洗牌。`);
    }
    const available = bank.filter((round) => !used.includes(round.id));
    const selectedRound = available[Math.floor(Math.random() * available.length)];
    state.round = { ...selectedRound, cards: shuffle(selectedRound.cards) };
    state.selected.clear();
    state.locked = false;
    state.challengeDone = false;
    state.masterChoice = -1;
    state.reflectionSaved = false;
    state.roundFailures = 0;
    state.hintOffered = false;
    state.hintAccepted = false;
    state.answerRevealed = false;
    state.currentTopic = null;
    state.roundStartedAt = performance.now();
    state.roundAttempt = 0;
    state.journeyRounds += 1;
    state.save.usedRounds[subject.id] = [...used, selectedRound.id];
    persist();
    renderRound();
    const topicCounts = state.round.cards.reduce((counts, card) => ({ ...counts, [card.topicId]: (counts[card.topicId] || 0) + 1 }), {});
    const currentLevel = levelTelemetry();
    TELEMETRY?.setContext({ screen: "gameScreen", subject: state.round.subjectId, mode: state.save.selectedMode, round_id: state.round.id, ...currentLevel });
    TELEMETRY?.track("round_started", {
      round_id: state.round.id,
      subject: state.round.subjectId,
      mode: state.save.selectedMode,
      grade: state.save.grade,
      ...currentLevel,
      card_count: state.round.cards.length,
      primary_relation_size: state.round.targetCount,
      primary_topic_id: state.round.topic?.id || "",
      valid_bond_sizes: Object.values(topicCounts).filter((count) => count >= 2),
    });
    if (state.screen !== "gameScreen") showScreen("gameScreen");
    window.setTimeout(() => { if (!state.save.guideSeen && state.screen === "gameScreen") $("guidePanel").hidden = false; }, 850);
  }

  function renderRound() {
    const subject = subjectById(state.round.subjectId);
    const mode = modeById();
    $("gameMeta").textContent = `${subject.english} · ${mode.english}`;
    $("gameTitle").textContent = `${subject.name} · ${mode.name}`;
    $("gameXp").textContent = state.save.xp;
    $("gameRoundNumber").textContent = pad(state.journeyRounds);
    $("gameCardCount").textContent = state.round.cards.length;
    $("missionCopy").textContent = mode.mission;
    $("modeRule").textContent = `本局 ${state.round.cards.length} 张星牌；组合 2–8 张，自由提出关系。`;
    const grid = $("cardGrid");
    grid.dataset.count = state.round.cards.length;
    grid.innerHTML = state.round.cards.map((card, index) => cardMarkup(card, index, subject)).join("");
    $("ritualHalo").classList.remove("is-active");
    $("hintOfferPanel").hidden = true;
    $("hintWhisper").hidden = true;
    $("declineHint").hidden = false;
    $("acceptHint").hidden = false;
    $("closeHint").hidden = true;
    $("revealPanel").hidden = true;
    $("verifyBond").classList.remove("is-next-round");
    $("verifyBond").querySelector("span").textContent = "组合羁绊";
    $("verifyBond").querySelector("small").textContent = "COMMUNE WITH CARDS";
    clearBondCanvas();
    updateSelection();
  }

  function cardMarkup(card, index, subject) {
    const topic = subject.topics.find((item) => item.id === card.topicId);
    const tilt = ((index % 5) - 2) * .75;
    return `<button class="tarot-card ${subject.id === "english" ? "is-english" : ""}" style="--ritual-tilt:${tilt}deg;--ritual-delay:${index * .11}s" data-card="${card.id}" type="button" aria-pressed="false" aria-label="题卡 ${index + 1}：${escapeHtml(card.text)}"><span class="tarot-card__inner"><span class="tarot-face tarot-face--front"><span class="tarot-number"><i>ARCANA ${pad(index + 1)}</i><i>${subject.glyph}</i></span><span class="tarot-orbit"></span><span class="tarot-question">${escapeHtml(card.text)}</span><span class="tarot-footer"><i>OBSERVE</i><i>点击选牌 · 右键放大</i></span></span><span class="tarot-face tarot-face--back"><span class="back-content"><span class="back-glyph">${subject.glyph}</span><span class="back-kicker">THE HIDDEN BOND</span><b class="back-name">${escapeHtml(topic.title)}</b><span class="back-key">星轨证据 · ${escapeHtml(card.evidence)}</span><span class="back-explain">${escapeHtml(topic.explanation)}</span></span></span></span></button>`;
  }

  function toggleCard(id) {
    if (state.locked || state.answerRevealed) return;
    if (state.selected.has(id)) state.selected.delete(id);
    else if (state.selected.size < 8) state.selected.add(id);
    else return toast("星阵最多容纳 8 张牌，请先撤回一张。");
    clickTone(state.selected.has(id) ? 640 : 350, .033);
    updateSelection();
  }
  function updateSelection() {
    document.querySelectorAll(".tarot-card").forEach((element) => {
      const selected = state.selected.has(element.dataset.card);
      element.classList.toggle("is-selected", selected);
      element.setAttribute("aria-pressed", String(selected));
    });
    const count = state.selected.size;
    $("selectedCount").textContent = count;
    if (state.answerRevealed) {
      $("clearSelection").disabled = true;
      $("verifyBond").disabled = state.locked;
      $("selectionTitle").textContent = "星牌已公开正确答案";
      $("selectionHint").textContent = "观察每张牌背面的羁绊名称、证据与解释";
      return;
    }
    $("clearSelection").disabled = count === 0 || state.locked;
    $("verifyBond").disabled = count < 2 || state.locked;
    $("selectionTitle").textContent = count < 2 ? "等待你的关系假设" : "星阵已经形成";
    $("selectionHint").textContent = count < 2 ? "每局牌数不同，羁绊数量不会提前提示" : "如果这些牌能被同一规律解释，就让它们回应";
  }
  function clearSelection() { state.selected.clear(); updateSelection(); clickTone(310, .03); }
  function verifyBond() {
    if (state.answerRevealed) { if (!state.locked) startRound(); return; }
    if (state.locked || state.selected.size < 2) return;
    const cards = state.round.cards.filter((card) => state.selected.has(card.id));
    const selectionKey = cards.map((card) => card.id).sort().join("|");
    const allowedCombination = state.round.allowedCombinations.find(
      (combination) => [...combination.cardIds].sort().join("|") === selectionKey,
    );
    const sharedValidTag = Boolean(allowedCombination)
      && cards.every((card) => card.validTagIds.includes(allowedCombination.revealTag)
        && !card.disabledBondTags.includes(allowedCombination.revealTag));
    const tag = allowedCombination ? DATA.tags[allowedCombination.revealTag] : null;
    const specificityOk = Boolean(tag?.enabledForBond) && Number(tag?.specificity || 0) >= 0.8
      && cards.length >= Number(state.round.minimumSizeByTag[allowedCombination?.revealTag] || tag?.minimumCardCount || 2);
    const conflictRule = state.round.conflictRules.find((rule) =>
      rule.left_cards?.some((id) => state.selected.has(id))
      && rule.right_cards?.some((id) => state.selected.has(id)));
    const success = Boolean(allowedCombination && sharedValidTag && specificityOk && !conflictRule);
    state.roundAttempt += 1;
    TELEMETRY?.track("bond_verified", {
      round_id: state.round.id,
      subject: state.round.subjectId,
      mode: state.save.selectedMode,
      attempt: state.roundAttempt,
      selected_count: cards.length,
      selected_cards: cards.map((card) => card.id),
      reveal_tag: allowedCombination?.revealTag || "",
      shared_valid_tag: sharedValidTag,
      specificity_ok: specificityOk,
      conflict_rule: conflictRule?.rule_id || "",
      success,
      elapsed_ms: Math.round(performance.now() - state.roundStartedAt),
    });
    if (success) revealBond(state.round.topic.id, cards, allowedCombination);
    else handleFailedBond(cards, conflictRule);
  }

  function handleFailedBond(cards, conflictRule = null) {
    state.locked = true;
    state.save.pseudo += 1;
    state.roundFailures += 1;
    persist();
    buzzTone();
    cards.forEach((card) => document.querySelector(`[data-card="${card.id}"]`)?.classList.add("is-pseudo"));
    $("selectionTitle").textContent = "星轨没有同时响应";
    $("selectionHint").textContent = "可以换一组牌，或撤回部分关系假设";
    const nearMiss = state.round.nearMisses.find((item) =>
      [...item.card_ids || item.cardIds || []].sort().join("|") === cards.map((card) => card.id).sort().join("|"));
    const fallback = state.round.allowedCombinations[0]?.feedback?.errorFeedback || {};
    const first = nearMiss?.first_hint || fallback.first_error?.hint || fallback.near_miss?.hint
      || "你看到了一处表面相似点。再核对主体、范围、任务词或因果方向。";
    const full = nearMiss?.full_explanation || fallback.full_error?.explanation || fallback.near_miss?.explanation
      || conflictRule?.message || "这组牌没有命中编辑白名单，关系边界并不一致。";
    $("errorFeedbackLabel").textContent = state.roundFailures === 1 ? "首次错误提示" : "完整错误反馈";
    $("errorFeedbackText").textContent = state.roundFailures === 1 ? first : full;
    $("errorFeedbackPanel").hidden = false;
    window.setTimeout(() => {
      cards.forEach((card) => document.querySelector(`[data-card="${card.id}"]`)?.classList.remove("is-pseudo"));
      if (state.roundFailures >= 5) { revealAllAnswers(); return; }
      state.locked = false;
      updateSelection();
      if (state.roundFailures >= 3 && !state.hintOffered) offerSubtleHint();
    }, state.save.reduceMotion ? 120 : 620);
  }
  function revealAllAnswers() {
    state.answerRevealed = true;
    state.locked = true;
    state.selected.clear();
    TELEMETRY?.track("answers_revealed_after_failures", {
      round_id: state.round.id,
      subject: state.round.subjectId,
      mode: state.save.selectedMode,
      attempts: state.roundAttempt,
      elapsed_ms: Math.round(performance.now() - state.roundStartedAt),
    });
    $("hintOfferPanel").hidden = true;
    const cards = [...document.querySelectorAll(".tarot-card")];
    cards.forEach((element) => element.classList.remove("is-selected", "is-pseudo", "is-dimmed", "is-consecrating"));
    $("verifyBond").classList.add("is-next-round");
    $("verifyBond").querySelector("span").textContent = "答案显形中";
    $("verifyBond").querySelector("small").textContent = "THE CARDS ARE SPEAKING";
    updateSelection();
    flipTone();
    cards.forEach((element, index) => {
      const stagger = state.save.reduceMotion ? index * 12 : index * 120;
      window.setTimeout(() => element.classList.add("is-revealed", "is-answer-card"), stagger);
      window.setTimeout(() => element.classList.add("is-inscribed"), (state.save.reduceMotion ? 80 : 1900) + stagger);
    });
    window.setTimeout(() => {
      state.locked = false;
      $("verifyBond").querySelector("span").textContent = "进入下一局";
      $("verifyBond").querySelector("small").textContent = "CONTINUE THE JOURNEY";
      updateSelection();
      hintTone();
    }, state.save.reduceMotion ? 260 : 3500);
  }
  function offerSubtleHint() {
    state.hintOffered = true;
    $("hintWhisperText").textContent = subtleHints[state.round.subjectId] || "先比较每张牌的对象、变化和限定，再寻找能覆盖全部所选牌的关系。";
    $("hintOfferPanel").hidden = false;
    hintTone();
    TELEMETRY?.track("hint_offered", { round_id: state.round.id, attempt: state.roundAttempt, subject: state.round.subjectId });
  }
  function declineHint() {
    $("hintOfferPanel").hidden = true;
    TELEMETRY?.track("hint_declined", { round_id: state.round.id, attempt: state.roundAttempt });
  }
  function acceptHint() {
    state.hintAccepted = true;
    $("hintWhisper").hidden = false;
    $("declineHint").hidden = true;
    $("acceptHint").hidden = true;
    $("closeHint").hidden = false;
    hintTone();
    TELEMETRY?.track("hint_accepted", { round_id: state.round.id, attempt: state.roundAttempt, subject: state.round.subjectId });
  }

  function revealBond(topicId, cards, combination) {
    state.locked = true;
    const subject = subjectById(state.round.subjectId);
    const topic = subject.topics.find((item) => item.id === topicId);
    const mode = modeById();
    const previousLevel = levelInfo();
    state.save.xp += mode.reward;
    state.save.rounds += 1;
    state.save.bonds += 1;
    const key = `${subject.id}:${topic.id}`;
    state.save.discoveries[key] = discovered(subject.id, topic.id) + 1;
    state.save.recent.unshift({ subjectId: subject.id, topicId: topic.id, title: topic.title, day: dayKey(), at: new Date().toISOString() });
    state.save.recent = state.save.recent.slice(0, 16);
    persist();
    const currentLevel = levelInfo();
    const currentLevelData = levelTelemetry(currentLevel);
    const rankUp = currentLevel.level !== previousLevel.level || currentLevel.title !== previousLevel.title;
    TELEMETRY?.setContext(currentLevelData);
    TELEMETRY?.track("round_completed", {
      round_id: state.round.id,
      subject: subject.id,
      mode: mode.id,
      topic_id: topic.id,
      ...currentLevelData,
      rank_up: rankUp,
      card_count: state.round.cards.length,
      selected_count: cards.length,
      attempts: state.roundAttempt,
      failures: state.roundFailures,
      hint_offered: state.hintOffered,
      hint_used: state.hintAccepted,
      elapsed_ms: Math.round(performance.now() - state.roundStartedAt),
      reward: mode.reward,
    });
    if (rankUp) TELEMETRY?.track("user_rank_changed", {
      previous_level: previousLevel.level,
      previous_title: previousLevel.title,
      ...currentLevelData,
    });
    document.querySelectorAll(".tarot-card").forEach((element) => {
      const selected = state.selected.has(element.dataset.card);
      element.classList.toggle("is-consecrating", selected);
      element.classList.toggle("is-dimmed", !selected);
    });
    drawBondLines(cards, 2100);
    ritualRiseTone();
    window.setTimeout(() => $("ritualHalo").classList.add("is-active"), state.save.reduceMotion ? 30 : 500);
    window.setTimeout(() => { flipTone(); cards.forEach((card) => document.querySelector(`[data-card="${card.id}"]`)?.classList.add("is-revealed")); }, state.save.reduceMotion ? 80 : 1350);
    window.setTimeout(() => { successTone(); cards.forEach((card) => document.querySelector(`[data-card="${card.id}"]`)?.classList.add("is-inscribed")); }, state.save.reduceMotion ? 150 : 3700);
    window.setTimeout(() => showReveal(topic, mode, combination), state.save.reduceMotion ? 420 : 5450);
  }

  function showReveal(topic, mode, combination) {
    const feedback = combination?.feedback || {};
    $("revealTitle").textContent = `【${topic.title}】`;
    $("revealExplanation").textContent = feedback.conclusion || topic.explanation;
    $("insightText").textContent = feedback.conclusion || topic.insight;
    $("feedbackConclusion").textContent = feedback.conclusion || topic.insight;
    $("feedbackEvidence").innerHTML = (feedback.evidence || []).map((item) =>
      `<li><b>${escapeHtml(item.card_id)}</b><span>${escapeHtml(item.evidence_text)}</span></li>`).join("");
    $("feedbackRule").textContent = feedback.rule || topic.explanation;
    $("feedbackTransfer").textContent = feedback.transfer || topic.method;
    $("rewardXp").textContent = `+${mode.reward}`;
    const challenge = $("modeChallenge");
    const options = $("challengeOptions");
    const masterNote = $("masterNote");
    const decodeAnswer = $("decodeAnswer");
    const decodeStatus = $("decodeAnswerStatus");
    state.currentTopic = topic;
    state.challengeDone = !["master", "decode"].includes(mode.id);
    $("nextRound").disabled = !state.challengeDone;
    $("viewMapAfterRound").disabled = !state.challengeDone;
    challenge.hidden = state.challengeDone;
    options.hidden = true;
    options.innerHTML = "";
    masterNote.hidden = true;
    masterNote.value = "";
    decodeAnswer.hidden = true;
    decodeAnswer.value = "";
    decodeStatus.hidden = true;
    if (mode.id === "master") {
      $("challengeLabel").textContent = "MASTER REFLECTION";
      $("challengeTitle").textContent = "哪一种判断过程最容易迁移？";
      options.hidden = false;
      masterNote.hidden = false;
      renderChallenge(["先压缩题面对象，再比较机制与限定", "只记住这几张牌共同出现的字", "把整段题面逐字背下来"]);
    } else if (mode.id === "decode") {
      $("challengeLabel").textContent = "EXAMINER DECODE";
      $("challengeTitle").textContent = "出题人为什么把这些题放在一起？";
      decodeAnswer.hidden = false;
      decodeStatus.hidden = false;
      window.setTimeout(() => decodeAnswer.focus(), 520);
    }
    $("revealPanel").hidden = false;
    $("gameXp").textContent = state.save.xp;
  }
  function renderChallenge(options) { $("challengeOptions").innerHTML = options.map((option, index) => `<button type="button" data-challenge="${index}">${escapeHtml(option)}</button>`).join(""); }
  function completeChallenge(button) {
    document.querySelectorAll("[data-challenge]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    state.masterChoice = Number(button.dataset.challenge);
    state.challengeDone = true;
    $("nextRound").disabled = false;
    $("viewMapAfterRound").disabled = false;
    clickTone(780, .045);
    TELEMETRY?.track("master_choice", {
      round_id: state.round.id,
      subject: state.round.subjectId,
      option_index: state.masterChoice,
    });
  }
  function updateDecodeAnswer() {
    const length = $("decodeAnswer").value.trim().length;
    state.challengeDone = length >= 6;
    $("nextRound").disabled = !state.challengeDone;
    $("viewMapAfterRound").disabled = !state.challengeDone;
    $("decodeAnswerStatus").textContent = state.challengeDone ? "已记录你的解释，可以继续抽牌。" : `再写 ${Math.max(0, 6 - length)} 个字即可记录；这里不自动判分。`;
  }
  function saveDecodeAnswer() {
    if (state.reflectionSaved) return;
    const text = $("decodeAnswer").value.trim();
    const masterText = $("masterNote").value.trim();
    const modeId = modeById().id;
    if (modeId === "decode" && text && state.currentTopic) {
      state.save.decodeNotes.unshift({ subjectId: state.round.subjectId, roundId: state.round.id, topicId: state.currentTopic.id, text, at: new Date().toISOString() });
      state.save.decodeNotes = state.save.decodeNotes.slice(0, 30);
      persist();
      TELEMETRY?.track("decode_reflection", {
        round_id: state.round.id,
        subject: state.round.subjectId,
        topic_id: state.currentTopic.id,
        text_length: text.length,
        response_text: TELEMETRY?.allowsOpenText() ? text : "",
      });
      state.reflectionSaved = true;
    } else if (modeId === "master" && state.currentTopic) {
      TELEMETRY?.track("master_reflection", {
        round_id: state.round.id,
        subject: state.round.subjectId,
        topic_id: state.currentTopic.id,
        option_index: state.masterChoice,
        text_length: masterText.length,
        response_text: TELEMETRY?.allowsOpenText() ? masterText : "",
      });
      state.reflectionSaved = true;
    }
  }

  function drawBondLines(cards, duration) {
    const canvas = $("bondCanvas");
    const rect = $("board").getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
    const points = cards.map((card) => { const cardRect = document.querySelector(`[data-card="${card.id}"]`).getBoundingClientRect(); return { x: cardRect.left - rect.left + cardRect.width / 2, y: cardRect.top - rect.top + cardRect.height / 2 }; });
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
    const start = performance.now();
    const animate = (now) => {
      const progress = state.save.reduceMotion ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      ctx.clearRect(0, 0, rect.width, rect.height); ctx.lineWidth = 1.5; ctx.shadowBlur = 16; ctx.shadowColor = "#ffe7ae";
      points.forEach((point, index) => { ctx.beginPath(); ctx.moveTo(point.x, point.y); const wobble = Math.sin(progress * Math.PI * 2 + index) * 8 * (1 - progress); ctx.quadraticCurveTo((point.x + center.x) / 2 + wobble, (point.y + center.y) / 2 - wobble, point.x + (center.x - point.x) * eased, point.y + (center.y - point.y) * eased); ctx.strokeStyle = `rgba(255,226,162,${.24 + eased * .68})`; ctx.stroke(); });
      ctx.beginPath(); ctx.arc(center.x, center.y, 4 + eased * 10, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,244,205,${eased})`; ctx.fill();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
  function clearBondCanvas() { const canvas = $("bondCanvas"); canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); }

  function renderMap() {
    const subject = subjectById(state.mapSubject);
    $("mapStyleLabel").textContent = mapStyleNames[subject.id];
    $("mapSubjects").innerHTML = DATA.subjects.map((item) => `<button type="button" data-map-subject="${item.id}" class="${item.id === subject.id ? "is-selected" : ""}" style="--subject-color:${item.color}" title="${item.name}">${item.glyph}</button>`).join("");
    state.mapPositions = getMapPositions(subject.id, subject.topics.length);
    state.mapLinks = getMapLinks(subject.id, subject.topics.length);
    drawMapCosmos(subject.id, subject.color);
    const layer = $("mapNodeLayer"); layer.innerHTML = "";
    state.mapLinks.forEach(([from, to]) => layer.appendChild(makeMapLine(subject, from, to)));
    subject.topics.forEach((topic, index) => {
      const count = discovered(subject.id, topic.id);
      const node = document.createElement("button"); node.type = "button"; node.className = `map-node ${count ? "is-discovered" : ""}`; node.dataset.mapNode = topic.id; node.style.left = `${state.mapPositions[index][0]}%`; node.style.top = `${state.mapPositions[index][1]}%`; node.innerHTML = `<span>${count ? topic.name.slice(0, 2) : "？"}</span><small>${count ? escapeHtml(topic.name) : `未知星位 ${pad(index + 1)}`}</small>`; layer.appendChild(node);
    });
    const firstFound = subject.topics.find((topic) => discovered(subject.id, topic.id));
    renderMapDetail(firstFound?.id || subject.topics[0].id);
  }

  function makeMapLine(subject, from, to) {
    const [x1, y1] = state.mapPositions[from], [x2, y2] = state.mapPositions[to];
    const dx = x2 - x1, dy = y2 - y1;
    const line = document.createElement("i");
    const lit = discovered(subject.id, subject.topics[from].id) && discovered(subject.id, subject.topics[to].id);
    line.className = `map-line ${lit ? "is-lit" : ""}`; line.style.left = `${x1}%`; line.style.top = `${y1}%`; line.style.width = `${Math.sqrt(dx * dx + dy * dy)}%`; line.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`; return line;
  }

  function getMapPositions(id, count) {
    const blueprint = mapBlueprints[id];
    if (!blueprint) return [];
    const result = blueprint.positions.slice(0, count).map(([x, y]) => [x, y]);
    for (let i = result.length; i < count; i += 1) {
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      const radius = Math.min(38, 9 + i * 1.4);
      result.push([50 + Math.cos(angle) * radius, 47 + Math.sin(angle) * radius * .78]);
    }
    return result.map(([x, y]) => [Math.max(7, Math.min(93, x)), Math.max(9, Math.min(84, y))]);
  }

  function getMapLinks(id, count) {
    const blueprint = mapBlueprints[id];
    if (!blueprint) return [];
    const links = blueprint.links.filter(([from, to]) => from < count && to < count);
    if (count > blueprint.positions.length) {
      for (let i = blueprint.positions.length; i < count; i += 1) links.push([Math.max(0, i - 1), i]);
    }
    return links;
  }

  function drawMapCosmos(id, color) {
    const canvas = $("mapCosmosCanvas"); const rect = $("mapNetwork").getBoundingClientRect(); const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
    const w = rect.width, h = rect.height, rand = seeded([...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0));
    const gradient = ctx.createRadialGradient(w * .5, h * .48, 5, w * .5, h * .48, Math.max(w, h) * .7); gradient.addColorStop(0, `${color}28`); gradient.addColorStop(.4, "#101a4b44"); gradient.addColorStop(1, "#01040fff"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 230; i += 1) { const x = rand() * w, y = rand() * h, r = rand() * 1.35 + .2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(185,220,255,${.16 + rand() * .65})`; ctx.fill(); }
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.strokeStyle = `${color}55`; ctx.lineWidth = 1;
    if (id === "history") {
      ctx.globalAlpha = .32;
      [-h * .22, 0, h * .22].forEach((offset, lane) => {
        ctx.beginPath();
        for (let x = -w * .48; x <= w * .48; x += 12) {
          const y = offset + Math.sin(x / 82 + lane * 1.7) * (18 + lane * 3);
          x === -w * .48 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      for (let x = -w * .42; x < w * .45; x += 58) { ctx.beginPath(); ctx.moveTo(x, -h * .31); ctx.lineTo(x + 18, h * .31); ctx.stroke(); }
    } else if (id === "chinese") {
      ctx.globalAlpha = .28;
      for (let petal = 0; petal < 5; petal += 1) {
        ctx.save(); ctx.rotate(petal * Math.PI * 2 / 5);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(45, -85, 150, -74, 165, 0); ctx.bezierCurveTo(150, 74, 45, 85, 0, 0); ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.stroke();
    } else if (id === "math") {
      ctx.globalAlpha = .31;
      for (let ring = 1; ring <= 5; ring += 1) {
        const radius = ring * 43;
        ctx.beginPath();
        for (let vertex = 0; vertex < 6; vertex += 1) {
          const angle = -Math.PI / 2 + vertex * Math.PI / 3;
          const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius * .76;
          vertex ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-w * .45, 0); ctx.lineTo(w * .45, 0); ctx.moveTo(0, -h * .42); ctx.lineTo(0, h * .42); ctx.stroke();
    } else if (id === "english") {
      ctx.globalAlpha = .38;
      ctx.beginPath();
      for (let y = -h * .43; y <= h * .43; y += 8) { const x = Math.sin(y / 42) * w * .18; y === -h * .43 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.beginPath();
      for (let y = -h * .43; y <= h * .43; y += 8) { const x = -Math.sin(y / 42) * w * .18; y === -h * .43 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      for (let y = -h * .39; y < h * .42; y += 38) { const x = Math.sin(y / 42) * w * .18; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(-x, y); ctx.stroke(); }
    } else if (id === "physics") {
      ctx.globalAlpha = .33;
      [[65,25,.2],[118,46,-.25],[175,76,.12],[232,112,-.08]].forEach(([rx, ry, rotation]) => { ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, rotation, 0, Math.PI * 2); ctx.stroke(); });
      for (let ray = 0; ray < 12; ray += 1) { const angle = ray * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 24, Math.sin(angle) * 18); ctx.lineTo(Math.cos(angle) * w * .34, Math.sin(angle) * h * .34); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
    } else if (id === "chemistry") {
      ctx.globalAlpha = .34;
      for (let row = -4; row <= 4; row += 1) for (let col = -7; col <= 7; col += 1) {
        const cx = col * 58 + (row % 2 ? 29 : 0), cy = row * 51;
        ctx.beginPath();
        for (let p = 0; p < 6; p += 1) { const angle = p * Math.PI / 3; const x = cx + Math.cos(angle) * 33, y = cy + Math.sin(angle) * 33; p ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      }
    } else if (id === "biology") {
      ctx.globalAlpha = .3;
      ctx.beginPath(); ctx.moveTo(0, h * .42); ctx.bezierCurveTo(-6, h * .18, 8, 15, 0, -h * .34); ctx.stroke();
      const branches = [[-1,-.18],[-1,.02],[-1,.2],[1,-.1],[1,.09],[1,.27]];
      branches.forEach(([side, y]) => { ctx.beginPath(); ctx.moveTo(0, h * y); ctx.bezierCurveTo(side * 52, h * (y - .04), side * 98, h * (y - .15), side * w * .31, h * (y - .2)); ctx.stroke(); });
      for (let i = 0; i < 12; i += 1) { ctx.beginPath(); ctx.arc((rand() - .5) * w * .68, (rand() - .5) * h * .62, 16 + rand() * 34, 0, Math.PI * 2); ctx.globalAlpha = .12; ctx.stroke(); }
    } else if (id === "politics") {
      ctx.globalAlpha = .31;
      for (let ring = 1; ring <= 5; ring += 1) { ctx.beginPath(); ctx.arc(0, 0, ring * 46, 0, Math.PI * 2); ctx.stroke(); }
      for (let sector = 0; sector < 8; sector += 1) { const angle = sector * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 24, Math.sin(angle) * 24); ctx.lineTo(Math.cos(angle) * w * .42, Math.sin(angle) * h * .42); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.globalAlpha = .34;
      ctx.beginPath(); ctx.ellipse(0, 0, w * .32, h * .4, 0, 0, Math.PI * 2); ctx.stroke();
      [-.28,-.12,.08,.25].forEach((latitude) => { ctx.beginPath(); ctx.ellipse(0, h * latitude, w * .31 * Math.cos(latitude), 20 + Math.abs(latitude) * 35, 0, 0, Math.PI * 2); ctx.stroke(); });
      [-.9,-.45,0,.45,.9].forEach((rotation) => { ctx.beginPath(); ctx.ellipse(0, 0, w * .12, h * .4, rotation, 0, Math.PI * 2); ctx.stroke(); });
    }
    ctx.restore();
  }

  function renderMapDetail(topicId) {
    const subject = subjectById(state.mapSubject); const topic = subject.topics.find((item) => item.id === topicId); const count = discovered(subject.id, topic.id);
    document.querySelectorAll("[data-map-node]").forEach((node) => node.classList.toggle("is-selected", node.dataset.mapNode === topicId));
    $("mapDetail").innerHTML = count ? `<p class="eyebrow">${subject.english} / DISCOVERED</p><h2>${escapeHtml(topic.title)}</h2><span class="node-state">已理解 ${count} 次</span><p>${escapeHtml(topic.explanation)}</p><dl><dt>星轨证据</dt><dd>${escapeHtml(topic.keys.join(" · "))}</dd><dt>迁移提示</dt><dd>${escapeHtml(topic.method)}</dd><dt>学科星图结构</dt><dd>${escapeHtml(mapBlueprints[subject.id].note)}</dd></dl>` : `<p class="eyebrow">${subject.english} / VEILED</p><h2>尚未显形的星位</h2><span class="node-state is-locked">等待占测</span><p>继续进入${subject.name}牌局。节点名称只会在羁绊成立后显现。</p><dl><dt>这片宇宙的形态</dt><dd>${mapStyleNames[subject.id]}</dd><dt>题库关系设计</dt><dd>${escapeHtml(mapBlueprints[subject.id].note)}</dd></dl>`;
  }

  function renderProfile() {
    const level = levelInfo();
    $("profileAvatar").textContent = state.save.nickname.slice(0, 1) || "观"; $("profileNicknameDisplay").textContent = state.save.nickname; $("profileTitleText").textContent = `LV.${pad(level.level)} · ${level.title}`; $("profileXpBar").style.width = `${level.within}%`; $("profileXpText").textContent = `${level.within} / 100 EXP`; $("nicknameInput").value = state.save.nickname; $("gradeSelect").value = state.save.grade;
    $("statRounds").textContent = state.save.rounds; $("statBonds").textContent = state.save.bonds; $("statPseudo").textContent = state.save.pseudo; $("statXp").textContent = state.save.xp; $("musicSetting").checked = state.save.music; $("soundSetting").checked = state.save.sound; $("motionSetting").checked = state.save.reduceMotion;
    $("subjectProgress").innerHTML = DATA.subjects.map((subject) => { const count = subject.topics.filter((topic) => discovered(subject.id, topic.id)).length; return `<div class="progress-item" style="--subject-color:${subject.color}"><i>${subject.glyph}</i><span><b>${subject.name}</b><small>${count ? "独特星图正在显形" : "等待首次占测"}</small></span><em>${count}/20</em></div>`; }).join("");
    $("recentDiscoveries").innerHTML = state.save.recent.length ? state.save.recent.slice(0, 5).map((item) => { const subject = subjectById(item.subjectId); return `<div class="recent-item"><i>${subject.glyph}</i><span><b>${escapeHtml(item.title)}</b><small>${subject.name} · 羁绊发现</small></span><time>${item.day}</time></div>`; }).join("") : `<div class="recent-item"><i>◇</i><span><b>还没有星牌记录</b><small>完成第一局后，发现会自动收录。</small></span></div>`;
  }
  function saveProfile() {
    state.save.nickname = $("nicknameInput").value.trim() || "星轨观察者";
    state.save.grade = $("gradeSelect").value;
    persist();
    renderProfile();
    TELEMETRY?.setContext({ grade: state.save.grade, ...levelTelemetry() });
    TELEMETRY?.track("profile_updated", { grade: state.save.grade });
    TELEMETRY?.track("grade_selected", { grade: state.save.grade });
    toast("观测员档案已保存。 ");
  }

  function toast(message) { const element = $("toast"); element.textContent = message; element.classList.add("is-visible"); clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(() => element.classList.remove("is-visible"), 2700); }

  async function refreshTelemetryUi() {
    if (!TELEMETRY) return;
    const summary = await TELEMETRY.stats();
    const current = summary.consent;
    const shortId = summary.participantId ? summary.participantId.slice(-10) : "未启用";
    $("telemetryParticipant").textContent = shortId;
    $("telemetryParticipant").title = summary.participantId || "";
    $("telemetryEventCount").textContent = summary.total;
    $("telemetryUploadedCount").textContent = summary.uploaded;
    $("telemetryConnection").textContent = summary.connected ? "云端已连接" : "仅本机";
    $("testDataEnabled").checked = current.status === "granted";
    $("testDataOpenText").checked = Boolean(current.openText);
    $("testDataOpenText").disabled = current.status !== "granted";
    $("testDataTesterCode").value = current.testerCode || "";
    $("telemetryLastSync").textContent = summary.status.message;
    $("telemetrySaveLabel").textContent = current.status === "granted" ? "去标识化测试记录已启用" : "游戏进度仅保存在本机";
    $("telemetrySaveDetail").textContent = current.status === "granted"
      ? `${summary.total} 条记录 · ${summary.connected ? `${summary.uploaded} 条已上传` : "等待导出或连接云端"}`
      : "未收集玩法测试数据";
  }

  async function openTestDataPanel() {
    await refreshTelemetryUi();
    $("testDataPanel").hidden = false;
    TELEMETRY?.track("test_data_panel_opened", { source: "profile" });
  }

  function openDataCenter(source = "profile") {
    TELEMETRY?.track("data_center_opened", { source });
    window.open("data-center.html", "_blank", "noopener");
  }

  function openPlaytestSurvey(source = "profile") {
    if (TELEMETRY?.consent().status !== "granted") {
      $("telemetryConsent").hidden = false;
      toast("请先选择是否参与去标识化测试，再提交体验反馈。");
      return;
    }
    $("playtestSurvey").dataset.source = source;
    $("playtestSurvey").hidden = false;
    TELEMETRY.track("survey_opened", {
      source,
      round_id: state.round?.id || "",
      subject: state.round?.subjectId || state.save.selectedSubject,
      mode: state.save.selectedMode,
    });
  }

  async function submitPlaytestSurvey(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const comment = String(values.comment || "").trim();
    await TELEMETRY?.track("playtest_survey", {
      source: $("playtestSurvey").dataset.source || "unknown",
      round_id: state.round?.id || "",
      subject: state.round?.subjectId || state.save.selectedSubject,
      mode: state.save.selectedMode,
      grade: state.save.grade,
      pattern_feeling: Number(values.patternFeeling),
      fun: Number(values.fun),
      clarity: Number(values.clarity),
      difficulty: Number(values.difficulty),
      continue_intent: Number(values.continueIntent),
      favorite_mode: values.favoriteMode || "",
      comment_length: comment.length,
      comment_text: TELEMETRY?.allowsOpenText() ? comment : "",
    });
    form.reset();
    $("playtestSurvey").hidden = true;
    TELEMETRY?.flush();
    toast("体验反馈已保存，谢谢你帮助校准星图。");
    refreshTelemetryUi();
  }

  async function saveTestDataSettings() {
    const enabled = $("testDataEnabled").checked;
    TELEMETRY?.setConsent({
      enabled,
      openText: enabled && $("testDataOpenText").checked,
      testerCode: $("testDataTesterCode").value,
    });
    TELEMETRY?.setContext({ grade: state.save.grade, ...levelTelemetry() });
    if (enabled) TELEMETRY?.track("test_settings_updated", { open_text: $("testDataOpenText").checked });
    await refreshTelemetryUi();
    toast(enabled ? "去标识化测试设置已保存。" : "已停止记录新的测试数据。");
  }

  async function deleteTestData() {
    if (!window.confirm("确定删除当前设备上的全部测试记录并停止收集吗？游戏进度不会被删除。")) return;
    const result = await TELEMETRY?.deleteData();
    await refreshTelemetryUi();
    toast(result?.remoteDeleted === false ? "本机记录已删除；远程删除将在联网后自动重试。" : "测试记录已删除，游戏进度仍然保留。");
  }

  async function initializeTelemetry() {
    if (!TELEMETRY) return;
    TELEMETRY.setContext({ grade: state.save.grade, screen: "launchScreen", subject: state.save.selectedSubject, mode: state.save.selectedMode, ...levelTelemetry() });
    TELEMETRY.onStatus((status) => {
      if ($("telemetryLastSync")) $("telemetryLastSync").textContent = status.message;
      if ($("telemetrySaveDetail") && TELEMETRY.consent().status === "granted") $("telemetrySaveDetail").textContent = status.message;
    });
    await TELEMETRY.init();
    if (TELEMETRY.consent().status === "unset") $("telemetryConsent").hidden = false;
    else TELEMETRY.track("screen_view", { screen: "launchScreen", previous_screen: "" });
    await refreshTelemetryUi();
  }
  function ensureAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!state.audio) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      const musicBus = ctx.createGain();
      const musicFilter = ctx.createBiquadFilter();
      const musicGain = ctx.createGain();
      const delay = ctx.createDelay(1.2);
      const feedback = ctx.createGain();
      const sfxGain = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      master.gain.value = .92;
      musicFilter.type = "lowpass";
      musicFilter.frequency.value = 2350;
      musicGain.gain.value = state.save.music ? .52 : 0;
      sfxGain.gain.value = state.save.sound ? .72 : 0;
      delay.delayTime.value = .42;
      feedback.gain.value = .17;
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 4;
      compressor.attack.value = .012;
      compressor.release.value = .26;
      musicBus.connect(musicFilter).connect(musicGain).connect(master);
      musicFilter.connect(delay).connect(musicGain);
      delay.connect(feedback).connect(delay);
      sfxGain.connect(master);
      master.connect(compressor).connect(ctx.destination);
      state.audio = { ctx, master, musicBus, musicFilter, musicGain, sfxGain, compressor, mode: "drift", nextBar: ctx.currentTime + .08, bar: 0, timer: 0 };
      startMusicLoop();
    }
    if (state.audio.ctx.state === "suspended") state.audio.ctx.resume().then(() => scheduleMusic()).catch(() => {});
    return state.audio;
  }
  function startMusicLoop() {
    if (!state.audio || state.audio.timer) return;
    scheduleMusic();
    state.audio.timer = window.setInterval(scheduleMusic, 900);
  }
  function scheduleMusic() {
    const audio = state.audio;
    if (!audio) return;
    const chords = [
      [146.83, 220, 277.18, 369.99],
      [123.47, 185, 246.94, 293.66],
      [98, 146.83, 196, 246.94],
      [110, 164.81, 220, 246.94],
    ];
    while (audio.nextBar < audio.ctx.currentTime + 7) {
      const focus = audio.mode === "focus";
      const duration = focus ? 4.8 : 6.4;
      const chord = chords[audio.bar % chords.length];
      chord.forEach((frequency, index) => musicVoice(frequency, audio.nextBar, duration, .030 + index * .003, index % 2 ? 5 : -5));
      const order = focus ? [0, 2, 1, 3, 2, 1] : [0, 2, 3, 1];
      order.forEach((index, step) => musicBell(chord[index] * (focus && step % 3 === 2 ? 2 : 1), audio.nextBar + .62 + step * (focus ? .64 : 1.34), focus ? .034 : .028));
      if (focus) musicPulse(chord[0] / 2, audio.nextBar + .1, duration);
      audio.nextBar += duration;
      audio.bar += 1;
    }
  }
  function musicVoice(frequency, start, duration, volume, detune) {
    const { ctx, musicBus } = state.audio;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = frequency; osc.detune.value = detune;
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 1.1); gain.gain.setValueAtTime(volume, start + Math.max(1.2, duration - 1.45)); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(musicBus); osc.start(start); osc.stop(start + duration + .05);
  }
  function musicBell(frequency, start, volume) {
    const { ctx, musicBus } = state.audio;
    [1, 2.01].forEach((ratio, index) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = index ? "sine" : "triangle"; osc.frequency.value = frequency * ratio;
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume / (index + 1), start + .025); gain.gain.exponentialRampToValueAtTime(.0001, start + 1.25);
      osc.connect(gain).connect(musicBus); osc.start(start); osc.stop(start + 1.3);
    });
  }
  function musicPulse(frequency, start, duration) {
    const { ctx, musicBus } = state.audio;
    for (let offset = 0; offset < duration; offset += 1.2) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start + offset); gain.gain.exponentialRampToValueAtTime(.034, start + offset + .05); gain.gain.exponentialRampToValueAtTime(.0001, start + offset + .42);
      osc.connect(gain).connect(musicBus); osc.start(start + offset); osc.stop(start + offset + .46);
    }
  }
  function tone(frequency, duration, volume, type = "sine", delay = 0, pan = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const { ctx, sfxGain } = audio;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = type; osc.frequency.value = frequency;
    if (panner) panner.pan.value = pan;
    gain.gain.setValueAtTime(.0001, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + duration);
    osc.connect(gain); if (panner) gain.connect(panner).connect(sfxGain); else gain.connect(sfxGain);
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration + .03);
  }
  function clickTone(f = 520, v = .03) { tone(f, .12, v, "sine"); tone(f * 1.5, .17, v * .35, "triangle", .025); }
  function buzzTone() { tone(164.81, .24, .022, "triangle"); tone(146.83, .34, .015, "sine", .08); }
  function hintTone() { [440, 554.37, 659.25].forEach((f, i) => tone(f, .55, .018, "sine", i * .11, (i - 1) * .18)); }
  function ritualRiseTone() { [146.83, 220, 293.66, 440].forEach((f, i) => tone(f, .9, .024, i < 2 ? "triangle" : "sine", i * .17, (i - 1.5) * .16)); }
  function flipTone() { [293.66, 440, 587.33].forEach((f, i) => tone(f, .62, .019, "sine", i * .09, (i - 1) * .25)); }
  function successTone() { [293.66, 369.99, 440, 554.37, 739.99].forEach((f, i) => tone(f, .72, .027, i > 2 ? "sine" : "triangle", i * .14, (i - 2) * .16)); }
  function wakeMusic() {
    if (!state.save.music || !state.audio) return;
    const start = state.audio.ctx.currentTime + .3;
    musicVoice(146.83, start, 4.2, .044, -4);
    musicVoice(220, start, 4.2, .038, 4);
    [293.66, 369.99, 440].forEach((frequency, index) => musicBell(frequency, start + .45 + index * .48, .042));
  }
  function setMusicMode(mode) {
    if (!state.audio) return;
    state.audio.mode = mode;
    const now = state.audio.ctx.currentTime;
    state.audio.musicFilter.frequency.setTargetAtTime(mode === "focus" ? 3200 : 2350, now, .8);
    state.audio.musicGain.gain.setTargetAtTime(state.save.music ? (mode === "focus" ? .46 : .52) : 0, now, .6);
  }
  function toggleSound(value = !state.save.sound) {
    state.save.sound = Boolean(value); persist();
    if ($("soundSetting")) $("soundSetting").checked = state.save.sound;
    const audio = ensureAudio(); if (audio) audio.sfxGain.gain.setTargetAtTime(state.save.sound ? .72 : 0, audio.ctx.currentTime, .05);
    if (state.save.sound) clickTone(659.25, .03);
  }
  function toggleMusic(value = !state.save.music) {
    state.save.music = Boolean(value); persist();
    if ($("musicSetting")) $("musicSetting").checked = state.save.music;
    const audio = ensureAudio();
    if (audio) { audio.musicGain.gain.setTargetAtTime(state.save.music ? (audio.mode === "focus" ? .46 : .52) : 0, audio.ctx.currentTime, .3); if (state.save.music) wakeMusic(); }
  }
  function applyMotion(value) { state.save.reduceMotion = Boolean(value); document.body.classList.toggle("reduce-motion", state.save.reduceMotion); persist(); if (state.screen === "launchScreen") scheduleLaunchGlitch(); }

  let launchGlitchTimer = 0;
  let launchGlitchReleaseTimer = 0;
  let launchEntering = false;
  function stopLaunchGlitch() {
    window.clearTimeout(launchGlitchTimer);
    window.clearTimeout(launchGlitchReleaseTimer);
    $("launchTitleGlitch")?.classList.remove("is-glitching");
  }
  function scheduleLaunchGlitch() {
    stopLaunchGlitch();
    if (state.save.reduceMotion || document.hidden || state.screen !== "launchScreen") return;
    launchGlitchTimer = window.setTimeout(() => {
      if (state.screen !== "launchScreen" || launchEntering) return;
      const title = $("launchTitleGlitch");
      const duration = Math.round(220 + Math.random() * 120);
      title.style.setProperty("--glitch-duration", `${duration}ms`);
      title.classList.add("is-glitching");
      launchGlitchReleaseTimer = window.setTimeout(() => { title.classList.remove("is-glitching"); scheduleLaunchGlitch(); }, duration + 30);
    }, 1900 + Math.random() * 1600);
  }

  function enterGame(event) {
    if (state.screen !== "launchScreen" || launchEntering) return;
    launchEntering = true;
    stopLaunchGlitch();
    ensureAudio(); wakeMusic(); successTone();
    const stage = $("launchStage");
    const rect = stage.getBoundingClientRect();
    const clientX = Number.isFinite(event?.clientX) ? event.clientX : rect.left + rect.width / 2;
    const clientY = Number.isFinite(event?.clientY) ? event.clientY : rect.top + rect.height / 2;
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${clientX - rect.left}px`;
    ripple.style.top = `${clientY - rect.top}px`;
    $("rippleLayer").appendChild(ripple);
    $("launchScreen").classList.add("is-entering");
    $("screenStatus").textContent = "正在进入题感大师训练系统";
    const title = $("launchTitleGlitch");
    title.style.setProperty("--glitch-duration", "320ms");
    title.classList.add("is-glitching");
    window.setTimeout(() => showScreen("subjectScreen"), state.save.reduceMotion ? 80 : 560);
    window.setTimeout(() => { ripple.remove(); title.classList.remove("is-glitching"); $("launchScreen").classList.remove("is-entering"); launchEntering = false; }, state.save.reduceMotion ? 240 : 1150);
  }

  function setupStars() {
    const configure = (canvas, count, holder) => { const ratio = window.devicePixelRatio || 1; canvas.width = window.innerWidth * ratio; canvas.height = window.innerHeight * ratio; canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`; holder.length = 0; for (let i = 0; i < count; i += 1) holder.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: Math.random() * 1.4 + .2, a: Math.random() * .7 + .18, v: Math.random() * .08 + .015 }); };
    configure($("globalStars"), 155, state.stars);
  }
  function animateStars() { const paint = (canvas, stars, tint) => { const ratio = window.devicePixelRatio || 1, ctx = canvas.getContext("2d"); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); stars.forEach((star) => { star.y -= star.v; if (star.y < -3) { star.y = window.innerHeight + 3; star.x = Math.random() * window.innerWidth; } ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${tint},${star.a})`; ctx.fill(); }); }; paint($("globalStars"), state.stars, "132,194,255"); requestAnimationFrame(animateStars); }

  function bindEvents() {
    $("launchScreen").addEventListener("click", enterGame); $("launchScreen").addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); enterGame(event); } });
    $("subjectBack").addEventListener("click", () => showScreen("launchScreen")); $("subjectConstellation").addEventListener("click", (event) => { const button = event.target.closest("[data-subject]"); if (button) chooseSubject(button.dataset.subject); }); $("confirmSubject").addEventListener("click", () => {
      TELEMETRY?.track("subject_confirmed", { subject: state.save.selectedSubject, grade: state.save.grade });
      showScreen("modeScreen");
    });
    $("modeBack").addEventListener("click", () => showScreen("subjectScreen")); $("modeGates").addEventListener("click", (event) => { const button = event.target.closest("[data-mode]"); if (button) chooseMode(button.dataset.mode); }); $("confirmMode").addEventListener("click", () => {
      TELEMETRY?.track("training_configured", { subject: state.save.selectedSubject, mode: state.save.selectedMode, grade: state.save.grade });
      showScreen("homeScreen");
    });
    $("homeBack").addEventListener("click", () => showScreen("modeScreen")); $("reselectSubject").addEventListener("click", () => showScreen("subjectScreen")); $("reselectMode").addEventListener("click", () => showScreen("modeScreen")); $("openMap").addEventListener("click", () => { state.mapOrigin = "homeScreen"; state.mapSubject = state.save.selectedSubject; showScreen("mapScreen"); }); $("openProfile").addEventListener("click", () => showScreen("profileScreen")); $("profileChip").addEventListener("click", () => showScreen("profileScreen")); $("startGame").addEventListener("click", startRound);
    $("leaveGame").addEventListener("click", () => { if (state.round && !state.currentTopic && !state.answerRevealed) TELEMETRY?.track("round_abandoned", { round_id: state.round.id, subject: state.round.subjectId, mode: state.save.selectedMode, attempts: state.roundAttempt, elapsed_ms: Math.round(performance.now() - state.roundStartedAt) }); showScreen("homeScreen"); }); $("cardGrid").addEventListener("click", (event) => { const card = event.target.closest("[data-card]"); if (card) toggleCard(card.dataset.card); }); $("cardGrid").addEventListener("contextmenu", (event) => { const element = event.target.closest("[data-card]"); if (!element) return; event.preventDefault(); const card = state.round.cards.find((item) => item.id === element.dataset.card); $("inspectNumber").textContent = `ARCANA / ${pad(state.round.cards.indexOf(card) + 1)}`; $("inspectTitle").textContent = card.text; $("cardInspect").hidden = false; TELEMETRY?.track("card_inspected", { round_id: state.round.id, card_id: card.id }); });
    $("clearSelection").addEventListener("click", clearSelection); $("verifyBond").addEventListener("click", verifyBond); $("inspectHint").addEventListener("click", () => { $("methodPanel").hidden = false; TELEMETRY?.track("observation_method_opened", { round_id: state.round?.id || "", attempt: state.roundAttempt }); });
    $("declineHint").addEventListener("click", declineHint); $("acceptHint").addEventListener("click", acceptHint); $("closeHint").addEventListener("click", () => { $("hintOfferPanel").hidden = true; }); $("decodeAnswer").addEventListener("input", updateDecodeAnswer);
    document.addEventListener("click", (event) => { const closer = event.target.closest("[data-close-modal]"); if (closer) $(closer.dataset.closeModal).hidden = true; const challenge = event.target.closest("[data-challenge]"); if (challenge) completeChallenge(challenge); });
    $("closeGuide").addEventListener("click", () => { state.save.guideSeen = true; persist(); $("guidePanel").hidden = true; TELEMETRY?.track("onboarding_completed", { round_id: state.round?.id || "" }); }); $("nextRound").addEventListener("click", () => { if (state.challengeDone) { saveDecodeAnswer(); startRound(); } }); $("viewMapAfterRound").addEventListener("click", () => { saveDecodeAnswer(); state.mapOrigin = "gameScreen"; state.mapSubject = state.round.subjectId; showScreen("mapScreen"); });
    $("mapBack").addEventListener("click", () => showScreen(state.mapOrigin || "homeScreen", { scrollTop: false })); $("mapSubjects").addEventListener("click", (event) => { const button = event.target.closest("[data-map-subject]"); if (button) { state.mapSubject = button.dataset.mapSubject; renderMap(); } }); $("mapNodeLayer").addEventListener("click", (event) => { const node = event.target.closest("[data-map-node]"); if (node) renderMapDetail(node.dataset.mapNode); });
    $("profileBack").addEventListener("click", () => showScreen("homeScreen")); $("saveProfile").addEventListener("click", saveProfile); $("profileOpenMap").addEventListener("click", () => { state.mapOrigin = "profileScreen"; state.mapSubject = state.save.selectedSubject; showScreen("mapScreen"); }); $("musicSetting").addEventListener("change", (event) => toggleMusic(event.target.checked)); $("soundSetting").addEventListener("change", (event) => toggleSound(event.target.checked)); $("motionSetting").addEventListener("change", (event) => applyMotion(event.target.checked)); $("resetGuide").addEventListener("click", () => { state.save.guideSeen = false; persist(); toast("已重置：下次进入牌局会重新显示新手引导。 "); });
    $("openSurveyAfterRound").addEventListener("click", () => openPlaytestSurvey("round_result")); $("openProfileSurvey").addEventListener("click", () => openPlaytestSurvey("profile")); $("openTestData").addEventListener("click", openTestDataPanel); $("openDataCenter").addEventListener("click", () => openDataCenter("profile")); $("openDataCenterFromPanel").addEventListener("click", () => openDataCenter("data_manager")); $("closeTestData").addEventListener("click", () => { $("testDataPanel").hidden = true; }); $("closePlaytestSurvey").addEventListener("click", () => { $("playtestSurvey").hidden = true; }); $("skipPlaytestSurvey").addEventListener("click", () => { $("playtestSurvey").hidden = true; TELEMETRY?.track("survey_skipped", { source: $("playtestSurvey").dataset.source || "unknown" }); }); $("playtestSurveyForm").addEventListener("submit", submitPlaytestSurvey);
    $("consentAgree").addEventListener("change", (event) => { $("acceptTelemetry").disabled = !event.target.checked; }); $("acceptTelemetry").addEventListener("click", async () => { if (!$("consentAgree").checked) return; TELEMETRY?.setContext({ grade: state.save.grade, ...levelTelemetry() }); TELEMETRY?.setConsent({ enabled: true, openText: $("consentOpenText").checked, testerCode: $("consentTesterCode").value }); $("telemetryConsent").hidden = true; TELEMETRY?.track("screen_view", { screen: "launchScreen", previous_screen: "" }); await refreshTelemetryUi(); toast("去标识化测试记录已启用，可随时在个人中心管理。"); }); $("declineTelemetry").addEventListener("click", async () => { TELEMETRY?.setConsent({ enabled: false, openText: false, testerCode: "" }); $("telemetryConsent").hidden = true; await refreshTelemetryUi(); toast("已选择仅在本机游玩，不会记录玩法测试数据。"); });
    $("testDataEnabled").addEventListener("change", (event) => { $("testDataOpenText").disabled = !event.target.checked; if (!event.target.checked) $("testDataOpenText").checked = false; }); $("saveTestDataSettings").addEventListener("click", saveTestDataSettings); $("syncTestData").addEventListener("click", async () => { const result = await TELEMETRY?.flush(); await refreshTelemetryUi(); toast(result?.reason === "no_endpoint" ? "尚未配置云端地址，记录仍安全保存在本机。" : "同步操作已完成。"); }); $("exportTestJson").addEventListener("click", async () => { const count = await TELEMETRY?.exportData("json"); toast(`已导出 ${count || 0} 条测试记录。`); }); $("exportTestCsv").addEventListener("click", async () => { const count = await TELEMETRY?.exportData("csv"); toast(`已导出 ${count || 0} 条测试记录。`); }); $("deleteTestData").addEventListener("click", deleteTestData);
    window.addEventListener("resize", () => { setupStars(); if (state.screen === "subjectScreen") drawSubjectConstellations(); if (state.screen === "mapScreen") renderMap(); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopLaunchGlitch(); else if (state.screen === "launchScreen") scheduleLaunchGlitch(); });
  }

  function init() {
    state.mapSubject = state.save.selectedSubject; applyMotion(state.save.reduceMotion); renderSubjects(); renderModes(); renderHome(); bindEvents(); setupStars(); animateStars(); scheduleLaunchGlitch(); initializeTelemetry();
  }

  init();
})();
